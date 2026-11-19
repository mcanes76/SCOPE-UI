'use strict';
// Usage: node docs/assets/validate-preview-sizing.cjs "<Chrome or Edge executable>" [artifact directory]
const assert=require('node:assert/strict');
const fs=require('node:fs/promises');
const {spawn}=require('node:child_process');
const path=require('node:path');
const {pathToFileURL}=require('node:url');
const {setTimeout:delay}=require('node:timers/promises');

const root=path.resolve(__dirname,'../..');
const artifacts=path.resolve(process.argv[3]||path.join(root,'.validation/phase-d/browser'));
const studio=path.join(root,'dist/SCOPE-Design-Studio.html');
const executable=process.argv[2];
const manualZooms=[1,.85,.7,.55];
const presets=['1920x1080','1600x900','1366x768','1280x720'];

async function until(check,message){
  for(let i=0;i<120;i++){
    const result=await check();
    if(result)return result;
    await delay(50);
  }
  assert.fail(message);
}

async function validate(){
  assert(executable,'Pass the path to a Chrome or Edge executable');
  await fs.mkdir(artifacts,{recursive:true});
  const profile=await fs.mkdtemp(path.join(artifacts,'profile-'));
  const options=['--headless','--disable-gpu','--no-first-run','--disable-background-networking',
    '--disable-features=IsolateSandboxedIframes','--disable-site-isolation-trials','--remote-debugging-port=0','--user-data-dir='+profile,'about:blank'];
  if(process.env.SCOPE_BROWSER_NO_SANDBOX==='1')options.unshift('--no-sandbox');
  const browser=spawn(executable,options,{stdio:'ignore',windowsHide:true});
  let socket,launchError;
  browser.on('error',error=>{launchError=error;});
  try{
    const port=await until(async()=>{
      if(launchError)throw launchError;
      return fs.readFile(path.join(profile,'DevToolsActivePort'),'utf8').then(s=>s.split('\n')[0],()=>null);
    },'Browser did not open a debugging port');
    const tabs=await fetch('http://127.0.0.1:'+port+'/json/list').then(r=>r.json());
    socket=new WebSocket(tabs.find(t=>t.type==='page').webSocketDebuggerUrl);
    await new Promise((resolve,reject)=>{
      socket.addEventListener('open',resolve,{once:true});
      socket.addEventListener('error',reject,{once:true});
    });
    const pending=new Map(),contexts=new Map();
    let id=0;
    socket.addEventListener('message',event=>{
      const m=JSON.parse(event.data);
      if(m.id){
        const {resolve,reject}=pending.get(m.id);
        pending.delete(m.id);
        if(m.error)reject(Error(m.error.message));else resolve(m.result);
      }
      if(m.method==='Runtime.executionContextCreated'&&m.params.context.auxData?.isDefault)
        contexts.set(m.params.context.auxData.frameId,m.params.context.id);
      if(m.method==='Runtime.executionContextsCleared')contexts.clear();
    });
    const cdp=(method,params={})=>new Promise((resolve,reject)=>{
      pending.set(++id,{resolve,reject});
      socket.send(JSON.stringify({id,method,params}));
    });
    await cdp('Runtime.enable');
    await cdp('Page.enable');
    async function evaluate(expression,contextId){
      const {result,exceptionDetails}=await cdp('Runtime.evaluate',{expression,contextId,returnByValue:true});
      if(exceptionDetails)throw Error(result.description||exceptionDetails.text);
      return result.value;
    }
    async function subframe(index=0){
      const {frameTree}=await cdp('Page.getFrameTree');
      return contexts.get(frameTree.childFrames?.[index]?.frame.id);
    }
    const settle=()=>cdp('Runtime.evaluate',{expression:'new Promise(resolve=>requestAnimationFrame(()=>requestAnimationFrame(resolve)))',awaitPromise:true});
    const viewport=(width,height)=>cdp('Emulation.setDeviceMetricsOverride',{width,height,deviceScaleFactor:1,mobile:false});
    const load=file=>cdp('Page.navigate',{url:pathToFileURL(file).href});
    const select=(selector,value)=>evaluate(`{const e=document.querySelector(${JSON.stringify(selector)});e.value=${JSON.stringify(value)};e.dispatchEvent(new Event('change',{bubbles:true}));}`);
    const click=(selector,context)=>evaluate(`document.querySelector(${JSON.stringify(selector)}).click()`,context);
    async function screenshot(name){
      const {data}=await cdp('Page.captureScreenshot',{format:'png'});
      await fs.writeFile(path.join(artifacts,name+'.png'),Buffer.from(data,'base64'));
    }
    async function connected(){
      await until(async()=>await evaluate("document.querySelector('#preview-status')?.textContent.includes('Connected')"),'Studio preview did not connect');
      await until(subframe,'Studio preview context unavailable');
    }
    const shellMetrics=`(()=>{
      const header=document.querySelector('#view-workspace .shell-top');
      return {resolution:[innerWidth,innerHeight],wide:matchMedia('(min-width: 1500px)').matches,
        narrow:matchMedia('(max-width: 760px)').matches,details:document.body.dataset.uiDetails,
        navigation:window.ScopePreviewRuntime.snapshot().navigation,
        headerWrap:header&&getComputedStyle(header).flexWrap,
        bounds:window.ScopeManagedWindows.bounds()};
    })()`;
    const previewMetrics=`(()=>{
      const area=document.querySelector('#preview-viewport'),frame=document.querySelector('#preview'),r=frame.getBoundingClientRect();
      return {area:[area.clientWidth,area.clientHeight],scroll:[area.scrollWidth,area.scrollHeight],
        outer:[area.offsetWidth,area.offsetHeight],frame:[r.width,r.height],scale:new DOMMatrix(getComputedStyle(frame).transform).a,
        page:[document.documentElement.scrollHeight,innerHeight]};
    })()`;
    async function checkResolution(width,height,index=0){
      const context=await subframe(index);
      await until(async()=>{
        const data=await evaluate(shellMetrics,context);
        if(data.resolution[0]!==width||data.resolution[1]!==height)return null;
        assert.equal(data.wide,width>=1500);
        assert.equal(data.narrow,width<=760);
        assert.equal(data.headerWrap,width<=760?'wrap':'nowrap');
        return data;
      },'Iframe viewport failed to reach '+width+'x'+height);
      await settle();
      return evaluate(shellMetrics,context);
    }
    function checkScaled(metrics,width,height,scale){
      assert(Math.abs(metrics.scale-scale)<.00001);
      assert(Math.abs(metrics.frame[0]-width*scale)<.05);
      assert(Math.abs(metrics.frame[1]-height*scale)<.05);
    }

    const baseline=[];
    await viewport(1440,900);
    if(await fs.stat(path.join(artifacts,'../before.html')).catch(()=>null)){
      await load(path.join(artifacts,'../before.html'));
      await connected();
      for(const mode of ['guided','advanced']){
        await click('[data-mode='+mode+']');
        await settle();
        baseline.push({mode,...await evaluate(previewMetrics),logical:(await evaluate(shellMetrics,await subframe())).resolution});
        await screenshot('before-'+mode);
      }
    }
    await load(studio);
    await connected();
    await until(async()=>(await evaluate(shellMetrics,await subframe())).details==='hidden','Studio default should hide UI Details');
    const measurements=[];
    for(const [width,height] of [[1440,900],[1280,720],[1024,600]]){
      await viewport(width,height);
      for(const mode of ['guided','advanced']){
        await click('[data-mode='+mode+']');
        const m=await until(async()=>{
          const metrics=await evaluate(previewMetrics);
          return metrics.frame.every((size,i)=>Math.abs(size-metrics.outer[i])<1)?metrics:null;
        },'Fit Studio dimensions did not settle');
        assert.deepEqual(m.page,[height,height],'Studio controls fit in desktop viewport');
        assert(m.area[1]>=240,JSON.stringify({width,height,mode,m}));
        assert.equal(await evaluate("['#preview-resolution','#zoom','#details','.studio-footer'].every(s=>{const r=document.querySelector(s).getBoundingClientRect();return r.top>=0&&r.bottom<=innerHeight&&r.width>0})"),true);
        await checkResolution(...m.outer);
        measurements.push({window:[width,height],mode,...m});
        if(width===1440)await screenshot('after-'+mode);
      }
    }
    await viewport(1440,900);
    await click('[data-mode=guided]');
    for(const preset of presets){
      await select('#preview-resolution',preset);
      const [w,h]=preset.split('x').map(Number);
      const auto=await evaluate(previewMetrics);
      checkScaled(auto,w,h,Math.min(1,auto.outer[0]/w,auto.outer[1]/h));
      assert.deepEqual(auto.scroll,auto.area,'Auto Fit should have no Studio preview scroll overflow');
      await checkResolution(w,h);
      for(const scale of manualZooms){
        await select('#zoom',String(scale));
        const m=await evaluate(previewMetrics);
        checkScaled(m,w,h,scale);
        assert.deepEqual(m.scroll,m.area.map((size,i)=>Math.max(size,Math.round([w,h][i]*scale))));
        await checkResolution(w,h);
        if(scale===1)assert(await evaluate(`(()=>{
          const area=document.querySelector('#preview-viewport');
          area.scrollTo(area.scrollWidth,area.scrollHeight);
          return area.scrollLeft>0&&area.scrollTop>0&&window.scrollY===0;
        })()`),'A larger manual preview should scroll within its own area');
      }
      await select('#zoom','auto');
      measurements.push({preset,zoom:'auto',...auto});
    }
    await select('#preview-resolution','custom');
    await evaluate("{document.querySelector('#preview-width').value=740;document.querySelector('#preview-height').value=680;document.querySelector('#custom-resolution').requestSubmit();}");
    const narrow=await checkResolution(740,680);
    await select('#zoom','0.7');
    assert.deepEqual(await checkResolution(740,680),narrow);
    await select('#zoom','auto');

    await select('#preview-resolution','fit');
    const fit=await evaluate(previewMetrics);
    await select('#zoom','0.55');
    checkScaled(await evaluate(previewMetrics),...fit.outer,.55);
    await checkResolution(...fit.outer);
    await select('#zoom','auto');
    await click('[data-action=present]');
    await checkResolution(...fit.outer);
    await click('#presentation-fit');
    await checkResolution(...(await evaluate(previewMetrics)).outer);
    await click('[data-action=return]');
    await checkResolution(...(await evaluate(previewMetrics)).outer);

    await select('#preview-resolution','1600x900');
    await click('[data-mode=advanced]');
    await checkResolution(1600,900);
    await click('[data-action=present]');
    await until(async()=>(await checkResolution(1600,900)).details==='shown','Present Design did not show UI Details');
    await screenshot('after-present');
    await click('[data-action=return]');
    await checkResolution(1600,900);
    assert.equal(await evaluate("document.querySelector('[data-mode=advanced]').getAttribute('aria-pressed')"),'true');
    await click('#details');
    await until(async()=>(await checkResolution(1600,900)).details==='hidden','UI Details did not hide');
    assert.equal(await evaluate("document.querySelector('#details-label').textContent"),'UI Details hidden');
    for(const name of ['Candidate A','Candidate B','Candidate C']){
      await select('#checkpoint',name);
      await click('[data-action=save-candidate]');
    }
    await click('[data-action=compare]');
    await select('#compare-left','Candidate B');
    await select('#compare-right','Candidate C');
    for(const index of [1,2]){
      await until(()=>subframe(index),'Comparison iframe did not open');
      await until(async()=>await evaluate('Boolean(window.ScopePreviewRuntime?.snapshot())',await subframe(index)),'Candidate config did not apply');
      assert.equal((await checkResolution(1600,900,index)).details,'hidden');
    }
    assert.equal(await evaluate("[...document.querySelectorAll('.compare-grid iframe')].map(f=>f.style.transform).every((s,i,a)=>s===a[0])"),true);
    await screenshot('after-candidates');
    await click('[data-action=close-compare]');

    await click('[data-mode=guided]');
    await click('#details');
    await until(async()=>(await checkResolution(1600,900)).details==='shown','UI Details did not show');
    const context=await subframe();
    const state=()=>evaluate("ScopeManagedWindows.snapshot().items.find(w=>w.app==='blos')",context);
    await evaluate("window.originalBLOS=ScopeManagedWindows.node('blos').querySelector('.managed-body')",context);
    async function drag(handle,dx,dy){
      const selector='.managed-window[data-managed-app="blos"] [data-managed-action="'+handle+'"]';
      const query='document.querySelector('+JSON.stringify(selector)+')';
      await evaluate(query+'.scrollIntoView({block:"nearest",inline:"nearest"})',context);
      const rect=await evaluate("document.querySelector('#preview').getBoundingClientRect().toJSON()");
      const point=await evaluate(`(()=>{const e=${query},r=e.getBoundingClientRect();return [r.left+r.width/2,r.top+r.height/2];})()`,context);
      const hit=await evaluate(`document.elementFromPoint(${point.join(',')})?.closest('[data-managed-action]')?.dataset.managedAction`,context);
      assert.equal(hit,handle,JSON.stringify({point,rect,hit}));
      const scale=rect.width/1600;
      assert(scale<1,'Native drag test requires a scaled frame');
      const [x,y]=point.map((v,i)=>v*scale+[rect.left,rect.top][i]);
      const mouse=(type,x,y,buttons)=>cdp('Input.dispatchMouseEvent',{type,x,y,button:type==='mouseMoved'&&!buttons?'none':'left',buttons,clickCount:1});
      assert.equal(await evaluate(`document.elementFromPoint(${x},${y})?.id`),'preview',JSON.stringify({handle,x,y,rect,point,scale}));
      await mouse('mouseMoved',x,y,0);
      await mouse('mousePressed',x,y,1);
      assert(await evaluate('ScopeManagedWindows.isInteracting()',context),JSON.stringify({handle,x,y,rect,point,scale}));
      await mouse('mouseMoved',x+dx*scale,y+dy*scale,1);
      await mouse('mouseReleased',x+dx*scale,y+dy*scale,0);
      await settle();
    }
    const original=await state();
    await drag('move',42,0);
    const moved=await state();
    assert(Math.abs(moved.rect.x-original.rect.x-42)<=2,JSON.stringify({original,moved}));
    await drag('resize',-44,0);
    const resized=await state();
    assert(Math.abs(resized.rect.width-moved.rect.width+44)<=2,JSON.stringify({moved,resized}));
    const {bounds}=await checkResolution(1600,900);
    const {x,y,width,height}=resized.rect;
    assert(x>=0&&y>=0&&x+width<=bounds.width&&y+height<=bounds.height);
    await select('#zoom','0.55');
    assert.deepEqual(await state(),resized);
    await click('#details');
    await until(async()=>(await checkResolution(1600,900)).details==='hidden','Scaled preview did not hide details');
    await click('#details');
    await until(async()=>(await checkResolution(1600,900)).details==='shown','Scaled preview did not reveal details');
    assert.deepEqual(await state(),resized);
    assert(await evaluate("originalBLOS===ScopeManagedWindows.node('blos').querySelector('.managed-body')",context));

    const studioShell=await checkResolution(1600,900);
    await select('#preview-resolution','custom');
    const narrowStudioShell=await checkResolution(740,680);
    await select('#preview-resolution','1600x900');
    await checkResolution(1600,900);
    await fs.rm(path.join(artifacts,'SCOPE-Operator-Standalone.html'),{force:true});
    await cdp('Page.setDownloadBehavior',{behavior:'allow',downloadPath:artifacts});
    await click('.studio-footer .exports summary');
    await click('.studio-footer [data-action=export-final]');
    const exportFile=path.join(artifacts,'SCOPE-Operator-Standalone.html');
    await until(()=>fs.stat(exportFile).catch(()=>null),'Operator standalone download did not finish');
    await viewport(1600,900);
    await load(exportFile);
    await until(()=>evaluate('Boolean(window.ScopeStandaloneMockup&&window.ScopeManagedWindows?.bounds())'),'Operator standalone did not initialize');
    assert.deepEqual(await evaluate(shellMetrics),studioShell);
    await screenshot('standalone-1600x900');
    await viewport(740,680);
    await until(async()=>{
      const data=await evaluate(shellMetrics);
      return JSON.stringify(data)===JSON.stringify(narrowStudioShell);
    },'Standalone narrow layout should match Studio at the same CSS viewport');
    await click('[data-ui-details-toggle]');
    assert.equal((await evaluate(shellMetrics)).details,'hidden');
    console.log(JSON.stringify({browser:path.basename(executable),baseline,measurements,dragging:'pass',standalone:'pass'},null,2));
  }finally{
    socket?.close();
    browser.kill();
  }
}
validate().catch(error=>{console.error(error);process.exitCode=1;});

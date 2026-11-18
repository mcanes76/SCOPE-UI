/* Display-owned controls + managed sizing; controlled DOM, not native rendering. */
'use strict';
const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),cp=require('node:child_process');
const root=path.resolve(__dirname,'../..'),read=p=>fs.readFileSync(path.join(root,p),'utf8');
const C=require('../../design-studio/design-core.js'),W=require('../../design-studio/workspace.js');globalThis.ScopeDesign=C;
const E=require('../../design-studio/exports.js'),B=require('../../scripts/build-standalone.cjs'),F=require('./validate-design-studio.cjs');
const presets=JSON.parse(read('design-studio/theme-presets.json')).presets,resources=B.resources(),plain=x=>JSON.parse(JSON.stringify(x));
const wmSource=read('docs/assets/validate-window-manager.cjs'),nativeDOM=new Function('b',wmSource.slice(wmSource.indexOf('function nativeDOM('),wmSource.indexOf('async function dispatch('))+'return nativeDOM;')({width:1200,height:800});
async function dispatch(engine,type,target,extra={}){let stopped=false;const e={target,preventDefault(){},stopPropagation(){},stopImmediatePropagation(){stopped=true;},...extra};for(const fn of [...(engine.captures[type]||[]),...(engine.listeners[type]||[]).filter(fn=>!(engine.captures[type]||[]).includes(fn))]){if(stopped)break;await fn(e);}return e;}
function fixture(){const design=C.validate({...C.defaults,navigation:'deck',workspace:W.validate({...W.defaults,left:'display'})}),html=E.composeFinal(resources,design,presets),engine=F.engineFixture(true,html),dom=nativeDOM(engine);const query=engine.document.querySelector.bind(engine.document);engine.document.querySelector=s=>s.startsWith('[data-demo-host]')?dom.rootNode.querySelector(s):query(s);engine.window.ScopeManagedWindows.decorate();return {html,engine,dom,manager:engine.window.ScopeManagedWindows};}
(async()=>{
 const f=fixture(),{engine,dom,manager}=f,slot='managed-display',run=engine.run;
 const markup=()=>run("DisplayModule.render(demoView('managed-display',1),'managed-display')");let ui=markup();
 assert(ui.includes('Regional Globe')&&ui.includes('Node Inventory'));assert(!ui.includes('node-picker'));assert(!ui.includes('app-actions compact'));
 assert.equal((ui.match(/data-demo-field="display-node-choice"/g)||[]).length,1);assert.equal((ui.match(/<option /g)||[]).length,10);
 const camera=ui.match(/<nav class="display-camera-tools"[\s\S]*?<\/nav>/)[0];assert.equal((camera.match(/<button /g)||[]).length,9);
 for(const action of ['in','out','left','right','up','down','center','network','earth'])assert(camera.includes('data-demo-action="display-'+action+'"'));
 for(const button of camera.matchAll(/<button[^>]+>/g))assert(/id="display-managed-display-display-/.test(button[0])&&/title="[^"]+"/.test(button[0])&&/aria-label="[^"]+"/.test(button[0]));
 assert(ui.indexOf('display-command-row')<ui.indexOf('earth-stage'));assert(ui.indexOf('network-note')<ui.indexOf('earth-stage'),'Information is in the collapsed disclosure, not an expanded row');
 for(const text of ['No actual installations','RF feasibility','CC BY 4.0','Solar System Scope','Embedded texture'])assert(ui.includes(text));
 const change=async(field,value,checked=false)=>{const node=new engine.Element();node.dataset={demoField:field,slot};node.value=value;node.checked=checked;await dispatch(engine,'change',node);};
 const action=async(name)=>{const node=new dom.Node('button');node.dataset={demoAction:'display-'+name,slot};await dispatch(engine,'click',node);};
 const view=()=>plain(run("demoView('managed-display',1)"));
 await action('network');let before=view();await change('display-node-choice','N01');assert.equal(view().node,'N01');assert.equal(view().yaw,before.yaw);assert.equal(view().pitch,before.pitch);assert.equal(view().zoom,before.zoom);
 await change('display-node-choice','unknown');assert.equal(view().node,'N01');await action('center');const selected=plain(run('DemoNodeStore.get("N01")'));assert.equal(view().yaw,selected.lon);assert.equal(view().pitch,selected.lat);
 before=view();await action('left');assert.equal(view().yaw,before.yaw-8);await action('right');assert.equal(view().yaw,before.yaw);await action('up');assert.equal(view().pitch,Math.min(80,before.pitch+5));await action('down');assert(Math.abs(view().pitch-before.pitch)<1e-9);
 await action('in');assert.equal(view().zoom,Math.min(10,before.zoom*1.22));await action('out');assert(Math.abs(view().zoom-before.zoom)<1e-9);await action('earth');assert.equal(view().zoom,1);await action('network');assert.deepEqual({yaw:view().yaw,pitch:view().pitch,zoom:view().zoom},plain(run('RegionalNetworkView')));
 const other=run("JSON.stringify(demoView('independent-display',1))");
 for(const field of ['display-links','display-labels','display-blos-overlay'])await change(field,'',false);
 ui=markup();assert(!ui.includes('data-link-model="display"'));assert(!ui.includes('data-link-model="blos"'));
 for(const field of ['display-links','display-labels','display-blos-overlay'])await change(field,'',true);
 ui=markup();assert(ui.includes('data-link-model="display"')&&ui.includes('data-link-model="blos"'));assert(ui.includes('dashed violet'));assert.equal(run("JSON.stringify(demoView('independent-display',1))"),other);
 const details=new engine.Element();details.dataset={displayPanel:'layers',slot};details.open=true;await dispatch(engine,'toggle',details);await change('display-labels','',false);assert(/data-display-panel="layers"[^>]* open/.test(markup()),'Layers stays open across checkbox refresh');
 assert(!run("JSON.stringify(demoView('managed-display',1))").includes('layersOpen'),'Transient disclosure state is not added to portable view schema');
 const summary=new engine.Element();summary.focus=()=>{engine.document.activeElement=summary;};details.closest=s=>s==='.display-options'?details:null;details.querySelector=()=>summary;await dispatch(engine,'keydown',details,{key:'Escape'});assert(!details.open);assert.equal(engine.document.activeElement,summary);await dispatch(engine,'toggle',details);
 run("demoView('managed-display',1).tab='nodes'");ui=markup();assert(ui.includes('display-inventory'));assert.equal((ui.match(/Select on globe/g)||[]).length,10);assert(ui.includes('display-node-managed-display'));
 const node=new dom.Node('button');node.dataset={demoAction:'display-node',node:'N10',slot};await dispatch(engine,'click',node);assert.equal(view().tab,'globe');assert.equal(view().node,'N10');
 const appState=run("JSON.stringify([demoView('managed-display',1),DemoNodeStore.nodes(),DemoDisplayConnectivityStore.links(),DemoBLOSConnectivityStore.links(),DemoSensorStore.list(),DemoLOSStore.get()])"),frame=manager.node('display'),body=frame.querySelector('.managed-body'),writes=body.htmlWrites;
 let budgets=0;for(const [width,height] of [[1920,1080],[1600,900],[1366,768],[720,520],[420,300]]){
   const bounds={width:Math.max(1,width-100),height:Math.max(1,height-200)};dom.setSize(bounds);manager.update({type:'fit'},{save:false});
   for(const action of ['open','maximize','restore','dock-left','restore','minimize','open','close','open'])manager.update({type:action,app:'display'});
   for(const arrangement of ['tile','cascade']){manager.open('blos');manager.update({type:arrangement});}
   for(const w of manager.snapshot().items){assert(w.rect.x>=0&&w.rect.y>=0&&w.rect.x+w.rect.width<=bounds.width&&w.rect.y+w.rect.height<=bounds.height);}
   const initial=W.windows.initial('display',bounds);assert(initial.width>=initial.height);budgets++;
 }
 assert.equal(manager.node('display'),frame);assert.equal(body.htmlWrites,writes);assert.equal(run("JSON.stringify([demoView('managed-display',1),DemoNodeStore.nodes(),DemoDisplayConnectivityStore.links(),DemoBLOSConnectivityStore.links(),DemoSensorStore.list(),DemoLOSStore.get()])"),appState);
 assert.deepEqual(W.windows.sizes.display,[1120,560]);assert.deepEqual(W.windows.sizes.blos,[760,560]);assert.deepEqual(W.windows.sizes.calibration,[780,620]);assert.deepEqual(W.windows.sizes.los,[640,480]);
 // Enforce the explicit no-algorithm-change boundary against the inspected checkpoint.
 const current=resources.html,baseline=cp.execFileSync('git',['show','5bbcf40:mockups/scope-integrated-electric-glass.html'],{cwd:root,encoding:'utf8',maxBuffer:8*1024*1024});
 for(const [start,end] of [['    const RegionalNetworkView=', '    const EarthRenderer='],['    const EarthRenderer=', '    const displayLegacyArc='],['    DisplayModule.globe=function','    };'],['    DisplayModule.action=function',"    document.addEventListener('change'"]]){const part=(s)=>{const a=s.indexOf(start);assert(a>=0);return s.slice(a,s.indexOf(end,a+start.length)).replace(/\r\n/g,'\n');};assert.equal(part(current),part(baseline),'Camera/rendering algorithms and action semantics remain unchanged');}
 const css=resources.css.slice(resources.css.indexOf('/* Display-owned layout.'));assert(css.includes('object-fit:contain'));assert(css.includes('@container (max-width:480px)'));assert(css.includes('flex-direction:row'));assert(css.includes('display-inventory'));assert(!/\.managed-|ScopeManagedWindows/.test(css));
 assert(f.html.includes('display-map-app')&&f.html.includes('display-node-choice')&&f.html.includes('container-type:size'));
 const out=path.join(root,'.validation/display-map-layout');fs.mkdirSync(out,{recursive:true});fs.writeFileSync(path.join(out,'operator-review.html'),f.html);
 console.log(JSON.stringify({displayMapLayout:'pass',cameraActions:9,nodes:10,layers:'all 3 independent; disclosure retained through refresh',keyboard:'stable camera IDs, native select/tabs/disclosures, Escape focus',sizingBudgets:budgets,algorithmIdentity:'unchanged against 5bbcf40',state:'camera/layers/selection/data retained through window arrangements',exports:'standalone embeds markup, CSS and handlers',browserRendering:'not verified by controlled DOM; native visual and pointer review remains manual'},null,2));
})().catch(error=>{console.error(error);process.exitCode=1;});

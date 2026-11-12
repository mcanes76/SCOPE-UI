/* Run from any directory: node docs/assets/validate-design-studio.cjs
 * Actual engine/editor handlers run in controlled DOM fixtures; this is not browser QA.
 */
'use strict';
const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm'),assert=require('node:assert/strict'),http=require('node:http');
const root=path.resolve(__dirname,'../..'),read=p=>fs.readFileSync(path.join(root,p),'utf8');
const C=require('../../design-studio/design-core.js');globalThis.ScopeDesign=C;
const E=require('../../design-studio/exports.js'),presets=JSON.parse(read('design-studio/theme-presets.json')).presets;
const initial=JSON.parse(read('design-studio/design-config.json'));
for(const file of ['design-core.js','studio.js','exports.js','preview-runtime.js','preview-bridge.js'])new vm.Script(read('design-studio/'+file));
assert.deepEqual(C.validate(initial),C.defaults);
const store=new C.DesignStore(initial);let notifications=0;store.subscribe(()=>notifications++);
store.update(d=>{d.navigation='deck';d.colors.border='#ffffff';d.regions.header={radius:8,background:'#18263A'};d.notes.navigation='Persistent navigation <preferred>';});
const candidate=C.clone(store.value);store.save('Candidate A');store.update(d=>d.layout.navWidth=900);assert.equal(store.value.layout.navWidth,280);store.undo();assert.deepEqual(store.value,candidate);store.redo();assert.equal(store.value.layout.navWidth,280);store.restore('Candidate A');assert.deepEqual(store.value,candidate);assert(notifications>=5);
const roundTrip=JSON.parse(JSON.stringify(store.value));assert.deepEqual(C.validate(roundTrip),store.value);
for(const patch of [{schemaVersion:2},{navigation:'unknown'},{colors:{accent:'red;display:none'}},{typography:{family:'url(evil)'}},{regions:{blos:{padding:9}}},{regions:{workspace:{visible:false}}},{regions:{navigation:{visible:false}}},{layout:{navWidth:'190'}},{layout:{navWidth:NaN}},{material:{opacity:Infinity}},{regions:{header:{unknown:2}}},{applicationData:{enabled:true}}])assert.throws(()=>C.validate({...C.defaults,...patch}));
const constrained=C.validate({...C.defaults,regions:{navigation:{width:900},context:{width:1},branding:{width:200}},layout:{navWidth:1,contextWidth:900,workspacePadding:0,panelGap:90}});assert.equal(constrained.regions.navigation.width,280);assert.equal(constrained.regions.context.width,180);assert.equal(constrained.regions.branding.width,64);assert.equal(constrained.layout.navWidth,140);assert.equal(constrained.layout.contextWidth,360);assert.equal(constrained.layout.workspacePadding,8);
let combinations=0;
for(const navigation of C.navigation)for(const p of presets){
  const d=C.validate({...initial,navigation,theme:p.id,material:p.material,typography:p.typography});const css=C.compileCSS(d);assert(css.includes('body[data-scope-design="true"]'));assert(!css.includes('.app-content')&&!css.includes('.btn-enable')&&!css.includes('.btn-leave'));if(navigation==='deck')assert(css.includes('@media(min-width:1251px)'));else assert(!css.includes('grid-template-columns:190px'));combinations++;
}
const outputCSS=E.css(candidate,presets);assert(outputCSS.includes('#FFFFFF'));assert(outputCSS.includes('border-radius:8px'));assert(outputCSS.includes('white-trim'));
const resources={html:read('mockups/scope-integrated-electric-glass.html'),css:read('mockups/styles.css'),core:['visual-system.js','parameters.js','design-core.js'].map(f=>read('design-studio/'+f)).join('\n'),runtime:read('design-studio/preview-runtime.js'),params:JSON.parse(read('mockups/params.json')),logo:'data:image/png;base64,'+fs.readFileSync(path.join(root,'mockups/assets/logo.png')).toString('base64'),fallback:'data:image/svg+xml;base64,'+fs.readFileSync(path.join(root,'mockups/assets/scope-logo.svg')).toString('base64')};
const final=E.composeFinal(resources,candidate,presets);assert(!final.includes('SCOPE_STUDIO_LOADER_START'));assert(!final.includes('void loadPresentationConfig();'));assert(!final.includes('href="styles.css"'));assert(!final.includes('src="assets/logo.png"'));assert(!final.includes("'assets/scope-logo.svg'"));assert(final.includes(resources.logo)&&final.includes(resources.fallback));assert(final.includes('data:image/jpeg;base64,'));assert(!/<(?:link|script|img)[^>]+(?:href|src)="(?!data:|#)/.test(final.replace(/<script>[\s\S]*?<\/script>/g,"")));
const finalScripts=[...final.matchAll(/<script>([\s\S]*?)<\/script>/g)].map(m=>m[1]);assert.equal(finalScripts.length,4);finalScripts.forEach(s=>new vm.Script(s));assert(finalScripts.at(-1).includes('"detailsVisible":true'));assert(finalScripts.at(-1).includes('presentation:true,editing:false'));
const malicious=C.clone(candidate);malicious.name='</script><img onerror="alert(1)">';malicious.notes.colors='<script>oops</script>';const summary=E.summary(malicious,presets,resources.params);assert(!summary.includes('<script>oops'));assert(summary.includes('&lt;script&gt;oops'));new vm.Script([...E.composeFinal(resources,malicious,presets).matchAll(/<script>([\s\S]*?)<\/script>/g)].at(-1)[1]);

// Reuse the baseline's proven application fixture, then run the real adapter against it.
function engineFixture(exported=false,suppliedHTML=null){
  const scripts=suppliedHTML?[...suppliedHTML.matchAll(/<script(?:\s[^>]*)?>([\s\S]*?)<\/script>/g)].map(m=>m[1]):finalScripts;
  const source=read('docs/assets/validate-electric-glass.cjs');let prefix=source.slice(0,source.indexOf('const run=code=>'));
  if(exported)prefix=prefix.replace('vm.runInContext(script,context);','vm.runInContext(testFinalScript,context);');
  const fixture=new Function('require','__dirname','testFinalScript',prefix+'\nreturn {context,document,window,Element,elements,listeners,windowEvents};')(require,__dirname,scripts[0]);
  const {context,document,window,Element}=fixture;document.head=new Element('head');document.head.append=function(el){fixture.elements.set('#'+el.id,el);};document.createElement=()=>new Element();
  fixture.insertions=[];fixture.downloads=[];
  Element.prototype.style={setProperty(){},removeProperty(){}};Element.prototype.before=function(el){fixture.insertions.push(el);};Element.prototype.click=function(){fixture.downloads.push({href:this.href,name:this.download});};Element.prototype.querySelector=function(){return null;};Element.prototype.removeEventListener=function(){};document.body.append=function(){};Element.prototype.append=function(){};Element.prototype.hasAttribute=function(k){return k in this.attrs;};
  context.MutationObserver=class{observe(){}};context.requestAnimationFrame=fn=>fn();context.queueMicrotask=fn=>fn();context.crypto=require('node:crypto').webcrypto;window.parent={postMessage(){}};
  const run=code=>{const result=vm.runInContext(code,context);window.ScopeVisuals=context.ScopeVisuals;window.ScopeParameters=context.ScopeParameters;context.ScopeOperator=window.ScopeOperator;return result;};
  if(suppliedHTML){
    context.location={href:'about:srcdoc'};context.parent=window.parent;context.URL=URL;context.Blob=Blob;context.fetch=()=>{throw Error('Offline engine attempted a request');};
    for(const script of scripts.slice(1)){run(script);window.ScopeDesign=context.ScopeDesign;context.ScopePreviewRuntime=window.ScopePreviewRuntime;}
  }else {run(resources.core);window.ScopeDesign=context.ScopeDesign;run(resources.runtime);if(exported)run(finalScripts.at(-1));}
  // VM globalThis and fixture window are distinct; browser globalThis === window.
  return {...fixture,run};
}
const engine=engineFixture(),run=engine.run;engine.context.presets=presets;engine.context.inputDesign=C.clone(candidate);
const standalone=engineFixture(true);assert.equal(standalone.document.body.dataset.scopeDesign,'true');assert.equal(standalone.run('presentation.detailsVisible'),true);assert.equal(standalone.run('appConfig.logoPath'),resources.logo);assert.equal(standalone.run('DemoNodeStore.nodes().length'),10);
run("DemoMulticastGroupStore.create('Studio retention',['N07']);demoView('left',0).node='N05';");const groups=run('JSON.stringify(DemoMulticastGroupStore.list())'),links=run('JSON.stringify(DemoDisplayConnectivityStore.links())');
let renders=0;engine.context.recordRender=()=>renders++;run('const realRenderForStudioTest=render;render=function(){recordRender();return realRenderForStudioTest();};');
const runtime=engine.window.ScopePreviewRuntime;runtime.apply(candidate,presets,{application:'blos',rightApplication:'display',editing:true,region:'header'});assert.equal(renders,1);assert.equal(run('presentation.detailsVisible'),false);assert.equal(run('state.deck.active'),0);
run("demoView('left',0).draftTest='retained'");
const appearance=C.clone(candidate);appearance.colors.header='#344455';appearance.theme='carbon';runtime.apply(appearance,presets,{application:'blos',rightApplication:'display',editing:true,region:'header'});assert.equal(renders,1,'Appearance edits must not replace application DOM');assert.equal(run("demoView('left',0).draftTest"),'retained');assert.equal(run('state.look'),'carbon');assert.equal(run('JSON.stringify(DemoMulticastGroupStore.list())'),groups);
for(const navigation of C.navigation){runtime.apply({...appearance,navigation},presets,{application:'calibration'});assert.equal(run('state.concept'),C.navigation.indexOf(navigation));assert.equal(run('JSON.stringify(DemoMulticastGroupStore.list())'),groups);assert.equal(run('JSON.stringify(DemoDisplayConnectivityStore.links())'),links);}
runtime.apply({...appearance,layout:{...appearance.layout,mode:'split'}},presets,{application:'blos',rightApplication:'display'});assert.equal(run('integrated.left'),0);assert.equal(run('integrated.right'),1);runtime.apply(appearance,presets,{application:'blos',rightApplication:'display'});assert.equal(run('state.deck.active'),0);
runtime.apply({...appearance,detailsVisible:false},presets,{presentation:true});assert.equal(run('presentation.detailsVisible'),true);

// Exercise real resize/selection handlers, including regenerated handles after a slider edit.
const layout=new engine.Element('deck-layout');layout.children=[];layout.style={values:{},setProperty(k,v,p){this.values[k]=[v,p];},removeProperty(k){delete this.values[k];}};
layout.append=el=>{layout.children.push(el);el.remove=()=>layout.children=layout.children.filter(x=>x!==el);};layout.querySelector=()=>layout.children.find(el=>el.className==='studio-resize');
const originalQueryAll=engine.document.querySelectorAll;
engine.document.querySelectorAll=selector=>selector==='.deck-layout'?[layout]:selector==='.studio-resize'?layout.children.filter(el=>el.className==='studio-resize'):originalQueryAll(selector);
engine.document.createElement=()=>{const el=new engine.Element();el.style={};el.setPointerCapture=()=>{};el.removeEventListener=(type)=>delete el.events[type];return el;};
const runtimeEvents=[];runtime.onEvent((type,payload)=>runtimeEvents.push({type,...payload}));
runtime.apply(candidate,presets,{application:'blos',editing:true});assert.equal(layout.children.length,2);
let handle=layout.children[0];handle.events.pointerdown({preventDefault(){},pointerId:1,clientX:200});handle.events.pointermove({clientX:2000});assert(layout.style.values['grid-template-columns'][0].startsWith('280px'));assert.equal(layout.style.values['grid-template-columns'][1],'important');handle.events.pointerup();assert.equal(runtimeEvents.at(-1).width,280);
const resized=C.clone(candidate);resized.regions.navigation={width:280};runtime.apply(resized,presets,{editing:true});handle=layout.children[0];assert.equal(handle.attrs['aria-valuenow'],'280');handle.events.keydown({key:'ArrowLeft',preventDefault(){}});assert.equal(runtimeEvents.at(-1).width,270);
runtime.apply({...candidate,layout:{...candidate.layout,contextVisible:false}},presets,{editing:true});assert.equal(layout.children.length,1);
const beforeSelectionEvents=runtimeEvents.length;engine.listeners.click.at(-1)({target:{closest:s=>s==='[data-demo-host]'?{}:null}});assert.equal(runtimeEvents.length,beforeSelectionEvents,'Application controls cannot be selected as editable shell regions');
runtime.apply(candidate,presets,{editing:false,presentation:true});assert.equal(layout.children.length,0,'Presentation must remove editor handles');

// Preview message authentication: rejected sources, origins, channels, versions and types.
let handler,applies=0,messages=[];const parent={postMessage:m=>messages.push(m)};
const bridgeContext=vm.createContext({URL,location:{href:'http://127.0.0.1/mockups/demo.html?studio=1&studioChannel=abc'},parent,window:{parent,addEventListener:(type,fn)=>handler=fn},ScopePreviewRuntime:{onEvent(){},apply(){applies++;}}});vm.runInContext(read('design-studio/preview-bridge.js'),bridgeContext);assert.equal(messages[0].type,'ready');
const valid={source:parent,origin:'http://127.0.0.1',data:{namespace:'scope-design-studio',version:1,channel:'abc',type:'configure',design:initial,presets,options:{}}};for(const mutate of [e=>e.source={},e=>e.origin='https://evil.invalid',e=>e.data.type='eval',e=>e.data.channel='wrong',e=>e.data.version=2,e=>e.data.namespace='other']){const e={...valid,data:{...valid.data}};mutate(e);handler(e);}assert.equal(applies,0);handler(valid);assert.equal(applies,1);

// Real editor handlers with a minimal controlled DOM. Native rendering is deliberately excluded.
async function editorFixture(offlineAssets=null){
  const els=new Map(),events={};
  class Element{
    constructor(id=''){this.id=id;this.dataset={};this.value='';this.checked=false;this.disabled=false;this.hidden=false;this.style={};this.attrs={};this.children=[];this.files=[];this.innerHTML='';this.textContent='';this.events={};this.classList={toggle(){},add(){},remove(){}};this.contentWindow={postMessage(){}};}
    setAttribute(k,v){this.attrs[k]=v;}addEventListener(k,fn){this.events[k]=fn;}append(...values){this.children.push(...values);}replaceChildren(){this.children=[];this.innerHTML='';}closest(){return this;}matches(){return false;}showModal(){this.open=true;}close(){this.open=false;this.events.close?.();}click(){}remove(){}
  }
  const get=id=>{if(!els.has(id))els.set(id,new Element(id));return els.get(id);};
  const document={body:new Element('body'),documentElement:new Element(),querySelector:s=>get(s.replace(/^#/,'')),querySelectorAll:()=>[],getElementById:get,createElement:()=>new Element(),addEventListener:(k,fn)=>events[k]=fn};
  const downloaded=[],context=vm.createContext({document,window:{addEventListener(){}},location:{origin:'http://127.0.0.1',href:'http://127.0.0.1/design-studio/'},crypto:{randomUUID:()=>Math.random().toString()},URL,ScopeDesign:C,ScopeExports:{...E,download:(...args)=>downloaded.push(args)},fetch:async url=>({ok:true,json:async()=>url==='theme-presets.json'?{presets}:url==='design-config.json'?initial:resources.params}),setTimeout:()=>0,clearTimeout(){},console});
  let networkRequests=0;
  if(offlineAssets){
    context.location={origin:'null',href:'file:///customer/SCOPE-Design-Studio.html'};context.window.origin='null';context.Blob=Blob;
    context.ScopeOfflineAssets=offlineAssets;context.window.ScopeOfflineAssets=offlineAssets;
    context.fetch=()=>{networkRequests++;throw Error('Offline editor attempted a request');};
    vm.runInContext(read('design-studio/exports.js'),context);context.ScopeExports.download=(...args)=>downloaded.push(args);
    vm.runInContext(read('design-studio/offline.js'),context);
  }
  context.ScopeVisuals=require('../../design-studio/visual-system.js');vm.runInContext(read('design-studio/component-editor.js'),context);
  let source=read('design-studio/studio.js');source=source.replace(/\}\)\(\);\s*$/,'globalThis.fixture={get store(){return store;},get mode(){return mode;},get step(){return step;},get presenting(){return presenting;},get region(){return region;}};})();');await vm.runInContext(source,context);
  const click=async(dataset={},id='')=>{const b=new Element(id);b.dataset=dataset;await events.click({target:b});};
  const input=(dataset,value,id='',type='range')=>{const el=new Element(id);el.dataset=dataset;el.value=value;el.type=type;el.checked=Boolean(value);events.input({target:el});};
  const f=context.fixture;assert(f);assert.equal(f.store.value.detailsVisible,false);
  function uniqueFormIds(){const markup=get('structure').innerHTML+get('controls').innerHTML,ids=[...markup.matchAll(/\sid="([^"]+)"/g)].map(m=>m[1]);assert.equal(new Set(ids).size,ids.length,'Editor form IDs must be unique across hidden/visible panels');for(const match of markup.matchAll(/\sfor="([^"]+)"/g))assert(ids.includes(match[1]),'Label must target a control');}
  for(let i=0;i<6;i++){await click({step:String(i)});assert.equal(f.step,i);uniqueFormIds();input({},'Customer step '+i,'decision-note','textarea');assert.equal(f.store.value.notes[Object.keys(initial.notes)[i]],'Customer step '+i);}
  await click({navigation:'deck'});await click({theme:'carbon'});input({path:'colors.header'},'#123456','','color');const before=C.clone(f.store.value);await click({mode:'advanced'});assert.equal(f.mode,'advanced');assert.deepEqual(f.store.value,before);await click({region:'header'});input({path:'regions.header.radius'},12);assert.equal(f.store.value.regions.header.radius,12);await click({action:'apply-global'});assert.equal(f.store.value.material.radius,12);await click({mode:'guided'});assert.equal(f.store.value.material.radius,12);
  get('checkpoint').value='Candidate A';await click({action:'save-candidate'});input({path:'colors.header'},'#654321','','color');await click({action:'restore-candidate'});assert.equal(f.store.value.colors.header,'#123456');await click({action:'compare'});assert.equal(get('comparison').open,true);assert.equal(get('compare-grid').children.length,2);await click({action:'close-compare'});assert.equal(get('compare-grid').children.length,0);
  const history=f.store.past.length;input({},'display','application','select');assert.equal(f.store.past.length,history);await click({action:'present'});assert.equal(f.presenting,true);assert.equal(f.store.value.detailsVisible,true);await click({action:'return'});assert.equal(f.presenting,false);assert.equal(f.store.value.colors.header,'#123456');
  await click({action:'export-json'});assert.equal(downloaded.at(-1)[1],'scope-design.json');assert.equal(JSON.parse(downloaded.at(-1)[0]).theme,'carbon');
  get('import-file').files=[{size:50,text:async()=>JSON.stringify(initial)}];await get('import-file').events.change({target:get('import-file')});assert.deepEqual(f.store.value,C.defaults);
  get('import-file').files=[{size:50,text:async()=>'{"schemaVersion":99}'}];await get('import-file').events.change({target:get('import-file')});assert.deepEqual(f.store.value,C.defaults);
  await click({action:'export-css'});assert(downloaded.at(-1)[0].includes('data-scope-design'));await click({action:'export-summary'});assert(downloaded.at(-1)[0].includes('Customer decisions'));
  if(offlineAssets){await click({action:'export-final'});assert.equal(downloaded.at(-1)[1],'SCOPE-Operator-Standalone.html');assert(downloaded.at(-1)[0].includes(offlineAssets.resources.logo));assert.equal(networkRequests,0);assert(get('preview').srcdoc.includes('ScopeEmbeddedTransport'));assert(get('preview').attrs.sandbox.includes('allow-scripts'));assert(!get('preview').attrs.sandbox.includes('allow-same-origin'));}
  return {context,get,downloaded,click,input};
}
async function servedResources(){
  const server=http.createServer((req,res)=>{const pathname=decodeURIComponent(new URL(req.url,'http://localhost').pathname),file=path.resolve(root,'.'+(pathname.endsWith('/')?pathname+'index.html':pathname));if(!file.startsWith(root+path.sep)){res.writeHead(403).end();return;}try{res.end(fs.readFileSync(file));}catch{res.writeHead(404).end();}});
  await new Promise((resolve,reject)=>{server.once('error',reject);server.listen(0,'127.0.0.1',resolve);});
  try{const base='http://127.0.0.1:'+server.address().port;for(const asset of ['design-studio/','design-studio/studio.css','design-studio/studio.js','design-studio/design-core.js','design-studio/exports.js','design-studio/design-config.json','design-studio/theme-presets.json','design-studio/preview-runtime.js','design-studio/preview-bridge.js','mockups/scope-integrated-electric-glass.html','mockups/styles.css','mockups/params.json','mockups/assets/logo.png','mockups/assets/scope-logo.svg']){const response=await fetch(base+'/'+asset);assert.equal(response.status,200,asset);assert((await response.arrayBuffer()).byteLength>0);}}
  finally{await new Promise(resolve=>server.close(resolve));}
}
module.exports={editorFixture,engineFixture};
if(require.main===module)(async()=>{await editorFixture();await servedResources();console.log(JSON.stringify({syntax:'pass',validatedShellMaterialCombinations:combinations,stateHistoryCandidatesImport:'pass',constrainedDimensions:'pass',runtimeAppearanceDOMRetention:'pass',independentApplicationModels:'pass',previewAuthentication:'pass',guidedAdvancedPresentationHandlers:'pass',sixWorkshopNotes:'pass',standaloneResourcesAndScriptAssembly:'pass',realLocalHTTPResources:14,browserRendering:'not tested; no browser surface available. Native layout, dragging, fullscreen, downloads and Chrome/Edge review remain manual.'},null,2));})().catch(error=>{console.error(error);process.exitCode=1;});

/* Acceptance and ownership checks in controlled DOM/window fixtures.
 * Native rendering and browser file/download behavior require browser review.
 */
'use strict';
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
const root=path.resolve(__dirname,'../..'),C=require('../../design-studio/design-core.js'),V=require('../../design-studio/visual-system.js'),P=require('../../design-studio/parameters.js');globalThis.ScopeDesign=C;
const E=require('../../design-studio/exports.js'),builder=require('../../scripts/build-standalone.cjs'),fixtures=require('./validate-design-studio.cjs');
const result=builder.build({output:'.validation/component-editor/acceptance-candidate.html'}),html=fs.readFileSync(result.file,'utf8'),payload=JSON.parse(html.match(/<script type="application\/json" id="scope-offline-assets">([\s\S]*?)<\/script>/)[1]),presets=payload.themes.presets;
const join='application.blos.button.join',create='application.blos.button.create',leave='application.blos.button.leave';
const resolve=(d,id)=>V.resolveStyle(d,presets.find(p=>p.id===d.theme),{id});
assert.equal(V.componentId('blos','group-join',{slot:'left'}),join);assert.equal(V.componentId('blos','group-join',{slot:'right'}),join);
const row=V.componentId('blos','group-join',{node:'N02'});assert.notEqual(row,join);assert.equal(row,V.componentId('blos','group-join',{node:'N02',slot:'other'}));assert.notEqual(row,V.componentId('blos','group-join',{node:'N03'}));
assert.equal(V.canonicalId('blos:group-join:0'),join);
for(const style of [{background:'red;display:none'},{radius:Infinity},{borderWidth:NaN},{opacity:'0.5'},{gradient:'yes'},{borderStyle:'url(evil)'},{position:'fixed'},{textTransform:'rotate(90deg)'}])assert.throws(()=>V.validateStyle(style));
assert.equal(V.validateStyle({radius:99,borderWidth:99,minWidth:-12}).radius,24);assert.equal(V.validateStyle({radius:'pill'}).radius,'pill');assert.equal(V.validateStyle({radius:50}).radius,50);assert.equal(V.validateStyle({borderWidth:99}).borderWidth,4);assert.throws(()=>V.validateComponents([]));
for(const preset of presets)for(const category of ['join','leave','warning','configuration']){const id=category==='configuration'?create:'application.blos.button.'+category;const values=resolve({...C.defaults,theme:preset.id},id).values;assert.equal(values.background,V.semantic[category][0]);assert(V.contrast(values.text,values.background)>=4.5);}
const defaults=P.validate({componentStyles:{global:{buttons:{radius:6,borderStyle:'dotted'}}}});assert.equal(defaults.schemaVersion,2);assert.equal(P.validate({schemaVersion:1}).schemaVersion,2);assert.equal(resolve({...C.defaults,parameters:defaults},join).values.radius,6);assert.throws(()=>P.validate({componentStyles:{global:{buttons:{onclick:'evil'}}}}));
const layer={...C.defaults,parameters:{componentStyles:{applications:{blos:{buttons:{radius:7}}}}},components:{global:{buttons:{radius:3}},classes:{join:{borderWidth:1}},applications:{blos:{join:{borderWidth:2}}},instances:{[join]:{borderWidth:4}}}};
assert.equal(resolve(layer,join).values.radius,7);assert.equal(resolve(layer,join).values.borderWidth,4);assert.equal(V.resolveStyle(layer,presets[0],{id:join},['instances',join]).values.borderWidth,2);
assert.equal(resolve({...C.defaults,components:{global:{buttons:{topLeft:12}},instances:{[join]:{radius:0}}}},join).values.topLeft,0,'Individual radius resets inherited corner shorthand');
assert.equal(resolve({...C.defaults,components:{instances:{'blos:group-join:0':{radius:0}}}},join).values.radius,0,'Legacy unambiguous main action alias remains effective');
assert(resolve({...C.defaults,components:{instances:{'blos:group-select:3':{radius:0}}}},join).warnings.some(w=>w.includes('Legacy positional')));
assert(resolve({...C.defaults,components:{instances:{[join]:{background:'#FFFFFF',text:'#FFFFFF'}}}},join).warnings.some(x=>x.includes('contrast')));assert(resolve({...C.defaults,components:{instances:{[join]:{background:'#AA00FF'}}}},join).warnings.some(x=>x.includes('semantic')));

(async()=>{
  const editor=await fixtures.editorFixture(payload),store=editor.context.fixture.store;
  await editor.click({theme:'slate-light'});editor.input({},'blos','application','select');await editor.click({mode:'advanced'});
  editor.input({componentControl:'scope'},'global','','select');editor.input({componentControl:'category'},'buttons','','select');await editor.click({componentPreset:'professional'});
  assert.equal(resolve(store.value,join).values.radius,4);assert.equal(resolve(store.value,leave).values.radius,4);
  function select(id,label){const [channel,client]=[...editor.context.fixture.clients][0];const info=V.describe(id);editor.windowEvents.message({origin:'null',source:client.frame.contentWindow,data:{namespace:'scope-design-studio',version:1,channel,type:'component',id,app:info.app,category:info.category,label}});}
  select(join,'Join Group');editor.input({componentProperty:'radius'},0);editor.input({componentProperty:'borderWidth'},2);editor.input({componentProperty:'border'},'#008C3A','','color');
  let values=resolve(store.value,join).values;assert.equal(values.radius,0);assert.equal(values.borderWidth,2);assert.equal(values.border,'#008C3A');assert.equal(values.background,'#00D96C');assert.equal(resolve(store.value,leave).values.radius,4);assert.equal(resolve(store.value,row).values.radius,4,'Individual main Join override must not affect node-row Join');
  select(create,'Create Group');await editor.click({componentPreset:'pill'});assert.equal(resolve(store.value,create).values.radius,50);assert.equal(resolve(store.value,create).values.background,'#7040D9');
  await editor.click({},'undo');assert.equal(resolve(store.value,create).values.radius,4);await editor.click({},'redo');assert.equal(resolve(store.value,create).values.radius,50);
  editor.get('checkpoint').value='Candidate A';await editor.click({action:'save-candidate'});editor.input({componentProperty:'radius'},12);await editor.click({action:'restore-candidate'});assert.equal(resolve(store.value,create).values.radius,50);
  const acceptance=C.clone(store.value);await editor.click({theme:'field-night'});assert.equal(resolve(store.value,create).values.radius,50);assert.equal(resolve(store.value,join).values.background,'#00D96C');await editor.click({action:'restore-candidate'});
  await editor.click({action:'export-json'});const json=editor.downloaded.at(-1)[0];editor.get('import-file').files=[{size:Buffer.byteLength(json),text:async()=>json}];await editor.get('import-file').events.change({target:editor.get('import-file')});assert.equal(resolve(store.value,join).values.borderWidth,2);
  await editor.click({action:'export-css'});const css=editor.downloaded.at(-1)[0];assert(css.includes('[data-style-id="'+join+'"]'));assert(css.includes('--scope-component-border:#008C3A!important'));assert(css.includes('border-radius:50px!important'));assert(css.includes('var(--scope-component-focusColor'));assert(css.includes('button[aria-busy="true"]'));assert(css.includes('prefers-reduced-motion'));
  await editor.click({action:'present'});assert.equal(resolve(store.value,create).values.radius,50);await editor.click({action:'return'});
  await editor.click({action:'export-final'});const final=editor.downloaded.at(-1)[0];assert.equal(editor.downloaded.at(-1)[1],'SCOPE-Operator-Standalone.html');const engine=fixtures.engineFixture(true,final),run=engine.run;
  assert.equal(resolve(engine.window.ScopePreviewRuntime.snapshot(),join).values.radius,0);assert.equal(resolve(engine.window.ScopePreviewRuntime.snapshot(),create).values.radius,50);
  assert.equal(engine.elements.get('#scope-design-overrides').textContent,C.compileDesign(engine.window.ScopePreviewRuntime.snapshot(),presets.find(p=>p.id==='slate-light')),'Export uses exactly the shared preview CSS compiler');
  // Exercise semantic annotation against actual BLOS module button markup.
  const host=engine.document.querySelectorAll('[data-demo-host]').find(h=>h.dataset.app==='0');assert(host);const owner=new engine.Element();owner.dataset={owner:'blos'};
  const buttons=[];const buttonHTML=run("BLOSModule.groups(demoView('single',0),'single')");
  for(const tag of buttonHTML.matchAll(/<button([^>]*)>([\s\S]*?)<\/button>/g)){
    const b=new engine.Element();b.textContent=tag[2].replace(/<[^>]*>/g,'');for(const attr of tag[1].matchAll(/([\w-]+)="([^"]*)"/g)){b.attrs[attr[1]]=attr[2];if(attr[1].startsWith('data-'))b.dataset[attr[1].slice(5).replace(/-([a-z])/g,(_,c)=>c.toUpperCase())]=attr[2];}
    b.setAttribute=function(k,v){this.attrs[k]=String(v);if(k.startsWith('data-'))this.dataset[k.slice(5).replace(/-([a-z])/g,(_,c)=>c.toUpperCase())]=String(v);};
    b.closest=selector=>selector==='[data-demo-host]'?host:selector==='[data-style-id]'&&b.attrs['data-style-id']?b:selector==='[data-owner]'?owner:null;buttons.push(b);
  }
  host.closest=selector=>selector==='.owner-surface'?owner:null;host.querySelectorAll=s=>s==='button'?buttons:[];
  const query=engine.document.querySelectorAll;engine.document.querySelectorAll=s=>s==='[data-component-selected]'?buttons.filter(b=>b.attrs['data-component-selected']!==undefined):s.startsWith('[data-style-id="')?buttons.filter(b=>b.dataset.styleId===s.match(/"([^"]+)"/)[1]):query(s);
  const events=[];engine.window.ScopePreviewRuntime.onEvent((type,value)=>events.push({type,...value}));engine.window.ScopePreviewRuntime.apply(engine.window.ScopePreviewRuntime.snapshot(),presets,{editing:true,componentPicker:true});
  const joinButton=buttons.find(b=>b.dataset.styleId===join),createButton=buttons.find(b=>b.dataset.styleId===create);assert(joinButton&&createButton,'Exported actual BLOS controls receive semantic IDs');
  const groupsBefore=run('JSON.stringify(DemoMulticastGroupStore.list())');let prevented=false,stopped=false;
  engine.listeners.click.at(-1)({target:joinButton,preventDefault(){prevented=true;},stopImmediatePropagation(){stopped=true;}});assert(prevented&&stopped);assert.equal(events.at(-1).id,join);assert.equal(joinButton.attrs['data-component-selected'],'true');assert.equal(run('demoDialog'),null);assert.equal(run('JSON.stringify(DemoMulticastGroupStore.list())'),groupsBefore,'Selection must not execute an operation');
  engine.window.ScopePreviewRuntime.apply(engine.window.ScopePreviewRuntime.snapshot(),presets,{editing:true,componentPicker:true});engine.listeners.keydown.at(-1)({key:'Escape',preventDefault(){}});assert.equal(events.at(-1).type,'component-exit');
  // Each reset has a bounded scope; reset-all is undoable and leaves shell design intact.
  select(join,'Join Group');await editor.click({componentReset:'border'});assert.equal(resolve(store.value,join).values.borderWidth,2);assert.equal(resolve(store.value,join).values.border,'#00D96C');await editor.click({action:'reset-semantic-component'});assert.equal(resolve(store.value,join).values.radius,4);assert.equal(resolve(store.value,create).values.radius,50);
  await editor.click({action:'reset-all-components'});assert.equal(store.value.components,undefined);assert.equal(store.value.theme,'slate-light');await editor.click({},'undo');assert.equal(resolve(store.value,create).values.radius,50);
  // Optional parameter component defaults are preserved by configurable exports.
  const configuration=P.validate({componentStyles:{global:{buttons:{minWidth:120,gradient:true,gradientStart:'#16345A',gradientEnd:'#294D77',loadingBg:'#38506C',loadingText:'#FFFFFF',letterSpacing:.5}}}});
  const withConfig=C.validate({...acceptance,parameters:configuration});assert.equal(resolve(withConfig,leave).values.minWidth,120);assert.equal(resolve(withConfig,join).values.radius,0);
  globalThis.ScopeOfflineAssets=payload;const zip=await E.folder(withConfig,presets);fs.writeFileSync(path.join(root,'.validation/component-editor/configurable.zip'),zip);delete globalThis.ScopeOfflineAssets;
  const body=Buffer.from(zip).toString('utf8');assert(body.includes('componentStyles'));assert(body.includes(join));assert(body.includes('Import Parameters JSON'));
  console.log(JSON.stringify({temporaryBuild:result.file,acceptanceSequence:'Slate Light / rounded all / square green-border Join / purple pill Create: pass',semanticDefaultFamilies:presets.length,stableIDsAndEntityIsolation:'pass',previewAndOperatorCSSParity:'pass',selectionOwnershipAndEscape:'pass (controlled events)',propertyComponentAllResets:'pass',undoRedoCandidatesJSONCSSFinalFolder:'pass',parameterDefaultsAndLegacySupport:'pass',browser:'NOT RUN: no browser surface; native focus, light/dark rendering and file dialogs remain unverified'},null,2));
})().catch(error=>{console.error(error);process.exitCode=1;});

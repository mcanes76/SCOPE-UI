/* Phase 1 shell ownership, cascade, history and portable export acceptance. */
'use strict';
const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const C=require('../../design-studio/design-core.js'),V=require('../../design-studio/visual-system.js'),P=require('../../design-studio/parameters.js');globalThis.ScopeDesign=C;
const E=require('../../design-studio/exports.js'),builder=require('../../scripts/build-standalone.cjs'),fixtures=require('./validate-design-studio.cjs');
const built=builder.build({output:'.validation/phase1/candidate.html'}),html=fs.readFileSync(built.file,'utf8'),payload=JSON.parse(html.match(/id="scope-offline-assets">([\s\S]*?)<\/script>/)[1]),presets=payload.themes.presets;
const preset=d=>presets.find(p=>p.id===d.theme),resolve=(d,c)=>V.resolveShellStyle(d,preset(d),c).values;
assert.equal(C.validate(C.defaults).shellComponents,undefined,'Legacy designs stay unchanged');
assert.deepEqual(P.validate({schemaVersion:1}).shellComponents,{});
assert.deepEqual(V.validateShellComponents(),{});
for(const input of [null,[],{unknown:{}},{buttons:{position:'fixed'}},{inputs:{background:'url(evil)'}},{panels:{opacity:NaN}},{typography:{fontFamily:'arbitrary;display:none'}}])assert.throws(()=>V.validateShellComponents(input));
assert.equal(V.validateShellComponents({panels:{opacity:0}}).panels.opacity,0);
for(const p of presets){
  const d=C.validate({...C.defaults,theme:p.id});
  assert.equal(resolve(d,'buttons').background,V.tokens(d,p).control);
  assert.equal(resolve(d,'panels').background,V.tokens(d,p).panel);
  assert.equal(resolve(d,'inputs').focusColor,V.tokens(d,p).focus);
  for(const c of Object.keys(V.shellFields))for(const value of Object.values(resolve(d,c)))assert.notEqual(value,undefined);
}
const layered=C.validate({...C.defaults,parameters:{shellComponents:{buttons:{radius:6,text:'#112233'}}},shellComponents:{buttons:{radius:12}}});
assert.equal(resolve(layered,'buttons').radius,12);assert.equal(resolve(layered,'buttons').text,'#112233');assert.equal(V.resolveShellStyle(layered,preset(layered),'buttons').sources.radius,'Component override');
assert.equal(V.resolveShellStyle(layered,preset(layered),'buttons',true).values.radius,V.tokens(layered,preset(layered)).f.controlRadius);
const design=C.validate({...layered,shellComponents:Object.fromEntries(Object.keys(V.shellFields).map(c=>[c,{}]))});
Object.assign(design.shellComponents,{buttons:{background:'#123456',text:'#FFFFFF',hoverBg:'#234567',pressedBg:'#345678',disabledBg:'#456789',radius:7},tabs:{selectedBg:'#56789A',background:'#112244',spacing:9},panels:{background:'#223344',opacity:.4,paddingX:21,elevation:'flat'},typography:{fontFamily:'Segoe UI',headingSize:30,fontSize:16,fontWeight:600,text:'#CCDDEE'},inputs:{focusColor:'#00AAFF',background:'#111122'},success:{background:'#008844'},warning:{background:'#CCAA00'},error:{background:'#AA1122'},neutral:{background:'#445566'}});
const css=V.compileShellComponents(design,preset(design));
assert(css.includes('--scope-shell-background:#123456'));assert(css.includes('--scope-shell-fontFamily:"Segoe UI",system-ui,sans-serif'));assert(css.includes('var(--scope-shell-opacity)'));assert(css.includes('var(--scope-shell-selectedBg)'));assert(css.includes('var(--scope-shell-disabledBg)'));assert(css.includes('var(--scope-shell-focusColor)'));
// Audit every emitted selector, including each pseudo-state, for both ownership exclusions.
for(const rule of css.split('\n'))for(const selector of split(rule.slice(0,rule.indexOf('{')))){assert(selector.includes(':not(:where([data-demo-host],[data-demo-host] *,#demo-action-dialog,#demo-action-dialog *))'),selector);assert(selector.startsWith('body[data-scope-design="true"]'));}
function split(s){let depth=0,start=0,out=[];for(let i=0;i<s.length;i++){if('(['.includes(s[i]))depth++;if(')]'.includes(s[i]))depth--;if(s[i]===','&&!depth){out.push(s.slice(start,i));start=i+1;}}out.push(s.slice(start));return out;}
assert(css.indexOf('--scope-shell-fontFamily:')<css.indexOf('--scope-shell-background:#123456'),'Typography defaults precede explicit component colors');
assert(css.includes('span:not(:where(button *))'),'Typography leaves nested button labels inheriting button color');
assert(css.includes('--scope-shell-disabledBg:#456789'),'Navigation retains disabled colors');
assert(!css.includes('opacity:0.4!important'),'Panel opacity changes the fill, not child controls');
(async()=>{
  const editor=await fixtures.editorFixture(payload),store=editor.context.fixture.store;
  await editor.click({mode:'advanced'});assert(editor.get('controls').innerHTML.includes('Shell Component Editor (Phase 1)'));
  for(const [category,style] of Object.entries(design.shellComponents))for(const [key,value] of Object.entries(style))editor.input({shellCategory:category,shellProperty:key},value,'',typeof value==='number'?'range':V.colors.includes(key)?'color':'select');
  assert.equal(resolve(store.value,'buttons').radius,7);assert.equal(resolve(store.value,'panels').opacity,.4);
  await editor.click({},'undo');assert.notEqual(resolve(store.value,'neutral').background,'#445566');await editor.click({},'redo');assert.equal(resolve(store.value,'neutral').background,'#445566');
  for(const candidate of ['Candidate A','Candidate B','Candidate C']){editor.get('checkpoint').value=candidate;await editor.click({action:'save-candidate'});}
  editor.input({shellCategory:'buttons',shellProperty:'radius'},2);await editor.click({action:'restore-candidate'});assert.equal(resolve(store.value,'buttons').radius,7);
  await editor.click({action:'compare'});assert.equal(editor.get('compare-grid').children.length,2);await editor.click({action:'close-compare'});
  await editor.click({theme:'slate-light'});assert.equal(resolve(store.value,'buttons').radius,7);assert.equal(resolve(store.value,'inputs').border,V.tokens(store.value,preset(store.value)).controlBorder);
  await editor.click({action:'export-json'});const json=editor.downloaded.at(-1)[0];assert.equal(JSON.parse(json).shellComponents.panels.opacity,.4);
  editor.get('import-file').files=[{size:json.length,text:async()=>json}];await editor.get('import-file').events.change({target:editor.get('import-file')});assert.equal(resolve(store.value,'tabs').spacing,9);
  await editor.click({action:'export-css'});assert(editor.downloaded.at(-1)[0].includes('--scope-shell-background:#123456'));
  await editor.click({action:'present'});assert.equal(resolve(store.value,'buttons').radius,7);await editor.click({action:'return'});
  await editor.click({action:'export-final'});const final=editor.downloaded.at(-1)[0],engine=fixtures.engineFixture(true,final),runtime=engine.window.ScopePreviewRuntime;
  assert.equal(resolve(runtime.snapshot(),'panels').opacity,.4);assert.equal(engine.elements.get('#scope-design-overrides').textContent,C.compileDesign(runtime.snapshot(),preset(runtime.snapshot())));
  engine.run("DemoMulticastGroupStore.create('Phase 1 retention',['N07']);demoView('single',0).draft='Phase 1 draft'");const groups=engine.run('JSON.stringify(DemoMulticastGroupStore.list())');
  let renders=0;engine.context.countPhase1Render=()=>renders++;engine.run('const phase1Render=render;render=function(){countPhase1Render();return phase1Render();}');
  const changed=C.clone(runtime.snapshot());changed.shellComponents.buttons.radius=3;runtime.apply(changed,presets,{presentation:true});
  assert.equal(renders,0);assert.equal(engine.run("demoView('single',0).draft"),'Phase 1 draft');assert.equal(engine.run('JSON.stringify(DemoMulticastGroupStore.list())'),groups);
  const parameters=P.validate({shellComponents:{buttons:{radius:5},inputs:{focusColor:'#BBCCDD'}}});await engine.window.ScopeOperator.importParameters(parameters);assert.equal(resolve(runtime.snapshot(),'buttons').radius,5,'Explicit parameter import replaces exported shell overrides');assert.equal(runtime.snapshot().shellComponents,undefined);
  globalThis.ScopeOfflineAssets=payload;const zip=await E.folder(store.value,presets);delete globalThis.ScopeOfflineAssets;const archive=Buffer.from(zip).toString('utf8');assert(archive.includes('"shellComponents"'));assert(archive.includes('"opacity": 0.4'));
  // Reset-to-theme clears both parameter and explicit layers, remains undoable.
  store.set({...store.value,parameters:{shellComponents:{buttons:{radius:15}}}});
  await editor.click({shellReset:'buttons',shellKey:'radius'});assert.equal(resolve(store.value,'buttons').radius,V.tokens(store.value,preset(store.value)).f.controlRadius);assert.equal(store.value.shellComponents.buttons.background,'#123456');
  await editor.click({},'undo');assert.equal(resolve(store.value,'buttons').radius,7);
  await editor.click({shellReset:'buttons'});assert.equal(store.value.shellComponents.buttons,undefined);assert.equal(store.value.shellComponents.panels.opacity,.4);
  await editor.click({shellReset:'all'});assert.deepEqual(JSON.parse(JSON.stringify(store.value.shellComponents)),{});assert.equal(resolve(store.value,'buttons').radius,V.tokens(store.value,preset(store.value)).f.controlRadius);
  await editor.click({mode:'guided'});assert(!editor.get('controls').innerHTML.includes('Shell Component Editor'));
  console.log(JSON.stringify({phase1:'pass',themeInheritance:presets.length+' palettes',ownership:'all emitted selectors exclude application hosts and dialogs',persistence:'JSON / parameters / history / Candidates A/B/C',exports:'CSS / standalone runtime / folder ZIP',applicationRetention:'no rerender; draft and model retained',resets:'property / category / all, including parameter defaults',browserRendering:'not covered by controlled DOM fixtures'},null,2));
})().catch(error=>{console.error(error);process.exitCode=1;});

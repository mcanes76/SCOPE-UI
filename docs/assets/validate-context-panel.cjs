/* Controlled DOM conformance; this is not browser geometry or visual acceptance. */
'use strict';
const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const root=path.resolve(__dirname,'../..'),C=require('../../design-studio/design-core.js');globalThis.ScopeDesign=C;
const E=require('../../design-studio/exports.js'),B=require('../../scripts/build-standalone.cjs'),F=require('./validate-design-studio.cjs');
const presets=JSON.parse(fs.readFileSync(path.join(root,'design-studio/theme-presets.json'),'utf8')).presets;
const plain=v=>JSON.parse(JSON.stringify(v));
assert.equal(C.defaults.layout.contextVisible,false);
assert.equal(C.validate({schemaVersion:1}).layout.contextVisible,true,'Legacy omitted visibility retains the old default');
for(const visible of [false,true])assert.equal(C.validate({...C.defaults,layout:{contextVisible:visible}}).layout.contextVisible,visible);
const helper=fs.readFileSync(path.join(__dirname,'validate-window-manager.cjs'),'utf8');
const nativeDOM=new Function('b',helper.slice(helper.indexOf('function nativeDOM('),helper.indexOf('async function dispatch('))+'return nativeDOM;')({width:1400,height:800});
const engine=F.engineFixture(true,E.composeFinal(B.resources(),C.defaults,presets)),dom=nativeDOM(engine),op=engine.window.ScopeOperator,runtime=engine.window.ScopePreviewRuntime;
const {Node}=dom;
const matches=Node.prototype.matches;Node.prototype.matches=function(s){return s.startsWith('#')?this.id===s.slice(1):matches.call(this,s);};
const query=engine.document.querySelector.bind(engine.document);engine.document.querySelector=s=>dom.rootNode.querySelector(s)||query(s);
let shell=dom.rootNode.querySelector('.shell'),header=new Node('header');header.className='shell-top';shell.prepend(header);
// The fixture does not parse full markup, so explicitly provide the native rail/event node.
const native=new Node('aside'),events=new Node('ul');native.className='deck-rail';events.id='deck-events';native.append(events);shell.append(native);
const host=new Node();host.dataset.demoHost='';host.draft={node:'N07'};dom.target.append(host);
const originalTarget=dom.target;
let renders=0;engine.context.recordContextRender=()=>renders++;engine.run('const contextRender=render;render=function(){recordContextRender();return contextRender();};');
runtime.apply({...C.defaults,navigation:'deck'},presets,{application:'blos'});
assert.equal(shell.querySelectorAll('.scope-context-panel').length,1);assert.equal(native.hidden,true);
const store=new C.DesignStore(op.currentDesign());runtime.onEvent((type,event)=>{if(type==='operator')store.set(event.design);});
const before=renders;const control=new Node('button');control.dataset.operator='context';const click=engine.captures.click.find(fn=>String(fn).includes('[data-operator],[data-integration-action]'));assert(click);click({target:control,preventDefault(){},stopImmediatePropagation(){}});assert.equal(native.hidden,false);assert.equal(renders,before,'Context changes must not render applications');
assert.equal(host.draft.node,'N07');assert.equal(shell.querySelector('.deck-main'),originalTarget);
native.scrollTop=77;for(const listener of native.events.scroll||[])listener();op.toggleContext();assert(native.hidden);op.toggleContext();assert.equal(native.scrollTop,77);
store.undo();assert.equal(store.value.layout.contextVisible,false);store.redo();assert.equal(store.value.layout.contextVisible,true);store.save('Candidate A');store.update(d=>d.layout.contextVisible=false);store.restore('Candidate A');assert.equal(store.value.layout.contextVisible,true);
let combinations=0;
for(const navigation of C.navigation)for(const mode of ['single','split','stacked'])for(const windowed of [false,true]){
  const design=C.validate({...C.defaults,navigation,layout:{...C.defaults.layout,mode,contextVisible:true},workspace:{...require('../../design-studio/workspace.js').defaults,layout:mode,windowed}});
  // Simulate a fresh shell after the engine changes navigation. Application node is reparented, never cloned.
  const next=new Node();next.className='shell';const main=new Node();main.className='deck-main';next.append(main);main.append(host);dom.rootNode.replaceChildren(next);shell=next;
  if(navigation==='deck'&&mode==='single'){const fresh=new Node('aside');fresh.className='deck-rail';next.append(fresh);}
  runtime.apply(design,presets,{application:'blos',rightApplication:'display'});op.decorateContext();
  assert.equal(next.querySelectorAll('.scope-context-panel').length,1);assert.equal(next.querySelector('.scope-context-panel'),native);assert.equal(next.querySelectorAll('.deck-rail').length,1);assert.equal(native.hidden,false);assert.equal(host.draft.node,'N07');
  const snapshot=plain(op.currentDesign());assert.equal(snapshot.layout.contextVisible,true);assert.deepEqual(C.validate(JSON.parse(JSON.stringify(snapshot))),C.validate(snapshot));
  const css=C.compileCSS(snapshot);assert(css.includes('.scope-context-main > .integrated-panes{position:relative}'));assert(css.includes('[data-ui-details="hidden"] .scope-context-panel > section{display:block!important}'));assert(css.includes('.scope-context-layout{display:grid;grid-template-columns:minmax(0,1fr) 250px'));assert(css.includes('.scope-context-panel[hidden]{display:none!important}'));
  op.toggleContext();assert(native.hidden);assert(C.compileCSS(op.currentDesign()).includes('.scope-context-layout{display:grid;grid-template-columns:minmax(0,1fr);'));
  combinations++;
}
const regionHidden=C.validate({...C.defaults,layout:{...C.defaults.layout,contextVisible:true},regions:{context:{visible:false,width:310}}});runtime.apply(regionHidden,presets);op.toggleContext();assert.equal(op.currentDesign().regions.context.visible,true);assert.equal(op.currentDesign().regions.context.width,310);
engine.run("state.history.push('Context event retained')");op.decorateContext();op.toggleContext();op.toggleContext();assert(engine.run("state.history.includes('Context event retained')"));
const exported=E.composeFinal(B.resources(),op.currentDesign(),presets),reopened=F.engineFixture(true,exported);assert.equal(reopened.window.ScopeOperator.currentDesign().layout.contextVisible,true);assert.equal(reopened.window.ScopeOperator.currentDesign().regions.context.width,310);
const saved=plain(op.currentDesign());saved.layout.contextVisible=false;runtime.apply(saved,presets);assert(native.hidden);
console.log(JSON.stringify({phaseC:'pass',shellLayouts:combinations,legacyAndExplicitVisibility:'pass',singlePanelIdentityAndApplicationDraft:'retained',collapseReopenScrollHistory:'pass',undoRedoCandidates:'pass',jsonCSSStandaloneRoundTrip:'pass',browserRendering:'NOT verified by controlled DOM'},null,2));

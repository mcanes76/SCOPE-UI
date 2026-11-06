/* Dependency-free checks: node docs/assets/validate-integrated-demo.cjs
 * Controlled DOM/window fixtures test contracts and handlers, not browser rendering.
 */
'use strict';
const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm'),assert=require('node:assert/strict');
const root=path.resolve(__dirname,'../..');
const html=fs.readFileSync(path.join(root,'mockups/scope-integrated-demo.html'),'utf8');
const script=html.match(/<script>([\s\S]*?)<\/script>/)[1];new vm.Script(script);
assert(!/\b(?:fetch|XMLHttpRequest|WebSocket|EventSource)\s*\(/.test(script));
assert(!/<(?:script|link|img)[^>]+(?:src|href)=/i.test(html));
const elements=new Map(),listeners={},windowEvents={},timers=[],hosts=new Map();
class Element {
  constructor(id=''){this.id=id;this.dataset={};this.attrs={};this.innerHTML='';this.textContent='';this.value='';this.checked=false;this.disabled=false;this.open=false;this.isConnected=true;this.events={};this.tagName='BUTTON';this.classList={add(){},remove(){},toggle(){}};}
  setAttribute(k,v){this.attrs[k]=String(v);}getAttribute(k){return this.attrs[k];}removeAttribute(k){delete this.attrs[k];}
  focus(){document.activeElement=this;}remove(){}setSelectionRange(){}
  closest(selector){if(selector==='[data-demo-action]')return this.dataset.demoAction?this:null;if(selector==='g[data-demo-action]')return this.tagName==='g'&&this.dataset.demoAction?this:null;if(selector==='[data-demo-host]')return null;if(selector==='[role="tab"]')return this.attrs.role==='tab'?this:null;return selector==='button'&&this.tagName!=='BUTTON'?null:this;}
  addEventListener(k,fn){this.events[k]=fn;}querySelectorAll(){return [];}
  showModal(){this.open=true;}close(){this.open=false;this.events.close?.();}
}
const get=id=>{const key='#'+id;if(!elements.has(key))elements.set(key,new Element(id));return elements.get(key);};
function markup(){return [0,1,2,3,4].map(i=>get('concept-panel-'+i).innerHTML).join('')+get('exploration').innerHTML;}
function activeHosts(){
  const result=[];
  for(const match of markup().matchAll(/<div class="app-content" data-demo-host tabindex="-1" data-app="(\d)" data-slot="([^"]+)"/g)){
    const [index,slot]=[Number(match[1]),match[2]];
    if(!hosts.has(slot))hosts.set(slot,new Element());
    const host=hosts.get(slot);host.dataset={app:String(index),slot};result.push(host);
  }
  return result;
}
const document={body:{dataset:{}},activeElement:null,title:'',
  querySelector(selector){
    if(selector.startsWith('[data-demo-host]')){const slot=selector.match(/data-slot="([^"]+)"/)?.[1];return activeHosts().find(h=>h.dataset.slot===slot)||null;}
    if(selector.startsWith('#'))return get(selector.slice(1));
    if(!elements.has(selector))elements.set(selector,new Element());return elements.get(selector);
  },
  querySelectorAll(selector){if(selector==='[data-demo-host]')return activeHosts();if(selector==='[data-initial-node]:checked')return selectedInitialNodes;return [];},
  getElementById(id){return get(id);},addEventListener(k,fn){(listeners[k]??=[]).push(fn);}
};
let selectedInitialNodes=[],printed='';
const window={location:{href:'file:///C:/REPO/SCOPE-UI/mockups/scope-integrated-demo.html'},screen:{availWidth:1920,availHeight:1080},
  addEventListener(k,fn){windowEvents[k]=fn;},print(){windowEvents.beforeprint?.();printed=get('print-guide').innerHTML;windowEvents.afterprint?.();},open(){return null;},close(){},opener:null};
const context=vm.createContext({document,window,URL,setTimeout:fn=>timers.push(fn)});
vm.runInContext(script,context);
const run=code=>vm.runInContext(code,context);
function click(dataset){const button=new Element();button.dataset=dataset;listeners.click.forEach(fn=>fn({target:button}));return button;}
function change(dataset,value,checked=false){const input=new Element();input.tagName='INPUT';input.dataset=dataset;input.value=value;input.checked=checked;listeners.change.forEach(fn=>fn({target:input}));}
function input(dataset,value){const field=new Element();field.tagName='INPUT';field.dataset=dataset;field.value=value;listeners.input.forEach(fn=>fn({target:field}));}
function relationships(source){const ids=new Set(),refs=[];for(const tag of source.matchAll(/<[a-z][\w-]*(\s[^<>]*?)?>/gi)){const attrs={};for(const a of tag[0].matchAll(/([\w-]+)="([^"]*)"/g))attrs[a[1]]=a[2];if(attrs.id){assert(!ids.has(attrs.id),'Duplicate ID '+attrs.id);ids.add(attrs.id);}for(const k of ['aria-controls','aria-labelledby','aria-describedby','for'])if(attrs[k])refs.push(...attrs[k].split(/\s+/));if(attrs.href?.startsWith('#'))refs.push(attrs.href.slice(1));}for(const id of refs)assert(ids.has(id),'Missing relationship '+id);}
const staticHTML=html.slice(0,html.indexOf('<script>'));
function pageHTML(){return staticHTML.replace(/(<div id="concept-panel-\d"[^>]*>)<\/div>/g,(all,start)=>start+get(start.match(/id="([^"]+)/)[1]).innerHTML+'</div>');}
assert.equal(run('DemoApplicationRegistry.length'),4);
assert.equal(run('DemoNodeStore.nodes().length'),10);
const snapshot=run('DemoNodeStore.nodes()');snapshot[0].label='mutated';assert.equal(run('DemoNodeStore.get("N01").label'),'Austin');
// Same application: one data model, independent tabs, selections and expanded lists.
run("integrated.left=0;integrated.right=0;demoView('left',0).tab='groups';demoView('right',0).tab='discovery';render();");
const graphBefore=run('JSON.stringify(DemoNodeStore.links())');
assert.throws(()=>run("DemoMulticastGroupStore.join('G01','N01')"));
assert.throws(()=>run("DemoMulticastGroupStore.join('G01','N10')"));
assert.throws(()=>run("DemoMulticastGroupStore.create('group 01',[])"));
assert.throws(()=>run("DemoMulticastGroupStore.create('Duplicate nodes',['N07','N07'])"));
click({demoAction:'group-create',slot:'left'});assert(get('demo-action-dialog').open);
get('demo-group-name').value='Exercise Group';selectedInitialNodes=[{dataset:{initialNode:'N07'}}];click({demoDialog:'confirm'});selectedInitialNodes=[];
const groupID=run("DemoMulticastGroupStore.list().find(g=>g.name==='Exercise Group').id");assert.equal(run("DemoMulticastGroupStore.membership('N07').name"),'Exercise Group');
click({demoAction:'group-join',slot:'right',node:'N08'});get('demo-group-target').value=groupID;get('demo-node-target').value='N08';click({demoDialog:'confirm'});
assert.equal(run("DemoMulticastGroupStore.membership('N08').id"),groupID);
assert.equal(run("demoView('left',0).tab"),'groups');assert.equal(run("demoView('right',0).tab"),'discovery');
assert(run("BLOSModule.discovery(demoView('right',0),'right')").includes('Exercise Group'));
assert(run("BLOSModule.topology(demoView('left',0),'left')").includes('Exercise Group'));
click({demoAction:'group-leave',slot:'left'});get('demo-node-target').value='N08';click({demoDialog:'confirm'});assert.equal(run("DemoMulticastGroupStore.membership('N08')"),null);
assert.equal(run('JSON.stringify(DemoNodeStore.links())'),graphBefore,'Group membership must never mutate topology links');
// Changing the right application must preserve the left view object.
run("demoView('left',0).node='N05'");change({integrationChoice:'right'},'2');assert.equal(run("demoView('left',0).node"),'N05');
click({demoAction:'sensor-edit',slot:'right'});input({demoField:'sensor-value',slot:'right',key:'azimuth'},'12.5');
input({demoField:'sensor-value',slot:'right',key:'elevation'},'999');click({demoAction:'sensor-apply',slot:'right'});assert(run("demoView('right',2).drafts.S1.error").includes('elevation'));
input({demoField:'sensor-value',slot:'right',key:'elevation'},'2.5');click({demoAction:'sensor-apply',slot:'right'});assert(get('demo-action-dialog').open);click({demoDialog:'cancel'});assert.equal(run("DemoSensorStore.get('S1').values.azimuth"),1.2);
click({demoAction:'sensor-apply',slot:'right'});click({demoDialog:'confirm'});assert.equal(run("DemoSensorStore.get('S1').values.azimuth"),12.5);
change({demoField:'sensor-choice',slot:'right'},'S2');change({demoField:'sensor-choice',slot:'right'},'S1');assert.equal(run("DemoSensorStore.get('S1').values.azimuth"),12.5);
click({demoAction:'sensor-edit',slot:'right'});input({demoField:'sensor-value',slot:'right',key:'roll'},'77');click({demoAction:'sensor-cancel',slot:'right'});assert.equal(run("DemoSensorStore.get('S1').values.roll"),.2);
click({demoAction:'sensor-read',slot:'right'});assert(run("demoView('right',2).busy"));timers.shift()();assert(run("DemoSensorStore.get('S1').lastRead"));
assert.throws(()=>run("DemoSensorStore.validate({azimuth:'',elevation:0,roll:0})"));
assert.throws(()=>run("DemoSensorStore.validate({azimuth:'   ',elevation:0,roll:0})"));
const revision=run("DemoSensorStore.get('S1').revision");run(`DemoSensorStore.update('S1',{azimuth:1,elevation:2,roll:3},${revision})`);assert.throws(()=>run(`DemoSensorStore.update('S1',{azimuth:4,elevation:5,roll:6},${revision})`));
click({demoAction:'sensor-restore',slot:'right'});click({demoDialog:'confirm'});assert.equal(run("DemoSensorStore.get('S1').values.azimuth"),1.2);
// Display's camera works and reference data remains read-only.
change({integrationChoice:'right'},'1');click({demoAction:'display-node',slot:'right',node:'N10'});assert.equal(run("demoView('right',1).yaw"),151);
const projected=run("DisplayModule.project(-34,151,demoView('right',1))");assert(Math.abs(projected.x-250)<.001);assert(projected.z>.99);
click({demoAction:'display-in',slot:'right'});assert(run("demoView('right',1).zoom")>1);
change({demoField:'display-links',slot:'right'},'',false);assert.equal(run("demoView('right',1).links"),false);
change({demoField:'display-labels',slot:'right'},'',false);assert.equal(run("demoView('right',1).labels"),false);
click({demoAction:'display-left',slot:'right'});click({demoAction:'display-up',slot:'right'});click({demoAction:'display-reset',slot:'right'});assert.equal(run("demoView('right',1).zoom"),1);
assert(!run("DisplayModule.globe(demoView('right',1),'right')").includes('NaN'));
// Native LOS local draft/apply/read/reset.
change({integrationChoice:'right'},'3');input({demoField:'los-label',slot:'right'},'Example local label');click({demoAction:'los-apply',slot:'right'});click({demoDialog:'confirm'});assert.equal(run('DemoLOSStore.get().config.label'),'Example local label');
click({demoAction:'los-read',slot:'right'});assert(run('DemoLOSStore.get().lastRead'));click({demoAction:'los-reset',slot:'right'});click({demoDialog:'confirm'});assert.equal(run('DemoLOSStore.get().config.label'),'Sample configuration');
click({integrationAction:'expand',panel:'left'});assert.equal(run('integrated.expanded'),'left');click({integrationAction:'restore'});assert.equal(run('integrated.expanded'),null);
click({integrationAction:'mode-single'});assert.equal(run('integrated.mode'),'single');click({integrationAction:'mode-split'});assert.equal(run('integrated.mode'),'split');
// Generated markup across every app/tab, split duplication, shell/look and guide topic.
let views=0,guides=0;
for(const look of ['prism','nocturne','carbon','spectrum'])for(let shell=0;shell<4;shell++){
  run(`state.look='${look}';state.concept=${shell};state.view='workspace';integrated.mode='split';`);
  for(let app=0;app<4;app++){
    run(`integrated.left=${app};integrated.right=${app};render();`);relationships(pageHTML());views++;
    if(app<2)for(const tab of app===0?['groups','discovery','topology']:['globe','nodes']){run(`demoView('left',${app}).tab='${tab}';render();`);relationships(pageHTML());views++;}
  }
  for(let app=0;app<4;app++){
    run(`integrated.mode='single';state.aperture.active=${app};state.deck.active=${app};state.portal.active=${app};state.portal.route='room';state.mosaic.panes=[${app}];state.mosaic.focus=${app};state.mosaic.expanded=null;render();`);
    relationships(pageHTML());assert(markup().includes(`data-app="${app}"`));views++;
  }
  for(const topic of ['shell','blos','display','calibration','los']){
    run(`state.view='guide';integrated.guideTopic='${topic}';render();`);relationships(pageHTML());run('exportStyleGuide()');relationships(printed);assert(!printed.includes('Export Style Guide to PDF'));assert(!printed.includes('data-guide-topic'));guides++;
  }
}
// A delayed calibration read must not write calibration feedback into another app.
run("integrated.mode='split';integrated.right=2;state.view='workspace';render();");
click({demoAction:'sensor-read',slot:'right'});change({integrationChoice:'right'},'0');get('demo-feedback-right').textContent='';timers.shift()();assert.equal(get('demo-feedback-right').textContent,'');
assert(!/[^\S\r\n]+\r?$/m.test(html),'No trailing whitespace');
console.log(JSON.stringify({syntax:'pass',dataContracts:'pass',groupCreateJoinLeave:'pass',separateTopologyLinks:'pass',panelStateIsolation:'pass',sameAppDataSynchronization:'pass',globeControls:'pass',calibrationReadUpdateCancelValidation:'pass',staleEditProtection:'pass',nativeLOS:'pass',generatedViews:views,exportedGuideFragments:guides,browserRendering:'not tested; controlled fixtures do not verify browser UI, native focus, PDF pagination or pop-ups'},null,2));

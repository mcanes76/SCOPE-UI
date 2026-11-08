/* Dependency-free checks: node docs/assets/validate-electric-glass.cjs
 * Controlled DOM/window fixtures test contracts and handlers, not browser rendering.
 */
'use strict';
const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm'),assert=require('node:assert/strict');
const root=path.resolve(__dirname,'../..');
const html=fs.readFileSync(path.join(root,'mockups/scope-integrated-electric-glass.html'),'utf8');
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
const window={location:{href:'file:///C:/REPO/SCOPE-UI/mockups/scope-integrated-electric-glass.html'},screen:{availWidth:1920,availHeight:1080},
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
assert.deepEqual(Array.from(run('looks.map(look=>look.id)')),['prism','nocturne','carbon','spectrum','white-trim']);
assert.equal(run('state.look'),'prism','Adding a look must not replace the existing default');
assert.equal(run('DemoNodeStore.nodes().length'),10);
const snapshot=run('DemoNodeStore.nodes()');snapshot[0].label='mutated';assert.equal(run('DemoNodeStore.get("N01").label'),'West Gulf A');
// Same application: one data model, independent tabs, selections and expanded lists.
run("integrated.left=0;integrated.right=0;demoView('left',0).tab='groups';demoView('right',0).tab='discovery';render();");
const graphBefore=run('JSON.stringify(DemoBLOSConnectivityStore.links())');
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
assert.equal(run('JSON.stringify(DemoBLOSConnectivityStore.links())'),graphBefore,'Group membership must never mutate topology links');
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
change({integrationChoice:'right'},'1');click({demoAction:'display-node',slot:'right',node:'N10'});assert.equal(run("demoView('right',1).yaw"),run('RegionalNetworkView.yaw'));
const projected=run("DisplayModule.project(30.2,-86.4,demoView('right',1))");assert(Math.abs(projected.x-250)<.001);assert(projected.z>.99);
click({demoAction:'display-in',slot:'right'});assert(run("demoView('right',1).zoom")>1);
change({demoField:'display-links',slot:'right'},'',false);assert.equal(run("demoView('right',1).links"),false);
change({demoField:'display-labels',slot:'right'},'',false);assert.equal(run("demoView('right',1).labels"),false);
click({demoAction:'display-left',slot:'right'});click({demoAction:'display-up',slot:'right'});click({demoAction:'display-reset',slot:'right'});assert.equal(run("demoView('right',1).zoom"),run('RegionalNetworkView.zoom'));
assert(!run("DisplayModule.globe(demoView('right',1),'right')").includes('NaN'));
// Native LOS local draft/apply/read/reset.
change({integrationChoice:'right'},'3');input({demoField:'los-label',slot:'right'},'Example local label');click({demoAction:'los-apply',slot:'right'});click({demoDialog:'confirm'});assert.equal(run('DemoLOSStore.get().config.label'),'Example local label');
click({demoAction:'los-read',slot:'right'});assert(run('DemoLOSStore.get().lastRead'));click({demoAction:'los-reset',slot:'right'});click({demoDialog:'confirm'});assert.equal(run('DemoLOSStore.get().config.label'),'Sample configuration');
click({integrationAction:'expand',panel:'left'});assert.equal(run('integrated.expanded'),'left');click({integrationAction:'restore'});assert.equal(run('integrated.expanded'),null);
click({integrationAction:'mode-single'});assert.equal(run('integrated.mode'),'single');click({integrationAction:'mode-split'});assert.equal(run('integrated.mode'),'split');

const regionalNodes=run('DemoNodeStore.nodes()');
assert.equal(regionalNodes.length,10);
for(const n of regionalNodes){assert(n.lat>=26&&n.lat<=35);assert(n.lon>=-94&&n.lon<=-78);const p=run(`EarthCamera.project(${n.lat},${n.lon},RegionalNetworkView)`);assert(p.visible);assert(p.x>25&&p.x<475&&p.y>25&&p.y<365);const point=run(`EarthCamera.ray(${p.x},${p.y},RegionalNetworkView)`);const inverse=run(`EarthCamera.geographic(${JSON.stringify(point)},RegionalNetworkView)`);assert(Math.abs(inverse.lat-n.lat)<1e-7);assert(Math.abs(inverse.lon-n.lon)<1e-7);}
const dGraph=run('JSON.stringify(DemoDisplayConnectivityStore.links())'),bGraph=run('JSON.stringify(DemoBLOSConnectivityStore.links())');
assert.notEqual(dGraph,bGraph);assert.equal(run('DemoDisplayConnectivityStore.links().length'),9);assert.equal(run('DemoBLOSConnectivityStore.links().length'),11);
run("DemoMulticastGroupStore.join('G01','N08');DemoMulticastGroupStore.leave('G01','N08');");assert.equal(run('JSON.stringify(DemoDisplayConnectivityStore.links())'),dGraph);assert.equal(run('JSON.stringify(DemoBLOSConnectivityStore.links())'),bGraph);
run("integrated.right=1;state.view='workspace';render();");click({demoAction:'display-earth',slot:'right'});assert.equal(run("demoView('right',1).zoom"),1);click({demoAction:'display-network',slot:'right'});assert.equal(run("demoView('right',1).zoom"),7);
change({demoField:'display-links',slot:'right'},'',true);change({demoField:'display-blos-overlay',slot:'right'},'',true);assert(run("demoView('right',1).blosOverlay"));
const overlay=run("DisplayModule.globe(demoView('right',1),'right')");assert(overlay.includes('data-link-model="blos"'));assert(overlay.includes('stroke-dasharray="7 5"'));assert(overlay.includes('data-link-model="display"'));
const oldCamera=run("JSON.stringify({yaw:demoView('right',1).yaw,pitch:demoView('right',1).pitch,zoom:demoView('right',1).zoom})");click({demoAction:'display-node',slot:'right',node:'N01'});assert.equal(run("JSON.stringify({yaw:demoView('right',1).yaw,pitch:demoView('right',1).pitch,zoom:demoView('right',1).zoom})"),oldCamera);
assert(run("BLOSModule.groups(demoView('left',0),'left')").includes('btn-join'));assert(run("BLOSModule.groups(demoView('left',0),'left')").includes('btn-leave'));
assert(run("CalibrationModule.render({...CalibrationModule.createView(),sensor:'S2'},'sample')").includes('Out of Alignment'));
assert.equal(run("demoAlignmentStatus(DemoSensorStore.get('S1')).code"),'ready');
for(const variant of ['btn-enable','btn-join','btn-leave','btn-disable','btn-read','btn-update','btn-warning','btn-neutral'])assert(html.includes(variant));
function luminance(hex){const c=hex.slice(1).match(/../g).map(x=>parseInt(x,16)/255).map(v=>v<=.04045?v/12.92:((v+.055)/1.055)**2.4);return .2126*c[0]+.7152*c[1]+.0722*c[2];}
function contrast(a,b){const x=luminance(a),y=luminance(b);return (Math.max(x,y)+.05)/(Math.min(x,y)+.05);}
function highlight(hex){return '#'+hex.slice(1).match(/../g).map(x=>Math.round(parseInt(x,16)+(255-parseInt(x,16))*23/255).toString(16).padStart(2,'0')).join('');}
let actionContrast=21;for(const [fill,hover,ink] of [['#00D96C','#22E986','#052415'],['#D91F35','#B9152B','#FFFFFF'],['#FFD000','#FFDC3D','#2B2300'],['#00BFFF','#33CDFF','#052139'],['#7040D9','#5C2EC1','#FFFFFF'],['#263A50','#344D67','#E8F2FF']])for(const bg of [fill,hover,highlight(fill),highlight(hover)]){const ratio=contrast(bg,ink);actionContrast=Math.min(actionContrast,ratio);assert(ratio>=4.5,fill+' '+bg+' '+ratio);}

// Generated markup across every app/tab, split duplication, shell/look and guide topic.
let views=0,guides=0;
for(const look of run('looks.map(look=>look.id)'))for(let shell=0;shell<4;shell++){
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
    run(`state.view='guide';integrated.guideTopic='${topic}';render();`);relationships(pageHTML());run('exportStyleGuide()');relationships(printed);assert(!printed.includes('Export Style Guide to PDF'));assert(!printed.includes('data-guide-topic'));
    assert.equal(printed.includes('White Trim / material definition'),look==='white-trim','Trim guide is opt-in for every coverage topic');
    if(look==='white-trim'){
      assert(printed.includes('#DAE5F3'));assert(printed.includes('#FAFCFF'));
      assert.equal(run('semanticActionClass("group-join")'),'btn-join');assert.equal(run('semanticActionClass("group-leave")'),'btn-leave');
      assert.equal(run('ElectricSemantic.positive'),'#00D96C');assert.equal(run('ElectricSemantic.negative'),'#D91F35');
    }
    guides++;
  }
}
// A delayed calibration read must not write calibration feedback into another app.
run("integrated.mode='split';integrated.right=2;state.view='workspace';render();");
click({demoAction:'sensor-read',slot:'right'});change({integrationChoice:'right'},'0');get('demo-feedback-right').textContent='';timers.shift()();assert.equal(get('demo-feedback-right').textContent,'');
// Detached hosts must recognize and retain the new selectable material.
const previousHref=window.location.href;
window.location.href='file:///C:/REPO/SCOPE-UI/mockups/scope-integrated-electric-glass.html?scopeWindow=1&look=white-trim&shell=3';
run('initializeWindowMode();render();');
assert.equal(run('state.look'),'white-trim');assert.equal(document.body.dataset.look,'white-trim');
assert(get('exploration').innerHTML.includes('Display'));
run('detachedContext=null;');window.location.href=previousHref;delete document.body.dataset.detached;
assert(!/[^\S\r\n]+\r?$/m.test(html),'No trailing whitespace');
console.log(JSON.stringify({syntax:'pass',dataContracts:'pass',groupCreateJoinLeave:'pass',separateTopologyLinks:'pass',panelStateIsolation:'pass',sameAppDataSynchronization:'pass',globeControls:'pass',calibrationReadUpdateCancelValidation:'pass',staleEditProtection:'pass',nativeLOS:'pass',minimumSemanticButtonContrast:actionContrast.toFixed(2),regionalNodes:10,independentConnectivityModels:'pass',regionalReset:'pass',projectionRoundTrips:'pass',generatedViews:views,exportedGuideFragments:guides,browserRendering:'not tested; controlled fixtures do not verify browser UI, native focus, PDF pagination or pop-ups'},null,2));

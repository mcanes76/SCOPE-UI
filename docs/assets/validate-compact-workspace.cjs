/* Controlled DOM and viewport-budget conformance; not native browser rendering. */
'use strict';
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
const root=path.resolve(__dirname,'../..'),C=require('../../design-studio/design-core.js'),W=require('../../design-studio/workspace.js');globalThis.ScopeDesign=C;
const E=require('../../design-studio/exports.js'),builder=require('../../scripts/build-standalone.cjs'),F=require('./validate-design-studio.cjs');
const read=p=>fs.readFileSync(path.join(root,p),'utf8');
const source=read('docs/assets/validate-window-manager.cjs');
const nativeDOM=new Function('b',source.slice(source.indexOf('function nativeDOM('),source.indexOf('async function dispatch('))+'return nativeDOM;')({width:1200,height:800});
const resources=builder.resources(),presets=JSON.parse(read('design-studio/theme-presets.json')).presets;
async function dispatch(engine,type,target,extra={}){let stopped=false;const event={target,preventDefault(){this.prevented=true;},stopImmediatePropagation(){stopped=true;},...extra};for(const fn of [...(engine.captures[type]||[]),...(engine.listeners[type]||[]).filter(fn=>!(engine.captures[type]||[]).includes(fn))]){if(stopped)break;await fn(event);}return event;}
function fixture(navigation,layout){
 const design=C.validate({...C.defaults,navigation,workspace:W.validate({...W.defaults,layout,windowed:true})});
 const html=E.composeFinal(resources,design,presets),engine=F.engineFixture(true,html),dom=nativeDOM(engine);
 const matches=dom.Node.prototype.matches;dom.Node.prototype.matches=function(s){return /^[a-z]+$/.test(s)?this.tagName===s.toUpperCase():matches.call(this,s);};
 engine.document.body.style={values:{},setProperty(k,v){this.values[k]=v;}};
 engine.window.ScopeManagedWindows.decorate();return {design,html,engine,dom,manager:engine.window.ScopeManagedWindows};
}
function inside(snapshot,bounds){for(const item of snapshot.items){const r=item.rect;assert(r.x>=0&&r.y>=0&&r.width>0&&r.height>0);assert(r.x+r.width<=bounds.width&&r.y+r.height<=bounds.height);}}
(async()=>{
 let cases=0;const budgets=[];
 for(const [width,height] of [[1920,1080],[1600,900],[1366,768]])for(const navigation of C.navigation)for(const layout of ['single','split','stacked']){
   const f=fixture(navigation,layout),{engine,dom,manager}=f;
   // Supply an intentionally explicit layout budget: fixture DOM has no CSS engine.
   // The production flex chain measures real row heights instead of these estimates.
   const chrome={toolbar:46,shellHeader:f.design.layout.headerHeight,launch:42,tasks:38,padding:f.design.layout.workspacePadding*2,border:6,navigation:navigation==='aperture'?64:0};
   const bounds={width:width-(navigation==='deck'?f.design.layout.navWidth+f.design.layout.contextWidth: navigation==='mosaic'?78:0)-chrome.padding,height:height-Object.values(chrome).reduce((a,b)=>a+b,0)};
   dom.setSize(bounds);engine.window.innerHeight=height;engine.windowEvents.resize();manager.decorate();
   assert.equal(engine.document.body.style.values['--scope-viewport-height'],height+'px');assert.equal(engine.document.body.dataset.workspaceFit,'true');
   for(const app of W.apps)manager.open(app);inside(manager.snapshot(),bounds);assert(manager.snapshot().items.every(w=>w.state==='normal'));
   const node=manager.node('display'),body=node.querySelector('.managed-body'),writes=body.htmlWrites;body.localScroll=240;
   engine.run("demoView('managed-display',1).zoom=5;demoView('managed-los',3).draft={label:'Keep',mode:'Review',enabled:true};");
   const state=engine.run("JSON.stringify([demoView('managed-display',1),demoView('managed-los',3),DemoMulticastGroupStore.list()])");
   for(const app of W.apps){const frame=manager.node(app),header=frame.querySelector('.managed-header'),controls=header.querySelector('.managed-controls'),menu=header.querySelector('.managed-menu');
     assert.equal(frame.querySelectorAll('[data-managed-action="popout"]').length,1);assert.equal(frame.querySelector('[data-managed-action="popout"]').textContent,'Pop Out');assert(menu.contains(frame.querySelector('[data-managed-action="popout"]')));
     assert.equal(controls.children.filter(n=>n.tagName==='BUTTON'&&!n.hidden).length,3,'Only minimize, maximize/restore, close are visible direct commands');
     for(const b of controls.children.filter(n=>n.tagName==='BUTTON'))assert(b.getAttribute('aria-label').includes(app==='los'?'Native LOS':app==='calibration'?'Calibration':app==='display'?'Display':'BLOS'));
     menu.open=true;const summary=menu.querySelector('summary');summary.focus();await dispatch(engine,'keydown',summary,{key:'ArrowDown'});assert.equal(engine.document.activeElement,menu.querySelector('[data-managed-action="dock-left"]'));
     await dispatch(engine,'keydown',engine.document.activeElement,{key:'End'});assert.equal(engine.document.activeElement,menu.querySelector('[data-managed-action="popout"]'));
     await dispatch(engine,'keydown',engine.document.activeElement,{key:'Escape'});assert.equal(menu.open,false);assert.equal(engine.document.activeElement,summary);
     for(const action of ['dock-left','dock-right']){menu.open=true;await dispatch(engine,'click',menu.querySelector('[data-managed-action="'+action+'"]'));assert.equal(menu.open,false);inside(manager.snapshot(),bounds);assert(frame.querySelector('[data-managed-action="maximize"]').hidden);assert(!frame.querySelector('[data-managed-action="restore"]').hidden);manager.update({type:'restore',app});}
   }
   const select=dom.rootNode.querySelector('[data-managed-select="open"]');assert.equal(select.children.length,5);select.value='display';await dispatch(engine,'change',select);assert.equal(select.value,'');assert.equal(manager.snapshot().active,'display');
   const layoutMenu=dom.rootNode.querySelector('.managed-layout-menu');assert.equal(layoutMenu.querySelectorAll('button').length,3);
   for(const action of ['tile','cascade']){await dispatch(engine,'click',layoutMenu.querySelector('[data-managed-action="'+action+'"]'));inside(manager.snapshot(),bounds);}
   for(const type of ['maximize','minimize','open','restore','resize','close','open']){manager.update(type==='resize'?{type,app:'display',rect:{x:9999,y:9999,width:9999,height:9999}}:{type,app:'display'});inside(manager.snapshot(),bounds);}
   const small={width:Math.floor(bounds.width*.65),height:Math.floor(bounds.height*.6)};dom.setSize(small);engine.window.innerHeight=Math.floor(height*.6);engine.windowEvents.resize();inside(manager.snapshot(),small);dom.setSize(bounds);engine.window.innerHeight=height;engine.windowEvents.resize();inside(manager.snapshot(),bounds);
   assert.equal(manager.node('display'),node);assert.equal(body.htmlWrites,writes);assert.equal(body.localScroll,240);assert.equal(engine.run("JSON.stringify([demoView('managed-display',1),demoView('managed-los',3),DemoMulticastGroupStore.list()])"),state);
   engine.window.ScopeOperator.transition({mode:layout});assert.equal(manager.enabled(),false);assert.equal(engine.document.body.dataset.workspaceFit,'true');engine.window.ScopeOperator.transition({workspace:{windowed:true}});manager.decorate();assert.equal(manager.node('display'),node);
   await dispatch(engine,'click',layoutMenu.querySelector('[data-managed-action="reset"]'));assert.equal(manager.snapshot().items.length,1);manager.open('display');assert.equal(manager.node('display'),node);assert.equal(body.htmlWrites,writes);
   engine.run("state.view='lab'");engine.window.ScopeOperator.decorate();assert.equal(engine.document.body.dataset.workspaceFit,'false','Lab retains document scrolling');
   if(navigation==='deck'&&layout==='single')budgets.push({viewport:width+'x'+height,fixtureStage:bounds});cases++;
 }
 const runtime=read('design-studio/workspace-windows-runtime.js'),operator=read('design-studio/operator-runtime.js');
 assert(operator.includes('min-height:0!important;height:100%'));assert(!operator.includes("'height','max('"),'No stacked minimum exceeds the viewport');
 assert(operator.includes('body[data-scope-design][data-workspace-fit=true] .shell'),'Viewport rule outranks later generated theme minimum height');
 assert(operator.includes('.aperture-dock{position:static'));assert(operator.includes('overflow:auto'));assert(runtime.includes('.managed-stage{flex:1 1 0;min-height:0;height:auto;max-height:none'));assert(runtime.includes('.managed-body{flex:1 1 auto;overflow:auto;min-height:0'));
 const output=path.join(root,'.validation/compact-workspace');fs.mkdirSync(output,{recursive:true});fs.writeFileSync(path.join(output,'operator-review.html'),fixture('deck','single').html);
 console.log(JSON.stringify({compactWorkspace:'pass',cases,viewports:['1920x1080','1600x900','1366x768'],controls:'3 visible commands plus overflow; one Pop Out; Open App and Layout',keyboard:'native disclosure/Tab plus arrows/Home/End/Escape; focus restoration',geometry:'initial/resize/tile/cascade/dock/maximize/restore/boundaries',applicationState:'DOM identity, content writes, scroll sentinel, drafts, views and models retained',fixtureBudgets:budgets,rendering:'NOT measured: controlled DOM has no CSS layout engine; native inspection blocked by browser URL verification'},null,2));
})().catch(e=>{console.error(e);process.exitCode=1;});

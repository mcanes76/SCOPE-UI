/* Real sizing handlers against explicit DOM rectangles. No browser layout claim. */
'use strict';
const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const root=path.resolve(__dirname,'../..'),W=require('../../design-studio/workspace.js'),M=W.windows,C=require('../../design-studio/design-core.js');globalThis.ScopeDesign=C;
const E=require('../../design-studio/exports.js'),B=require('../../scripts/build-standalone.cjs'),F=require('./validate-design-studio.cjs');
const read=f=>fs.readFileSync(path.join(root,f),'utf8'),plain=x=>JSON.parse(JSON.stringify(x)),large={width:1400,height:900},small={width:600,height:350};
const inside=(s,b)=>s.items.forEach(w=>{assert(w.rect.x>=0&&w.rect.y>=0&&w.rect.width>0&&w.rect.height>0);assert(w.rect.x+w.rect.width<=b.width&&w.rect.y+w.rect.height<=b.height);});
let bornSmall=M.action(W.defaults.windows,{type:'open',app:'display'},small);inside(bornSmall,small);assert.equal(bornSmall.items[0].restore.width,820);assert.equal(bornSmall.items[0].restore.height,560);bornSmall=M.action(bornSmall,{type:'fit'},large);assert.equal(bornSmall.items[0].rect.width,820);assert.equal(bornSmall.items[0].rect.height,560);
let s=M.action(W.defaults.windows,{type:'open',app:'display'},large),intended=plain(s.items[0].restore);
assert(s.items[0].state==='normal');assert(s.items[0].rect.width>820&&s.items[0].rect.height>560);assert(s.items[0].rect.width<large.width&&s.items[0].rect.height<large.height);
for(const b of [small,{width:320,height:180},large]){s=M.action(s,{type:'fit'},b);inside(s,b);assert.deepEqual(s.items[0].restore,intended);}assert.deepEqual(s.items[0].rect,intended);
for(const action of ['maximize','minimize','open','restore','dock-left','dock-right','restore','close','open']){
 s=M.action(s,{type:action,app:'display'},large);s=M.action(s,{type:'fit'},small);assert.deepEqual(s.items[0].restore,intended);s=M.action(s,{type:'fit'},large);assert.deepEqual(s.items[0].restore,intended);inside(s,large);
}
s=M.action(s,{type:'move',app:'display',rect:{...s.items[0].rect,x:10,y:15}},large);assert.equal(s.items[0].restore.x,10);assert.equal(s.items[0].restore.y,15);intended=plain(s.items[0].restore);
s=M.action(s,{type:'fit'},small);s=M.action(s,{type:'move',app:'display',rect:{...s.items[0].rect,x:0,y:0}},small);assert.equal(s.items[0].restore.width,intended.width,'Move does not erase temporarily constrained size');
s=M.action(s,{type:'resize',app:'display',rect:{x:0,y:0,width:500,height:320}},small);s=M.action(s,{type:'fit'},large);assert.deepEqual(s.items[0].rect,{x:0,y:0,width:500,height:320},'Deliberate resize replaces prior intent');
let tiled=M.action(M.action(W.defaults.windows,{type:'reset',apps:W.apps},large),{type:'tile'},large);const restores=tiled.items.map(w=>plain(w.restore));
for(const b of [small,large]){tiled=M.action(tiled,{type:'fit'},b);inside(tiled,b);assert.deepEqual(tiled.items.map(w=>w.restore),restores);if(b===small)assert(tiled.items.every(w=>w.tile&&w.rect.width>=420&&w.rect.height>=300),'A temporarily cramped grid displays usable cascaded windows without losing tile intent');else for(let i=0;i<tiled.items.length;i++)for(let j=i+1;j<tiled.items.length;j++){const a=tiled.items[i].rect,c=tiled.items[j].rect;assert(a.x+a.width<=c.x||c.x+c.width<=a.x||a.y+a.height<=c.y||c.y+c.height<=a.y);}}
assert.deepEqual(M.validate(JSON.parse(JSON.stringify(tiled))),tiled);const old=plain(tiled);old.items.forEach(w=>delete w.tile);assert.deepEqual(M.validate(old),old,'Legacy configurations need no migration');
assert.throws(()=>M.validate({...tiled,items:[{...tiled.items[0],tile:{column:2,row:0,columns:2,rows:1}}]}));
const wmSource=read('docs/assets/validate-window-manager.cjs'),nativeDOM=new Function('b',wmSource.slice(wmSource.indexOf('function nativeDOM('),wmSource.indexOf('async function dispatch('))+'return nativeDOM;')({width:1200,height:800});
const presets=JSON.parse(read('design-studio/theme-presets.json')).presets,resources=B.resources();
resources.runtime="class ResizeObserver{constructor(cb){this.cb=cb;(globalThis.sizeObservers??=[]).push(this);}observe(){}disconnect(){}notify(){this.cb();}}\n"+resources.runtime;
function fixture(hidden=false,preview=false){
 const design=C.validate({...C.defaults,navigation:'deck'}),engine=F.engineFixture(true,E.composeFinal(resources,design,presets,{preview})),dom=nativeDOM(engine),runtime=engine.window.ScopeManagedWindows;
 const shell=dom.target.parentElement,body=new dom.Node('body'),header=new dom.Node('header'),layout=new dom.Node(),rail=new dom.Node('aside'),context=new dom.Node('header'),toolbar=new dom.Node('nav');
 layout.className='deck-layout';rail.className='deck-rail';toolbar.className='operator-bar';header.className='shell-top';context.className='deck-context';
 body.dataset={...engine.document.body.dataset};engine.document.body=body;body.append(toolbar,dom.rootNode);shell.prepend(header);shell.append(layout);layout.append(dom.target,rail);dom.target.append(context);
 dom.Node.prototype.nodeType=1;const env={height:900,width:1400,toolbar:64,below:false,railHeight:190,hidden,maximum:null,writes:0};
 const box=(left,top,width,height)=>({left,top,width,height,right:left+width,bottom:top+height,x:left,y:top});
 function rectangles(node){
   const st=dom.rootNode.querySelector('.managed-stage'),height=parseFloat(st?.style.height)||300,side=env.below?0:250,tw=env.hidden?0:env.width-side;
   const targetTop=env.toolbar+76,canvasTop=targetTop+22,stageTop=canvasTop+54,canvasBottom=stageTop+height+54+(parseFloat(st?.parentElement.style['padding-bottom'])||0),targetBottom=env.maximum?targetTop+env.maximum:canvasBottom+48+18+22;
   if(node===st)return box(22,stageTop,Math.max(0,tw-44),env.hidden?0:height);
   if(node===body||node===dom.rootNode)return box(0,node===body?0:env.toolbar,env.width,targetBottom+(env.below?env.railHeight:0)+1-(node===body?0:env.toolbar));
   if(node===toolbar)return box(0,0,env.width,env.toolbar);
   if(node===shell)return box(0,env.toolbar,env.width,targetBottom+(env.below?env.railHeight:0)+1-env.toolbar);
   if(node===header)return box(0,env.toolbar,env.width,76);
   if(node===layout)return box(0,targetTop,env.width,targetBottom+(env.below?env.railHeight:0)-targetTop);
   if(node===dom.target)return box(0,targetTop,tw,targetBottom-targetTop);
   if(node===rail)return env.below?box(0,targetBottom,env.width,env.railHeight):box(tw,targetTop,250,190);
   if(node===context)return box(22,canvasBottom,tw-44,48);
   if(node.classList.contains('managed-workspace'))return box(22,canvasTop,tw-44,canvasBottom-canvasTop);
   if(node.classList.contains('managed-launch'))return box(22,canvasTop,tw-44,54);
   if(node.classList.contains('managed-tasks'))return box(22,stageTop+height,tw-44,54);
   return box(0,0,0,0);
 }
 dom.Node.prototype.getBoundingClientRect=function(){return rectangles(this);};
 Object.defineProperty(dom.Node.prototype,'clientWidth',{configurable:true,get(){const r=rectangles(this);return Math.max(0,r.width-(this.classList.contains('managed-stage')?2:0));}});
 Object.defineProperty(dom.Node.prototype,'clientHeight',{configurable:true,get(){const r=rectangles(this);return Math.max(0,r.height-(this.classList.contains('managed-stage')?2:0));}});
 const create=engine.document.createElement;engine.document.createElement=tag=>{const el=create(tag),set=el.style.setProperty;el.style.setProperty=function(k,v,p){if(k==='height')env.writes++;set.call(this,k,v,p);};return el;};
 engine.window.getComputedStyle=el=>({display:'block',visibility:env.hidden?'hidden':'visible',position:'static',overflowY:'visible',paddingBottom:el===dom.target?'22px':el.style['padding-bottom']||'0px',paddingTop:el===dom.target?'22px':'0px',borderBottomWidth:el===shell?'1px':'0px',borderTopWidth:'0px',marginBottom:el===context?'18px':'0px',maxHeight:el===dom.target&&env.maximum?env.maximum+'px':'none',boxSizing:'border-box'});
 engine.window.innerHeight=env.height;runtime.decorate();
 return {engine,dom,runtime,env,context,rail,resize(){engine.window.innerHeight=env.height;engine.windowEvents.resize();},notify(){engine.run('sizeObservers.forEach(o=>o.notify())');}};
}
const f=fixture(),r=f.runtime,first=plain(r.snapshot().items[0].restore),frame=r.node('blos'),body=frame.querySelector('.managed-body'),writes=body.htmlWrites;
assert.equal(r.measure().stageTop,216);assert.equal(r.measure().trailingShellSpace,143);assert.equal(r.measure().stageOuterHeight,541);assert.equal(r.bounds().height,539);
const originalRect=f.dom.Node.prototype.getBoundingClientRect;f.dom.Node.prototype.getBoundingClientRect=function(){const b=originalRect.call(this);return {...b,top:b.top-120,bottom:b.bottom-120,y:b.y-120};};f.engine.window.scrollY=120;f.notify();assert.equal(r.measure().stageOuterHeight,541,'An existing document scroll offset does not inflate the budget');f.engine.window.scrollY=0;f.dom.Node.prototype.getBoundingClientRect=originalRect;
let reports=[];for(const [width,height] of [[1920,1080],[1600,900],[1366,768]]){f.env.width=width;f.env.height=height;f.resize();inside(r.snapshot(),r.bounds());assert.deepEqual(plain(r.snapshot().items[0].restore),first);reports.push({viewport:[width,height],metrics:plain(r.measure())});}
f.env.toolbar=118;f.notify();assert.equal(r.measure().stageTop,270,'Actual wrapped toolbar consumes its measured height');
f.env.below=true;f.notify();assert.equal(r.measure().trailingShellSpace,333,'Responsive context row is accounted for without moving/hiding it');assert.equal(f.rail.parentElement,f.dom.target.parentElement);
const stable=f.env.writes;for(let i=0;i<8;i++)f.notify();assert.equal(f.env.writes,stable,'Unchanged observer notifications do not rewrite height');
f.env.below=false;const dock=new f.dom.Node('nav');dock.className='aperture-dock';f.dom.target.append(dock);const readStyle=f.engine.window.getComputedStyle;f.engine.window.getComputedStyle=el=>el===dock?{...readStyle(el),position:'absolute',bottom:'25px'}:readStyle(el);const dockRect=f.dom.Node.prototype.getBoundingClientRect;f.dom.Node.prototype.getBoundingClientRect=function(){return this===dock?{left:0,right:200,top:0,bottom:160,width:200,height:160}:dockRect.call(this);};f.notify();assert.equal(r.measure().trailingShellSpace,314,'A taller positioned dock gets real extra space rather than overlapping the stage');dock.remove();f.notify();assert.equal(r.measure().trailingShellSpace,143);
f.env.below=false;f.env.maximum=400;f.notify();assert(r.measure().stageOuterHeight<=400-22-54-54-48-18-22,'A bounded host overrides a larger viewport');
const beforeHidden=plain(r.snapshot());f.env.hidden=true;f.env.width=0;f.resize();assert.deepEqual(plain(r.snapshot()),beforeHidden,'Hidden geometry never fits to one pixel');r.open('display');assert.equal(r.snapshot().items.length,1);
f.env.hidden=false;f.env.width=1600;f.env.height=1000;f.env.maximum=null;f.resize();assert(r.snapshot().items.some(w=>w.app==='display'));assert.equal(r.node('blos'),frame);assert.equal(body.htmlWrites,writes);
const cold=fixture(true);assert.equal(cold.runtime.snapshot().initialized,false);cold.env.hidden=false;cold.notify();assert.equal(cold.runtime.snapshot().initialized,true);
const preview=fixture(false,true);assert.equal(preview.engine.run('presentation.detailsVisible'),false,'Studio preview retains the configured UI Details state');assert.equal(preview.runtime.measure().stageOuterHeight,541);preview.env.height=300;preview.resize();assert.equal(preview.runtime.measure().stageOuterHeight,180);assert(preview.runtime.measure().minimumOverflow>0,'Very short viewports retain usable controls with explicitly necessary page scrolling');
const portable=C.validate({...C.defaults,workspace:W.validate({...W.defaults,windows:tiled})}),html=E.composeFinal(B.resources(),portable,presets),reopened=F.engineFixture(true,html);assert.deepEqual(plain(reopened.window.ScopePreviewRuntime.snapshot().workspace.windows),tiled,'Tiled intent survives standalone/Studio configuration validation');
const source=read('design-studio/workspace-windows-runtime.js');assert(!source.includes('100dvh - 260px'));assert(source.includes("['Minimize','minimize'],['Maximize','maximize']"));assert(!source.includes('managed-select'));assert(!source.includes('managed-menu'));assert(!source.includes('display-map'));
console.log(JSON.stringify({containerSizing:'pass',geometry:'shrink/grow, move/resize intent, normal/maximized/minimized/docked/closed and tiled restore',compatibility:'old JSON plus optional tile placement round trip',measurement:'real sizing path with controlled DOM rectangles, wrapped toolbar, host cap, responsive context row',observer:'repeated notifications stable',hidden:'cold and warm activation deferred without geometry loss',applicationDOM:'retained',budgets:reports,browserRendering:'NOT established: fixtures provide geometry; native screenshots and layout review remain outstanding'},null,2));

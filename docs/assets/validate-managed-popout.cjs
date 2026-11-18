/* Reproduce the overlapping shell decorators; test real detach/window handlers. */
'use strict';
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
const root=path.resolve(__dirname,'../..'),C=require('../../design-studio/design-core.js'),W=require('../../design-studio/workspace.js');globalThis.ScopeDesign=C;
const E=require('../../design-studio/exports.js'),builder=require('../../scripts/build-standalone.cjs'),F=require('./validate-design-studio.cjs');
const read=file=>fs.readFileSync(path.join(root,file),'utf8'),plain=x=>JSON.parse(JSON.stringify(x)),bounds={width:1200,height:800};
const managerSource=read('docs/assets/validate-window-manager.cjs'),nativeDOM=new Function('b',managerSource.slice(managerSource.indexOf('function nativeDOM('),managerSource.indexOf('async function dispatch('))+'return nativeDOM;')(bounds);
const syncSource=read('docs/assets/validate-source-sync.cjs'),installClone=new Function(syncSource.slice(syncSource.indexOf('function installClone('),syncSource.indexOf('(async()=>{'))+'return installClone;')();
const resources=builder.resources(),presets=JSON.parse(read('design-studio/theme-presets.json')).presets;
if(process.argv.includes('--investigate-before')){
 const cp=require('node:child_process');
 for(const file of ['operator-runtime.js','workspace-windows-runtime.js'])resources.runtime=resources.runtime.replace(read('design-studio/'+file),cp.execFileSync('git',['show','1c0264a:design-studio/'+file],{cwd:root,encoding:'utf8'}));
}
function fixture(app,navigation='deck',theme='electric-glass'){
 const design=C.validate({...C.defaults,navigation,theme,parameters:{applications:{[app]:{name:'Configured '+app}}},workspace:W.validate({left:'blos',right:'display',windows:W.windows.action(W.defaults.windows,{type:'reset',apps:[app]},bounds)})});
 const html=E.composeFinal(resources,design,presets),engine=F.engineFixture(true,html),dom=nativeDOM(engine);
 // Existing general fixtures deliberately do not model pane decoration. Route
 // its actual selector through this DOM, including shell-injected HTML buttons.
 const query=engine.document.querySelectorAll.bind(engine.document);engine.document.querySelectorAll=selector=>selector==='.integration-pane'?dom.rootNode.querySelectorAll(selector):query(selector);
 const descriptor=Object.getOwnPropertyDescriptor(dom.Node.prototype,'innerHTML');
 Object.defineProperty(dom.Node.prototype,'innerHTML',{get:descriptor.get,set(value){descriptor.set.call(this,value);for(const match of value.matchAll(/<button([^>]*)>([\s\S]*?)<\/button>/g)){if(!match[1].includes('data-operator='))continue;const button=new dom.Node('button');for(const attr of match[1].matchAll(/([\w-]+)="([^"]*)"/g))button.setAttribute(attr[1],attr[2]);button.textContent=match[2];this.append(button);}}});
 engine.window.ScopeManagedWindows.decorate();installClone(engine,html);return {design,html,engine,dom,manager:engine.window.ScopeManagedWindows,op:engine.window.ScopeOperator};
}
async function click(engine,target){let stopped=false;const event={target,preventDefault(){},stopImmediatePropagation(){stopped=true;}};for(const fn of [...(engine.captures.click||[]),...engine.listeners.click.filter(fn=>!(engine.captures.click||[]).includes(fn))]){if(stopped)break;await fn(event);}}
const controls=node=>node.querySelectorAll('[data-managed-action="popout"],[data-operator="popout"]');
(async()=>{
 if(process.argv.includes('--investigate')||process.argv.includes('--investigate-before')){
   const f=fixture('display');f.op.decorate();const node=f.manager.node('display'),buttons=controls(node),observed=[];
   for(const button of buttons){
     let url;f.engine.window.open=value=>{url=value;return {closed:false,focus(){},resizeTo(){},moveTo(){},postMessage(){}};};await click(f.engine,button);
     const childHTML=await(await fetch(url)).text(),child=F.engineFixture(true,childHTML);
     observed.push({label:button.textContent,managedAction:button.dataset.managedAction,managedApplication:button.dataset.managedApp,operatorAction:button.dataset.operator,inferredApplication:button.dataset.app,slot:button.dataset.slot,launchedApplication:W.apps[child.run('detachedContext.app')]});URL.revokeObjectURL(url);
   }
   console.log(JSON.stringify({baseline:process.argv.includes('--investigate-before')?'1c0264a':'working tree',buttons:observed},null,2));return;
 }
 let cases=0,children=0;
 for(const theme of ['electric-glass','prism','slate-light'])for(const navigation of C.navigation)for(const app of W.apps){
   const f=fixture(app,navigation,theme),{engine,manager,op}=f,index=W.apps.indexOf(app),node=manager.node(app),body=node.querySelector('.managed-body'),writes=body.htmlWrites;
   const view=engine.run("demoView('managed-"+app+"',"+index+")");if(app==='blos')view.tab='discovery';if(app==='display'){view.node='N06';view.zoom=5;}if(app==='los')view.draft={label:'Retained draft',mode:'Review',enabled:true};
   const viewBefore=plain(view);engine.run("DemoMulticastGroupStore.create('Pop Out retention',['N07']);");const models=engine.run('JSON.stringify(DemoMulticastGroupStore.list())');
   for(let repeat=0;repeat<3;repeat++)op.decorate();
   assert.equal(controls(node).length,1,app+' / '+navigation+' / '+theme);const button=controls(node)[0];assert.equal(button.textContent,'Pop Out');assert.equal(button.dataset.managedApp,app);assert.equal(button.dataset.managedAction,'popout');assert.equal(node.querySelector('[data-workspace-pane-actions]'),null);
   // Remove stale shell decoration from a previously decorated cached header.
   const stale=new f.dom.Node('span');stale.dataset.workspacePaneActions='';stale.innerHTML='<button data-operator="popout" data-app="blos" data-slot="left">Pop Out</button>';node.querySelector('.managed-header').append(stale);assert.equal(controls(node).length,2);op.decorate();assert.equal(controls(node).length,1);
   const opened=[],handle={closed:false,focusCount:0,focus(){this.focusCount++;},close(){this.closed=true;},postMessage(){},resizeTo(){},moveTo(){}};engine.window.open=(url,name,features)=>{opened.push({url,name,features});return handle;};
   await click(engine,button);assert.equal(opened.length,1);assert.equal(op.snapshot().detached[0].app,index);assert.equal(op.snapshot().detached[0].slot,'managed-'+app);
   const size=Object.fromEntries(opened[0].features.split(',').map(part=>part.split('=')));assert(Number(size.width)>0&&Number(size.width)<1920);assert(Number(size.height)>0&&Number(size.height)<1080);assert(Number(size.left)>=0&&Number(size.top)>=0);
   const childHTML=await(await fetch(opened[0].url)).text(),child=F.engineFixture(true,childHTML);assert.equal(child.run('detachedContext.app'),index);assert.equal(child.document.body.dataset.theme,theme);assert.equal(child.run('apps['+index+'].name'),'Configured '+app);assert.equal(child.window.ScopePreviewRuntime.snapshot().navigation,navigation);assert.deepEqual(plain(child.run("demoView('popup',"+index+")")),{...viewBefore,busy:false});
   await click(engine,button);assert.equal(opened.length,1,'Repeat click focuses the existing browser window');assert(handle.focusCount>=2);assert.equal(manager.node(app),node);assert.equal(body.htmlWrites,writes);assert.equal(engine.run('JSON.stringify(DemoMulticastGroupStore.list())'),models);
   for(const type of ['minimize','open','maximize','restore','dock-left','restore','dock-right','restore','resize','close','open']){manager.update(type==='resize'?{type,app,rect:{...manager.snapshot().items.find(w=>w.app===app).rect,width:600,height:400}}:{type,app});op.decorate();assert.equal(controls(node).length,1);assert.equal(manager.node(app),node);assert.equal(body.htmlWrites,writes);}
   op.transition({workspace:{popout:false}});assert(controls(node)[0].hidden);assert.throws(()=>op.detach(index,'managed-'+app),/disabled/);op.transition({workspace:{popout:true}});assert(!controls(node)[0].hidden);
   assert.deepEqual(plain(engine.run("demoView('managed-"+app+"',"+index+")")),viewBefore);URL.revokeObjectURL(opened[0].url);cases++;children++;
 }
 const multi=fixture('display');for(const app of W.apps)multi.manager.open(app);multi.op.decorate();for(const app of W.apps)assert.equal(controls(multi.manager.node(app)).length,1,'Multiple visible windows retain one control each');
 // Classic split panes still receive their own centralized pop-out controls.
 const classic=fixture('blos');classic.op.transition({mode:'split'});const pane=new classic.dom.Node('section');pane.className='integration-pane';const header=new classic.dom.Node('header');header.className='integration-pane-header';const select=new classic.dom.Node('select');select.dataset.integrationChoice='left';header.append(select);pane.append(header);classic.dom.target.append(pane);classic.op.decorate();assert.equal(pane.querySelectorAll('[data-operator="popout"]').length,1);assert.equal(pane.querySelector('[data-operator="popout"]').dataset.app,'blos');
 const output=builder.build({output:'.validation/managed-popout/verified-studio.html'}),packaged=JSON.parse(fs.readFileSync(output.file,'utf8').match(/id="scope-offline-assets">([\s\S]*?)<\/script>/)[1]);
 const exported=F.engineFixture(true,E.composeFinal(packaged.resources,C.defaults,presets)),exportDOM=nativeDOM(exported);exported.window.ScopeManagedWindows.decorate();
 assert.equal(controls(exported.window.ScopeManagedWindows.node('blos')).length,1,'Built standalone runtime renders exactly one Pop Out command');
 console.log(JSON.stringify({managedPopOut:'pass',cases,applications:W.apps,navigationModes:C.navigation.length,representativeThemes:3,exactlyOneControl:'including repeated decoration, stale cleanup and permission changes',browserWindows:children,placement:'bounded non-fullscreen requests; browser/OS remains authoritative',state:'appearance, configuration, view drafts, managed DOM and domain models retained',otherActions:'minimize/restore/maximize/dock/close/resize regression retained',classicSplitControl:'retained',nativeBrowsers:'controlled fixtures; native Chrome/Edge popup placement remains manual'},null,2));
})().catch(error=>{console.error(error);process.exitCode=1;});

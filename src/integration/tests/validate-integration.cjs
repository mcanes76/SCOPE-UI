'use strict';
const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
const C=require('../contracts.js'),Host=require('../adapter-host.js'),A=require('../reference-application.js'),W=require('../../../design-studio/workspace.js');
let checks=0;const check=async(name,fn)=>{await fn();checks++;console.log('PASS '+name);};
const clone=x=>JSON.parse(JSON.stringify(x));
function fixture(overrides={}){
  const calls=[],events=[],diagnostics=[],container={owned:true};let context;
  const host=new Host({timeoutMs:40,schemas:A.schemas,onDiagnostic:e=>diagnostics.push(e)});
  const factory=()=>({initialize(c){context=c;calls.push('initialize');c.onDispose(()=>calls.push('cleanup'));},mount(c){assert.equal(c,container);calls.push('mount');},activate(){calls.push('activate');},deactivate(){calls.push('deactivate');},resize(s){calls.push(['resize',s]);},dispose(){calls.push('dispose');},saveState(){return {count:3,selection:null};},restoreState(s){calls.push(['restore',s]);},receiveContext(t,p){calls.push([t,p]);},handleCommand(t,p){if(t.endsWith('.fail'))throw Error('private operational detail');context.emit('reference.status.changed',{count:p.amount});return {count:p.amount};},...overrides});
  host.register(A.manifest,factory,{grants:A.manifest.capabilities});host.subscribe('reference.status.changed',e=>events.push(e));
  return {host,calls,events,diagnostics,container,get context(){return context;}};
}
class Element{
  constructor(ownerDocument){this.ownerDocument=ownerDocument;this.children=[];this.listeners=new Map();this.parent=null;this.textContent='';this.disabled=false;}
  append(...nodes){for(const n of nodes){n.parent=this;this.children.push(n);}}
  remove(){if(this.parent)this.parent.children=this.parent.children.filter(n=>n!==this);this.parent=null;}
  addEventListener(t,f){this.listeners.set(t,f);}removeEventListener(t,f){if(this.listeners.get(t)===f)this.listeners.delete(t);}
}
(async()=>{
  await check('manifest, versions, capability grants and approved schemas',async()=>{
    assert.deepEqual(C.manifest(require('../reference.manifest.json')),A.manifest);
    for(const patch of [{contractVersion:2},{schemaVersion:2},{integration:'iframe'},{id:'../blos'},{singleton:false},{publishes:['other.app.event']},{capabilities:['backend-admin']},{commands:['reference.status.increment'],capabilities:[]},{entryURL:'https://evil.invalid/app.js'}])assert.throws(()=>C.manifest({...A.manifest,...patch}));
    assert.throws(()=>new Host({schemas:A.schemas}).register(A.manifest,A.create));
    assert.throws(()=>new Host().register(A.manifest,A.create,{grants:A.manifest.capabilities}));
    const f=fixture();assert.throws(()=>f.host.register(A.manifest,A.create,{grants:A.manifest.capabilities}));assert.equal(f.calls.length,0,'Registration does not execute app code');
    const optional={...A.manifest,id:'reference.minimum',capabilities:[],commands:[],contexts:[],publishes:[]},minimal=new Host();minimal.register(optional,()=>({initialize(){},mount(){},activate(){},deactivate(){},resize(){},dispose(){}}));await minimal.launch(optional.id,{});await assert.rejects(minimal.save(optional.id),/Capability/);await minimal.close(optional.id);
  });
  await check('bounded plain JSON, prototype/cycle/non-finite rejection',()=>{
    for(const value of [Infinity,{x:NaN},{x:()=>{}},new Date(),{x:Symbol('bad')},JSON.parse('{"__proto__":{"admin":true}}'),{text:'x'.repeat(8193)},Array(2001).fill(1),Array(10).fill('😀'.repeat(3000))])assert.throws(()=>C.json(value));
    const cycle={};cycle.self=cycle;assert.throws(()=>C.json(cycle));assert.deepEqual(C.json({safe:[1,true,null]}),{safe:[1,true,null]});
  });
  await check('singleton launch, serialized lifecycle, activate/deactivate/resize and cleanup',async()=>{
    const f=fixture(),id=A.manifest.id;await Promise.all([f.host.launch(id,f.container,{size:{width:640,height:480}}),f.host.launch(id,f.container)]);
    assert.equal(f.calls.filter(x=>x==='mount').length,1);await assert.rejects(f.host.launch(id,{}),/elsewhere/);assert.equal(f.host.status(id).state,'active');
    await f.host.deactivate(id);await f.host.deactivate(id);assert.equal(f.calls.filter(x=>x==='deactivate').length,1);await f.host.activate(id);await f.host.resize(id,{width:700,height:500});
    assert.throws(()=>f.host.resize(id,{width:-1,height:4}));await f.host.close(id);await f.host.close(id);assert.equal(f.calls.filter(x=>x==='dispose').length,1);assert.equal(f.calls.filter(x=>x==='cleanup').length,1);assert(f.context.signal.aborted);assert.equal(f.host.status(id).state,'disposed');await assert.rejects(f.host.command(id,'reference.status.increment',{amount:1}),/available/);
  });
  await check('approved event exchange, copied payloads and listener fault isolation',async()=>{
    const f=fixture(),id=A.manifest.id;await f.host.launch(id,f.container);const seen=[];
    f.host.subscribe('reference.status.changed',e=>{e.payload.count=900;throw Error('listener fault');});f.host.subscribe('reference.status.changed',e=>seen.push(e.payload.count));
    await f.host.command(id,'reference.status.increment',{amount:1});assert.deepEqual(seen,[1]);assert.equal(f.events[0].payload.count,1);assert.throws(()=>f.context.emit('shell.privileged',{}),/permitted/);assert.throws(()=>f.context.emit('reference.status.changed',{count:Infinity}));assert.throws(()=>f.host.subscribe('unapproved',()=>{}));await f.host.close(id);assert.equal(f.context.emit('reference.status.changed',{count:2}),false);
  });
  await check('context/command validation, recoverable errors and sanitized diagnostics',async()=>{
    const f=fixture(),id=A.manifest.id;await f.host.launch(id,f.container);await f.host.context(id,'shell.selection',{id:'sample-a'});assert(f.calls.some(x=>Array.isArray(x)&&x[0]==='shell.selection'));
    await assert.rejects(f.host.command(id,'reference.status.increment',{amount:100}));await assert.rejects(f.host.command(id,'other.command',{}),/permitted/);await assert.rejects(f.host.context(id,'other.context',{}),/permitted/);
    await assert.rejects(f.host.command(id,'reference.status.fail',{}),/private/);assert.equal(f.host.status(id).state,'active');assert(!JSON.stringify(f.diagnostics).includes('private operational'));await f.host.dispose();
    const invalidResponse=fixture({handleCommand(){return {count:'not-a-number'};}});await invalidResponse.host.launch(id,invalidResponse.container);await assert.rejects(invalidResponse.host.command(id,'reference.status.increment',{amount:1}),/Count/);assert.equal(invalidResponse.host.status(id).state,'active');await invalidResponse.host.dispose();
  });
  await check('versioned save/restore and incompatible state rejection',async()=>{
    const f=fixture(),id=A.manifest.id;await f.host.launch(id,f.container);const saved=await f.host.save(id);await f.host.close(id);await f.host.launch(id,f.container,{state:saved});assert(f.calls.some(x=>Array.isArray(x)&&x[0]==='restore'&&x[1].count===3));await f.host.close(id);
    for(const patch of [{appId:'blos'},{applicationVersion:'9.0.0'},{contractVersion:2},{schemaVersion:2}])await assert.rejects(f.host.launch(id,f.container,{state:{...saved,...patch}}),/incompatible/);assert.equal(f.host.status(id).state,'disposed');
  });
  await check('failed initialization, cleanup and explicit retry with a fresh instance',async()=>{
    let fail=true;const f=fixture({initialize(){if(fail)throw Error('init failed');}}),id=A.manifest.id;
    await assert.rejects(f.host.launch(id,f.container),/init/);assert.equal(f.host.status(id).state,'failed');assert.equal(f.calls.filter(x=>x==='dispose').length,1);fail=false;await f.host.launch(id,f.container);assert.equal(f.host.status(id).state,'active');await f.host.close(id);
    const primitive=fixture({initialize(){throw null;}});await assert.rejects(primitive.host.launch(id,primitive.container),/Adapter operation failed/);assert.equal(primitive.host.status(id).state,'failed');assert(primitive.calls.includes('dispose'));
  });
  await check('deadline quarantine, late callback cancellation and cleanup failures',async()=>{
    let late;const f=fixture({mount(){return new Promise(resolve=>{late=resolve;});}}),id=A.manifest.id;await assert.rejects(f.host.launch(id,f.container),/deadline/);assert.equal(f.host.status(id).state,'quarantined');late();assert.equal(f.context.emit('reference.status.changed',{count:2}),false);await assert.rejects(f.host.launch(id,f.container),/replacement/);
    const broken=fixture({dispose(){throw Error('Cannot clean');}});await broken.host.launch(id,broken.container);await assert.rejects(broken.host.close(id),/confirmed/);assert.equal(broken.host.status(id).state,'quarantined');assert(broken.calls.includes('cleanup'),'Other cleanup callbacks still run');
  });
  await check('future-frame guard: source, origin, schema, version, identity, session and replay',()=>{
    const source={},options={source,origin:'https://apps.example.invalid',sessionId:'test-session-123456',appId:A.manifest.id,schemas:{status:C.status}},guard=C.messageGuard(options);
    const event={source,origin:options.origin,data:{namespace:'scope-integration',contractVersion:1,sessionId:options.sessionId,appId:A.manifest.id,sequence:1,type:'status',payload:{level:'healthy',code:'reference.ready',message:'test'}}};
    for(const value of [{...event,source:{}},{...event,origin:'null'},{...event,data:{...event.data,contractVersion:2}},{...event,data:{...event.data,appId:'other.app'}},{...event,data:{...event.data,sessionId:'wrong'}},{...event,data:{...event.data,type:'execute'}},{...event,data:{...event.data,payload:{level:'invalid',code:'reference.ready',message:'test'}}}])assert.throws(()=>guard(value));
    assert.equal(guard(event).sequence,1);assert.throws(()=>guard(event));assert.equal(guard({...event,data:{...event.data,sequence:2}}).sequence,2);for(const origin of ['*','null','https://apps.example.invalid/path'])assert.throws(()=>C.messageGuard({...options,origin}));
  });
  await check('real reference adapter DOM, state, events and disposal in a Phase 3 bounded window',async()=>{
    const doc={createElement(){return new Element(doc);}},container=new Element(doc),events=[],host=new Host({schemas:A.schemas});host.register(A.manifest,A.create,{grants:A.manifest.capabilities});host.subscribe('reference.status.changed',e=>events.push(e));
    const bounds={width:1000,height:700};let geometry=W.windows.action(W.defaults.windows,{type:'open',app:'blos'},bounds);const initial=geometry.items[0].rect;assert(initial.width<bounds.width&&initial.height<bounds.height);
    await host.launch(A.manifest.id,container,{size:{width:initial.width,height:initial.height}});const section=container.children[0],button=section.children.at(-1);button.listeners.get('click')();assert.equal(events[0].payload.count,1);
    await host.deactivate(A.manifest.id);assert(button.disabled);await host.activate(A.manifest.id);assert(!button.disabled);
    geometry=W.windows.action(geometry,{type:'resize',app:'blos',rect:{...initial,width:9999,height:9999}},bounds);await host.resize(A.manifest.id,geometry.items[0].rect.width?{width:geometry.items[0].rect.width,height:geometry.items[0].rect.height}:{});assert.equal(container.children[0],section);assert.equal(section.children[4].textContent,'Resize notification: 1000 × 700');
    await host.context(A.manifest.id,'shell.selection',{id:'sample-b'});assert(section.children[3].textContent.includes('sample-b'));const saved=await host.save(A.manifest.id);assert.equal(saved.data.count,1);await host.close(A.manifest.id);assert.equal(container.children.length,0);assert.equal(button.listeners.size,0);await host.launch(A.manifest.id,container,{state:saved});assert(container.children[0].children[2].textContent.includes('1'));await host.close(A.manifest.id);await assert.rejects(host.launch(A.manifest.id,container,{state:{...saved,data:{count:10000,selection:null}}}),/Count/);assert.equal(container.children.length,0,'Failed application restore is disposed without a partial UI');await host.dispose();
  });
  await check('offline example has only local resources, no dynamic loading, and valid script syntax',()=>{
    const folder=path.resolve(__dirname,'../../../examples/app-integration'),html=fs.readFileSync(path.join(folder,'index.html'),'utf8');
    for(const m of html.matchAll(/(?:src|href)="([^"]+)"/g)){assert(!/^(?:https?:|\/\/)/.test(m[1]));const file=path.resolve(folder,m[1]);assert(fs.existsSync(file));if(file.endsWith('.js'))new vm.Script(fs.readFileSync(file,'utf8'));}
    const source=fs.readFileSync(path.join(folder,'reference-lab.js'),'utf8');assert(!/\b(?:fetch|eval|WebSocket)\s*\(/.test(source));assert(!source.includes('DemoApplicationRegistry'));
  });
  console.log(JSON.stringify({integration:'pass',focusedChecks:checks,reference:'synthetic trusted module only',designStudioFilesModified:0,iframeTransport:'guard tested; transport not implemented',browserRendering:'not exercised by controlled DOM tests'},null,2));
})().catch(error=>{console.error(error);process.exitCode=1;});

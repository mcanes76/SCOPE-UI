/* Trusted in-process reference host. Not a security sandbox or production runtime. */
(function(root){
  'use strict';
  const C=root.ScopeIntegrationContracts||(typeof require==='function'?require('./contracts.js'):null);
  class AdapterHost{
    constructor({schemas={events:{},commands:{},contexts:{}},timeoutMs=1500,onDiagnostic=()=>{}}={}){
      if(!Number.isFinite(timeoutMs)||timeoutMs<1||timeoutMs>30000)throw Error('Invalid lifecycle deadline');
      this.schemas=schemas;this.timeoutMs=timeoutMs;this.onDiagnostic=onDiagnostic;this.records=new Map();this.listeners=new Map();
    }
    diagnostic(r,operation,code){try{this.onDiagnostic(Object.freeze({appId:r.manifest.id,operation,code,lifecycle:r.state}));}catch{}}
    register(input,factory,{grants=[]}={}){
      const manifest=C.manifest(input);if(this.records.has(manifest.id)||typeof factory!=='function')throw Error('Duplicate registration or invalid factory');
      if(!Array.isArray(grants)||grants.some(x=>!C.capabilities.includes(x))||manifest.capabilities.some(x=>!grants.includes(x)))throw Error('Application capabilities were not granted');
      for(const topic of manifest.publishes)if(typeof this.schemas.events?.[topic]!=='function')throw Error('Event schema is not approved');
      for(const topic of manifest.contexts)if(typeof this.schemas.contexts?.[topic]!=='function')throw Error('Context schema is not approved');
      for(const topic of manifest.commands)if(typeof this.schemas.commands?.[topic]?.request!=='function'||typeof this.schemas.commands?.[topic]?.response!=='function')throw Error('Command schemas are not approved');
      const r={manifest,factory,state:'registered',instance:null,controller:null,container:null,cleanups:[],queue:Promise.resolve(),health:null,tainted:false};this.records.set(manifest.id,r);return C.json(manifest);
    }
    record(id){const r=this.records.get(id);if(!r)throw Error('Application is not registered');return r;}
    status(id){const r=this.record(id);return C.json({id,state:r.state,capabilities:r.manifest.capabilities,health:r.health});}
    list(){return [...this.records.keys()].map(id=>this.status(id));}
    enqueue(id,fn){const r=this.record(id),job=r.queue.then(()=>fn(r));r.queue=job.catch(()=>{});return job;}
    async deadline(r,fn){
      let timer;try{return await Promise.race([Promise.resolve().then(fn),new Promise((_,reject)=>{timer=setTimeout(()=>{r.tainted=true;const e=Error('Adapter deadline exceeded');e.code='timeout';reject(e);},this.timeoutMs);})]);}finally{clearTimeout(timer);}
    }
    async call(r,method,...args){
      const fn=r.instance?.[method];if(typeof fn!=='function')throw Error('Missing adapter method: '+method);
      return this.deadline(r,()=>fn.apply(r.instance,args));
    }
    async cleanup(r){
      r.controller?.abort();let clean=true;
      if(r.instance){try{await this.call(r,'dispose');}catch{clean=false;this.diagnostic(r,'dispose','cleanup-failed');}}
      for(const dispose of r.cleanups.splice(0).reverse()){try{await this.deadline(r,dispose);}catch{clean=false;}}
      r.instance=null;r.container=null;r.controller=null;return clean&&!r.tainted;
    }
    async failed(r,operation,error){r.state='failed';this.diagnostic(r,operation,error?.code==='timeout'?'timeout':'adapter-failed');const safe=await this.cleanup(r);r.state=safe?'failed':'quarantined';}
    launch(id,container,{state,size}={}){
      return this.enqueue(id,async r=>{
        if(!container)throw Error('A shell-owned mount container is required');
        if(['active','inactive'].includes(r.state)){if(r.container!==container)throw Error('Singleton is already mounted elsewhere');return this.status(id);}
        if(r.state==='quarantined')throw Error('Application requires host/session replacement after unsafe cleanup');
        const restored=state===undefined?undefined:C.snapshot(state,r.manifest);if(restored&&!r.manifest.capabilities.includes('state'))throw Error('State restore is not supported');
        const initialSize=size===undefined?undefined:C.size(size);r.state='initializing';r.tainted=false;r.controller=new AbortController();r.cleanups=[];r.health=null;
        try{
          r.instance=r.factory();if(!r.instance||typeof r.instance!=='object'||typeof r.instance.then==='function')throw Error('Factory must synchronously return an adapter');
          for(const method of ['initialize','mount','activate','deactivate','resize','dispose'])if(typeof r.instance[method]!=='function')throw Error('Missing adapter method: '+method);
          for(const [cap,methods] of [['state',['saveState','restoreState']],['commands',['handleCommand']],['context',['receiveContext']]])if(r.manifest.capabilities.includes(cap)&&methods.some(m=>typeof r.instance[m]!=='function'))throw Error('Missing capability implementation: '+cap);
          const controller=r.controller,context=Object.freeze({appId:id,contractVersion:C.version,signal:controller.signal,
            emit:(topic,payload)=>{if(controller.signal.aborted||r.controller!==controller)return false;if(!r.manifest.publishes.includes(topic))throw Error('Event is not permitted');const data=C.json(this.schemas.events[topic](C.json(payload)));for(const listener of [...(this.listeners.get(topic)||[])]){try{listener(Object.freeze({appId:id,topic,payload:C.json(data)}));}catch{this.diagnostic(r,'event','listener-failed');}}return true;},
            report:value=>{if(!controller.signal.aborted&&r.controller===controller)r.health={...C.status(value),at:Date.now()};},
            onDispose:fn=>{if(controller.signal.aborted||typeof fn!=='function'||r.cleanups.length>=100)throw Error('Invalid cleanup registration');r.cleanups.push(fn);}
          });
          await this.call(r,'initialize',context);r.state='mounting';r.container=container;await this.call(r,'mount',container);
          if(restored)await this.call(r,'restoreState',restored.data);if(initialSize)await this.call(r,'resize',initialSize);
          r.state='inactive';await this.call(r,'activate');r.state='active';return this.status(id);
        }catch(error){await this.failed(r,'launch',error);throw error instanceof Error?error:Error('Adapter operation failed');}
      });
    }
    lifecycle(id,method,state,args=[]){return this.enqueue(id,async r=>{if(!['active','inactive'].includes(r.state))throw Error('Application is not mounted');if(state&&r.state===state)return this.status(id);try{await this.call(r,method,...args);if(state)r.state=state;return this.status(id);}catch(error){await this.failed(r,method,error);throw error instanceof Error?error:Error('Adapter operation failed');}});}
    activate(id){return this.lifecycle(id,'activate','active');}
    deactivate(id){return this.lifecycle(id,'deactivate','inactive');}
    resize(id,size){return this.lifecycle(id,'resize',null,[C.size(size)]);}
    optional(id,cap,fn){return this.enqueue(id,async r=>{if(!['active','inactive'].includes(r.state)||!r.manifest.capabilities.includes(cap))throw Error('Capability is not available');try{return await fn(r);}catch(error){this.diagnostic(r,cap,error?.code==='timeout'?'timeout':'request-failed');if(error?.code==='timeout')await this.failed(r,cap,error);throw error instanceof Error?error:Error('Adapter operation failed');}});}
    command(id,name,payload){return this.optional(id,'commands',async r=>{if(!r.manifest.commands.includes(name))throw Error('Command is not permitted');const schema=this.schemas.commands[name],request=C.json(schema.request(C.json(payload))),result=await this.call(r,'handleCommand',name,request);return C.json(schema.response(C.json(result)));});}
    context(id,name,payload){return this.optional(id,'context',async r=>{if(!r.manifest.contexts.includes(name))throw Error('Context is not permitted');await this.call(r,'receiveContext',name,C.json(this.schemas.contexts[name](C.json(payload))));});}
    save(id){return this.optional(id,'state',async r=>C.snapshot({schemaVersion:1,contractVersion:C.version,appId:id,applicationVersion:r.manifest.version,data:C.json(await this.call(r,'saveState'))},r.manifest));}
    close(id){return this.enqueue(id,async r=>{if(r.state==='quarantined')throw Error('Application is quarantined');if(['registered','disposed'].includes(r.state)){r.state='disposed';return this.status(id);}if(r.state==='active'){try{await this.call(r,'deactivate');}catch{this.diagnostic(r,'deactivate','cleanup-failed');}}r.state='disposing';const safe=await this.cleanup(r);r.state=safe?'disposed':'quarantined';if(!safe)throw Error('Application cleanup was not confirmed');return this.status(id);});}
    subscribe(topic,listener){if(typeof this.schemas.events?.[topic]!=='function'||typeof listener!=='function')throw Error('Event subscription is not approved');const set=this.listeners.get(topic)||new Set();set.add(listener);this.listeners.set(topic,set);return ()=>{set.delete(listener);if(!set.size)this.listeners.delete(topic);};}
    async dispose(){const results=await Promise.allSettled([...this.records.keys()].map(id=>this.close(id)));this.listeners.clear();return results;}
  }
  root.ScopeAdapterHost=AdapterHost;if(typeof module!=='undefined')module.exports=AdapterHost;
})(typeof globalThis!=='undefined'?globalThis:this);

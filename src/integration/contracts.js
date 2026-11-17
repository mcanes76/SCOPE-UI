/* Reference integration contract v1. No dependency on the Design Studio. */
(function(root){
  'use strict';
  const version=1, capabilities=['state','commands','context'];
  const fail=message=>{throw new Error(message);};
  const object=x=>x!==null&&typeof x==='object'&&!Array.isArray(x);
  function json(value){
    let count=0;const seen=new Set();
    function clean(v,depth){
      if(++count>2000||depth>10)fail('Payload exceeds limits');
      if(v===null||typeof v==='boolean')return v;
      if(typeof v==='number'){if(!Number.isFinite(v))fail('Non-finite payload number');return v;}
      if(typeof v==='string'){if(v.length>8192)fail('Payload string too long');return v;}
      if(!object(v)&&!Array.isArray(v)||!Array.isArray(v)&&![Object.prototype,null].includes(Object.getPrototypeOf(v))||Object.getOwnPropertySymbols(v).length)fail('Only plain JSON payloads are supported');
      if(seen.has(v))fail('Cyclic payload');seen.add(v);
      const out=Array.isArray(v)?[]:{};
      for(const [key,item] of Object.entries(v)){
        if(['__proto__','constructor','prototype'].includes(key))fail('Unsafe payload key');
        out[key]=clean(item,depth+1);
      }
      seen.delete(v);return out;
    }
    const out=clean(value,0);if(new TextEncoder().encode(JSON.stringify(out)).byteLength>32768)fail('Payload exceeds 32 KB');return out;
  }
  function exact(input,keys,label){if(!object(input)||Object.keys(input).some(k=>!keys.includes(k)))fail('Invalid '+label);}
  function name(value){return typeof value==='string'&&/^[a-z][a-z0-9]*(?:[.-][a-z0-9]+)*$/.test(value)&&value.length<=100;}
  function manifest(input){
    exact(input,['schemaVersion','id','name','version','contractVersion','integration','singleton','capabilities','publishes','commands','contexts','theme'],'manifest');
    if(input.schemaVersion!==1||input.contractVersion!==version)fail('Unsupported integration contract version');
    if(!name(input.id)||typeof input.name!=='string'||!input.name.trim()||input.name.length>100||typeof input.version!=='string'||!/^\d+\.\d+\.\d+$/.test(input.version)||input.integration!=='module'||input.singleton!==true)fail('Invalid manifest identity or integration mode');
    const out=json(input);
    if(Object.hasOwn(out,'theme')){
      const theme=root.ScopeIntegrationTheme||(typeof require==='function'?require('./theme-contract.js'):null);
      if(!theme)fail('Load the optional SCOPE theme contract before registering a themed manifest');
      out.theme=theme.declaration(out.theme);
    }
    for(const field of ['capabilities','publishes','commands','contexts']){
      const list=out[field];if(!Array.isArray(list)||list.length>16||new Set(list).size!==list.length||list.some(x=>field==='capabilities'?!capabilities.includes(x):!name(x)))fail('Invalid manifest '+field);
    }
    if(out.publishes.some(x=>!x.startsWith(out.id+'.'))||out.commands.some(x=>!x.startsWith(out.id+'.')))fail('Application topics must use its namespace');
    if(out.commands.length&&!out.capabilities.includes('commands')||out.contexts.length&&!out.capabilities.includes('context'))fail('Undeclared optional capability');
    return out;
  }
  function size(input){exact(input,['width','height'],'resize');for(const n of ['width','height'])if(!Number.isFinite(input[n])||input[n]<0||input[n]>32768)fail('Invalid resize');return {width:Math.round(input.width),height:Math.round(input.height)};}
  function status(input){exact(input,['level','code','message'],'status');if(!['healthy','degraded','error'].includes(input.level)||!name(input.code)||typeof input.message!=='string'||input.message.length>300)fail('Invalid status');return json(input);}
  function snapshot(input,m){
    exact(input,['schemaVersion','contractVersion','appId','applicationVersion','data'],'snapshot');
    if(input.schemaVersion!==1||input.contractVersion!==version||input.appId!==m.id||input.applicationVersion!==m.version||!Object.hasOwn(input,'data'))fail('Snapshot is incompatible with application version');return json(input);
  }
  // A guard for future non-opaque iframe transports, not an iframe adapter.
  function messageGuard({source,origin,sessionId,appId,schemas}){
    if(!source||typeof origin!=='string'||!/^https?:\/\//.test(origin)||new URL(origin).origin!==origin||typeof sessionId!=='string'||sessionId.length<16||!name(appId)||!object(schemas))fail('A pinned source, exact non-opaque origin and session are required');
    let sequence=0;
    return event=>{
      if(event.source!==source||event.origin!==origin)fail('Message source or origin mismatch');
      const m=json(event.data);exact(m,['namespace','contractVersion','sessionId','appId','sequence','type','payload'],'message');
      if(m.namespace!=='scope-integration'||m.contractVersion!==version||m.sessionId!==sessionId||m.appId!==appId||!Number.isSafeInteger(m.sequence)||m.sequence<=sequence||!Object.hasOwn(schemas,m.type)||typeof schemas[m.type]!=='function')fail('Invalid integration envelope');
      m.payload=json(schemas[m.type](json(m.payload)));sequence=m.sequence;return m;
    };
  }
  const api={version,capabilities,json,manifest,size,status,snapshot,messageGuard};root.ScopeIntegrationContracts=api;if(typeof module!=='undefined')module.exports=api;
})(typeof globalThis!=='undefined'?globalThis:this);

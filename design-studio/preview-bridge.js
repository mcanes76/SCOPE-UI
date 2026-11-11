/* Authenticated, versioned parent ↔ engine interface; no arbitrary eval or CSS. */
(function(){
  'use strict';
  const embedded=window.ScopeEmbeddedTransport;
  const url=new URL(location.href),channel=embedded?.channel||url.searchParams.get('studioChannel'),origin=embedded?embedded.parentOrigin:url.origin;
  if(window.parent===window||!channel||(!embedded&&origin==='null'))return;
  // Opaque srcdoc/file origins cannot be named as targetOrigin. Address only the
  // captured parent/window and still verify origin, source, version and channel.
  const send=(type,payload={})=>parent.postMessage({namespace:'scope-design-studio',version:1,channel,type,...payload},origin==='null'?'*':origin);
  ScopePreviewRuntime.onEvent((type,payload)=>send(type,payload));
  window.addEventListener('message',event=>{
    const m=event.data;
    if(event.source!==parent||event.origin!==origin||m?.namespace!=='scope-design-studio'||m.version!==1||m.channel!==channel||m.type!=='configure')return;
    try{ScopePreviewRuntime.apply(m.design,m.presets,m.options);send('applied');}catch(error){send('error',{message:error.message});}
  });
  send('ready');
})();

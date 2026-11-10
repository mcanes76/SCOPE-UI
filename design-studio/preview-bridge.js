/* Authenticated, versioned parent ↔ engine interface; no arbitrary eval or CSS. */
(function(){
  'use strict';
  const url=new URL(location.href),channel=url.searchParams.get('studioChannel'),origin=url.origin;
  if(window.parent===window||!channel||origin==='null')return;
  const send=(type,payload={})=>parent.postMessage({namespace:'scope-design-studio',version:1,channel,type,...payload},origin);
  ScopePreviewRuntime.onEvent((type,payload)=>send(type,payload));
  window.addEventListener('message',event=>{
    const m=event.data;
    if(event.source!==parent||event.origin!==origin||m?.namespace!=='scope-design-studio'||m.version!==1||m.channel!==channel||m.type!=='configure')return;
    try{ScopePreviewRuntime.apply(m.design,m.presets,m.options);send('applied');}catch(error){send('error',{message:error.message});}
  });
  send('ready');
})();

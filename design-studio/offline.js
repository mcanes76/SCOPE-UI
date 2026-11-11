/* Optional distribution adapter. The editor/engine remain authoritative sources. */
(function(){
  'use strict';
  const assets=window.ScopeOfflineAssets;
  if(!assets)return;
  const script=text=>'<script data-scope-preview-bridge>'+text.replace(/<\/script/gi,'<\\/script')+'</script>';
  function preview(frame,channel){
    // An opaque sandbox isolates the editor from application DOM. No same-origin
    // permission, security flags or browser exceptions are needed.
    frame.setAttribute('sandbox','allow-scripts allow-modals allow-downloads allow-popups allow-popups-to-escape-sandbox');
    const engine=ScopeExports.composeFinal(assets.resources,assets.initial,assets.themes.presets,{preview:true});
    const transport='window.ScopeEmbeddedTransport='+JSON.stringify({channel,parentOrigin:window.origin||location.origin}).replace(/</g,'\\u003c')+';';
    frame.srcdoc=engine.replace('</body>',()=>script(transport+assets.bridge)+'</body>');
  }
  let helpURL;
  function help(){
    if(!helpURL){
      const mockup=URL.createObjectURL(new Blob([ScopeExports.composeFinal(assets.resources,assets.initial,assets.themes.presets)],{type:'text/html;charset=utf-8'}));
      const escapedURL=location.href.replace(/&/g,'&amp;').replace(/"/g,'&quot;');
      const html=assets.help.replace('href="index.html"','href="'+escapedURL+'"').replace('href="../mockups/scope-integrated-electric-glass.html"','href="'+mockup+'"');
      helpURL=URL.createObjectURL(new Blob([html],{type:'text/html;charset=utf-8'}));
    }
    return helpURL;
  }
  const helpLink=document.querySelector('a[href="README.html"]');
  if(helpLink)helpLink.addEventListener('click',()=>{helpLink.href=help();});
  window.ScopeOfflineRuntime={preview,configuration:()=>[ScopeDesign.clone(assets.themes),ScopeDesign.clone(assets.initial),ScopeDesign.clone(assets.resources.params)],logo:assets.resources.logo,fallback:assets.resources.fallback};
})();

/* Embedded engine shell adapter for independent, offline application windows.
 * No application store or operational handler is changed. */
(function(){
  'use strict';
  const urls=new Map();
  appWindowURL=function(index){
    const current=ScopePreviewRuntime.snapshot();
    if(!current)return '';
    const clone=document.documentElement.cloneNode(true);
    clone.querySelectorAll('[data-scope-preview-bridge],[data-scope-portable-launch],#scope-studio-frame,#scope-design-overrides').forEach(el=>el.remove());
    const launch=document.createElement('script');launch.dataset.scopePortableLaunch='';
    launch.textContent='window.ScopePortableWindow='+JSON.stringify({app:index,look:state.look,shell:state.concept,details:presentation.detailsVisible}).replace(/</g,'\\u003c')+';';
    clone.querySelector('head').prepend(launch);
    const restore=document.createElement('script');restore.dataset.scopePortableLaunch='';
    current.detailsVisible=presentation.detailsVisible;
    restore.textContent='window.ScopePreviewRuntime.apply('+JSON.stringify(current).replace(/</g,'\\u003c')+','+JSON.stringify(window.ScopePortablePresets).replace(/</g,'\\u003c')+',{editing:false});';
    clone.querySelector('body').append(restore);
    if(urls.has(index))URL.revokeObjectURL(urls.get(index));
    const url=URL.createObjectURL(new Blob(['<!doctype html>'+clone.outerHTML],{type:'text/html;charset=utf-8'}));urls.set(index,url);return url;
  };
})();

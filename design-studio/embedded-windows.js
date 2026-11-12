/* Embedded engine shell adapter for independent, offline application windows.
 * No application store or operational handler is changed. */
(function(){
  'use strict';
  const urls=new Map();
  appWindowURL=function(index){
    const current=ScopePreviewRuntime.snapshot();
    if(!current)return '';
    const clone=document.documentElement.cloneNode(true);
    clone.querySelectorAll('[data-scope-preview-bridge],[data-scope-saved-config],[data-scope-folder-params],[data-scope-portable-launch],#scope-studio-frame,#scope-design-overrides,.operator-bar,.operator-divider').forEach(el=>el.remove());
    const launch=document.createElement('script');launch.dataset.scopePortableLaunch='';
    const token=crypto.randomUUID();window.ScopeDetachedTokens??=new Map();window.ScopeDetachedTokens.set(index,token);
    launch.textContent='window.ScopePortableWindow='+JSON.stringify({app:index,look:state.look,shell:state.concept,details:presentation.detailsVisible,token,...window.ScopeOperator.launchInfo(index,token)}).replace(/</g,'\\u003c')+';';
    clone.querySelector('head').prepend(launch);
    const restore=document.createElement('script');restore.dataset.scopePortableLaunch='';
    current.detailsVisible=presentation.detailsVisible;
    current.workspace=ScopeWorkspace.fromDesign(current);
    const preserve=current.workspace.preserveViews;
    const savedViews=preserve?[...demoViews].filter(([key])=>key.endsWith(':'+index)).map(([key,value])=>[key,{...cloneDemo(value),busy:false}]):[];
    const slot=window.ScopeOperator.originSlot(index);
    const view=demoViews.get(slot+':'+index);if(view&&preserve)savedViews.push(['popup:'+index,{...cloneDemo(view),busy:false}]);
    current.workspace=ScopeWorkspace.fromDesign(current);
    if(current.workspace){current.workspace={...current.workspace,layout:'single',left:ApplicationIds[index],expanded:null,allowedLayouts:[...new Set(['single',...current.workspace.allowedLayouts])]};current.layout.mode='single';current.operator=ScopeWorkspace.operator(current.workspace);}
    restore.textContent='for(const [key,value] of '+JSON.stringify(savedViews).replace(/</g,'\\u003c')+'){if(value.group&&!DemoMulticastGroupStore.list().some(g=>g.id===value.group))value.group=DemoMulticastGroupStore.list()[0]?.id;demoViews.set(key,value);}window.ScopePreviewRuntime.apply('+JSON.stringify(current).replace(/</g,'\\u003c')+','+JSON.stringify(window.ScopePortablePresets||window.ScopeOperatorPresets).replace(/</g,'\\u003c')+',{editing:false});render();';
    clone.querySelector('body').append(restore);
    if(urls.has(index))URL.revokeObjectURL(urls.get(index));
    const url=URL.createObjectURL(new Blob(['<!doctype html>'+clone.outerHTML],{type:'text/html;charset=utf-8'}));urls.set(index,url);return url;
  };
  window.addEventListener('message',event=>{
    const m=event.data,launch=window.ScopePortableWindow;
    if(!launch||event.source!==presentationParent||event.origin!==new URL(window.location.href).origin||m?.type!=='scope-window-design'||m.version!==1||m.token!==launch.token)return;
    try{const d=ScopeDesign.clone(m.design),w=ScopeWorkspace.fromDesign(d);d.workspace={...w,layout:'single',left:ApplicationIds[launch.app],expanded:null,allowedLayouts:[...new Set(['single',...w.allowedLayouts])]};d.layout.mode='single';d.operator=ScopeWorkspace.operator(d.workspace);window.ScopePreviewRuntime.apply(d,m.presets,{editing:false});}catch{}
  });
})();

/* Operator controls shared by preview, folder and single-file mockups. */
(function(){
  'use strict';
  let current=null,presets=[],options={},toolbar=null,lastInput='',paramsInput='',picker=null,feedback='',dragging=false;
  const op={left:'blos',right:'display',ratio:50,allowed:['single','split','popout']};
  const C=window.ScopeDesign,P=window.ScopeParameters;
  function parameters(){
    const base={...appConfig,applications:Object.fromEntries(ApplicationIds.map((id,i)=>[id,{...appConfig.applications[id],visible:true}]))};
    const incoming=current?.parameters||{};
    return P.validate({...base,...incoming,branding:{...base.branding,...incoming.branding},applications:Object.fromEntries(ApplicationIds.map(id=>[id,{...base.applications[id],...incoming.applications?.[id]}])),labels:{...base.labels,...incoming.labels,shells:{...base.labels.shells,...incoming.labels?.shells}}});
  }
  function configure(d,ps,opts){
    current=d;presets=ps;options=opts;window.ScopeOperatorPresets=ps;
    const key=JSON.stringify(d.operator||{});if(key!==lastInput){Object.assign(op,{left:opts.application||op.left,right:opts.rightApplication||op.right,ratio:50,allowed:['single','split','popout']},d.operator);lastInput=key;}
    const pk=JSON.stringify(d.parameters||{});
    if(pk!==paramsInput){paramsInput=pk;const p=parameters();if(window.ScopePortablePresets&&!window.ScopeFolderPackage&&!p.logoPath.startsWith('data:'))p.logoPath=DefaultPresentationConfig.logoPath;applyPresentationConfig(p);if(/^data:image\//.test(p.logoPath))appConfig.logoPath=p.logoPath;render();}
    decorate();
    if(window.ScopeDetachedTokens){const origin=new URL(window.location.href).origin;appWindows.forEach((handle,index)=>{try{if(!handle.closed)handle.postMessage({type:'scope-window-design',version:1,token:window.ScopeDetachedTokens.get(index),design:d,presets:ps},origin==='null'?'*':origin);}catch{}});}
  }
  function transition(patch){
    const d=C.clone(current);d.operator={...op,...patch.operator};if(patch.mode)d.layout.mode=patch.mode;
    if(!d.operator.allowed.includes(d.layout.mode))throw Error('Viewing mode is not enabled');
    if(patch.mode==='single'){state.mosaic.panes=[ApplicationIds.indexOf(d.operator.left)];state.mosaic.expanded=null;}
    current=d;window.ScopePreviewRuntime.apply(d,presets,{...options,application:d.operator.left,rightApplication:d.operator.right});
    window.ScopeOperator.onChange?.(d);
  }
  function decorate(){
    if(!current||dragging)return;
    if(!toolbar){toolbar=document.createElement('nav');toolbar.className='operator-bar';toolbar.setAttribute('aria-label','Operator workspace controls');const target=document.getElementById('exploration');target.before(toolbar);}
    const p=parameters(),visible=ApplicationIds.filter(id=>p.applications[id].visible),choices=active=>visible.map(id=>`<option value="${id}" ${id===active?'selected':''}>${escapeHTML(p.applications[id].name)}</option>`).join('');
    const left=ApplicationIds[integrated.mode==='split'?integrated.left:state.concept===3?state.deck.active:state.concept===2?state.portal.active:state.concept===1?state.mosaic.focus:state.aperture.active];op.left=left;op.right=ApplicationIds[integrated.right];
    toolbar.innerHTML=`<div class="operator-layouts">${['single','split'].filter(m=>op.allowed.includes(m)).map(m=>`<button data-operator="mode" data-mode="${m}" aria-pressed="${integrated.mode===m}">${m==='single'?'Single Application':'Two Applications'}</button>`).join('')}</div><label>${integrated.mode==='split'?'Left':'Application'} <select data-operator-select="left">${choices(left)}</select></label>${integrated.mode==='split'?`<label>Right <select data-operator-select="right">${choices(op.right)}</select></label>`:''}${op.allowed.includes('popout')?`<button data-operator="popout" data-app="${integrated.mode==='split'?op.right:left}">Pop Out ${escapeHTML(p.applications[integrated.mode==='split'?op.right:left].name)}</button>`:''}<button data-operator="return">Return to Main Workspace</button><button data-operator="workspace">Workspace</button><button data-operator="laboratory">Component Laboratory</button><details><summary>Configuration</summary><div class="operator-config"><button data-operator="import-params">Import Parameters JSON</button><button data-operator="import-logo">Import Logo Image</button><button data-operator="save-params">Save Parameters JSON</button><button data-operator="save-html">Save Updated Mockup</button><span>Window data sessions are independent. No cross-window model synchronization is claimed.</span></div></details><output id="operator-feedback" role="status">${escapeHTML(feedback)}</output>`;
    for(const id of ApplicationIds){const index=ApplicationIds.indexOf(id),show=p.applications[id].visible;document.querySelectorAll(`[data-deck-app="${index}"],[data-membership="${index}"],[data-enter-room="${index}"],[data-switch-app="${index}"]`).forEach(el=>{el.hidden=!show;});}
    const pane=document.querySelector('.integrated-panes');if(!pane)return;
    pane.style.setProperty('grid-template-columns',integrated.expanded?'minmax(0,1fr)':`minmax(0,${op.ratio}fr) minmax(0,${100-op.ratio}fr)`,'important');pane.style.position='relative';
    pane.querySelector('.operator-divider')?.remove();if(integrated.expanded)return;
    const divider=document.createElement('button');divider.className='operator-divider';divider.setAttribute('role','separator');divider.setAttribute('aria-label','Resize left and right applications');divider.setAttribute('aria-orientation','vertical');divider.setAttribute('aria-valuemin','25');divider.setAttribute('aria-valuemax','75');divider.setAttribute('aria-valuenow',String(op.ratio));divider.style.left=op.ratio+'%';
    divider.addEventListener('keydown',e=>{if(['ArrowLeft','ArrowRight'].includes(e.key)){e.preventDefault();transition({operator:{ratio:Math.max(25,Math.min(75,op.ratio+(e.key==='ArrowLeft'?-5:5)))}});}});
    divider.addEventListener('pointerdown',e=>{e.preventDefault();dragging=true;divider.setPointerCapture(e.pointerId);let ratio=op.ratio;const move=event=>{const r=pane.getBoundingClientRect();ratio=Math.max(25,Math.min(75,Math.round((event.clientX-r.left)/r.width*100)));divider.style.left=ratio+'%';pane.style.setProperty('grid-template-columns',`${ratio}fr ${100-ratio}fr`,'important');};const end=()=>{dragging=false;divider.removeEventListener('pointermove',move);divider.removeEventListener('pointerup',end);divider.removeEventListener('pointercancel',end);transition({operator:{ratio}});};divider.addEventListener('pointermove',move);divider.addEventListener('pointerup',end);divider.addEventListener('pointercancel',end);});pane.append(divider);
  }
  async function importParameters(value){
    const p=P.validate(value);if(!presets.some(x=>x.id===p.initial.theme))throw Error('Unknown palette in parameters');
    const d=C.clone(current);d.parameters=p;d.theme=p.initial.theme;d.typography=C.clone(presets.find(x=>x.id===d.theme).typography);d.navigation=p.initial.navigation;d.layout.mode=p.initial.mode;d.operator={left:p.initial.left,right:p.initial.right,ratio:50,allowed:p.allowedModes};
    if(p.buttonGeometry!=='inherit'){d.components??={global:{},classes:{},applications:{},instances:{}};d.components.global.buttons={...(d.components.global.buttons||{}),radius:{square:0,slight:4,rounded:10,pill:50}[p.buttonGeometry]};}
    current=d;window.ScopePreviewRuntime.apply(d,presets,{...options,application:d.operator.left,rightApplication:d.operator.right});window.ScopeOperator.onChange?.(d);say('Parameters applied.');
  }
  function say(text){feedback=text;const out=document.getElementById('operator-feedback');if(out)out.textContent=text;}
  function choose(kind){
    if(!picker){picker=document.createElement('input');picker.type='file';picker.hidden=true;document.body.append(picker);picker.addEventListener('change',async()=>{try{const file=picker.files[0];if(!file)return;if(kindSelected==='params'){if(file.size>3000000)throw Error('Parameters exceed 3 MB');await importParameters(JSON.parse(await file.text()));}else {if(file.size>2000000||!['image/png','image/jpeg','image/webp','image/gif'].includes(file.type))throw Error('Choose a PNG/JPEG/WebP/GIF below 2 MB');const url=await new Promise((resolve,reject)=>{const reader=new FileReader();reader.onload=()=>resolve(reader.result);reader.onerror=reject;reader.readAsDataURL(file);});const d=C.clone(current);d.parameters={...d.parameters,logoPath:url};window.ScopePreviewRuntime.apply(d,presets,options);window.ScopeOperator.onChange?.(d);say('Logo embedded.');}}catch(error){say(error.message);}finally{picker.value='';}});}
    kindSelected=kind;picker.accept=kind==='params'?'.json,application/json':'image/png,image/jpeg,image/webp,image/gif';picker.click();
  }
  let kindSelected='params';
  async function saveUpdated(){
    const saved=C.clone(current);if(window.ScopeFolderPackage&&!saved.parameters?.logoPath?.startsWith("data:")){const path=parameters().logoPath;const response=await fetch(path);if(!response.ok)throw Error("Logo could not be embedded; import a logo image before saving.");const blob=await response.blob();const data=await new Promise((resolve,reject)=>{const reader=new FileReader();reader.onload=()=>resolve(reader.result);reader.onerror=reject;reader.readAsDataURL(blob);});saved.parameters={...saved.parameters,logoPath:data};}
    const clone=document.documentElement.cloneNode(true);clone.querySelectorAll('[data-scope-preview-bridge],[data-scope-saved-config],[data-scope-folder-params],#scope-studio-frame,#scope-design-overrides').forEach(el=>el.remove());
    const script=document.createElement('script');script.dataset.scopeSavedConfig='';script.textContent='window.ScopePreviewRuntime.apply('+JSON.stringify(saved).replace(/</g,'\\u003c')+','+JSON.stringify(presets).replace(/</g,'\\u003c')+',{presentation:true,editing:false});';clone.querySelector('body').append(script);download('<!doctype html>'+clone.outerHTML,'scope-configured-mockup.html','text/html');
  }
  function download(text,name,type){const url=URL.createObjectURL(new Blob([text],{type})),a=document.createElement('a');a.href=url;a.download=name;document.body.append(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),1000);}
  document.addEventListener('change',e=>{const slot=e.target.dataset.operatorSelect;if(slot)try{transition({operator:{[slot]:e.target.value}});}catch(error){say(error.message);}});
  document.addEventListener('click',async e=>{
    const b=e.target.closest('[data-operator]');if(!b)return;
    try{const action=b.dataset.operator;if(action==='workspace'||action==='laboratory'){state.view=action==='workspace'?'workspace':'lab';render();decorate();}if(action==='mode')transition({mode:b.dataset.mode});if(action==='popout'){const id=ApplicationIds.indexOf(b.dataset.app);const opened=openAppWindow(id,windowRects(1)[0]);say(opened?'Independent application window opened. Return here to keep working.':'Pop-up blocked. Allow this direct user-requested window or use split view.');}
      if(action==='return'){appWindows.forEach(handle=>{try{if(!handle.closed)handle.close();}catch{}});say('Returned to main workspace. Detached data was independent.');if(detachedContext)window.close();}
      if(action==='import-params')choose('params');if(action==='import-logo')choose('logo');if(action==='save-params')download(JSON.stringify({...parameters(),initial:{theme:current.theme,navigation:current.navigation,mode:current.layout.mode,left:op.left,right:op.right},allowedModes:op.allowed},null,2),'params.json','application/json');if(action==='save-html')await saveUpdated();
    }catch(error){say(error.message);}
  });
  const css=document.createElement('style');css.textContent='.operator-bar{display:flex;align-items:center;gap:10px;flex-wrap:wrap;padding:10px 16px;background:var(--scope-shell,#14243a);color:var(--scope-text,#edf5ff);border-bottom:1px solid var(--scope-border,#6c829c);font:13px system-ui}.operator-bar label{display:flex;align-items:center;gap:8px}.operator-bar button,.operator-bar select{font:inherit;padding:8px 10px;min-height:38px}.operator-bar output{font-size:11px;max-width:420px}.operator-config{display:grid;gap:8px;position:absolute;z-index:100;background:var(--scope-panel,#24364b);padding:16px;box-shadow:0 8px 25px #0007;max-width:390px}.operator-divider{position:absolute!important;top:0;bottom:0;width:10px;padding:0!important;min-height:44px!important;transform:translateX(-50%);cursor:col-resize;touch-action:none;z-index:20;background:var(--scope-focus,#80dfff)!important;opacity:.35}.operator-divider:hover,.operator-divider:focus-visible{opacity:1}@media(max-width:760px){.integrated-panes{display:flex!important;flex-direction:column}.operator-divider{display:none!important}}@media print{.operator-bar{display:none!important}}';document.head.append(css);
  window.ScopeOperator={configure,decorate,transition,importParameters,parameters,snapshot:()=>({...op,mode:integrated.mode})};
})();

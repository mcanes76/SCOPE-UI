/* Runs in the existing engine realm; never edits application stores or forms. */
(function(){
  'use strict';
  const core=window.ScopeDesign;
  const base=document.createElement('style');base.id='scope-studio-frame';
  base.textContent=`body[data-scope-design="true"]{background:#080e19}body[data-scope-design="true"] .study-header,body[data-scope-design="true"] .study-controls,body[data-scope-design="true"]>.footer,body[data-scope-design="true"] .simulation-banner,body[data-scope-design="true"] .integration-toolbar,body[data-scope-design="true"] .why{display:none!important}body[data-scope-design="true"] #exploration{padding:2px;max-width:none;margin:0}body[data-scope-design="true"] [data-studio-highlight]{outline:2px solid #54e1ff!important;outline-offset:-3px}body[data-scope-design="true"] .studio-resize{position:absolute;top:0;bottom:0;width:10px;padding:0;min-height:40px;border:0;border-radius:0;background:transparent;z-index:10;cursor:col-resize;touch-action:none}body[data-scope-design="true"] .studio-resize:hover,body[data-scope-design="true"] .studio-resize:focus-visible{background:#54e1ff66}body[data-scope-design="true"] .deck-layout{position:relative}@media(max-width:1250px){.studio-resize{display:none!important}}`;
  document.head.append(base);
  const style=document.createElement('style');style.id='scope-design-overrides';document.head.append(style);
  let design=null,selected='',editing=false,dragging=false,callback=()=>{},application='',rightApplication='';
  const selector=region=>core.regions[region];
  function decorate(){
    annotate();window.ScopeOperator?.decorate();
    document.querySelectorAll('[data-studio-highlight]').forEach(el=>el.removeAttribute('data-studio-highlight'));
    if(editing&&selected)document.querySelectorAll(selector(selected)).forEach(el=>{if(!el.closest('[data-demo-host]'))el.setAttribute('data-studio-highlight','');});
    if(dragging)return;
    document.querySelectorAll('.studio-resize').forEach(el=>el.remove());
    if(!editing||design?.navigation!=='deck'||design.layout.mode!=='single')return;
    document.querySelectorAll('.deck-layout').forEach(layout=>{
      if(layout.querySelector('.studio-resize'))return;
      for(const region of ['navigation','context']){
        if(region==='context'&&(!design.layout.contextVisible||design.regions.context?.visible===false))continue;
        const handle=document.createElement('button');handle.className='studio-resize';handle.type='button';handle.setAttribute('aria-label','Resize '+region+'; left and right arrows adjust width');handle.setAttribute('role','separator');handle.setAttribute('aria-orientation','vertical');
        const key=region==='navigation'?'navWidth':'contextWidth',range=region==='navigation'?[140,280]:[180,360];
        const width=design.regions[region]?.width||design.layout[key];
        handle.setAttribute('aria-valuemin',range[0]);handle.setAttribute('aria-valuemax',range[1]);handle.setAttribute('aria-valuenow',width);
        handle.style[region==='navigation'?'left':'right']=(width-5)+'px';
        handle.addEventListener('keydown',e=>{if(['ArrowLeft','ArrowRight'].includes(e.key)){e.preventDefault();callback('resize',{region,width:Math.max(range[0],Math.min(range[1],width+(e.key==='ArrowRight'?10:-10)*(region==='navigation'?1:-1)))});}});
        handle.addEventListener('pointerdown',e=>{
          e.preventDefault();dragging=true;handle.setPointerCapture(e.pointerId);const start=e.clientX;let next=width;
          const move=event=>{next=Math.max(range[0],Math.min(range[1],Math.round(width+(event.clientX-start)*(region==='navigation'?1:-1))));handle.style[region==='navigation'?'left':'right']=(next-5)+'px';handle.setAttribute('aria-valuenow',next);const visible=design.layout.contextVisible&&design.regions.context?.visible!==false;layout.style.setProperty('grid-template-columns',(region==='navigation'?next:design.regions.navigation?.width||design.layout.navWidth)+'px minmax(0,1fr)'+(visible?' '+(region==='context'?next:design.regions.context?.width||design.layout.contextWidth)+'px':''),'important');};
          const end=()=>{dragging=false;handle.removeEventListener('pointermove',move);handle.removeEventListener('pointerup',end);handle.removeEventListener('pointercancel',end);layout.style.removeProperty('grid-template-columns');callback('resize',{region,width:next});};
          handle.addEventListener('pointermove',move);handle.addEventListener('pointerup',end);handle.addEventListener('pointercancel',end);
        });layout.append(handle);
      }
    });
  }
  let queued=false;
  new MutationObserver(records=>{if(records.some(r=>r.type==='childList'&&[...r.addedNodes,...r.removedNodes].some(n=>n.nodeType===1&&!n.classList?.contains('studio-resize')&&!n.classList?.contains('operator-divider')))&&!queued){queued=true;requestAnimationFrame(()=>{queued=false;decorate();});}}).observe(document.getElementById('exploration'),{childList:true,subtree:true});
  function reportApplication(){
      if(!design||detachedContext)return;
      const index=integrated.mode==='split'?integrated.left:design.navigation==='aperture'?state.aperture.active:design.navigation==='deck'?state.deck.active:design.navigation==='portal'?state.portal.active:state.mosaic.focus;
      const next=ApplicationIds[index],right=ApplicationIds[integrated.right];
      if(next!==application||(integrated.mode==='split'&&right!==rightApplication)){application=next;rightApplication=right;callback('application',{application:next,rightApplication:right});}
  }
  document.addEventListener('change',()=>setTimeout(reportApplication,0));
  document.addEventListener('click',event=>{
    setTimeout(reportApplication,0);
    if(!editing||event.target.closest('[data-demo-host]')||event.target.closest('.studio-resize'))return;
    for(const id of ['branding','header','navigation','context','footer','workspace','shell'])if(event.target.closest(selector(id))){callback('selection',{region:id});break;}
  },true);
  function selectApp(id,right=false){
    const index=ApplicationIds.indexOf(id);if(index<0)return false;
    if(integrated.mode==='split'){integrated[right?'right':'left']=index;return true;}
    state.aperture.active=index;state.deck.active=index;state.portal.active=index;state.portal.route='room';
    if(!state.mosaic.panes.includes(index))state.mosaic.panes=[...state.mosaic.panes.slice(0,2),index];state.mosaic.focus=index;if(state.mosaic.expanded!==null)state.mosaic.expanded=index;return true;
  }
  function apply(input,presets,options={}){
    const next=core.validate(input),preset=presets.find(p=>p.id===next.theme);
    if(next.operator)options={application:next.operator.left,rightApplication:next.operator.right,...options};
    if(!preset||!looks.some(l=>l.id===preset.engineLook))throw Error('Unknown preview theme');
    const navChanged=!design||next.navigation!==design.navigation;
    const modeChanged=!design||next.layout.mode!==design.layout.mode;
    if(modeChanged)integrated.expanded=null;
    design=next;editing=Boolean(options.editing);selected=options.region&&Object.hasOwn(core.regions,options.region)?options.region:'';
    state.look=preset.engineLook;state.concept=core.navigation.indexOf(next.navigation);if(navChanged)state.view='workspace';integrated.mode=next.layout.mode;
    let redraw=navChanged||modeChanged;
    if(options.application&&options.application!==application){application=options.application;redraw=selectApp(application)||redraw;}
    if(options.rightApplication&&options.rightApplication!==rightApplication){rightApplication=options.rightApplication;if(integrated.mode==='split')redraw=selectApp(rightApplication,true)||redraw;}
    // Navigation changes retain the engine's per-slot draft/view maps and application stores.
    if((navChanged||modeChanged)&&application&&!detachedContext){selectApp(application);if(integrated.mode==='split'&&rightApplication)selectApp(rightApplication,true);}
    document.body.dataset.scopeDesign='true';document.body.dataset.look=preset.engineLook;document.body.dataset.theme=next.theme;document.body.dataset.family=preset.family||'glass';
    
    style.textContent=core.compileDesign(next,preset);
    window.ScopeOperator?.configure(next,presets,options);window.ScopeComponentPicker=Boolean(options.componentPicker);

    if(redraw)render(); // Theme/token-only edits do not replace application DOM.
    setUIDetails(options.presentation?true:next.detailsVisible,false);decorate();
  }
  function annotate(){
    document.querySelectorAll('.owner-surface[data-owner]').forEach(()=>{});
    document.querySelectorAll('[data-demo-host]').forEach(host=>{
      const id=ApplicationIds[Number(host.dataset.app)];host.closest('.owner-surface')?.setAttribute('data-owner',id);host.setAttribute('data-owner',id);
      const counts={};host.querySelectorAll('button').forEach(button=>{const action=button.dataset.demoAction||button.dataset.demoTab||button.dataset.demoDialog||'button';const n=counts[action]||0;counts[action]=n+1;button.setAttribute('data-style-id',id+':'+action.replace(/[^a-z0-9:_-]/g,'-')+':'+n);});
    });
  }
  document.addEventListener('click',event=>{
    if(!editing||!window.ScopeComponentPicker)return;const b=event.target.closest('[data-style-id]');if(!b)return;
    event.preventDefault();event.stopImmediatePropagation();callback('component',{id:b.dataset.styleId,app:b.closest('[data-owner]').dataset.owner,label:b.textContent.trim().slice(0,80),semantic:!!b.closest('.btn-join,.btn-enable,.btn-leave,.btn-disable,.btn-update,.btn-warning')});
  },true);
  window.ScopePreviewRuntime={apply,snapshot(){return core.clone(design);},onEvent(fn){callback=fn;if(window.ScopeOperator)window.ScopeOperator.onChange=d=>callback('operator',{design:d});},highlight(region){selected=region;decorate();},pick(value){window.ScopeComponentPicker=Boolean(value);}};
})();

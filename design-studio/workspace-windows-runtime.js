/* Managed operator windows. Only shell nodes and geometry are owned here. */
(function(){
  'use strict';
  const W=window.ScopeWorkspace,M=W.windows,apps=W.apps,nodes=new Map();
  let design=null,settings=null,canvas=null,stage=null,tasks=null,drag=null,configKey='',placing=false,lastSize='',observer=null;
  const baseRender=render,baseRects=windowRects;
  function enabled(){return Boolean(design&&settings?.windowed&&!detachedContext);}
  function active(){return enabled()&&state.view==='workspace';}
  function bounds(){const r=stage?.getBoundingClientRect();return {width:Math.max(1,Math.floor(stage?.clientWidth||r?.width||1)),height:Math.max(1,Math.floor(stage?.clientHeight||r?.height||1))};}
  function names(id){return window.ScopeOperator.parameters().applications[id].name;}
  function commit(){if(design&&!drag)window.ScopeOperator.setWindows(settings.windows,settings.windowed);}
  function update(action,{save=true,focus=false}={}){
    if(!stage)return;settings.windows=M.action(settings.windows,action,bounds());paint();if(save)commit();if(focus){const node=nodes.get(settings.windows.active);(node?.querySelector('.managed-title')||tasks?.querySelector('button')||canvas?.querySelector('.managed-launch button'))?.focus();}EarthRenderer.schedule();
  }
  function open(app){if(!apps.includes(app)||!window.ScopeOperator.parameters().applications[app].visible)return;update({type:'open',app},{focus:true});}
  function button(label,action,app){const b=document.createElement('button');b.type='button';b.dataset.managedAction=action;if(app)b.dataset.managedApp=app;b.textContent=label;b.setAttribute('aria-label',label+(app?' '+names(app):''));b.setAttribute('data-style-id','shell.window.button.'+action+(app?'.'+app:''));return b;}
  function createWindow(app){
    const index=apps.indexOf(app),slot='managed-'+app;
    // Reuse compatible engine view state when entering managed mode. No store is copied.
    if(!demoViews.has(slot+':'+index)){
      const source=document.querySelector('[data-demo-host][data-app="'+index+'"]');const view=source&&demoViews.get(source.dataset.slot+':'+index);if(view)demoViews.set(slot+':'+index,view);
    }
    const frame=document.createElement('section');frame.className='managed-window integration-pane';frame.dataset.managedApp=app;frame.setAttribute('role','region');frame.setAttribute('aria-label',names(app)+' workspace window');
    const header=document.createElement('header');header.className='managed-header integration-pane-header';
    const title=button(names(app),'move',app);title.className='managed-title';title.setAttribute('aria-label','Move '+names(app)+' window; arrow keys move, Shift plus arrows resize');header.append(title);
    const controls=document.createElement('div');controls.className='managed-controls';
    for(const [text,action] of [['Minimize','minimize'],['Maximize','maximize'],['Restore','restore'],['Dock left','dock-left'],['Dock right','dock-right'],['Close','close']])controls.append(button(text,action,app));
    controls.append(button('Pop out','popout',app));header.append(controls);
    const body=document.createElement('div');body.className='managed-body';body.innerHTML=surface(index,'Managed workspace window',slot);
    const grip=button('Resize','resize',app);grip.className='managed-resize';grip.setAttribute('aria-label','Resize '+names(app)+' window with arrow keys');
    frame.append(header,body,grip);nodes.set(app,frame);return frame;
  }
  function paint(){
    if(!stage||placing)return;placing=true;
    try{
      const windows=settings.windows;
      for(const id of apps){const b=canvas.querySelector('.managed-launch [data-managed-app="'+id+'"]');if(b){const label='Open '+names(id);if(b.textContent!==label)b.textContent=label;b.hidden=!window.ScopeOperator.parameters().applications[id].visible;}}
      for(const [app,node] of nodes)if(!windows.items.some(w=>w.app===app))node.hidden=true;
      for(const item of windows.items){
        let node=nodes.get(item.app);if(item.state==='closed'){if(node){node.hidden=true;node.dataset.managedState='closed';}continue;}
        if(!node)node=createWindow(item.app);if(node.parentElement!==stage)stage.append(node);
        node.hidden=item.state==='minimized';node.dataset.managedState=item.state;node.classList.toggle('managed-active',windows.active===item.app);
        node.setAttribute('aria-label',names(item.app)+' workspace window'+(windows.active===item.app?' (active)':''));
        const r=item.rect;for(const [key,value] of Object.entries({left:r.x,top:r.y,width:r.width,height:r.height,zIndex:windows.items.indexOf(item)+1}))node.style[key]=key==='zIndex'?String(value):value+'px';
        const title=node.querySelector('.managed-title'),label=names(item.app)+(windows.active===item.app?' - Active':'');if(title.textContent!==label)title.textContent=label;
        node.querySelector('[data-managed-action="maximize"]').hidden=item.state==='maximized';node.querySelector('[data-managed-action="restore"]').hidden=item.state!=='maximized'&&item.dock==='none';node.querySelector('.managed-resize').hidden=item.state==='maximized';node.querySelector('[data-managed-action="popout"]').hidden=!settings.popout;
      }
      if(!drag){
        const key=JSON.stringify(windows.items.map(w=>[w.app,w.state,windows.active===w.app,names(w.app)]));
        if(tasks.dataset.taskKey!==key){tasks.dataset.taskKey=key;tasks.replaceChildren();for(const item of windows.items.filter(w=>w.state!=='closed')){const b=button(names(item.app)+(item.state==='minimized'?' (minimized)':''),'open',item.app);b.setAttribute('aria-pressed',String(windows.active===item.app));tasks.append(b);}if(!tasks.children.length)tasks.textContent='No open windows. Choose an application above.';}
      }
    }finally{placing=false;}
  }
  function decorate(){
    if(!active()||placing||drag)return;
    const host=document.getElementById('view-workspace'),shell=host?.querySelector('.shell');if(!shell)return;
    let target=shell.querySelector('.integrated-panes,.aperture-stage,.deck-main,.panes,.portal-room');if(!target)return;
    if(!canvas){
      canvas=document.createElement('section');canvas.className='managed-workspace';canvas.setAttribute('aria-label','Managed operator workspace');
      const launch=document.createElement('nav');launch.className='managed-launch';launch.setAttribute('aria-label','Open application windows');
      for(const id of apps)launch.append(button('Open '+names(id),'open',id));
      for(const [label,action] of [['Cascade','cascade'],['Tile','tile'],['Reset workspace','reset']])launch.append(button(label,action));
      stage=document.createElement('div');stage.className='managed-stage';stage.setAttribute('aria-label','Application window area');
      tasks=document.createElement('nav');tasks.className='managed-tasks';tasks.setAttribute('aria-label','Open and minimized windows');canvas.append(launch,stage,tasks);
      if(typeof ResizeObserver!=='undefined'){observer=new ResizeObserver(()=>{if(!active()||drag||placing)return;const key=JSON.stringify(bounds());if(key!==lastSize){lastSize=key;settings.windows=M.action(settings.windows,{type:'fit'},bounds());paint();}});observer.observe(stage);}
    }
    // Keep engine navigation chrome; replace only the shell's application hosts.
    if(canvas.parentElement!==target){
      for(const host of target.querySelectorAll('[data-demo-host]')){const index=Number(host.dataset.app),id=apps[index],key='managed-'+id+':'+index;if(!demoViews.has(key)&&demoViews.has(host.dataset.slot+':'+index))demoViews.set(key,demoViews.get(host.dataset.slot+':'+index));}
      target.querySelectorAll('.owner-surface,.pane,.integration-pane,.operator-divider').forEach(el=>{if(!canvas.contains(el))el.remove();});
      target.dataset.managedTarget='true';target.prepend(canvas);
      if(target.classList.contains('integrated-panes')){target.style.setProperty('display','block','important');target.style.setProperty('height','auto','important');}
    }
    const visible=window.ScopeOperator.parameters().applications;
    for(const item of settings.windows.items)if(!visible[item.app].visible){item.state='closed';if(settings.windows.active===item.app)settings.windows.active=null;}
    if(!settings.windows.initialized){settings.windows=M.action(settings.windows,{type:'reset',apps:[settings.left,...(settings.layout==='single'?[]:[settings.right])]},bounds());}
    settings.windows=M.action(settings.windows,{type:'fit'},bounds());paint();EarthRenderer.schedule();
  }
  function configure(d){
    design=d;const next=W.fromDesign(d),key=JSON.stringify(next);if(key!==configKey&&!drag){settings=next;configKey=key;}
    if(!enabled())canvas?.remove();
  }
  render=function(){canvas?.remove();baseRender();decorate();};
  // Browser/OS placement is advisory; a single pop-out is never screen-sized.
  windowRects=function(count,layout){if(count!==1)return baseRects(count,layout);const screen=window.screen,w=Math.max(1,screen.availWidth||1280),h=Math.max(1,screen.availHeight||800),r=M.initial('blos',{width:w,height:h});return [{left:(screen.availLeft||0)+Math.floor((w-r.width)/2),top:(screen.availTop||0)+Math.floor((h-r.height)/2),width:r.width,height:r.height}];};
  document.addEventListener('click',e=>{
    if(!active()||window.ScopeComponentPicker)return;
    const b=e.target.closest('[data-managed-action]');
    if(b){e.preventDefault();e.stopImmediatePropagation();const type=b.dataset.managedAction,app=b.dataset.managedApp;if(type==='move'||type==='resize')return;if(type==='popout'){window.ScopeOperator.detach(apps.indexOf(app),'managed-'+app);return;}update(type==='reset'?{type,apps:[settings.left]}:{type,app},{focus:['open','restore','close','minimize'].includes(type)});return;}
    const launch=e.target.closest('[data-window-open],#open-window-selection');if(launch){e.preventDefault();e.stopImmediatePropagation();const indices=launch.dataset.windowOpen!==undefined?[Number(launch.dataset.windowOpen)]:windowSelection.apps;document.getElementById('window-manager')?.close();state.portal.route='room';render();for(const i of indices)if(apps[i])open(apps[i]);return;}
    const nav=e.target.closest('[data-deck-app],[data-switch-app],[data-enter-room],[data-membership]');if(nav){const i=Number(nav.dataset.deckApp??nav.dataset.switchApp??nav.dataset.enterRoom??nav.dataset.membership);if(!apps[i])return;e.preventDefault();e.stopImmediatePropagation();state.aperture.active=i;state.deck.active=i;state.portal.active=i;state.portal.route='room';state.mosaic.focus=i;if(nav.dataset.switchApp!==undefined)document.getElementById('switcher')?.close();render();open(apps[i]);}
  },true);
  document.addEventListener('pointerdown',e=>{
    if(!active()||window.ScopeComponentPicker||e.button!==undefined&&e.button!==0)return;const node=e.target.closest('.managed-window');if(!node)return;const app=node.dataset.managedApp;
    if(settings.windows.active!==app)update({type:'focus',app});
    const handle=e.target.closest('[data-managed-action="move"],[data-managed-action="resize"]');if(!handle)return;
    const item=settings.windows.items.find(w=>w.app===app);if(item.state!=='normal')return;e.preventDefault();handle.setPointerCapture?.(e.pointerId);
    drag={before:W.clone(settings.windows),rect:W.clone(item.rect),app,type:handle.dataset.managedAction==='move'?'move':'resize',x:e.clientX,y:e.clientY};
    const move=event=>{if(!drag)return;const r=drag.rect,dx=event.clientX-drag.x,dy=event.clientY-drag.y;settings.windows=M.action(drag.before,{type:drag.type,app,rect:drag.type==='move'?{...r,x:r.x+dx,y:r.y+dy}:{...r,width:r.width+dx,height:r.height+dy}},bounds());paint();};
    const end=event=>{if(!drag)return;const before=drag.before;drag=null;if(event?.type==='pointercancel')settings.windows=before;for(const [type,fn] of [['pointermove',move],['pointerup',end],['pointercancel',end],['lostpointercapture',end]])handle.removeEventListener(type,fn);paint();commit();EarthRenderer.schedule();};
    drag.cancel=()=>end({type:'pointercancel'});
    handle.addEventListener('pointermove',move);for(const type of ['pointerup','pointercancel','lostpointercapture'])handle.addEventListener(type,end);
  },true);
  document.addEventListener('keydown',e=>{
    if(!active()||window.ScopeComponentPicker)return;if(e.key==='Escape'&&drag){drag.cancel();e.preventDefault();e.stopImmediatePropagation();return;}const b=e.target.closest('[data-managed-action="move"],[data-managed-action="resize"]');
    if(b&&['ArrowLeft','ArrowRight','ArrowUp','ArrowDown'].includes(e.key)){e.preventDefault();e.stopImmediatePropagation();const app=b.dataset.managedApp,item=settings.windows.items.find(w=>w.app===app),resize=e.shiftKey||b.dataset.managedAction==='resize',rect={...item.rect},dx=e.key==='ArrowLeft'?-10:e.key==='ArrowRight'?10:0,dy=e.key==='ArrowUp'?-10:e.key==='ArrowDown'?10:0;if(resize){rect.width+=dx;rect.height+=dy;}else{rect.x+=dx;rect.y+=dy;}update({type:resize?'resize':'move',app,rect});}
    if(e.key==='Escape'&&!document.querySelector('dialog[open]')){const details=document.querySelector('.operator-bar details[open]');if(details){details.open=false;details.querySelector('summary')?.focus();e.preventDefault();e.stopImmediatePropagation();}}
  },true);
  document.addEventListener('focusin',e=>{if(!active()||window.ScopeComponentPicker)return;const node=e.target.closest('.managed-window');if(node&&settings.windows.active!==node.dataset.managedApp)update({type:'focus',app:node.dataset.managedApp});},true);
  window.addEventListener('resize',()=>{if(active()&&!drag&&stage)update({type:'fit'},{save:false});});
  // Native modal focus trapping and Escape are retained; restore the launch focus.
  for(const id of ['switcher','window-manager','confirmation']){
    const dialog=document.getElementById(id);if(!dialog)continue;const show=dialog.showModal?.bind(dialog);let launch=null;
    if(show)dialog.showModal=function(){launch=document.activeElement;return show();};
    dialog.addEventListener('close',()=>{if(launch?.isConnected)launch.focus();});
  }
  const css=document.createElement('style');css.id='scope-managed-window-styles';css.textContent=`
  .managed-workspace{width:100%;min-width:0;position:relative}.managed-launch,.managed-tasks{display:flex;flex-wrap:wrap;gap:6px;padding:8px;background:var(--scope-nav,var(--surface));color:var(--scope-text);border:1px solid var(--scope-border)}.managed-launch button,.managed-tasks button{font-size:12px;padding:6px 9px;min-height:36px}.managed-stage{position:relative;isolation:isolate;overflow:hidden;width:100%;height:clamp(280px,calc(100dvh - 260px),820px);background:var(--scope-workspace,#101c2c);border:1px solid var(--scope-border)}.managed-window{position:absolute!important;display:flex!important;flex-direction:column;min-width:0!important;min-height:0!important;margin:0!important;overflow:hidden;border:1px solid var(--scope-border)!important;border-radius:var(--scope-window-radius,8px);background:var(--scope-panel);box-shadow:0 8px 24px #0006}.managed-window[hidden],.managed-window button[hidden]{display:none!important}.managed-window.managed-active{outline:2px solid var(--scope-focus);outline-offset:-2px}.managed-header{flex:0 0 auto;display:flex;flex-wrap:wrap;gap:4px;padding:6px!important;background:var(--scope-header)!important;color:var(--scope-text)!important;cursor:default}.managed-title{flex:1;min-width:100px;text-align:left;cursor:move;touch-action:none}.managed-controls{display:flex;flex-wrap:wrap;gap:3px}.managed-controls button{font-size:10px;padding:4px 6px;min-height:30px}.managed-body{flex:1 1 auto;overflow:auto;min-height:0;min-width:0}.managed-body>.owner-surface{min-height:100%;margin:0!important;border-radius:0!important}.managed-resize{position:absolute;bottom:0;right:0;min-height:24px!important;min-width:32px!important;padding:2px!important;font-size:9px;cursor:nwse-resize;touch-action:none;z-index:2}[data-managed-target=true].panes{display:block!important}[data-managed-target=true].aperture-stage{display:block!important;padding-bottom:80px}.operator-bar[data-managed-active=true] label,.operator-bar[data-managed-active=true] [data-operator=swap],.operator-bar[data-managed-active=true] [data-operator=reset-ratio],.operator-bar[data-managed-active=true] [data-operator=popout]{display:none!important}
  body[data-scope-design] :is(#switcher,#window-manager,#confirmation){position:fixed;inset:0;margin:auto;width:min(680px,calc(100vw - 32px));height:fit-content;max-width:calc(100vw - 32px);max-height:85vh;overflow:auto;padding:24px;box-sizing:border-box}body[data-scope-design] :is(#switcher,#window-manager,#confirmation)::backdrop{background:#02061180;backdrop-filter:blur(2px)}.operator-config{max-height:85vh;overflow:auto;max-width:min(390px,calc(100vw - 32px));box-sizing:border-box}@media print{.managed-controls,.managed-resize,.managed-launch,.managed-tasks{display:none!important}}`;
  document.head.append(css);
  window.ScopeManagedWindows={isInteracting:()=>Boolean(drag),configure,decorate,enabled,active,open,update,snapshot:()=>W.clone(settings?.windows||W.defaults.windows),node:app=>nodes.get(app),bounds};
})();

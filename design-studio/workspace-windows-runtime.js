/* Managed operator windows. Only shell nodes and geometry are owned here. */
(function(){
  'use strict';
  const W=window.ScopeWorkspace,M=W.windows,apps=W.apps,nodes=new Map();
  let design=null,settings=null,canvas=null,stage=null,tasks=null,drag=null,configKey='',placing=false,lastSize='',observer=null,sizeQueued=false,metrics=null;
  const minimums=new Map(),observed=new Set(),pendingOpen=new Set();
  const baseRender=render,baseRects=windowRects;
  function enabled(){return Boolean(design&&settings?.windowed&&!detachedContext);}
  function active(){return enabled()&&state.view==='workspace';}
  function bounds(){const r=stage?.getBoundingClientRect(),width=Math.floor(stage?.clientWidth??r?.width??0),height=Math.floor(stage?.clientHeight??r?.height??0);return width>0&&height>0?{width,height}:null;}
  const pixels=value=>Number.parseFloat(value)||0;
  function releaseSizing(){for(const [el,previous] of minimums){if(previous.value)el.style.setProperty('min-height',previous.value,previous.priority);else el.style.removeProperty('min-height');}minimums.clear();observer?.disconnect();observed.clear();metrics=null;lastSize='';}
  function sizeAncestors(){
    for(let el=canvas?.parentElement;el&&el!==document.body;el=el.parentElement){
      if(!['shell','deck-layout','aperture-stage','panes'].some(c=>el.classList?.contains(c)))continue;
      if(!minimums.has(el))minimums.set(el,{value:el.style.getPropertyValue?.('min-height')||'',priority:el.style.getPropertyPriority?.('min-height')||''});
      el.style.setProperty('min-height',el.classList.contains('shell')?(design.regions.shell?.height||0)+'px':'0px','important');
    }
  }
  function measureStage(){
    if(!active()||!canvas?.isConnected||!stage)return null;
    const rect=stage.getBoundingClientRect();if(rect.width<=0||stage.getClientRects?.().length===0)return null;
    // Older fixture/host environments without CSS measurement can supply an
    // explicit stage rectangle; browsers always take the DOM budget path below.
    if(typeof window.getComputedStyle!=='function')return bounds();
    const style=el=>window.getComputedStyle(el),viewport=window.visualViewport;
    const host=canvas.parentElement,dock=[...host.children].find(el=>el.classList?.contains('aperture-dock'));
    const dockStyle=dock&&style(dock),extra=dock&&dockStyle.display!=='none'?Math.max(0,Math.ceil(dock.getBoundingClientRect().height+pixels(dockStyle.bottom)+8-pixels(style(host).paddingBottom))):0;
    // The positioned Aperture dock normally fits in existing host padding. If
    // it wraps taller, reserve only the additional physical space below tasks.
    if(canvas.style.paddingBottom!==extra+'px')canvas.style.setProperty('padding-bottom',extra+'px');
    const viewportBottom=(viewport?.offsetTop||0)+(viewport?.height||window.innerHeight||document.documentElement?.clientHeight||0);
    if(viewportBottom<=0)return null;
    const limits=[],watch=new Set([stage]);let reserve=0;
    for(let child=stage,parent=child.parentElement;parent;child=parent,parent=parent.parentElement){
      const box=parent.getBoundingClientRect(),s=style(parent),cr=child.getBoundingClientRect();watch.add(parent);
      if(s.display==='none'||s.visibility==='hidden')return null;
      let after=0;
      for(const sibling of parent.children){
        if(sibling===child)continue;const ss=style(sibling);watch.add(sibling);
        if(ss.display==='none'||ss.position==='absolute'||ss.position==='fixed')continue;
        const r=sibling.getBoundingClientRect();
        if(r.width>0&&r.height>0&&r.left<cr.right-1&&r.right>cr.left+1&&r.top>=cr.bottom-1)after=Math.max(after,r.bottom-cr.bottom+pixels(ss.marginBottom));
      }
      reserve+=after+pixels(s.paddingBottom)+pixels(s.borderBottomWidth);
      // A declared fixed height/maximum or an actual scrollport is a real host
      // boundary. Natural content height must not become a self-imposed ceiling.
      const inline=parent.style.height,typed=parent.computedStyleMap?.().get('height');
      const fixed=inline&&!['auto','fit-content','min-content','max-content'].includes(inline)||typed&&typed.toString()!=='auto';
      if(fixed||parent.scrollHeight>parent.clientHeight+1&&['auto','scroll','hidden','clip'].includes(s.overflowY))limits.push(box.bottom-rect.top-reserve);
      const maximum=Number.parseFloat(s.maxHeight);
      if(Number.isFinite(maximum))limits.push(box.top+maximum+(s.boxSizing==='border-box'?0:pixels(s.paddingTop)+pixels(s.paddingBottom)+pixels(s.borderTopWidth)+pixels(s.borderBottomWidth))-rect.top-reserve);
      if(parent===document.body)break;
    }
    const documentTop=rect.top+(window.scrollY||0);
    const room=viewportBottom-documentTop-reserve,ceiling=Math.min(...limits);
    if(ceiling<1)return null; // A collapsed bounded host has no usable geometry.
    // Preserve usable controls when shell chrome alone exhausts a short viewport;
    // a genuinely smaller bounded host still wins over this soft minimum.
    const height=Math.floor(Math.min(ceiling,Math.max(180,room)));
    const value=height+'px';if(stage.style.height!==value)stage.style.setProperty('height',value);
    if(observer){let changed=watch.size!==observed.size||[...watch].some(el=>!observed.has(el));if(changed){observer.disconnect();observed.clear();for(const el of watch)if(el.nodeType===1){observer.observe(el);observed.add(el);}}}
    const measured=bounds();metrics={viewportBottom,stageTop:rect.top,stageDocumentTop:documentTop,trailingShellSpace:reserve,stageOuterHeight:height,minimumOverflow:Math.max(0,height-room),bounds:measured};return measured;
  }
  function fitStage(){
    if(!settings.windows.initialized||pendingOpen.size){decorate();return bounds();}
    const b=measureStage();if(!b)return null;
    const key=JSON.stringify(b);if(key!==lastSize){lastSize=key;settings.windows=M.action(settings.windows,{type:'fit'},b);paint();EarthRenderer.schedule();}return b;
  }
  function scheduleSize(){if(sizeQueued)return;sizeQueued=true;requestAnimationFrame(()=>{sizeQueued=false;if(active()&&!drag&&!placing)fitStage();});}
  function names(id){return window.ScopeOperator.parameters().applications[id].name;}
  function commit(){if(design&&!drag)window.ScopeOperator.setWindows(settings.windows,settings.windowed);}
  function update(action,{save=true,focus=false}={}){
    if(!stage)return;const b=measureStage();if(!b){if(action.type==='open')pendingOpen.add(action.app);return;}settings.windows=M.action(M.action(settings.windows,{type:'fit'},b),action,b);paint();if(save)commit();if(focus){const node=nodes.get(settings.windows.active);(node?.querySelector('.managed-title')||tasks?.querySelector('button')||canvas?.querySelector('.managed-launch button'))?.focus();}EarthRenderer.schedule();
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
    controls.append(button('Pop Out','popout',app));header.append(controls);
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
      if(typeof ResizeObserver!=='undefined')observer=new ResizeObserver(scheduleSize);
    }
    // Keep engine navigation chrome; replace only the shell's application hosts.
    if(canvas.parentElement!==target){
      for(const host of target.querySelectorAll('[data-demo-host]')){const index=Number(host.dataset.app),id=apps[index],key='managed-'+id+':'+index;if(!demoViews.has(key)&&demoViews.has(host.dataset.slot+':'+index))demoViews.set(key,demoViews.get(host.dataset.slot+':'+index));}
      target.querySelectorAll('.owner-surface,.pane,.integration-pane,.operator-divider').forEach(el=>{if(!canvas.contains(el))el.remove();});
      target.dataset.managedTarget='true';target.prepend(canvas);
      if(target.classList.contains('integrated-panes')){target.style.setProperty('display','block','important');target.style.setProperty('height','auto','important');}
    }
    if(observer&&!observed.has(stage)){observer.observe(stage);observed.add(stage);}
    sizeAncestors();const measured=measureStage();if(!measured)return;
    const visible=window.ScopeOperator.parameters().applications;
    for(const item of settings.windows.items)if(!visible[item.app].visible){item.state='closed';if(settings.windows.active===item.app)settings.windows.active=null;}
    if(!settings.windows.initialized){settings.windows=M.action(settings.windows,{type:'reset',apps:[settings.left,...(settings.layout==='single'?[]:[settings.right])]},measured);}
    for(const app of pendingOpen)if(visible[app]?.visible)settings.windows=M.action(settings.windows,{type:'open',app},measured);pendingOpen.clear();
    lastSize=JSON.stringify(measured);settings.windows=M.action(settings.windows,{type:'fit'},measured);paint();EarthRenderer.schedule();
  }
  function configure(d){
    design=d;const next=W.fromDesign(d),key=JSON.stringify(next);if(key!==configKey&&!drag){settings=next;configKey=key;}
    if(!enabled()){canvas?.remove();releaseSizing();pendingOpen.clear();}
  }
  render=function(){releaseSizing();canvas?.remove();baseRender();decorate();};
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
    const move=event=>{if(!drag)return;const b=bounds();if(!b)return;const r=drag.rect,dx=event.clientX-drag.x,dy=event.clientY-drag.y;settings.windows=M.action(drag.before,{type:drag.type,app,rect:drag.type==='move'?{...r,x:r.x+dx,y:r.y+dy}:{...r,width:r.width+dx,height:r.height+dy}},b);paint();};
    const end=event=>{if(!drag)return;const before=drag.before;drag=null;if(event?.type==='pointercancel')settings.windows=before;for(const [type,fn] of [['pointermove',move],['pointerup',end],['pointercancel',end],['lostpointercapture',end]])handle.removeEventListener(type,fn);fitStage();paint();commit();EarthRenderer.schedule();};
    drag.cancel=()=>end({type:'pointercancel'});
    handle.addEventListener('pointermove',move);for(const type of ['pointerup','pointercancel','lostpointercapture'])handle.addEventListener(type,end);
  },true);
  document.addEventListener('keydown',e=>{
    if(!active()||window.ScopeComponentPicker)return;if(e.key==='Escape'&&drag){drag.cancel();e.preventDefault();e.stopImmediatePropagation();return;}const b=e.target.closest('[data-managed-action="move"],[data-managed-action="resize"]');
    if(b&&['ArrowLeft','ArrowRight','ArrowUp','ArrowDown'].includes(e.key)){e.preventDefault();e.stopImmediatePropagation();const app=b.dataset.managedApp,item=settings.windows.items.find(w=>w.app===app),resize=e.shiftKey||b.dataset.managedAction==='resize',rect={...item.rect},dx=e.key==='ArrowLeft'?-10:e.key==='ArrowRight'?10:0,dy=e.key==='ArrowUp'?-10:e.key==='ArrowDown'?10:0;if(resize){rect.width+=dx;rect.height+=dy;}else{rect.x+=dx;rect.y+=dy;}update({type:resize?'resize':'move',app,rect});}
    if(e.key==='Escape'&&!document.querySelector('dialog[open]')){const details=document.querySelector('.operator-bar details[open]');if(details){details.open=false;details.querySelector('summary')?.focus();e.preventDefault();e.stopImmediatePropagation();}}
  },true);
  document.addEventListener('focusin',e=>{if(!active()||window.ScopeComponentPicker)return;const node=e.target.closest('.managed-window');if(node&&settings.windows.active!==node.dataset.managedApp)update({type:'focus',app:node.dataset.managedApp});},true);
  window.addEventListener('resize',scheduleSize);window.visualViewport?.addEventListener('resize',scheduleSize);
  // Native modal focus trapping and Escape are retained; restore the launch focus.
  for(const id of ['switcher','window-manager','confirmation']){
    const dialog=document.getElementById(id);if(!dialog)continue;const show=dialog.showModal?.bind(dialog);let launch=null;
    if(show)dialog.showModal=function(){launch=document.activeElement;return show();};
    dialog.addEventListener('close',()=>{if(launch?.isConnected)launch.focus();});
  }
  const css=document.createElement('style');css.id='scope-managed-window-styles';css.textContent=`
  .managed-workspace{width:100%;min-width:0;position:relative}.managed-launch,.managed-tasks{display:flex;flex-wrap:wrap;gap:6px;padding:8px;background:var(--scope-nav,var(--surface));color:var(--scope-text);border:1px solid var(--scope-border)}.managed-launch button,.managed-tasks button{font-size:12px;padding:6px 9px;min-height:36px}.managed-stage{position:relative;isolation:isolate;overflow:hidden;width:100%;height:300px;min-height:0;box-sizing:border-box;background:var(--scope-workspace,#101c2c);border:1px solid var(--scope-border)}.managed-window{position:absolute!important;display:flex!important;flex-direction:column;min-width:0!important;min-height:0!important;margin:0!important;overflow:hidden;border:1px solid var(--scope-border)!important;border-radius:var(--scope-window-radius,8px);background:var(--scope-panel);box-shadow:0 8px 24px #0006}.managed-window[hidden],.managed-window button[hidden]{display:none!important}.managed-window.managed-active{outline:2px solid var(--scope-focus);outline-offset:-2px}.managed-header{flex:0 0 auto;display:flex;flex-wrap:wrap;gap:4px;padding:6px!important;background:var(--scope-header)!important;color:var(--scope-text)!important;cursor:default}.managed-title{flex:1;min-width:100px;text-align:left;cursor:move;touch-action:none}.managed-controls{display:flex;flex-wrap:wrap;gap:3px}.managed-controls button{font-size:10px;padding:4px 6px;min-height:30px}.managed-body{flex:1 1 auto;overflow:auto;min-height:0;min-width:0}.managed-body>.owner-surface{min-height:100%;margin:0!important;border-radius:0!important}.managed-resize{position:absolute;bottom:0;right:0;min-height:24px!important;min-width:32px!important;padding:2px!important;font-size:9px;cursor:nwse-resize;touch-action:none;z-index:2}[data-managed-target=true].panes{display:block!important}[data-managed-target=true].aperture-stage{display:block!important;padding-bottom:80px}.operator-bar[data-managed-active=true] label,.operator-bar[data-managed-active=true] [data-operator=swap],.operator-bar[data-managed-active=true] [data-operator=reset-ratio],.operator-bar[data-managed-active=true] [data-operator=popout]{display:none!important}
  body[data-scope-design] :is(#switcher,#window-manager,#confirmation){position:fixed;inset:0;margin:auto;width:min(680px,calc(100vw - 32px));height:fit-content;max-width:calc(100vw - 32px);max-height:85vh;overflow:auto;padding:24px;box-sizing:border-box}body[data-scope-design] :is(#switcher,#window-manager,#confirmation)::backdrop{background:#02061180;backdrop-filter:blur(2px)}.operator-config{max-height:85vh;overflow:auto;max-width:min(390px,calc(100vw - 32px));box-sizing:border-box}@media print{.managed-controls,.managed-resize,.managed-launch,.managed-tasks{display:none!important}}`;
  document.head.append(css);
  window.ScopeManagedWindows={isInteracting:()=>Boolean(drag),configure,decorate,enabled,active,open,update,snapshot:()=>W.clone(settings?.windows||W.defaults.windows),node:app=>nodes.get(app),bounds,measure:()=>metrics&&W.clone(metrics)};
})();

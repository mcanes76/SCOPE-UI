/* Separate engineering demo. It is not imported by or added to the Studio. */
(function(){
  'use strict';
  const A=ScopeReferenceApplication,M=ScopeWorkspace.windows,$=id=>document.getElementById(id),id=A.manifest.id;
  const log=text=>{const li=document.createElement('li');li.textContent=text;$('log').prepend(li);while($('log').children.length>50)$('log').lastElementChild.remove();};
  const host=new ScopeAdapterHost({schemas:A.schemas,onDiagnostic:e=>log(e.appId+' / '+e.operation+' / '+e.code)});
  host.register(A.manifest,A.create,{grants:['state','commands','context']});const unsubscribe=host.subscribe('reference.status.changed',e=>log('Approved event: '+e.topic+' count='+e.payload.count));
  let state=ScopeWorkspace.clone(ScopeWorkspace.defaults.windows),saved,drag=null,selection=false;
  const bounds=()=>({width:Math.max(1,$('workspace').clientWidth),height:Math.max(1,$('workspace').clientHeight)});
  // The blos key selects an existing Phase 3 geometry profile only. No BLOS UI is loaded.
  function geometry(action){state=M.action(state,{...action,app:'blos'},bounds());const w=state.items[0],node=$('window');node.hidden=!w||['closed','minimized'].includes(w.state);$('reopen').hidden=w?.state!=='minimized';if(w){Object.assign(node.style,{left:w.rect.x+'px',top:w.rect.y+'px',width:w.rect.width+'px',height:w.rect.height+'px'});$('maximize').hidden=w.state==='maximized';$('restore').hidden=w.state!=='maximized';}}
  function mounted(){return ['active','inactive'].includes(host.status(id).state);}
  async function resized(){if(mounted())await host.resize(id,{width:$('mount').clientWidth,height:$('mount').clientHeight});}
  async function perform(fn){try{await fn();$('status').textContent='Lifecycle: '+host.status(id).state+'; '+(host.status(id).health?.message||'no health report');}catch(error){$('status').textContent=error.message;log('Request failed; inspect the bounded diagnostic above.');}}
  $('launch').addEventListener('click',()=>perform(async()=>{geometry({type:'open'});await host.launch(id,$('mount'),{state:saved,size:{width:$('mount').clientWidth,height:$('mount').clientHeight}});await host.activate(id);log('Launched one singleton reference instance.');}));
  $('save').addEventListener('click',()=>perform(async()=>{saved=await host.save(id);log('Optional versioned view snapshot saved in memory.');}));
  $('context').addEventListener('click',()=>perform(()=>{selection=!selection;return host.context(id,'shell.selection',{id:selection?'sample-a':'sample-b'});}));
  $('command').addEventListener('click',()=>perform(()=>host.command(id,'reference.status.increment',{amount:1})));
  $('fail').addEventListener('click',()=>perform(()=>host.command(id,'reference.status.fail',{})));
  $('minimize').addEventListener('click',()=>perform(async()=>{await host.deactivate(id);geometry({type:'minimize'});log('Deactivated without disposing application state.');}));
  $('reopen').addEventListener('click',()=>perform(async()=>{geometry({type:'open'});await host.activate(id);await resized();$('move').focus();}));
  $('maximize').addEventListener('click',()=>perform(async()=>{geometry({type:'maximize'});await resized();}));$('restore').addEventListener('click',()=>perform(async()=>{geometry({type:'restore'});await resized();}));
  $('close').addEventListener('click',()=>perform(async()=>{await host.close(id);geometry({type:'close'});$('launch').focus();log('Disposed reference application and its listeners.');}));
  for(const [name,type] of [['move','move'],['resize','resize']]){
    const handle=$(name);handle.addEventListener('pointerdown',e=>{if(!mounted()||state.items[0]?.state!=='normal')return;e.preventDefault();drag={before:ScopeWorkspace.clone(state),x:e.clientX,y:e.clientY,rect:{...state.items[0].rect},type};handle.setPointerCapture(e.pointerId);});
    handle.addEventListener('pointermove',e=>{if(!drag)return;const r=drag.rect,dx=e.clientX-drag.x,dy=e.clientY-drag.y;geometry({type:drag.type,rect:drag.type==='move'?{...r,x:r.x+dx,y:r.y+dy}:{...r,width:r.width+dx,height:r.height+dy}});});
    const end=e=>{if(!drag)return;if(e.type==='pointercancel')state=drag.before;drag=null;geometry({type:'fit'});perform(resized);};for(const event of ['pointerup','pointercancel','lostpointercapture'])handle.addEventListener(event,end);
    handle.addEventListener('keydown',e=>{if(!['ArrowLeft','ArrowRight','ArrowUp','ArrowDown'].includes(e.key)||!mounted())return;e.preventDefault();const rect={...state.items[0].rect},x=e.key==='ArrowLeft'?-10:e.key==='ArrowRight'?10:0,y=e.key==='ArrowUp'?-10:e.key==='ArrowDown'?10:0;if(type==='move'){rect.x+=x;rect.y+=y;}else{rect.width+=x;rect.height+=y;}geometry({type,rect});perform(resized);});
  }
  window.addEventListener('resize',()=>{if(state.initialized){geometry({type:'fit'});perform(resized);}});
  window.addEventListener('beforeunload',()=>{unsubscribe();void host.dispose();});
})();

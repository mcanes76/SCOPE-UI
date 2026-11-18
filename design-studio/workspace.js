/* Version 1 workspace contract. Configuration is portable; window handles are not. */
(function(root){
  'use strict';
  const apps=['blos','display','calibration','los'],layouts=['single','split','stacked'];
  const defaults={schemaVersion:1,layout:'single',left:'blos',right:'display',ratio:50,focused:'left',expanded:null,previousLayout:'split',minPaneWidth:240,minPaneHeight:180,allowedLayouts:['single','split','stacked'],popout:true,preserveViews:true,windowed:true,windows:{initialized:false,active:null,items:[]}};
  const clone=x=>JSON.parse(JSON.stringify(x));
  function validate(input={},base={}){
    if(!input||typeof input!=='object'||Array.isArray(input))throw Error('Workspace must be an object');
    const out={...clone(defaults),...clone(base)};
    for(const [key,value] of Object.entries(input)){
      if(!Object.hasOwn(defaults,key))throw Error('Unknown workspace setting: '+key);
      if(key==='schemaVersion'&&value!==1)throw Error('Unsupported workspace schema version');
      if(['layout','previousLayout'].includes(key)&&!layouts.includes(value))throw Error('Invalid workspace layout');
      if(['left','right'].includes(key)&&!apps.includes(value))throw Error('Invalid workspace application');
      if(key==='focused'&&!['left','right'].includes(value)||key==='expanded'&&value!==null&&!['left','right'].includes(value))throw Error('Invalid workspace pane');
      if(['popout','preserveViews','windowed'].includes(key)&&typeof value!=='boolean')throw Error('Workspace permission must be boolean');
      if(['ratio','minPaneWidth','minPaneHeight'].includes(key)){
        const range=key==='ratio'?[10,90]:key==='minPaneWidth'?[160,640]:[120,480];
        if(typeof value!=='number'||!Number.isFinite(value)||value<range[0]||value>range[1])throw Error('Invalid workspace '+key);
      }
      if(key==='allowedLayouts'&&(!Array.isArray(value)||!value.length||value.some(v=>!layouts.includes(v))||new Set(value).size!==value.length))throw Error('Invalid allowed workspace layouts');
      out[key]=key==='windows'?validateWindows(value):clone(value);
    }
    if(!out.allowedLayouts.includes(out.layout))throw Error('Workspace layout is not enabled');
    if(out.layout==='single')out.expanded=null;
    return out;
  }
  function fromDesign(d){
    const o=d.operator||{},allowed=o.allowed||['single','split','stacked','popout'];
    return validate(d.workspace||{},{...defaults,layout:d.layout?.mode||'single',left:o.left||'blos',right:o.right||'display',ratio:o.ratio??50,allowedLayouts:allowed.filter(x=>layouts.includes(x)),popout:allowed.includes('popout')});
  }
  function operator(w){return {left:w.left,right:w.right,ratio:w.ratio,allowed:[...w.allowedLayouts,...(w.popout?['popout']:[])]};}
  function limits(w,pixels,stacked=false){const minimum=stacked?w.minPaneHeight:w.minPaneWidth,low=Math.min(50,Math.max(10,Math.ceil(minimum/Math.max(1,pixels)*100)));return [low,100-low];}
  function resize(w,ratio,pixels,stacked=false){const [lo,hi]=limits(w,pixels,stacked);return Math.max(lo,Math.min(hi,Math.round(ratio)));}
  // Only bounded JSON view maps cross windows. Reject code, HTML, non-finite and prototype keys.
  function view(value){
    let count=0;
    function clean(v,depth){if(++count>4000||depth>12)throw Error('View state is too large');if(v===null||typeof v==='boolean')return v;if(typeof v==='number'){if(!Number.isFinite(v))throw Error('Invalid view number');return v;}if(typeof v==='string'){if(v.length>6000)throw Error('View text too long');return v;}if(Array.isArray(v)){if(v.length>300)throw Error('View list too long');return v.map(x=>clean(x,depth+1));}if(v&&typeof v==='object'){const result={};for(const [k,x] of Object.entries(v)){if(!/^[a-zA-Z0-9_-]{1,80}$/.test(k)||['__proto__','constructor','prototype'].includes(k))throw Error('Invalid view key');result[k]=clean(x,depth+1);}return result;}throw Error('Invalid view value');}
    if(!value||typeof value!=='object'||Array.isArray(value))throw Error('View state must be an object');const result=clean(value,0);if(JSON.stringify(result).length>50000)throw Error('View state is too large');return result;
  }
  // Portable window geometry is separate from application view/model state.
  const windowSizes={blos:[760,560],display:[820,560],calibration:[780,620],los:[640,480]};
  function rectangle(input){
    if(!input||typeof input!=='object'||Array.isArray(input)||Object.keys(input).some(k=>!['x','y','width','height'].includes(k)))throw Error('Invalid window rectangle');
    const out={};for(const k of ['x','y','width','height']){const v=input[k];if(typeof v!=='number'||!Number.isFinite(v)||Math.abs(v)>100000||['width','height'].includes(k)&&v<1)throw Error('Invalid window dimension');out[k]=Math.round(v);}return out;
  }
  function validateWindows(input={initialized:false,active:null,items:[]}){
    if(!input||typeof input!=='object'||Array.isArray(input)||Object.keys(input).some(k=>!['initialized','active','items'].includes(k))||typeof input.initialized!=='boolean'||!Array.isArray(input.items)||input.items.length>4)throw Error('Invalid managed workspace');
    const seen=new Set(),items=input.items.map(item=>{
      if(!item||Object.keys(item).some(k=>!['app','rect','restore','state','beforeMinimize','dock','tile'].includes(k))||!apps.includes(item.app)||seen.has(item.app)||!['normal','maximized','minimized','closed'].includes(item.state)||!['normal','maximized'].includes(item.beforeMinimize)||!['none','left','right'].includes(item.dock))throw Error('Invalid managed window');
      if(item.tile){const t=item.tile;if(typeof t!=='object'||Array.isArray(t)||Object.keys(t).length!==4||['column','row','columns','rows'].some(k=>!Number.isInteger(t[k]))||t.columns<1||t.columns>4||t.rows<1||t.rows>4||t.column<0||t.column>=t.columns||t.row<0||t.row>=t.rows)throw Error('Invalid tiled placement');}
      else if(Object.hasOwn(item,'tile'))throw Error('Invalid tiled placement');
      seen.add(item.app);return {app:item.app,rect:rectangle(item.rect),restore:rectangle(item.restore),state:item.state,beforeMinimize:item.beforeMinimize,dock:item.dock,...(item.tile?{tile:clone(item.tile)}:{})};
    });
    if(input.active!==null&&!items.some(w=>w.app===input.active&&!['closed','minimized'].includes(w.state)))throw Error('Invalid active window');
    return {initialized:input.initialized,active:input.active,items};
  }
  function workspaceBounds(bounds){const width=Number(bounds?.width),height=Number(bounds?.height);if(!Number.isFinite(width)||!Number.isFinite(height)||width<1||height<1)throw Error('Workspace bounds must be positive');return {width:Math.floor(width),height:Math.floor(height)};}
  function fitWindow(rect,bounds){
    const b=workspaceBounds(bounds),r=rectangle(rect),width=Math.max(Math.min(420,b.width),Math.min(b.width,r.width)),height=Math.max(Math.min(300,b.height),Math.min(b.height,r.height));
    return {x:Math.max(0,Math.min(b.width-width,r.x)),y:Math.max(0,Math.min(b.height-height,r.y)),width,height};
  }
  function initialWindow(app,bounds,offset=0,fill=false){
    if(!apps.includes(app))throw Error('Invalid managed application');const b=workspaceBounds(bounds),size=windowSizes[app];
    const available=fill?[Math.max(1,b.width-32),Math.max(1,b.height-32)]:[Math.max(1,Math.floor(b.width*.82)),Math.max(1,Math.floor(b.height*.8))],dimensions=size.map((preferred,i)=>Math.min(available[i],fill?Math.round(preferred+Math.max(0,available[i]-preferred)*.75):preferred));
    return fitWindow({x:fill?Math.floor((b.width-dimensions[0])/2):20+offset*28,y:fill?Math.floor((b.height-dimensions[1])/2):20+offset*24,width:dimensions[0],height:dimensions[1]},b);
  }
  function windowAction(input,action,bounds){
    const b=workspaceBounds(bounds);let s=validateWindows(input);const type=action?.type,app=action?.app;
    const full={x:0,y:0,width:b.width,height:b.height},dockRect=side=>b.width<840?full:({x:side==='right'?Math.floor(b.width/2):0,y:0,width:side==='right'?b.width-Math.floor(b.width/2):Math.floor(b.width/2),height:b.height});
    const tileRect=t=>({x:Math.floor(t.column*b.width/t.columns),y:Math.floor(t.row*b.height/t.rows),width:Math.floor((t.column+1)*b.width/t.columns)-Math.floor(t.column*b.width/t.columns),height:Math.floor((t.row+1)*b.height/t.rows)-Math.floor(t.row*b.height/t.rows)});
    const displayed=w=>{
      if(w.state==='maximized'||w.state==='minimized'&&w.beforeMinimize==='maximized')return clone(full);
      if(w.dock!=='none')return dockRect(w.dock);
      if(w.tile){const r=tileRect(w.tile);return r.width<Math.min(420,b.width)||r.height<Math.min(300,b.height)?initialWindow(w.app,b,w.tile.row*w.tile.columns+w.tile.column):r;}
      return fitWindow(w.restore,b);
    };
    function focus(id){const i=s.items.findIndex(w=>w.app===id);if(i<0)return;const [w]=s.items.splice(i,1);s.items.push(w);s.active=id;}
    function visible(){return s.items.filter(w=>!['closed','minimized'].includes(w.state));}
    if(type==='reset'){s={initialized:true,active:null,items:[]};const ids=[...new Set(action.apps||['blos'])];for(const id of ids)s=windowAction(s,{type:'open',app:id,fill:ids.length===1},b);return s;}
    if(type==='fit'){
      for(const w of s.items)w.rect=displayed(w);return s;
    }
    if(type==='cascade'||type==='tile'){
      const ws=visible(),cols=b.width<840?1:2,rows=Math.max(1,Math.ceil(ws.length/cols));
      if(type==='tile'&&b.height/rows<Math.min(300,b.height))return windowAction(s,{type:'cascade'},b);
      ws.forEach((w,i)=>{w.state='normal';w.dock='none';if(type==='tile')w.tile={column:i%cols,row:Math.floor(i/cols),columns:cols,rows};else delete w.tile;w.rect=w.tile?tileRect(w.tile):initialWindow(w.app,b,i);w.restore=clone(w.rect);});return s;
    }
    if(!apps.includes(app))throw Error('Invalid managed application');let w=s.items.find(w=>w.app===app);
    if(type==='open'){
      if(!w){const rect=initialWindow(app,b,visible().length,action.fill??visible().length===0),preferred=windowSizes[app],restore={...rect,width:Math.max(rect.width,preferred[0]),height:Math.max(rect.height,preferred[1])};w={app,rect,restore,state:'normal',beforeMinimize:'normal',dock:'none'};s.items.push(w);}
      else if(w.state==='minimized')w.state=w.beforeMinimize;
      else if(w.state==='closed'){w.state='normal';w.dock='none';w.rect=fitWindow(w.restore,b);}
      s.initialized=true;focus(app);return windowAction(s,{type:'fit'},b);
    }
    if(!w)throw Error('Window is not open');
    if(type==='close'||type==='minimize'){if(w.state==='closed')return s;if(type==='minimize'&&w.state!=='minimized')w.beforeMinimize=w.state;w.state=type==='close'?'closed':'minimized';if(s.active===app)s.active=visible().at(-1)?.app||null;return s;}
    if(type==='focus'){if(!['closed','minimized'].includes(w.state))focus(app);return s;}
    if(type==='restore'){
      if(w.state==='minimized')w.state=w.beforeMinimize;
      else {w.state='normal';w.dock='none';}w.rect=displayed(w);focus(app);return s;
    }
    if(type==='maximize'){
      if(w.state!=='maximized'){w.state='maximized';w.rect=clone(full);w.dock='none';}focus(app);return s;
    }
    if(type==='dock-left'||type==='dock-right'){
      w.state='normal';w.dock=type==='dock-left'?'left':'right';w.rect=dockRect(w.dock);focus(app);return s;
    }
    if(type==='move'||type==='resize'){
      if(w.state!=='normal')return s;const requested=fitWindow(rectangle({...action.rect,width:Math.max(1,action.rect?.width),height:Math.max(1,action.rect?.height)}),b);
      const intended=w.tile?clone(w.rect):clone(w.restore);delete w.tile;w.dock='none';w.restore=type==='move'?{...intended,x:requested.x,y:requested.y}:requested;w.rect=fitWindow(w.restore,b);focus(app);return s;
    }
    throw Error('Unknown window action');
  }
  const windows={validate:validateWindows,fit:fitWindow,initial:initialWindow,action:windowAction,bounds:workspaceBounds,sizes:windowSizes};
  root.ScopeWorkspace={windows,defaults,layouts,apps,validate,fromDesign,operator,limits,resize,view,clone};if(typeof module!=='undefined')module.exports=root.ScopeWorkspace;
})(typeof globalThis!=='undefined'?globalThis:this);

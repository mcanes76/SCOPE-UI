/* Version 1 workspace contract. Configuration is portable; window handles are not. */
(function(root){
  'use strict';
  const apps=['blos','display','calibration','los'],layouts=['single','split','stacked'];
  const defaults={schemaVersion:1,layout:'single',left:'blos',right:'display',ratio:50,focused:'left',expanded:null,previousLayout:'split',minPaneWidth:240,minPaneHeight:180,allowedLayouts:['single','split','stacked'],popout:true,preserveViews:true};
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
      if(['popout','preserveViews'].includes(key)&&typeof value!=='boolean')throw Error('Workspace permission must be boolean');
      if(['ratio','minPaneWidth','minPaneHeight'].includes(key)){
        const range=key==='ratio'?[10,90]:key==='minPaneWidth'?[160,640]:[120,480];
        if(typeof value!=='number'||!Number.isFinite(value)||value<range[0]||value>range[1])throw Error('Invalid workspace '+key);
      }
      if(key==='allowedLayouts'&&(!Array.isArray(value)||!value.length||value.some(v=>!layouts.includes(v))||new Set(value).size!==value.length))throw Error('Invalid allowed workspace layouts');
      out[key]=clone(value);
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
  root.ScopeWorkspace={defaults,layouts,apps,validate,fromDesign,operator,limits,resize,view,clone};if(typeof module!=='undefined')module.exports=root.ScopeWorkspace;
})(typeof globalThis!=='undefined'?globalThis:this);

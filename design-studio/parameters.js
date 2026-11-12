/* Versioned operator-parameter schema; legacy presentation params migrate to v2. */
(function(root){
  'use strict';
  const apps=['blos','display','calibration','los'],nav=['aperture','mosaic','portal','deck'];
  const defaults={schemaVersion:2,branding:{name:'SCOPE'},logoPath:'assets/logo.png',applications:{blos:{name:'BLOS',visible:true,tabs:{}},display:{name:'Display',visible:true,tabs:{}},calibration:{name:'Sensor Calibration',visible:true,tabs:{}},los:{name:'Native LOS',visible:true,tabs:{}}},labels:{shells:{aperture:'Aperture',mosaic:'Mosaic',portal:'Portal',deck:'Command Deck'}},initial:{theme:'electric-glass',navigation:'aperture',mode:'single',left:'blos',right:'display'},allowedModes:['single','split','popout'],buttonGeometry:'inherit'};
  const clone=x=>JSON.parse(JSON.stringify(x));
  const obj=x=>x&&typeof x==='object'&&!Array.isArray(x);
  function validate(input,partial=false){
    if(!obj(input))throw Error('Parameters must be an object');
    for(const key of Object.keys(input))if(!Object.hasOwn(defaults,key))throw Error('Unknown parameter field: '+key);
    if(input.schemaVersion!==undefined&&![1,2].includes(input.schemaVersion))throw Error('Unsupported parameter schema version');
    function merge(a,b){const out=clone(a);for(const [k,v] of Object.entries(b)){if(['__proto__','constructor','prototype'].includes(k))throw Error('Invalid parameter key');out[k]=obj(v)&&obj(out[k])?merge(out[k],v):clone(v);}return out;}
    const p=merge(defaults,input);p.schemaVersion=2;
    let safeSVG=false;
    if(typeof p.logoPath==='string'&&/^data:image\/svg\+xml;base64,[A-Za-z0-9+/=]+$/.test(p.logoPath)){try{const svg=atob(p.logoPath.split(',')[1]);safeSVG=svg.length<100000&&!/(?:\bon\w+\s*=|href\s*=|url\s*\(|<!|<\?)/i.test(svg)&&[...svg.matchAll(/<\/?([\w:-]+)/g)].every(m=>['svg','title','circle','path','g','rect','line','ellipse','polyline','polygon'].includes(m[1]));}catch{}}
    const text=(v,label)=>{if(typeof v!=='string'||!v.trim()||v.length>300)throw Error('Invalid '+label);};
    if(!obj(p.branding)||!obj(p.applications)||!obj(p.labels)||!obj(p.labels.shells)||!obj(p.initial))throw Error('Invalid parameter structure');text(p.branding.name,'branding');
    if(typeof p.logoPath!=='string'||p.logoPath.length>3000000||(!safeSVG&&!/^data:image\/(png|jpeg|webp|gif);base64,[A-Za-z0-9+/=]+$/.test(p.logoPath)&&(/^(?:[a-z][a-z0-9+.-]*:|\/|\\)/i.test(p.logoPath)||p.logoPath.includes('\\')||p.logoPath.length>300)))throw Error('Logo must be a relative image path or embedded PNG/JPEG/WebP/GIF');
    for(const id of Object.keys(p.applications))if(!apps.includes(id))throw Error('Unknown application ID');
    for(const id of apps){const a=p.applications[id];if(!obj(a))throw Error('Invalid application');text(a.name,'application name');if(typeof a.visible!=='boolean'||!obj(a.tabs))throw Error('Invalid application options');for(const v of Object.values(a.tabs))text(v,'tab label');}
    if(!apps.some(id=>p.applications[id].visible))throw Error('At least one application must remain visible');
    for(const id of nav)text(p.labels.shells[id],'navigation label');
    if(!nav.includes(p.initial.navigation)||!['single','split'].includes(p.initial.mode)||!apps.includes(p.initial.left)||!apps.includes(p.initial.right))throw Error('Invalid initial arrangement');
    if(!p.applications[p.initial.left].visible||p.initial.mode==='split'&&!p.applications[p.initial.right].visible)throw Error('Initial applications must be visible');
    const known=root.ScopeDesign?.themes||root.ScopeVisuals?.paletteIds||[];
    if(!['electric-glass','prism','nocturne','carbon','spectrum','frosted-white','white-trim','electric-steel','electric-teal','electric-violet','electric-olive','electric-amber','electric-indigo','electric-cyan','electric-green','electric-slate',...known].includes(p.initial.theme))throw Error('Invalid initial palette');
    if(!Array.isArray(p.allowedModes)||!p.allowedModes.length||p.allowedModes.some(m=>!['single','split','popout'].includes(m))||!p.allowedModes.includes(p.initial.mode))throw Error('Allowed modes must include the initial mode');
    if(!['inherit','square','slight','rounded','pill'].includes(p.buttonGeometry))throw Error('Invalid button geometry');
    if(partial){const out=clone(input);delete out.schemaVersion;return out;}return p;
  }
  const api={defaults,validate};root.ScopeParameters=api;if(typeof module!=='undefined')module.exports=api;
})(typeof globalThis!=='undefined'?globalThis:this);

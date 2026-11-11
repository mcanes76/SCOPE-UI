/* Shared, dependency-free schema, history and shell CSS compiler. */
(function(root){
  'use strict';
  const clone=value=>JSON.parse(JSON.stringify(value));
  const navigation=['aperture','mosaic','portal','deck'];
  const themes=[
  'electric-glass',
  'prism',
  'nocturne',
  'carbon',
  'spectrum',
  'frosted-white',
  'white-trim',
  'electric-steel',
  'electric-teal',
  'electric-violet',
  'electric-olive',
  'electric-amber',
  'electric-indigo',
  'electric-cyan',
  'electric-green',
  'electric-slate'
];
  const regions={shell:'.shell',header:'.shell-top',branding:'.shell-brand',navigation:'.aperture-dock,.mosaic-layout>nav,.application-shelf,.portal-location,.directory-grid,.deck-nav',workspace:'.aperture-stage,.mosaic-board,.portal-directory,.portal-room,.deck-main,.integrated-panes',context:'.deck-rail',footer:'.owner-footer,.detached-note'};
  const bounds={borderWidth:[0,3],radius:[0,28],opacity:[0.6,0.98],blur:[0,28],padding:[0,40],gap:[8,28],width:[140,360],height:[56,112]};
  const defaults={schemaVersion:1,name:'Customer design',navigation:'aperture',theme:'electric-glass',colors:{},material:{},typography:{family:'system-ui',baseSize:15,headingSize:24,weight:500,density:'comfortable',spacing:16},layout:{mode:'single',navWidth:190,contextWidth:250,contextVisible:true,headerVisible:true,footerVisible:true,workspacePadding:22,panelGap:16,headerHeight:76},regions:{},detailsVisible:false,notes:{navigation:'',theme:'',colors:'',typography:'',layout:'',review:''}};
  function object(v){return v!==null&&typeof v==='object'&&!Array.isArray(v);}
  function assert(ok,message){if(!ok)throw Error(message);}
  function numeric(value,min,max,key){assert(typeof value==='number'&&Number.isFinite(value),key+' must be a number');return Math.max(min,Math.min(max,value));}
  function color(value){assert(typeof value==='string'&&/^#[\da-f]{6}$/i.test(value),'Use a six-digit hex color');return value.toUpperCase();}
  function validate(input){
    assert(object(input)&&input.schemaVersion===1,'Unsupported design schema. Expected version 1.');
    const d=clone(defaults);
    const known=new Set(Object.keys(d));for(const k of Object.keys(input))assert(known.has(k),'Unknown design field: '+k);
    for(const key of ['navigation','theme']){if(input[key]!==undefined){assert((key==='navigation'?navigation:themes).includes(input[key]),'Unknown '+key);d[key]=input[key];}}
    if(input.name!==undefined){assert(typeof input.name==='string'&&input.name.trim().length>0&&input.name.length<=100,'Design name must contain 1–100 characters');d.name=input.name.trim();}
    if(input.detailsVisible!==undefined){assert(typeof input.detailsVisible==='boolean','Details must be boolean');d.detailsVisible=input.detailsVisible;}
    for(const key of ['colors','material','typography','layout','regions','notes'])if(input[key]!==undefined)assert(object(input[key]),key+' must be an object');
    for(const [key,v] of Object.entries(input.colors||{})){assert(['background','header','navigation','workspace','panel','accent','text','border'].includes(key),'Unknown color token');d.colors[key]=color(v);}
    for(const [key,v] of Object.entries(input.material||{})){assert(bounds[key]&&['borderWidth','radius','opacity','blur'].includes(key),'Unknown material token');d.material[key]=numeric(v,...bounds[key],key);}
    const typeRules={family:['system-ui','Segoe UI','Arial','Trebuchet MS','Georgia'],baseSize:[14,20],headingSize:[18,36],weight:[400,700],density:['compact','comfortable','spacious'],spacing:[8,28]};
    for(const [k,v] of Object.entries(input.typography||{})){assert(Object.hasOwn(typeRules,k),'Unknown typography token');if(['family','density'].includes(k)){assert(typeRules[k].includes(v),'Invalid '+k);d.typography[k]=v;}else d.typography[k]=numeric(v,...typeRules[k],k);}
    const layoutRules={navWidth:[140,280],contextWidth:[180,360],workspacePadding:[8,40],panelGap:[8,28],headerHeight:[56,112]};
    for(const [k,v] of Object.entries(input.layout||{})){
      assert(Object.hasOwn(defaults.layout,k),'Unknown layout token');
      if(layoutRules[k])d.layout[k]=numeric(v,...layoutRules[k],k);
      else if(k==='mode'){assert(['single','split'].includes(v),'Invalid workspace mode');d.layout[k]=v;}
      else {assert(typeof v==='boolean','Visibility must be boolean');d.layout[k]=v;}
    }
    for(const [region,values] of Object.entries(input.regions||{})){
      assert(Object.hasOwn(regions,region)&&object(values),'Application internals are read-only; unknown shell region');d.regions[region]={};
      for(const [k,v] of Object.entries(values)){
        assert(['background','text','border',...Object.keys(bounds),'visible'].includes(k),'Unknown shell property');
        if(['background','text','border'].includes(k))d.regions[region][k]=color(v);
        else if(k==='visible'){assert(typeof v==='boolean','Visibility must be boolean');assert(v||!['shell','branding','navigation','workspace'].includes(region),'Primary navigation and workspace must remain visible');d.regions[region][k]=v;}
        else {assert(k!=='width'||['navigation','context','branding'].includes(region),'Width is not available here');assert(k!=='height'||region==='header','Height is only available on the header');const range=k==='width'?(region==='branding'?[24,64]:region==='navigation'?[140,280]:[180,360]):bounds[k];d.regions[region][k]=numeric(v,...range,k);}
      }
    }
    for(const [key,v] of Object.entries(input.notes||{})){assert(Object.hasOwn(defaults.notes,key)&&typeof v==='string'&&v.length<=3000,'Invalid decision note');d.notes[key]=v;}
    return d;
  }
  function compileCSS(input){
    const d=validate(input),out=['/* SCOPE Studio v1. Load after mockups/styles.css; set body[data-scope-design="true"] and the engine look specified by theme-presets.json. Semantic action colors remain engine-owned. */'];
    const selector=s=>s.split(',').map(v=>'body[data-scope-design="true"] '+v.trim()).join(',');
    function rule(s,props){out.push(selector(s)+'{'+props+'}');}
    function material(v){return Object.entries(v).map(([k,x])=>({borderWidth:'border-width:'+x+'px!important;border-style:solid!important',radius:'border-radius:'+x+'px!important',opacity:'--studio-opacity:'+x,blur:'backdrop-filter:blur('+x+'px)!important;-webkit-backdrop-filter:blur('+x+'px)!important'})[k]).join(';');}
    rule('.theme','font-family:"'+d.typography.family+'",system-ui,sans-serif!important;font-size:'+d.typography.baseSize+'px!important;font-weight:'+d.typography.weight+';--studio-spacing:'+d.typography.spacing+'px;--studio-density:'+({compact:.75,comfortable:1,spacious:1.25}[d.typography.density]));
    rule('.surface-identity,.pane-title,.room-title h2','font-size:'+d.typography.headingSize+'px!important');
    rule('.surface-top,.pane-header','flex-wrap:wrap');
    rule('.surface-identity span','overflow-wrap:anywhere;min-width:0');
    rule('.shell-top,.surface-top,.pane-header,.integration-pane-header','padding-block:calc(var(--studio-spacing)*var(--studio-density)*.65)!important');
    rule('.shell','min-height:calc(100vh - 4px)!important');
    const targets={background:'.shell',header:regions.header,navigation:regions.navigation,workspace:regions.workspace,panel:'.pane,.integration-pane,.owner-surface',accent:'.theme',text:'.shell',border:'.shell,.shell-top,.pane,.owner-surface,.integration-pane,.deck-nav,.deck-rail'};
    for(const [k,v] of Object.entries(d.colors))rule(targets[k],k==='accent'?'--accent:'+v+';--primary:'+v:k==='text'?'color:'+v+'!important':k==='border'?'border-color:'+v+'!important':'background:linear-gradient(#FFFFFF09,#FFFFFF00),'+v+'!important');
    if(Object.keys(d.material).length)rule('.shell,.shell-top,.pane,.integration-pane,.owner-surface,.deck-nav,.deck-rail',material(d.material));
    if(d.material.opacity!==undefined)rule('.shell-top,.pane,.integration-pane,.deck-nav,.deck-rail','background-color:color-mix(in srgb,'+(d.colors.panel||'#233047')+' calc(var(--studio-opacity)*100%),transparent)!important');
    rule(regions.workspace,'padding:'+d.layout.workspacePadding+'px!important;gap:'+d.layout.panelGap+'px!important;min-width:0');
    rule('.aperture-stage','padding-bottom:'+(d.layout.workspacePadding+100)+'px!important');
    rule('.panes,.integrated-panes','gap:'+d.layout.panelGap+'px!important');
    rule('.shell-top','min-height:'+d.layout.headerHeight+'px!important');
    if(!d.layout.headerVisible)rule(regions.header,'display:none!important');
    if(!d.layout.footerVisible)rule(regions.footer,'display:none!important');
    if(d.navigation==='deck'&&d.layout.mode==='single'){
      const nav=d.regions.navigation?.width||d.layout.navWidth,ctx=d.regions.context?.width||d.layout.contextWidth;
      const visible=d.layout.contextVisible&&d.regions.context?.visible!==false;
      out.push('@media(min-width:1251px){'+selector('.deck-layout')+'{grid-template-columns:'+nav+'px minmax(0,1fr)'+(visible?' '+ctx+'px':'')+'!important}}');
      out.push('@media(min-width:851px) and (max-width:1250px){'+selector('.deck-layout')+'{grid-template-columns:'+nav+'px minmax(0,1fr)!important}}');
      if(!visible)rule(regions.context,'display:none!important');
    }
    for(const [id,v] of Object.entries(d.regions)){
      let props=material(Object.fromEntries(Object.entries(v).filter(([k])=>['borderWidth','radius','opacity','blur'].includes(k))));
      for(const [k,x] of Object.entries(v)){
        if(k==='background')props+=';background:linear-gradient(#FFFFFF09,#FFFFFF00),'+x+'!important';
        if(k==='text')props+=';color:'+x+'!important';
        if(k==='border')props+=';border-color:'+x+'!important';
        if(['padding','gap'].includes(k))props+=';'+k+':'+x+'px!important';
        if(k==='height')props+=';min-height:'+x+'px!important';
        if(k==='width'&&id==='branding')props+=';--studio-logo-size:'+x+'px';
        if(k==='visible'&&!x)props+=';display:none!important';
        if(k==='opacity')props+=';background-color:color-mix(in srgb,'+(v.background||d.colors.panel||'#233047')+' '+x*100+'%,transparent)!important';
      }
      rule(regions[id],props);
    }
    rule('.shell-brand .scope-logo','width:var(--studio-logo-size,40px)!important;height:var(--studio-logo-size,40px)!important;object-fit:contain!important');
    return out.join('\n');
  }
  class DesignStore{
    constructor(value=defaults){this.value=validate(value);this.past=[];this.future=[];this.candidates={Baseline:clone(this.value)};this.listeners=[];}
    subscribe(fn){this.listeners.push(fn);return()=>this.listeners=this.listeners.filter(x=>x!==fn);}
    emit(){this.listeners.forEach(fn=>fn(this.value));}
    set(value,key=''){const next=validate(value);if(JSON.stringify(next)===JSON.stringify(this.value))return;const now=Date.now();if(!key||key!==this.lastKey||now-this.lastTime>650)this.past.push(clone(this.value));this.past=this.past.slice(-100);this.lastKey=key;this.lastTime=now;this.value=next;this.future=[];this.emit();}
    update(fn,key=''){const next=clone(this.value);fn(next);this.set(next,key);}
    undo(){if(!this.past.length)return;this.future.push(clone(this.value));this.value=this.past.pop();this.lastKey='';this.emit();}
    redo(){if(!this.future.length)return;this.past.push(clone(this.value));this.value=this.future.pop();this.lastKey='';this.emit();}
    save(name){if(!['Candidate A','Candidate B','Candidate C'].includes(name))throw Error('Choose Candidate A, B or C');this.candidates[name]=clone(this.value);}
    restore(name){if(!this.candidates[name])throw Error('This checkpoint has not been saved');this.set(this.candidates[name]);}
  }
  function effectiveDesign(input,preset){
    const d=validate(input);
    // These schemes use the existing White Trim material with preset palette
    // and glass tokens. Explicit customer overrides retain precedence.
    return preset.engineLook==='white-trim'&&d.theme!=='white-trim'
      ? {...d,colors:{...preset.colors,...d.colors},material:{...preset.material,...d.material}}
      : d;
  }
  const api={clone,defaults,navigation,themes,regions,bounds,validate,compileCSS,effectiveDesign,DesignStore};
  root.ScopeDesign=api;if(typeof module!=='undefined')module.exports=api;
})(typeof globalThis!=='undefined'?globalThis:this);

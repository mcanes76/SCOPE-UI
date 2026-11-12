/* Canonical visual tokens and constrained component cascade. No application logic. */
(function(root){
  'use strict';
  const families={professional:{name:'Professional',radius:8,border:1,blur:0,shadow:'0 5px 16px #0002',font:'Segoe UI'},technical:{name:'Technical',radius:3,border:1,blur:0,shadow:'inset 0 1px #ffffff12',font:'Consolas'},field:{name:'Field Operations',radius:4,border:2,blur:0,shadow:'none',font:'Arial'},glass:{name:'Glass / Experimental',radius:18,border:1,blur:18,shadow:'0 12px 28px #0005,inset 0 1px #ffffff26',font:'Segoe UI'}};
  const paletteIds=['slate-light','graphite-dark','technical-teal','disco','ide-workbench','industrial-hmi','field-day','field-night','neutral-tactical','slate-indigo','sage-teal','sand-bronze','slate-cyan','civic-blue'];
  const appIds=['blos','display','calibration','los'];
  const categories=['buttons','headers','panels','tabs','navigation','frames','join','leave','warning','configuration','info','neutral'];
  const componentDefaults={global:{},classes:{},applications:{},instances:{}};
  const colors=['background','text','icon','border','hoverBg','hoverText','focusColor','pressedBg','selectedBg','disabledBg','disabledText'];
  const limits={borderWidth:[0,5],radius:[0,50],topLeft:[0,50],topRight:[0,50],bottomLeft:[0,50],bottomRight:[0,50],paddingX:[4,28],paddingY:[4,20],height:[32,64],fontSize:[12,24],fontWeight:[400,800]};
  function validateStyle(input){
    if(!input||typeof input!=='object'||Array.isArray(input))throw Error('Component style must be an object');const out={};
    for(const [k,v] of Object.entries(input)){
      if(colors.includes(k)){if(typeof v!=='string'||!/^#[\da-f]{6}$/i.test(v))throw Error('Invalid component color');out[k]=v.toUpperCase();}
      else if(limits[k]){if(typeof v!=='number'||!Number.isFinite(v))throw Error('Invalid component dimension');out[k]=Math.max(limits[k][0],Math.min(limits[k][1],v));}
      else if(k==='borderStyle'&&['solid','dashed'].includes(v))out[k]=v;
      else if(k==='fontFamily'&&["system-ui","Segoe UI","Arial","Aptos","Calibri","Tahoma","Verdana","Trebuchet MS","Bahnschrift","Georgia","Consolas","Courier New","Lucida Console","Arial Narrow"].includes(v))out[k]=v;
      else if(k==='elevation'&&['flat','raised','inset'].includes(v))out[k]=v;
      else throw Error('Unsupported component property: '+k);
    }return out;
  }
  function validateComponents(value=componentDefaults){
    const out=JSON.parse(JSON.stringify(componentDefaults));
    for(const [scope,entries] of Object.entries(value)){
      if(!Object.hasOwn(out,scope)||!entries||typeof entries!=='object'||Array.isArray(entries))throw Error('Invalid component scope');
      for(const [key,style] of Object.entries(entries)){
        if(scope==='global'&&!categories.includes(key))throw Error('Invalid component category');
        if(scope==='classes'&&!categories.includes(key))throw Error('Invalid component class');
        if(scope==='applications'){
          if(!appIds.includes(key))throw Error('Invalid application style scope');out[scope][key]={};
          for(const [category,s] of Object.entries(style)){if(!categories.includes(category))throw Error('Invalid application category');out[scope][key][category]=validateStyle(s);}continue;
        }
        if(scope==='instances'&&!/^(blos|display|calibration|los):[a-z0-9:_-]{1,140}$/.test(key))throw Error('Invalid component instance');
        out[scope][key]=validateStyle(style);
      }
    }return out;
  }
  function family(preset){return preset.family||'glass';}
  function tokens(design,preset){
    const c={...preset.colors,...design.colors},light=preset.mode==='light';
    const base=families[family(preset)],r=preset.roles||{};
    const f={...base,radius:preset.geometry?.panelRadius??base.radius,controlRadius:preset.geometry?.controlRadius??base.radius,controlHeight:preset.geometry?.controlHeight??(family(preset)==='field'?44:38),shadow:preset.surfaceTreatment==='overlay'?'0 12px 24px #00000059':base.shadow};
    return {page:c.background,shell:c.header||c.panel,nav:c.navigation,workspace:c.workspace,panel:c.panel,raised:r.raised||(light?'#F3F6F9':'#253247'),inset:r.inset||(light?'#FFFFFF':'#0F1724'),text:c.text,secondary:r.secondary||(light?'#344459':'#BFCCDF'),muted:r.muted||(light?'#425269':'#B5C4D6'),border:c.border,selection:r.selection||(light?'#C4D8F4':'#324B6A'),focus:c.accent,hover:r.hover||(light?'#D4DFEB':'#314561'),pressed:r.pressed||(light?'#B6C9DE':'#1A2B43'),disabled:r.disabled||(light?'#DAE0E7':'#273447'),disabledText:light?'#4B596C':'#B2BDCD',accent:c.accent,light,f};
  }
  function contrast(a,b){const luminance=c=>{const rgb=c.slice(1).match(/../g).map(x=>parseInt(x,16)/255).map(x=>x<=.04045?x/12.92:((x+.055)/1.055)**2.4);return rgb[0]*.2126+rgb[1]*.7152+rgb[2]*.0722;};const x=luminance(a),y=luminance(b);return (Math.max(x,y)+.05)/(Math.min(x,y)+.05);}
  const selectors={buttons:'button',headers:'.surface-top,.pane-header,.integration-pane-header',panels:'[data-demo-host] section,[data-demo-host] fieldset,[data-demo-host] .demo-card',tabs:'.app-tabs button',navigation:'.deck-nav button,.aperture-dock button,.shelf-app,.portal-location button',frames:'.owner-surface,.integration-pane,.pane',join:'.btn-join,.btn-enable',leave:'.btn-leave,.btn-disable',warning:'.btn-warning',configuration:'.btn-update',info:'.btn-read',neutral:'.btn-neutral'};
  function compile(design,preset){
    const t=tokens(design,preset),out=[],prefix='body[data-scope-design="true"][data-theme="'+design.theme+'"]';
    const rule=(s,p)=>out.push(s.split(',').map(x=>prefix+' '+x.trim()).join(',')+'{'+p+'}');
    const vars=Object.entries(t).filter(([,v])=>typeof v==='string').map(([k,v])=>'--scope-'+k+':'+v).join(';');
    out.push(prefix+'{'+vars+';color-scheme:'+(t.light?'light':'dark')+';background:'+t.page+';color:'+t.text+'}');
    rule('.theme','--ink:'+t.text+';--muted:'+t.muted+';--surface:'+t.panel+';--raised:'+t.raised+';--line:'+t.border+';--accent:'+t.accent+';color:'+t.text+'!important');
    // Legacy glass keeps its original material layers. New families explicitly own every surface.
    if(family(preset)!=='glass'){
      rule('.shell,.shell-top,.deck-nav,.deck-rail,.aperture-dock,.workspace-tools,.application-shelf,.portal-location','background:'+t.shell+'!important;color:'+t.text+'!important;backdrop-filter:none!important;box-shadow:'+t.f.shadow+'!important;border-color:'+t.border+'!important');
      rule('.aperture-stage,.mosaic-board,.portal-room,.deck-main,.integrated-panes','background:'+t.workspace+'!important');
      rule('.shell,.pane,.owner-surface,.integration-pane,dialog','border-radius:'+t.f.radius+'px!important;border-width:'+t.f.border+'px!important;border-color:'+t.border+'!important;box-shadow:'+t.f.shadow+'!important');
    }
    rule('[data-demo-host],.owner-surface,.detached-surface','background:'+t.workspace+'!important;color:'+t.text+'!important');
    rule('[data-demo-host] section,[data-demo-host] fieldset,[data-demo-host] article,[data-demo-host] .demo-card,.shell-context-card,dialog','background:'+t.panel+'!important;color:'+t.text+'!important;border-color:'+t.border+'!important');
    rule('.app-summary,.app-table-wrap,.node-info,.alignment-values article,.alignment-editor,.lab-panel,.viz-card,.laboratory','background:'+t.panel+'!important;color:'+t.text+'!important;border-color:'+t.border+'!important');
    if(family(preset)!=='glass')rule('.app-summary,.app-table-wrap,.node-info,.alignment-values article,.alignment-editor,[data-demo-host] section,dialog','border-radius:'+t.f.radius+'px!important;box-shadow:'+t.f.shadow+'!important');
    rule('.app-summary strong,.app-summary span,.alignment-values strong,.alignment-values span,.alignment-values small,.alignment-editor span,.alignment-editor small,.member-list span,.los-events li,.owner-footer,.detached-note,dialog p,dialog label,dialog h2,dialog small','color:'+t.secondary+'!important');
    rule('.owner-footer,.detached-note','background:'+t.nav+'!important');
    rule('.earth-attribution,.earth-attribution a,.earth-render-status,.chart-legend,.node-info span,.app-table .small,.lab-heading p,.lab-heading h2,.gallery-heading p,.gallery-heading h2','color:'+t.secondary+'!important');
    rule('[data-demo-host] h2,[data-demo-host] h3,[data-demo-host] h4,[data-demo-host] label,[data-demo-host] legend,.surface-identity,.boundary-tag,.pane-title,.deck-nav-note,.room-title,.room-bottom','color:'+t.text+'!important');
    rule('[data-demo-host] p,[data-demo-host] .small,[data-demo-host] .muted,.muted,.deck-rail p','color:'+t.secondary+'!important');
    rule('.muted','color:'+t.muted+'!important');
    rule('input,select,textarea,option','background:'+t.inset+'!important;color:'+t.text+'!important;border-color:'+t.border+'!important');
    rule('table,thead,tbody,tr,th,td','background:'+t.panel+'!important;color:'+t.text+'!important;border-color:'+t.border+'!important');
    rule('tr.selected-row td','background:'+t.selection+'!important');
    rule('.demo-feedback','color:'+(t.light?'#17613F':'#9AE8BB')+'!important');rule('.demo-feedback.error,.app-error','color:'+(t.light?'#A11932':'#FFB6C2')+'!important');
    rule('.surface-top,.integration-pane-header,.pane-header,.app-tabs','background:'+t.nav+'!important;color:'+t.text+'!important;border-color:'+t.border+'!important');
    rule('button','background:'+t.raised+'!important;color:'+t.text+'!important;border-color:'+t.border+'!important;border-radius:'+t.f.controlRadius+'px;min-height:'+t.f.controlHeight+'px');
    rule('button:hover:not(:disabled)','background:'+t.hover+'!important');rule('button:active','background:'+t.pressed+'!important');rule('button[aria-pressed="true"],button[aria-selected="true"]','background:'+t.selection+'!important;color:'+t.text+'!important');
    rule('button:disabled,input:disabled','background:'+t.disabled+'!important;color:'+t.disabledText+'!important');rule(':focus-visible','outline:3px solid '+t.focus+'!important;outline-offset:3px');
    const semantic={join:['#00D96C','#092313'],leave:['#D91F35','#FFFFFF'],warning:['#FFD000','#292000'],configuration:['#7040D9','#FFFFFF'],info:['#00BFFF','#06202D']};
    for(const [category,[bg,fg]] of Object.entries(semantic)){rule(selectors[category],`background:${bg}!important;color:${fg}!important;border-color:${bg}!important`);rule(selectors[category].split(',').map(s=>s+':is(:hover,:active,[aria-pressed="true"]):not(:disabled)').join(','),`background:${bg}!important;color:${fg}!important;filter:brightness(1.09)`);}
    const scoped=(category,app)=>selectors[category].split(',').map(s=>app?'[data-owner="'+app+'"] '+s:s).join(',');
    function style(s,v){
      const props={background:'background',text:'color',icon:'--scope-icon',border:'border-color',borderStyle:'border-style',borderWidth:'border-width',radius:'border-radius',topLeft:'border-top-left-radius',topRight:'border-top-right-radius',bottomLeft:'border-bottom-left-radius',bottomRight:'border-bottom-right-radius',paddingX:'padding-inline',paddingY:'padding-block',height:'min-height',fontSize:'font-size',fontWeight:'font-weight',fontFamily:'font-family'};
      rule(s,Object.entries(v).filter(([k])=>props[k]).sort(([a],[b])=>(a==='radius'?-1:b==='radius'?1:0)).map(([k,x])=>props[k]+':'+x+(Object.hasOwn(limits,k)&&k!=='fontWeight'?'px':'')+'!important').join(';'));
      if(v.icon)rule(s.split(',').map(x=>x+' .icon').join(','),'color:'+v.icon+'!important');
      if(v.elevation)rule(s,'box-shadow:'+({flat:'none',raised:'0 5px 14px #0005',inset:'inset 0 2px 5px #0006'}[v.elevation])+'!important');
      for(const [key,state] of [['hoverBg',':hover:not(:disabled)'],['pressedBg',':active'],['selectedBg','[aria-pressed="true"]'],['disabledBg',':disabled']])if(v[key])rule(s.split(',').map(x=>x+state).join(','),'background:'+v[key]+'!important');
      if(v.selectedBg)rule(s.split(',').map(x=>x+'[aria-selected="true"]').join(','),'background:'+v.selectedBg+'!important');
      if(v.hoverText)rule(s.split(',').map(x=>x+':hover').join(','),'color:'+v.hoverText+'!important');
      if(v.focusColor)rule(s.split(',').map(x=>x+':focus-visible').join(','),'outline:3px solid '+v.focusColor+'!important');
      if(v.disabledText)rule(s.split(',').map(x=>x+':disabled').join(','),'color:'+v.disabledText+'!important');
    }
    if(preset.surfaceTreatment==='overlay'){
      const alpha=Math.max(.6,Math.min(1,Number(preset.surfaceOpacity)||.95));
      rule('.pane,.integration-pane,[data-demo-host] section,[data-demo-host] fieldset,.shell-context-card,dialog','background:color-mix(in srgb,'+t.panel+' '+alpha*100+'%,transparent)!important;box-shadow:'+t.f.shadow+'!important;border-radius:'+t.f.radius+'px!important');
      rule('button,input,select,textarea','border-radius:'+t.f.controlRadius+'px;font-size:'+design.typography.baseSize+'px!important');
      rule('.surface-identity,[data-demo-host] h2,[data-demo-host] h3,dialog h2','color:'+t.accent+'!important');
    }
    const c=design.components||componentDefaults;
    for(const [category,v] of Object.entries(c.global))style(scoped(category),v);
    for(const [category,v] of Object.entries(c.classes))style(scoped(category),v);
    for(const [app,categories] of Object.entries(c.applications))for(const [category,v] of Object.entries(categories))style(scoped(category,app),v);
    for(const [id,v] of Object.entries(c.instances))style('[data-style-id="'+id+'"][data-style-id][data-style-id]',v);
    out.push('@media(prefers-reduced-motion:reduce){'+prefix+' *{transition:none!important;animation:none!important;scroll-behavior:auto!important}}');
    return out.join('\n');
  }
  const api={families,paletteIds,appIds,categories,componentDefaults,validateComponents,validateStyle,tokens,family,contrast,compile};root.ScopeVisuals=api;if(typeof module!=='undefined')module.exports=api;
})(typeof globalThis!=='undefined'?globalThis:this);

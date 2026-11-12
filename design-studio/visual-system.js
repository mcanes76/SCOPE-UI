/* Canonical visual tokens and constrained component cascade. No application logic. */
(function(root){
  'use strict';
  const families={professional:{name:'Professional',radius:8,border:1,blur:0,shadow:'0 5px 16px #0002',font:'Segoe UI'},technical:{name:'Technical',radius:3,border:1,blur:0,shadow:'inset 0 1px #ffffff12',font:'Consolas'},field:{name:'Field Operations',radius:4,border:2,blur:0,shadow:'none',font:'Arial'},glass:{name:'Glass / Experimental',radius:18,border:1,blur:18,shadow:'0 12px 28px #0005,inset 0 1px #ffffff26',font:'Segoe UI'}};
  const paletteIds=['slate-light','graphite-dark','technical-teal','disco','ide-workbench','industrial-hmi','field-day','field-night','neutral-tactical','slate-indigo','sage-teal','sand-bronze','slate-cyan','civic-blue'];
  const appIds=['blos','display','calibration','los'];
  const categories=['buttons','headers','panels','tabs','navigation','frames','join','leave','warning','configuration','info','neutral'];
  const componentDefaults={global:{},classes:{},applications:{},instances:{}};
  const fontFamilies=['system-ui','Segoe UI','Arial','Aptos','Calibri','Tahoma','Verdana','Trebuchet MS','Bahnschrift','Georgia','Consolas','Courier New','Lucida Console','Arial Narrow'];
  const colors=['background','text','icon','border','hoverBg','hoverText','focusColor','focusBg','focusText','pressedBg','pressedText','selectedBg','selectedText','disabledBg','disabledText','loadingBg','loadingText','gradientStart','gradientEnd'];
  const limits={borderWidth:[0,4],radius:[0,24],topLeft:[0,24],topRight:[0,24],bottomLeft:[0,24],bottomRight:[0,24],paddingX:[0,32],paddingY:[0,24],height:[32,72],minWidth:[0,320],fontSize:[12,24],fontWeight:[400,800],letterSpacing:[-1,4],opacity:[.2,1],gradientAngle:[0,360]};
  const componentPresets={industrial:{name:'Square / Industrial',style:{radius:0,borderWidth:2,borderStyle:'solid',height:44,elevation:'flat'}},professional:{name:'Slightly Rounded / Professional',style:{radius:4,borderWidth:1,borderStyle:'solid',height:40,elevation:'flat'}},modern:{name:'Soft Rounded / Modern',style:{radius:12,borderWidth:1,height:44,elevation:'flat'}},pill:{name:'Capsule / Pill',style:{radius:50,height:44,paddingX:20}},minimal:{name:'Flat / Minimal',style:{radius:2,borderWidth:1,elevation:'flat',gradient:false}},dimensional:{name:'Raised / Dimensional',style:{radius:8,borderWidth:1,elevation:'raised'}}};
  const semantic={join:['#00D96C','#092313'],leave:['#D91F35','#FFFFFF'],warning:['#FFD000','#292000'],configuration:['#7040D9','#FFFFFF'],info:['#00BFFF','#06202D']};
  const actionNames={'group-join':'join','group-leave':'leave','group-create':'create','sensor-apply':'update','sensor-read':'read','sensor-edit':'edit','sensor-restore':'restore','los-apply':'update','los-read':'read','los-reset':'reset'};
  function componentId(app,action,data={}){
    const safe=value=>String(value).toLowerCase().replace(/[^a-z0-9_-]/g,'-');
    if(!appIds.includes(app))return '';
    let id='application.'+app+'.button.'+(actionNames[action]||safe(action));
    for(const key of ['tab','group','node','sensor','key'])if(data[key])id+='.'+key+'.'+safe(data[key]);
    return id;
  }
  function canonicalId(id){
    const old=id.match(/^(blos|display|calibration|los):([a-z0-9_-]+):0$/);
    return old&&Object.hasOwn(actionNames,old[2])?componentId(old[1],old[2]):id;
  }
  function validId(id){return typeof id==='string'&&id.length<=200&&(/^(?:application\.(?:blos|display|calibration|los)\.button|shell\.(?:button|navigation\.button|window\.button))\.[a-z0-9_-]+(?:\.[a-z0-9_-]+)*$/.test(id)||/^(blos|display|calibration|los):[a-z0-9:_-]{1,140}$/.test(id));}
  function describe(id){
    id=canonicalId(id||'');const match=id.match(/^application\.([a-z]+)\.button\.([a-z0-9_-]+)/),app=match?.[1]||'shell',action=match?.[2]||id.split('.').at(-1)||'button';
    const base=action.endsWith('-confirm')?(actionNames[action.slice(0,-8)]||action.slice(0,-8)):action;
    const category=base==='join'||base==='enable'?'join':base==='leave'||base==='disable'?'leave':base==='warning'||app==='calibration'&&base==='restore'||app==='los'&&base==='reset'?'warning':['create','update','edit'].includes(base)?'configuration':['read','info','display-reset','display-network','display-earth','topology-reset'].includes(base)?'info':base==='internal-tab'?'tabs':id.startsWith('shell.navigation.')?'navigation':app==='shell'?'buttons':'neutral';
    return {id,app,action,category,label:app==='shell'?'SCOPE / '+action:app+' / '+action};
  }
  function validateStyle(input){
    if(!input||typeof input!=='object'||Array.isArray(input))throw Error('Component style must be an object');const out={};
    for(const [k,v] of Object.entries(input)){
      if(colors.includes(k)){if(typeof v!=='string'||!/^#[\da-f]{6}$/i.test(v))throw Error('Invalid component color');out[k]=v.toUpperCase();}
      else if(k==='radius'&&(v==='pill'||v===50))out[k]=v;
      else if(limits[k]){if(typeof v!=='number'||!Number.isFinite(v))throw Error('Invalid component dimension');out[k]=Math.max(limits[k][0],Math.min(limits[k][1],v));}
      else if(k==='borderStyle'&&['solid','dashed','dotted'].includes(v))out[k]=v;
      else if(k==='fontFamily'&&fontFamilies.includes(v))out[k]=v;
      else if(k==='elevation'&&['flat','raised','inset'].includes(v))out[k]=v;
      else if(k==='gradient'&&typeof v==='boolean')out[k]=v;
      else if(k==='textTransform'&&['none','uppercase','lowercase','capitalize'].includes(v))out[k]=v;
      else throw Error('Unsupported component property: '+k);
    }return out;
  }
  function validateComponents(value=componentDefaults){
    if(!value||typeof value!=='object'||Array.isArray(value))throw Error('Component overrides must be an object');
    const out=JSON.parse(JSON.stringify(componentDefaults));
    for(const [scope,entries] of Object.entries(value)){
      if(!Object.hasOwn(out,scope)||!entries||typeof entries!=='object'||Array.isArray(entries))throw Error('Invalid component scope');
      for(const [key,style] of Object.entries(entries)){
        if(scope==='global'&&!categories.includes(key))throw Error('Invalid component category');
        if(scope==='classes'&&!categories.includes(key))throw Error('Invalid component class');
        if(scope==='applications'){
          if(!appIds.includes(key)||!style||typeof style!=='object'||Array.isArray(style))throw Error('Invalid application style scope');out[scope][key]={};
          for(const [category,s] of Object.entries(style)){if(!categories.includes(category))throw Error('Invalid application category');out[scope][key][category]=validateStyle(s);}continue;
        }
        if(scope==='instances'&&!validId(key))throw Error('Invalid component instance');
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
  function mergeComponents(design){
    const a=validateComponents(design.parameters?.componentStyles||componentDefaults),b=validateComponents(design.components||componentDefaults);
    const overlay=(base,style)=>{const out={...base};if(Object.hasOwn(style,'radius'))for(const key of ['topLeft','topRight','bottomLeft','bottomRight'])delete out[key];return {...out,...style};};
    for(const scope of ['global','classes','instances'])for(const [key,style] of Object.entries(b[scope]))a[scope][key]=overlay(a[scope][key],style);
    for(const [app,groups] of Object.entries(b.applications)){a.applications[app]??={};for(const [key,style] of Object.entries(groups))a.applications[app][key]=overlay(a.applications[app][key],style);}return a;
  }
  function resolveStyle(design,preset,descriptor={},exclude){
    const info={...describe(descriptor.id),...descriptor},t=tokens(design,preset),values={radius:t.f.controlRadius,borderWidth:t.f.border,borderStyle:'solid',height:t.f.controlHeight,minWidth:0,paddingX:12,paddingY:8,fontFamily:design.typography.family,fontSize:design.typography.baseSize,fontWeight:500,letterSpacing:0,textTransform:'none',elevation:family(preset)==='glass'?'raised':'flat',opacity:1,gradient:false,gradientAngle:180};
    const sources=Object.fromEntries(Object.keys(values).map(k=>[k,'Family / typography']));
    const pair=semantic[info.category];Object.assign(values,{background:pair?.[0]||t.raised,text:pair?.[1]||t.text,border:pair?.[0]||t.border,icon:pair?.[1]||t.text,hoverBg:pair?.[0]||t.hover,hoverText:pair?.[1]||t.text,focusColor:t.focus,focusBg:pair?.[0]||t.raised,focusText:pair?.[1]||t.text,pressedBg:pair?.[0]||t.pressed,pressedText:pair?.[1]||t.text,selectedBg:pair?.[0]||t.selection,selectedText:pair?.[1]||t.text,disabledBg:t.disabled,disabledText:t.disabledText,loadingBg:t.raised,loadingText:t.text,gradientStart:pair?.[0]||t.raised,gradientEnd:t.panel});
    for(const k of colors)sources[k]=pair&&['background','text','border','icon','hoverBg','hoverText','pressedBg','pressedText','selectedBg','selectedText','focusBg','focusText'].includes(k)?'Semantic '+info.category:'Palette';
    function apply(style,label,path){const same=exclude&&(JSON.stringify(path)===JSON.stringify(exclude)||path[0]==='instances'&&exclude[0]==='instances'&&canonicalId(path[1])===canonicalId(exclude[1]));if(label.startsWith('Design')&&same)return;if(style&&Object.hasOwn(style,'radius'))for(const key of ['topLeft','topRight','bottomLeft','bottomRight']){delete values[key];delete sources[key];}for(const [key,value] of Object.entries(style||{})){values[key]=value;sources[key]=label;}}
    const param=design.parameters?.componentStyles||componentDefaults,own=design.components||componentDefaults,cats=[...new Set(['buttons',info.category||'buttons'])];
    function at(path,label){const get=c=>path.reduce((v,k)=>v?.[k],c);apply(get(param),'Parameters '+label,path);apply(get(own),'Design '+label,path);}
    for(const cat of cats)at(['global',cat],'global '+cat);
    for(const cat of cats)at(['classes',cat],'class '+cat);
    for(const cat of cats)at(['applications',info.app,cat],info.app+' '+cat);
    for(const id of [...new Set([...Object.keys(param.instances||{}),...Object.keys(own.instances||{})])].sort((a,b)=>Number(a===canonicalId(a))-Number(b===canonicalId(b))))if(canonicalId(id)===canonicalId(info.id||''))at(['instances',id],'instance');
    // A base fill/foreground is inherited by states unless explicitly styled.
    for(const [key,base] of [['hoverBg','background'],['focusBg','background'],['pressedBg','background'],['selectedBg','background'],['hoverText','text'],['focusText','text'],['pressedText','text'],['selectedText','text']])if(!sources[key]?.startsWith('Design')&&!sources[key]?.startsWith('Parameters')&&(sources[base]?.startsWith('Design')||sources[base]?.startsWith('Parameters'))){values[key]=values[base];sources[key]=sources[base];}
    for(const key of ['topLeft','topRight','bottomLeft','bottomRight'])if(values[key]===undefined){values[key]=values.radius;sources[key]=sources.radius;}
    if(!sources.icon?.startsWith('Design')&&!sources.icon?.startsWith('Parameters')&&(sources.text?.startsWith('Design')||sources.text?.startsWith('Parameters'))){values.icon=values.text;sources.icon=sources.text;}
    if(!sources.gradientStart?.startsWith('Design')&&!sources.gradientStart?.startsWith('Parameters')&&(sources.background?.startsWith('Design')||sources.background?.startsWith('Parameters'))){values.gradientStart=values.background;sources.gradientStart=sources.background;}
    const warnings=[];
    for(const id of new Set([...Object.keys(param.instances||{}),...Object.keys(own.instances||{})]))if(id.includes(':')&&canonicalId(id)===id)warnings.push('Legacy positional override '+id+' is retained but not rebound automatically. Select the semantic control to reapply it safely.');
    const blend=(fg,bg,alpha)=>'#'+[0,1,2].map(i=>Math.round(parseInt(fg.slice(1+i*2,3+i*2),16)*alpha+parseInt(bg.slice(1+i*2,3+i*2),16)*(1-alpha)).toString(16).padStart(2,'0')).join('');
    for(const [state,bg,fg] of [['Default','background','text'],['Hover','hoverBg','hoverText'],['Focus','focusBg','focusText'],['Pressed','pressedBg','pressedText'],['Selected','selectedBg','selectedText'],['Disabled','disabledBg','disabledText'],['Loading','loadingBg','loadingText']]){
      const backgrounds=values.gradient?[values[bg],values.gradientStart,values.gradientEnd]:[values[bg]],ratio=Math.min(...backgrounds.map(c=>contrast(values[fg],blend(c,t.workspace,values.opacity))));
      if(ratio<4.5)warnings.push(state+' text contrast '+ratio.toFixed(2)+':1 is below 4.5:1.');
    }
    if(pair){for(const key of ['background','hoverBg','focusBg','pressedBg','selectedBg','loadingBg'])if((sources[key]?.startsWith('Design')||sources[key]?.startsWith('Parameters'))&&values[key]!==pair[0]){warnings.push('Explicit '+info.category+' fill override: check that its semantic color remains recognizable.');break;}}
    return {descriptor:info,values,sources,warnings};
  }
  function splitSelectors(value){let depth=0,quote='',start=0;const out=[];for(let i=0;i<value.length;i++){const ch=value[i];if(quote){if(ch===quote&&value[i-1]!=='\\')quote='';}else if(ch==='"'||ch==="'")quote=ch;else if(ch==='('||ch==='[')depth++;else if(ch===')'||ch===']')depth--;else if(ch===','&&!depth){out.push(value.slice(start,i).trim());start=i+1;}}out.push(value.slice(start).trim());return out;}
  const selectors={buttons:'button',headers:'.surface-top,.pane-header,.integration-pane-header',panels:'[data-demo-host] section,[data-demo-host] fieldset,[data-demo-host] .demo-card',tabs:'.app-tabs button',navigation:'.deck-nav button,.aperture-dock button,.shelf-app,.portal-location button,button[data-switch-app],button[data-enter-room]',frames:'.owner-surface,.integration-pane,.pane',join:'.btn-join,.btn-enable',leave:'.btn-leave,.btn-disable',warning:'.btn-warning',configuration:'.btn-update',info:'.btn-read',neutral:'.btn-neutral'};
  function compile(design,preset){
    const t=tokens(design,preset),out=[],prefix='body[data-scope-design="true"][data-theme="'+design.theme+'"]';
    const rule=(s,p)=>out.push(splitSelectors(s).map(x=>prefix+' '+x.trim()).join(',')+'{'+p+'}');
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
    const variable=(key,fallback)=>'var(--scope-component-'+key+','+fallback+')';
    const paint=(bg,fg,state='')=>{
      const independent=['disabled','loading'].includes(state),fill=state?variable(state+'Bg',independent?bg:variable('background',bg)):variable('background',bg),ink=state?variable(state+'Text',independent?fg:variable('text',fg)):variable('text',fg);
      return 'background:color-mix(in srgb,'+fill+' calc('+variable('opacity','1')+' * 100%),transparent)!important;background-image:'+variable('gradient','none')+'!important;color:'+ink+'!important';
    };
    // Every control starts a new property scope; header/panel properties cannot leak into child buttons.
    rule('button',colors.concat(['opacity','gradient','gradientAngle']).map(k=>'--scope-component-'+k+':initial').join(';'));
    rule('button',paint(t.raised,t.text)+';border-color:'+variable('border',t.border)+'!important;border-radius:'+t.f.controlRadius+'px;min-height:'+t.f.controlHeight+'px');
    rule('button:hover:not(:disabled)',paint(t.hover,t.text,'hover'));rule('button:active:not(:disabled)',paint(t.pressed,t.text,'pressed'));
    rule('button[aria-pressed="true"],button[aria-selected="true"]',paint(t.selection,t.text,'selected'));
    rule('button:disabled,input:disabled',paint(t.disabled,t.disabledText,'disabled'));
    rule(':focus-visible','outline:3px solid '+variable('focusColor',t.focus)+'!important;outline-offset:3px');
    rule('button:focus-visible:not(:disabled)',paint(t.raised,t.text,'focus'));
    for(const [category,[bg,fg]] of Object.entries(semantic)){
      rule(selectors[category],paint(bg,fg)+';border-color:'+variable('border',bg)+'!important');
      for(const [pseudo,state] of [[':hover:not(:disabled)','hover'],[':focus-visible:not(:disabled)','focus'],[':active:not(:disabled)','pressed'],['[aria-pressed="true"]:not(:disabled)','selected'],['[aria-selected="true"]:not(:disabled)','selected']])rule(splitSelectors(selectors[category]).map(s=>s+pseudo).join(','),paint(bg,fg,state));
    }
    rule('button[aria-busy="true"],button[data-loading="true"]',paint(t.raised,t.text,'loading'));
    const scoped=(category,app)=>selectors[category].split(',').map(s=>app?'[data-owner="'+app+'"] '+s:s).join(',');
    function style(s,v,kind='buttons'){
      const custom=(target,p)=>out.push(splitSelectors(target).map(x=>prefix+'[data-scope-design][data-theme][data-scope-design][data-theme] :where('+x+')').join(',')+'{'+p+'}');
      const props={borderStyle:'border-style',borderWidth:'border-width',radius:'border-radius',topLeft:'border-top-left-radius',topRight:'border-top-right-radius',bottomLeft:'border-bottom-left-radius',bottomRight:'border-bottom-right-radius',paddingX:'padding-inline',paddingY:'padding-block',height:'min-height',minWidth:'min-width',fontSize:'font-size',fontWeight:'font-weight',fontFamily:'font-family',letterSpacing:'letter-spacing',textTransform:'text-transform'};
      const declarations=Object.entries(v).filter(([k])=>props[k]).sort(([a],[b])=>(a==='radius'?-1:b==='radius'?1:0)).map(([k,x])=>props[k]+':'+(x==='pill'?'999':x)+(Object.hasOwn(limits,k)&&!['fontWeight','opacity','gradientAngle'].includes(k)?'px':'')+'!important');
      for(const key of colors)if(v[key])declarations.push('--scope-component-'+key+':'+v[key]+'!important');
      if(v.opacity!==undefined)declarations.push('--scope-component-opacity:'+v.opacity+'!important');
      if(v.gradient!==undefined)declarations.push('--scope-component-gradient:'+(v.gradient?'linear-gradient('+variable('gradientAngle','180deg')+','+variable('gradientStart',variable('background',t.raised))+','+variable('gradientEnd',t.panel)+')':'none')+'!important');
      if(v.gradientAngle!==undefined)declarations.push('--scope-component-gradientAngle:'+v.gradientAngle+'deg!important');
      if(v.elevation)declarations.push('box-shadow:'+({flat:'none',raised:'0 5px 14px #0005',inset:'inset 0 2px 5px #0006'}[v.elevation])+'!important');
      custom(s,declarations.join(';'));
      if(v.icon)custom(splitSelectors(s).map(x=>x+' .icon').join(','),'color:'+variable('icon','currentColor')+'!important');
      if(['headers','panels','frames'].includes(kind))custom(s,(v.background?'background:'+variable('background',t.panel)+'!important;':'')+(v.text?'color:'+variable('text',t.text)+'!important;':'')+(v.border?'border-color:'+variable('border',t.border)+'!important;':''));
    }
    if(preset.surfaceTreatment==='overlay'){
      const alpha=Math.max(.6,Math.min(1,Number(preset.surfaceOpacity)||.95));
      rule('.pane,.integration-pane,[data-demo-host] section,[data-demo-host] fieldset,.shell-context-card,dialog','background:color-mix(in srgb,'+t.panel+' '+alpha*100+'%,transparent)!important;box-shadow:'+t.f.shadow+'!important;border-radius:'+t.f.radius+'px!important');
      rule('button,input,select,textarea','border-radius:'+t.f.controlRadius+'px;font-size:'+design.typography.baseSize+'px!important');
      rule('.surface-identity,[data-demo-host] h2,[data-demo-host] h3,dialog h2','color:'+t.accent+'!important');
    }
    const c=mergeComponents(design);
    const ordered=groups=>Object.entries(groups).sort(([a],[b])=>Number(a!=='buttons')-Number(b!=='buttons'));
    for(const [category,v] of ordered(c.global))style(scoped(category),v,category);
    for(const [category,v] of ordered(c.classes))style(scoped(category),v,category);
    for(const [app,categories] of Object.entries(c.applications))for(const [category,v] of ordered(categories))style(scoped(category,app),v,category);
    for(const [id,v] of Object.entries(c.instances).sort(([a],[b])=>Number(a===canonicalId(a))-Number(b===canonicalId(b))))style('[data-style-id="'+canonicalId(id)+'"][data-style-id][data-style-id]',v);
    out.push('@media(prefers-reduced-motion:reduce){'+prefix+' *{transition:none!important;animation:none!important;scroll-behavior:auto!important}}');
    return out.join('\n');
  }
  const api={families,paletteIds,appIds,categories,componentDefaults,componentPresets,fontFamilies,colors,limits,semantic,componentId,canonicalId,validId,describe,mergeComponents,resolveStyle,validateComponents,validateStyle,tokens,family,contrast,compile};root.ScopeVisuals=api;if(typeof module!=='undefined')module.exports=api;
})(typeof globalThis!=='undefined'?globalThis:this);

/* Version 1 semantic color/effect contract. Old palette IDs/colors remain aliases. */
(function(root){
  'use strict';
  const families={professional:{name:'Professional',description:'Calm layered engineering workstations',radius:8,border:1,blur:0,shadow:'0 5px 16px #0002',font:'Segoe UI',tablePadding:12},technical:{name:'Technical Workbench',description:'Compact instruments and separated working planes',radius:3,border:1,blur:0,shadow:'inset 0 1px #ffffff12',font:'Consolas',tablePadding:8},field:{name:'Field Operations',description:'Matte day / low-glare exploratory field palettes',radius:4,border:2,blur:0,shadow:'none',font:'Arial',tablePadding:14},glass:{name:'Glass and Experimental',description:'Layered/frosted surfaces with optional illumination',radius:18,border:1,blur:18,shadow:'0 12px 28px #0005,inset 0 1px #ffffff26',font:'Segoe UI',tablePadding:12}};
  const roleNames=['canvas','shell.background','shell.header','navigation.background','navigation.selected','navigation.foreground','workspace.background','application.background','application.header','panel.background','panel.header','surface.raised','surface.inset','control.background','control.foreground','control.border','control.hover','control.pressed','control.selected','control.disabled','control.disabledForeground','text.primary','text.secondary','text.muted','border.default','border.strong','focus.ring'];
  const effectDefaults={transparency:true,blur:true,reflections:true,motion:false};
  const familyAliases={'technical-workbench':'technical','field-operations':'field','glass-experimental':'glass'};
  const normalizeFamily=id=>familyAliases[id]||id;
  function familyForPalette(id){if(['disco','ide-workbench','industrial-hmi','slate-cyan'].includes(id))return 'technical';if(['field-day','field-night','neutral-tactical','low-luminance-amber'].includes(id))return 'field';if(['slate-light','graphite-dark','technical-teal','sage-teal','sand-bronze','slate-indigo','civic-blue'].includes(id))return 'professional';return 'glass';}
  function hex(v){if(typeof v!=='string'||!/^#[\da-f]{6}$/i.test(v))throw Error('Theme role colors must be six-digit HEX');return v.toUpperCase();}
  function mix(a,b,amount){return '#'+[0,1,2].map(i=>Math.round(parseInt(a.slice(1+i*2,3+i*2),16)*(1-amount)+parseInt(b.slice(1+i*2,3+i*2),16)*amount).toString(16).padStart(2,'0')).join('').toUpperCase();}
  function contrast(a,b){const l=c=>{const v=c.slice(1).match(/../g).map(x=>parseInt(x,16)/255).map(x=>x<=.04045?x/12.92:((x+.055)/1.055)**2.4);return v[0]*.2126+v[1]*.7152+v[2]*.0722;};const x=l(a),y=l(b);return (Math.max(x,y)+.05)/(Math.min(x,y)+.05);}
  function readable(text,bg){return contrast(text,bg)>=4.5?text:contrast('#EAF1FA',bg)>=contrast('#172536',bg)?'#EAF1FA':'#172536';}
  function legacyTokens(p){
    const c=p.colors,r=p.roles||{},raised=r.raised||c.panel,text=c.text,inset=r.inset||(p.mode==='light'?'#FFFFFF':'#101A25'),selected=r.selection||mix(c.navigation,c.accent,.2),disabled=r.disabled||mix(c.workspace,raised,.65);
    return {canvas:c.background,'shell.background':c.background,'shell.header':c.header,'navigation.background':c.navigation,'navigation.selected':selected,'navigation.foreground':readable(text,selected),'workspace.background':c.workspace,'application.background':c.workspace,'application.header':c.navigation,'panel.background':c.panel,'panel.header':raised,'surface.raised':raised,'surface.inset':inset,'control.background':raised,'control.foreground':readable(text,raised),'control.border':c.border,'control.hover':r.hover||mix(raised,text,.08),'control.pressed':r.pressed||mix(raised,c.accent,.18),'control.selected':selected,'control.disabled':disabled,'control.disabledForeground':readable(r.disabledText||r.muted||text,disabled),'text.primary':text,'text.secondary':r.secondary||(p.mode==='light'?'#344454':'#CBD6E5'),'text.muted':r.muted||(p.mode==='light'?'#405164':'#B9C8DB'),'border.default':c.border,'border.strong':mix(c.border,text,.4),'focus.ring':c.accent};
  }
  function validateVisual(input){
    if(!input||typeof input!=='object'||Array.isArray(input)||input.schemaVersion!==1)throw Error('Unsupported visual role schema; expected version 1');
    for(const key of Object.keys(input))if(!['schemaVersion','tokens','effects'].includes(key))throw Error('Unknown visual setting: '+key);
    const out={schemaVersion:1,tokens:{},effects:{}};
    if(input.tokens!==undefined&&(!input.tokens||typeof input.tokens!=='object'||Array.isArray(input.tokens)))throw Error('Theme token overrides must be an object');
    for(const [key,value] of Object.entries(input.tokens||{})){if(!roleNames.includes(key))throw Error('Unknown theme role: '+key);out.tokens[key]=hex(value);}
    if(input.effects!==undefined&&(!input.effects||typeof input.effects!=='object'||Array.isArray(input.effects)))throw Error('Theme effects must be an object');
    for(const [key,value] of Object.entries(input.effects||{})){if(!Object.hasOwn(effectDefaults,key)||typeof value!=='boolean')throw Error('Invalid theme effect');out.effects[key]=value;}
    return out;
  }
  const aliases={background:['canvas','shell.background'],header:['shell.header'],navigation:['navigation.background','application.header'],workspace:['workspace.background','application.background'],panel:['panel.background','surface.raised','control.background'],accent:['focus.ring'],text:['text.primary','control.foreground'],border:['border.default','control.border']};
  function resolve(design,preset){
    if(preset.tokenSchemaVersion!==undefined&&preset.tokenSchemaVersion!==1)throw Error('Unsupported preset token schema');
    const roles={...legacyTokens(preset)},sources=Object.fromEntries(roleNames.map(k=>[k,'Palette '+preset.id]));
    for(const [key,value] of Object.entries(preset.tokens||{})){if(!roleNames.includes(key))throw Error('Unknown preset role');roles[key]=hex(value);}
    for(const [key,value] of Object.entries(design.colors||{}))for(const role of aliases[key]||[]){roles[role]=hex(value);sources[role]='Legacy color override';}
    const visual=design.visual?validateVisual(design.visual):{tokens:{},effects:{}};
    for(const [key,value] of Object.entries(visual.tokens)){roles[key]=value;sources[key]='Visual role override';}
    const states={hover:{background:roles['control.hover'],foreground:readable(roles['control.foreground'],roles['control.hover'])},pressed:{background:roles['control.pressed'],foreground:readable(roles['control.foreground'],roles['control.pressed'])},selected:{background:roles['control.selected'],foreground:readable(roles['control.foreground'],roles['control.selected'])},disabled:{background:roles['control.disabled'],foreground:roles['control.disabledForeground']}};
    const warnings=[];
    for(const [fg,bg] of [['text.primary','application.background'],['text.primary','panel.background'],['text.primary','shell.header'],['text.secondary','panel.background'],['text.muted','application.background'],['control.foreground','control.background'],['navigation.foreground','navigation.selected']]){const ratio=contrast(roles[fg],roles[bg]);if(ratio<4.5)warnings.push(fg+' on '+bg+': '+ratio.toFixed(2)+':1 (below 4.5:1).');}
    return {schemaVersion:1,theme:preset.id,family:preset.family||'glass',roles,sources,states,effects:{...effectDefaults,...visual.effects},warnings};
  }
  const api={schemaVersion:1,families,roleNames,effectDefaults,normalizeFamily,familyForPalette,legacyTokens,validateVisual,resolve,mix,contrast};root.ScopeTheme=api;if(typeof module!=='undefined')module.exports=api;
})(typeof globalThis!=='undefined'?globalThis:this);

/* Inspector markup is pure; DesignStore and ScopeVisuals own all style state. */
(function(root){
  'use strict';
  const V=root.ScopeVisuals;
  const names={background:'Background',text:'Text / foreground',icon:'Icon',border:'Border color',radius:'Corner radius',topLeft:'Top left',topRight:'Top right',bottomLeft:'Bottom left',bottomRight:'Bottom right',height:'Control height',minWidth:'Minimum width',paddingX:'Horizontal padding',paddingY:'Vertical padding',borderWidth:'Border thickness',fontFamily:'Font family',fontSize:'Font size',fontWeight:'Font weight',letterSpacing:'Letter spacing',textTransform:'Text transform',elevation:'Shadow / elevation',opacity:'Background opacity',gradient:'Gradient overlay',gradientStart:'Gradient start',gradientEnd:'Gradient end',gradientAngle:'Gradient angle',borderStyle:'Border style'};
  function panel(context){
    const {scope,app,category,instance,style,escape:e,resolved,inherited,picking}=context;
    const values=resolved.values,sources=resolved.sources,identity=resolved.descriptor;
    const options=(items,current)=>items.map(item=>{const [value,label]=Array.isArray(item)?item:[item,item];return `<option value="${value}" ${value===current?'selected':''}>${e(label)}</option>`;}).join('');
    const display=v=>v===50||v==='pill'?'pill':typeof v==='boolean'?v?'on':'off':v===undefined?'inherited':String(v);
    function field(key,items){
      const own=Object.hasOwn(style,key),effective=values[key],editable=own?style[key]:effective,id='component-property-'+key,label=names[key]||key.replace(/([A-Z])/g,' $1');let input;
      if(items)input=`<select id="${id}" data-component-property="${key}"><option value="">Inherited (${e(display(inherited.values[key]))})</option>${options(items,own?style[key]:'')}</select>`;
      else if(key==='gradient')input=`<input id="${id}" type="checkbox" data-component-property="${key}" ${editable?'checked':''}>`;
      else if(V.colors.includes(key))input=`<input id="${id}" type="color" data-component-property="${key}" value="${editable||'#334455'}">`;
      else {const [min,max]=V.limits[key],step=key==='opacity'?.05:key==='letterSpacing'?.1:key==='fontWeight'?100:1;input=`<input id="${id}" type="range" data-component-property="${key}" min="${min}" max="${max}" step="${step}" value="${Math.min(max,Math.max(min,Number(editable)||min))}">`;}
      return `<div class="component-property${own?' is-overridden':''}"><label for="${id}">${e(label)} <output>${e(display(effective))}</output></label>${input}<small>${own?'Set here: '+e(display(style[key]))+'; effective source: '+e(sources[key])+'; inherited: '+e(display(inherited.values[key])):'Inherited: '+e(sources[key]||'Family')}</small><button type="button" data-component-reset="${key}" ${own?'':'disabled'} aria-label="Reset ${e(label)} to inherited">Reset property</button></div>`;
    }
    const group=(title,keys)=>`<details class="component-group"><summary>${title}</summary>${keys.map(k=>Array.isArray(k)?field(k[0],k[1]):field(k)).join('')}</details>`;
    const appOptions=app==='shell'?[['shell','Shell — global or instance scope'],...V.appIds]:V.appIds;
    let h=`<details class="component-editor"><summary>Component Styles</summary><h3>${e(context.label||identity.label||'Button styles')}</h3><p class="component-identity"><code>${e(instance||identity.id||'application.button')}</code><br>Owner: ${e(identity.app==='shell'?'SCOPE shell':context.appName||identity.app)}<br>Family → Palette → Global component → Application → Individual override</p><label for="component-scope">Override scope</label><select id="component-scope" data-component-control="scope">${options([['global','All components in category'],['classes','Component class (all applications)'],['applications','Application component class'],['instances','Individual semantic component']],scope)}</select><label for="component-category">Component category</label><select id="component-category" data-component-control="category">${options(V.categories,category)}</select><label for="component-application">Application</label><select id="component-application" data-component-control="app">${options(appOptions,app)}</select><div class="component-pick-controls"><button type="button" data-action="pick-component" aria-pressed="${Boolean(picking)}">${picking?'Exit selection mode':'Pick component in preview'}</button><p class="hint">${picking?'Click an eligible control to select it. Escape exits. Selection clicks do not execute the application action.':'Eligible controls have stable semantic IDs. Application operations remain unchanged.'}</p></div><div class="component-presets" role="group" aria-label="Reusable component presets">${Object.entries(V.componentPresets).map(([id,preset])=>`<button type="button" data-component-preset="${id}">${e(preset.name)}</button>`).join('')}</div>`;
    h+=group('Geometry',['radius','topLeft','topRight','bottomLeft','bottomRight','height','minWidth','paddingX','paddingY','borderWidth',['borderStyle',['solid','dashed','dotted']]]);
    h+=group('Appearance',['background','text','icon','border',['elevation',['flat','raised','inset']],'opacity','gradient','gradientStart','gradientEnd','gradientAngle']);
    h+=group('Typography',[['fontFamily',V.fontFamilies],'fontSize','fontWeight','letterSpacing',['textTransform',['none','uppercase','lowercase','capitalize']]]);
    for(const [state,keys] of [['Hover',['hoverBg','hoverText']],['Focus',['focusBg','focusText','focusColor']],['Pressed',['pressedBg','pressedText']],['Selected',['selectedBg','selectedText']],['Disabled',['disabledBg','disabledText']],['Loading',['loadingBg','loadingText']]])h+=group(state,keys);
    h+=`<div class="component-reset-controls"><button data-action="reset-component">Reset to Inherited</button><button data-action="reset-semantic-component">Reset Component</button><button data-action="reset-all-components">Reset All Overrides</button></div><div class="component-warnings" role="status">${resolved.warnings.map(w=>`<p>△ ${e(w)}</p>`).join('')}</div><p class="hint">Geometry presets do not change semantic colors. Intentional color overrides may reduce contrast or obscure Join / Leave / Warning / Configuration meaning. Labels and symbols are retained.</p></details>`;
    return h;
  }
  function shellPanel(design,preset,e){
    const labels={chrome:'Shell chrome',dialogs:'Shell dialogs',buttons:'Buttons',tabs:'Tabs / navigation',panels:'Panels / cards',typography:'Typography',inputs:'Inputs / selects',success:'Status: success',warning:'Status: warning',error:'Status: error',neutral:'Status: neutral'};
    let html='<details class="shell-component-editor"><summary>Shell Component Editor (Phase 1)</summary><p class="hint">Theme ? parameter defaults ? component override. These controls style the SCOPE shell only. Application forms, dialogs and stores retain their ownership.</p>';
    for(const [category,keys] of Object.entries(V.shellFields)){
      const {values,sources}=V.resolveShellStyle(design,preset,category),own=design.shellComponents?.[category]||{};
      html+='<details class="shell-component-group"><summary>'+labels[category]+'</summary>';
      for(const key of keys){
        const id='shell-style-'+category+'-'+key,data='data-shell-category="'+category+'" data-shell-property="'+key+'"',value=values[key];let input;
        const choices=key==='fontFamily'?V.fontFamilies:key==='elevation'?['flat','soft','raised','inset','luminous']:null;
        if(choices)input='<select id="'+id+'" '+data+'>'+choices.map(x=>'<option value="'+x+'" '+(x===value?'selected':'')+'>'+e(x)+'</option>').join('')+'</select>';
        else if(V.colors.includes(key))input='<input id="'+id+'" type="color" '+data+' value="'+value+'">';
        else {const [min,max]=V.shellLimits[key],step=key==='opacity'?.05:key==='fontWeight'?100:1;input='<input id="'+id+'" type="range" '+data+' min="'+min+'" max="'+max+'" step="'+step+'" value="'+(value==='pill'?24:value)+'">';}
        html+='<div class="component-property"><label for="'+id+'">'+e(names[key]||({spacing:'Navigation spacing',headingSize:'Heading size'})[key]||key)+' <output id="'+id+'-value">'+e(String(value))+'</output></label>'+input+'<small id="'+id+'-source">'+e(sources[key])+'</small><button type="button" data-shell-reset="'+category+'" data-shell-key="'+key+'" '+(Object.hasOwn(own,key)||Object.hasOwn(design.parameters?.shellComponents?.[category]||{},key)?'':'disabled')+'>Reset to theme</button></div>';
      }
      html+='<button type="button" data-shell-reset="'+category+'">Reset '+labels[category]+' to theme</button></details>';
    }
    return html+'<button type="button" data-shell-reset="all">Reset all shell components to theme</button></details>';
  }
  root.ScopeComponentEditor={panel,shellPanel};
})(typeof globalThis!=='undefined'?globalThis:this);

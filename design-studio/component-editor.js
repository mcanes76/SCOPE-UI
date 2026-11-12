/* Pure inspector markup and property paths; state remains in DesignStore. */
(function(root){
  const V=root.ScopeVisuals;
  function panel(context){
    const {scope,app,category,instance,style,escape:e}=context;
    const options=(values,current)=>values.map(v=>`<option value="${v}" ${v===current?'selected':''}>${e(v)}</option>`).join('');
    let h=`<details class="component-editor"><summary>Component styles &amp; button geometry</summary><p class="hint">Family → Palette → Component class → Application → Instance. Overrides change appearance only.</p><label>Override scope<select data-component-control="scope">${options(['global','classes','applications','instances'],scope)}</select></label><label>Component category<select data-component-control="category">${options(V.categories,category)}</select></label><label>Application<select data-component-control="app">${options(V.appIds,app)}</select></label><p class="hint">Instance: ${e(instance||'Choose Pick a button, then click one in the preview.')}</p><button data-action="pick-component">Pick a button in preview</button><label>Geometry preset<select data-component-geometry><option value="">Custom / inherited</option>${options(['square','slight','rounded','pill'],'')}</select></label>`;
    for(const key of ['background','text','icon','border','hoverBg','hoverText','focusColor','pressedBg','selectedBg','disabledBg','disabledText'])h+=`<label>${key}<input type="color" data-component-property="${key}" value="${style[key]||(['text','icon','hoverText','disabledText'].includes(key)?'#EAF2FA':'#344B65')}"></label>`;
    for(const [key,[min,max]] of Object.entries(V.limits))h+=`<label>${key}<output>${style[key]??'inherited'}</output><input type="range" data-component-property="${key}" min="${min}" max="${max}" step="${key==='fontWeight'?100:1}" value="${style[key]??(key==='height'?40:key==='fontSize'?15:key==='fontWeight'?500:8)}"></label>`;
    for(const [key,values] of [['borderStyle',['solid','dashed']],['fontFamily',['system-ui','Segoe UI','Arial','Georgia','Consolas','Trebuchet MS']],['elevation',['flat','raised','inset']]])h+=`<label>${key}<select data-component-property="${key}"><option value="">Inherited</option>${options(values,style[key])}</select></label>`;
    return h+'<button data-action="reset-component">Reset to Inherited Style</button><p class="hint">Changing fills can obscure green Join, red Leave, yellow Warning or purple Configuration. Labels and symbols remain unchanged. Inspect contrast after overrides.</p></details>';
  }
  root.ScopeComponentEditor={panel};
})(typeof globalThis!=='undefined'?globalThis:this);

/* Export composition is pure and testable; acquisition/download stay at the edge. */
(function(root){
  'use strict';
  const C=root.ScopeDesign;
  const escape=value=>String(value).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const json=value=>JSON.stringify(value).replace(/</g,'\\u003c');
  function css(design,presets){const d=C.validate(design),p=presets.find(p=>p.id===d.theme);return '/* Selected material: '+p.name+'; body[data-look="'+p.engineLook+'"]. Shell: '+d.navigation+'. Requires the existing engine stylesheet and markup. */\n'+C.compileCSS(d);}
  function summary(design,presets,params){
    const d=C.validate(design),p=presets.find(p=>p.id===d.theme);
    return `<!doctype html><html lang="en"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${escape(d.name)} / Design decisions</title><style>body{font:16px/1.65 system-ui,sans-serif;max-width:960px;margin:40px auto;padding:24px;color:#17283b;background:#f5f8fb}h1{font-size:32px}h2{margin-top:32px;font-size:21px}dt{font-weight:700}dd{margin:0 0 12px}pre{white-space:pre-wrap;overflow-wrap:anywhere;font-size:12px;background:#e6edf4;padding:20px;border-radius:8px}.note{white-space:pre-wrap}button{padding:10px 18px}@media print{body{background:white;margin:0}button{display:none}h2{break-after:avoid}pre{font-size:10px}}</style><button onclick="window.print()">Print / Save PDF</button><p>${escape(params.branding?.name||'SCOPE')} / DESIGN STUDIO · SCHEMA 1</p><h1>${escape(d.name)}</h1><dl><dt>Navigation</dt><dd>${escape(params.labels?.shells?.[d.navigation]||d.navigation)}</dd><dt>Material</dt><dd>${escape(p.name)}</dd><dt>Typography</dt><dd>${escape(d.typography.family)} · ${d.typography.baseSize}px · ${d.typography.density}</dd><dt>Arrangement</dt><dd>${escape(d.layout.mode)} · ${d.layout.workspacePadding}px workspace padding · ${d.layout.panelGap}px panel spacing</dd></dl><h2>Customer decisions</h2>${Object.entries(d.notes).map(([key,note])=>`<h3>${escape(key)}</h3><p class="note">${escape(note||'No comment recorded.')}</p>`).join('')}<h2>Reproducible design configuration</h2><pre>${escape(JSON.stringify(d,null,2))}</pre><p>Shell design exploration. Application internals and semantic operational colors remain owned by the existing mockup. Final HTML exports begin a fresh local simulation.</p></html>`;
  }
  function composeFinal(resources,design,presets){
    const d=C.validate(design);d.detailsVisible=true;
    const params=C.clone(resources.params);params.logoPath=resources.logo;
    let html=resources.html.replace(/\/\* SCOPE_STUDIO_LOADER_START[\s\S]*?\/\* SCOPE_STUDIO_LOADER_END \*\//,'');
    html=html.replace('<link rel="stylesheet" href="styles.css">',()=>'<style>'+resources.css+'</style>');
    let replaced=false;
    html=html.replace(/const DefaultPresentationConfig=[\s\S]*?;\s*let appConfig=/,()=>{replaced=true;return 'const DefaultPresentationConfig='+json(params)+';\n    let appConfig=';});
    if(!replaced||html.includes('href="styles.css"'))throw Error('Baseline export markers changed; export stopped to avoid an incomplete mockup.');
    html=html.replace(/void loadPresentationConfig\(\);/,'/* Presentation configuration embedded in this standalone export. */');
    html=html.replaceAll('src="assets/logo.png"','src="'+resources.logo+'"').replaceAll("'assets/scope-logo.svg'",JSON.stringify(resources.fallback));
    const safeScript=s=>s.replace(/<\/script/gi,'<\\/script');
    const bootstrap='window.ScopePreviewRuntime.apply('+json(d)+','+json(presets)+',{presentation:true,editing:false});';
    html=html.replace('</body>',()=>'<script>'+safeScript(resources.core)+'</script><script>'+safeScript(resources.runtime)+'</script><script>'+bootstrap+'</script></body>');
    if(!html.includes(bootstrap)||/src="\.\.\/design-studio\//.test(html))throw Error('Standalone export assembly failed');
    return html;
  }
  async function fetchText(url){const r=await fetch(url,{cache:'no-store'});if(!r.ok)throw Error('Cannot embed '+url);return r.text();}
  async function dataURL(url){const r=await fetch(url,{cache:'no-store'});if(!r.ok)throw Error('Logo unavailable');const blob=await r.blob();return new Promise((resolve,reject)=>{const reader=new FileReader();reader.onload=()=>resolve(reader.result);reader.onerror=reject;reader.readAsDataURL(blob);});}
  async function finalHTML(design,presets){
    const [html,style,core,runtime,config,fallback]=await Promise.all([fetchText('../mockups/scope-integrated-electric-glass.html'),fetchText('../mockups/styles.css'),fetchText('design-core.js'),fetchText('preview-runtime.js'),fetchText('../mockups/params.json'),dataURL('../mockups/assets/scope-logo.svg')]);
    const params=JSON.parse(config);let logo=fallback;const path=params.logoPath||'assets/logo.png';
    if(!/^(?:[a-z][a-z0-9+.-]*:|\/|\\)/i.test(path)&&!path.includes('\\'))try{logo=await dataURL(new URL(path,new URL('../mockups/',location.href)));}catch{}
    return composeFinal({html,css:style,core,runtime,params,logo,fallback},design,presets);
  }
  function download(content,name,type){const blob=new Blob([content],{type:type+';charset=utf-8'}),url=URL.createObjectURL(blob),a=document.createElement('a');a.href=url;a.download=name;document.body.append(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),1000);}
  const api={css,summary,composeFinal,finalHTML,download};root.ScopeExports=api;if(typeof module!=='undefined')module.exports=api;
})(typeof globalThis!=='undefined'?globalThis:this);

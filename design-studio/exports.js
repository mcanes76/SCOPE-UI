/* Export composition is pure and testable; acquisition/download stay at the edge. */
(function(root){
  'use strict';
  const C=root.ScopeDesign;
  const escape=value=>String(value).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const json=value=>JSON.stringify(value).replace(/</g,'\\u003c');
  function css(design,presets){const d=C.validate(design),p=presets.find(p=>p.id===d.theme);return '/* Selected material: '+p.name+'; body[data-theme="'+d.theme+'"][data-look="'+p.engineLook+'"][data-scope-design="true"]. Shell: '+d.navigation+'. Load after the included engine stylesheet. */\n'+C.compileDesign(d,p);}
  function summary(design,presets,params){
    params={...params,branding:{...params.branding,...design.parameters?.branding}};
    const d=C.validate(design),p=presets.find(p=>p.id===d.theme);
    return `<!doctype html><html lang="en"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${escape(d.name)} / Design decisions</title><style>body{font:16px/1.65 system-ui,sans-serif;max-width:960px;margin:40px auto;padding:24px;color:#17283b;background:#f5f8fb}h1{font-size:32px}h2{margin-top:32px;font-size:21px}dt{font-weight:700}dd{margin:0 0 12px}pre{white-space:pre-wrap;overflow-wrap:anywhere;font-size:12px;background:#e6edf4;padding:20px;border-radius:8px}.note{white-space:pre-wrap}button{padding:10px 18px}@media print{body{background:white;margin:0}button{display:none}h2{break-after:avoid}pre{font-size:10px}}</style><button onclick="window.print()">Print / Save PDF</button><p>${escape(params.branding?.name||'SCOPE')} / DESIGN STUDIO · SCHEMA 1</p><h1>${escape(d.name)}</h1><dl><dt>Navigation</dt><dd>${escape(params.labels?.shells?.[d.navigation]||d.navigation)}</dd><dt>Material</dt><dd>${escape(p.name)}</dd><dt>Typography</dt><dd>${escape(d.typography.family)} · ${d.typography.baseSize}px · ${d.typography.density}</dd><dt>Arrangement</dt><dd>${escape(d.layout.mode)} · ${d.layout.workspacePadding}px workspace padding · ${d.layout.panelGap}px panel spacing</dd></dl><h2>Customer decisions</h2>${Object.entries(d.notes).map(([key,note])=>`<h3>${escape(key)}</h3><p class="note">${escape(note||'No comment recorded.')}</p>`).join('')}<h2>Reproducible design configuration</h2><pre>${escape(JSON.stringify(d,null,2))}</pre><p>Shell design exploration. Application internals and semantic operational colors remain owned by the existing mockup. Final HTML exports begin a fresh local simulation.</p></html>`;
  }
  function composeFinal(resources,design,presets,options={}){
    const d=C.validate(design);if(!options.preview)d.detailsVisible=true;
    const params=C.clone(resources.params);params.logoPath=resources.logo;
    let html=resources.html.replace(/\/\* SCOPE_STUDIO_LOADER_START[\s\S]*?\/\* SCOPE_STUDIO_LOADER_END \*\//,'');
    html=html.replace('<link rel="stylesheet" href="styles.css">',()=>'<style>'+resources.css+'</style>');
    let replaced=false;
    html=html.replace(/const DefaultPresentationConfig=[\s\S]*?;\s*let appConfig=/,()=>{replaced=true;return 'const DefaultPresentationConfig='+json(params)+';\n    let appConfig=';});
    if(!replaced||html.includes('href="styles.css"'))throw Error('Baseline export markers changed; export stopped to avoid an incomplete mockup.');
    html=html.replace(/void loadPresentationConfig\(\);/,'/* Presentation configuration embedded in this standalone export. */');
    // Detached windows made from an embedded preview receive their launch state
    // in generated markup; ordinary file/HTTP query parameters still work.
    html=html.replace("const value=params.get('scopeWindow');","const value=window.ScopePortableWindow?String(window.ScopePortableWindow.app):params.get('scopeWindow');");
    html=html.replace("const look=params.get('look');","const look=window.ScopePortableWindow?.look||params.get('look');");
    html=html.replace("const shell=Number(params.get('shell'));","const shell=Number(window.ScopePortableWindow?.shell??params.get('shell'));");
    html=html.replaceAll('src="assets/logo.png"','src="'+resources.logo+'"').replaceAll("'assets/scope-logo.svg'",JSON.stringify(resources.fallback));
    const safeScript=s=>s.replace(/<\/script/gi,'<\\/script');
    const bootstrap='window.ScopePreviewRuntime.apply('+json(d)+','+json(presets)+',{presentation:'+(!options.preview)+',editing:false});';
    html=html.replace('</body>',()=>'<script>'+safeScript(resources.core)+'</script><script>'+safeScript(resources.runtime)+'</script><script>'+bootstrap+'</script></body>');
    if(!html.includes(bootstrap)||/src="\.\.\/design-studio\//.test(html)||html.includes('class="studio-header"')||html.includes('id="studio-layout"'))throw Error('Standalone export assembly failed: Studio UI found in operator artifact');
    return html;
  }
  async function fetchText(url){const r=await fetch(url,{cache:'no-store'});if(!r.ok)throw Error('Cannot embed '+url);return r.text();}
  async function dataURL(url){const r=await fetch(url,{cache:'no-store'});if(!r.ok)throw Error('Logo unavailable');const blob=await r.blob();return new Promise((resolve,reject)=>{const reader=new FileReader();reader.onload=()=>resolve(reader.result);reader.onerror=reject;reader.readAsDataURL(blob);});}
  async function finalHTML(design,presets){
    if(root.ScopeOfflineAssets)return composeFinal(root.ScopeOfflineAssets.resources,design,presets);
    const [html,style,core,runtime,config,fallback]=await Promise.all([fetchText('../mockups/scope-integrated-electric-glass.html'),fetchText('../mockups/styles.css'),fetchText('design-core.js'),fetchText('preview-runtime.js'),fetchText('../mockups/params.json'),dataURL('../mockups/assets/scope-logo.svg')]);
    const params=JSON.parse(config);let logo=fallback;const path=params.logoPath||'assets/logo.png';
    if(!/^(?:[a-z][a-z0-9+.-]*:|\/|\\)/i.test(path)&&!path.includes('\\'))try{logo=await dataURL(new URL(path,new URL('../mockups/',location.href)));}catch{}
    const extra=await Promise.all(['visual-system.js','parameters.js','operator-runtime.js','embedded-windows.js','theme-tokens.js'].map(fetchText));
    return composeFinal({html,css:style,core:extra[4]+'\n'+extra[0]+'\n'+extra[1]+'\n'+core,runtime:extra[2]+'\n'+runtime+'\nwindow.ScopePortablePresets='+json(presets)+';\n'+extra[3],params,logo,fallback},design,presets);
  }
  async function folder(design,presets){
    const P=root.ScopeParameters||(typeof require==='function'?require('./parameters.js'):null);
    const base=root.ScopeOfflineAssets?.resources.params||JSON.parse(await fetchText('../mockups/params.json'));
    const params=P.validate({...base,...design.parameters,initial:{theme:design.theme,navigation:design.navigation,mode:design.layout.mode,left:design.operator?.left||'blos',right:design.operator?.right||'display'},allowedModes:design.operator?.allowed||['single','split','popout']});
    const asset=design.parameters?.logoPath?.startsWith('data:image/')?design.parameters.logoPath:root.ScopeOfflineAssets?.resources.logo||await dataURL('../mockups/assets/logo.png');
    const extension=asset.startsWith('data:image/svg+xml')?'svg':asset.startsWith('data:image/jpeg')?'jpg':asset.startsWith('data:image/webp')?'webp':asset.startsWith('data:image/gif')?'gif':'png';const logoFile='assets/logo.'+extension;params.logoPath=logoFile;
    let html=await finalHTML(design,presets);
    html=html.replace('<head>','<head><script data-scope-folder-params>window.ScopeFolderPackage=true;</script>');
    html=html.replace('</body>','<script data-scope-folder-params>if(["http:","https:"].includes(location.protocol))fetch("params.json",{cache:"no-store"}).then(r=>{if(!r.ok)throw Error("params.json unavailable");return r.json()}).then(p=>window.ScopeOperator.importParameters(p)).catch(e=>{document.getElementById("operator-feedback").textContent=e.message;});</script></body>');
    const bytes=Uint8Array.from(atob(asset.split(',')[1]),c=>c.charCodeAt(0));
    const archive=root.ScopeArchive||(typeof require==='function'?require('./archive.js'):null);
    return archive.zip({'index.html':html,'params.json':JSON.stringify(params,null,2),[logoFile]:bytes,'README.txt':'SCOPE configurable mockup\nExtract this folder. Edit params.json and replace assets/logo.png.\nServe this extracted folder over local HTTP, e.g. python -m http.server 8080 --bind 127.0.0.1, then open http://127.0.0.1:8080/.\nDirect file launch uses embedded defaults; use Import Parameters JSON and Import Logo Image when no server is available.\nPop-ups use independent simulations; no cross-window model synchronization is claimed.\n'});
  }
  function download(content,name,type){const blob=new Blob([content],{type:type+';charset=utf-8'}),url=URL.createObjectURL(blob),a=document.createElement('a');a.href=url;a.download=name;document.body.append(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),1000);}
  const api={css,summary,composeFinal,finalHTML,folder,download};root.ScopeExports=api;if(typeof module!=='undefined')module.exports=api;
})(typeof globalThis!=='undefined'?globalThis:this);

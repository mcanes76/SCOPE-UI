/* Developer-only packaging. Customers receive the generated HTML alone.
 * Run: node scripts/build-standalone.cjs
 * Review first: node scripts/build-standalone.cjs --output .validation/candidate.html
 */
'use strict';
const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto');
const root=path.resolve(__dirname,'..');
const C=require('../design-studio/design-core.js');globalThis.ScopeDesign=C;
const E=require('../design-studio/exports.js');
const read=rel=>fs.readFileSync(path.join(root,rel),'utf8');
const parse=rel=>{try{return JSON.parse(read(rel));}catch(error){throw Error(rel+': '+error.message);}};
const encodeJSON=value=>JSON.stringify(value).replace(/</g,'\\u003c');
const inlineScript=text=>'<script>'+text.replace(/\r\n/g,'\n').replace(/<\/script/gi,'<\\/script')+'</script>';
function resources(){
  const params=parse('mockups/params.json'),presets=parse('design-studio/theme-presets.json');
  const fallback='data:image/svg+xml;base64,'+fs.readFileSync(path.join(root,'mockups/assets/scope-logo.svg')).toString('base64');
  let logo=fallback;const configured=params.logoPath||'assets/logo.png';
  if(!/^(?:[a-z][a-z0-9+.-]*:|\/|\\)/i.test(configured)&&!configured.includes('\\')){
    const file=path.resolve(root,'mockups',configured);
    if(!file.startsWith(root+path.sep))throw Error('Configured logo must stay inside the repository');
    if(fs.existsSync(file)){
      const types={'.png':'image/png','.svg':'image/svg+xml','.jpg':'image/jpeg','.jpeg':'image/jpeg','.webp':'image/webp','.gif':'image/gif'};
      const mime=types[path.extname(file).toLowerCase()];if(!mime)throw Error('Unsupported configured logo image type');
      logo='data:'+mime+';base64,'+fs.readFileSync(file).toString('base64');
    }
  }
  const runtime=read('design-studio/operator-runtime.js')+'\n'+read('design-studio/preview-runtime.js')+'\nwindow.ScopePortablePresets='+encodeJSON(presets.presets)+';\n'+read('design-studio/embedded-windows.js');
  return {html:read('mockups/scope-integrated-electric-glass.html'),css:read('mockups/styles.css'),core:['theme-tokens.js','visual-system.js','parameters.js','design-core.js'].map(f=>read('design-studio/'+f)).join('\n'),runtime,params,logo,fallback};
}
function build(options={}){
  const themes=parse('design-studio/theme-presets.json'),initial=C.validate(parse('design-studio/design-config.json'));
  if(![1,2].includes(themes.schemaVersion))throw Error('Unsupported palette catalog version');
  const ids=new Set();
  for(const p of themes.presets){
    if(ids.has(p.id))throw Error('Duplicate palette ID: '+p.id);ids.add(p.id);
    if(!Object.hasOwn(globalThis.ScopeTheme.families,p.family))throw Error('Unknown palette family: '+p.family);
    if(themes.schemaVersion===2&&(p.tokenSchemaVersion!==1||globalThis.ScopeTheme.roleNames.some(key=>!Object.hasOwn(p.tokens||{},key))))throw Error('Incomplete version 2 palette roles: '+p.id);
  }
  for(const p of themes.presets){C.validate({...C.defaults,theme:p.id,colors:p.colors,material:p.material,typography:p.typography});globalThis.ScopeTheme.resolve(C.defaults,p);}
  const payload={version:1,themes,initial,resources:resources(),bridge:read('design-studio/preview-bridge.js'),help:read('design-studio/README.html')};
  let html=read('design-studio/index.html');
  html=html.replace(/<script defer src="[^"]+"><\/script>/g,'');
  html=html.replace('<link rel="stylesheet" href="studio.css">',()=>'<style>'+read('design-studio/studio.css')+'</style>');
  html=html.replace('href="../mockups/assets/scope-logo.svg"','href="'+payload.resources.fallback+'"').replace('src="../mockups/assets/logo.png"','src="'+payload.resources.logo+'"');
  html=html.replace('</body>',()=>'<script type="application/json" id="scope-offline-assets">'+encodeJSON(payload)+'</script>'+inlineScript("window.ScopeOfflineAssets=JSON.parse(document.getElementById('scope-offline-assets').textContent);")+['theme-tokens.js','visual-system.js','parameters.js','design-core.js','archive.js','exports.js','offline.js','component-editor.js','studio.js'].map(file=>inlineScript(read('design-studio/'+file))).join('')+'</body>');
  // Verify preview assembly now; never ship a bundle with drifted engine markers.
  E.composeFinal(payload.resources,initial,themes.presets,{preview:true});
  const destination=options.output?path.resolve(root,options.output):path.join(root,'dist','SCOPE-Design-Studio.html');fs.mkdirSync(path.dirname(destination),{recursive:true});fs.writeFileSync(destination,html,'utf8');
  return {file:destination,bytes:Buffer.byteLength(html),sha256:crypto.createHash('sha256').update(html).digest('hex'),navigationModels:C.navigation.length,themes:themes.presets.length};
}
module.exports={build,resources};if(require.main===module){const args=process.argv.slice(2);if(args.length&&!(args.length===2&&args[0]==='--output'))throw Error('Usage: node scripts/build-standalone.cjs [--output path]');console.log(JSON.stringify(build({output:args[1]}),null,2));}

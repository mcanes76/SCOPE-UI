/* Checks the corrected distribution against modular source without writing dist.
 * Run: node docs/assets/validate-source-sync.cjs [--reference path/to/reference.html]
 * Controlled DOM fixtures exercise real handlers; this is not browser validation.
 */
'use strict';
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict'),crypto=require('node:crypto');
const root=path.resolve(__dirname,'../..'),builder=require('../../scripts/build-standalone.cjs');
const C=require('../../design-studio/design-core.js'),V=require('../../design-studio/visual-system.js');globalThis.ScopeDesign=C;
const E=require('../../design-studio/exports.js'),fixtures=require('./validate-design-studio.cjs');
const args=process.argv.slice(2);if(args.length&&!(args.length===2&&args[0]==='--reference'))throw Error('Usage: node docs/assets/validate-source-sync.cjs [--reference path]');
const reference=path.resolve(root,args[1]||'dist/SCOPE-Design-Studio.html'),original=fs.readFileSync(reference),distBefore=fs.readFileSync(path.join(root,'dist/SCOPE-Design-Studio.html'));
const built=builder.build({output:'.validation/source-sync/verified-candidate.html'}),candidate=fs.readFileSync(built.file);
assert(candidate.equals(original),'Source build differs from the corrected reference; dist was not changed');
const html=candidate.toString('utf8'),payload=JSON.parse(html.match(/<script type="application\/json" id="scope-offline-assets">([\s\S]*?)<\/script>/)[1]);
const presets=payload.themes.presets,fonts=['system-ui','Segoe UI','Arial','Aptos','Calibri','Tahoma','Verdana','Trebuchet MS','Bahnschrift','Georgia','Consolas','Courier New','Lucida Console','Arial Narrow'];
const markup=h=>h.replace(/<script(?:\s[^>]*)?>[\s\S]*?<\/script>/g,'');
function operatorOnly(h){const m=markup(h);for(const marker of ['id="studio-layout"','class="studio-header','data-mode="guided"','data-mode="advanced"','id="steps"','id="presentation-actions"'])assert(!m.includes(marker),'Studio UI leaked into operator export: '+marker);assert(!/<(?:link|script|img)[^>]*(?:src|href)="(?!data:|#)/.test(m),'Unresolved operator asset');}
for(const font of fonts){
  const d=C.validate({...C.defaults,typography:{...C.defaults.typography,family:font},components:{global:{buttons:{fontFamily:font}}}});
  assert.deepEqual(C.validate(JSON.parse(JSON.stringify(d))),d);assert.equal(V.validateStyle({fontFamily:font}).fontFamily,font);
  const output=E.composeFinal(payload.resources,d,presets);operatorOnly(output);
  const engine=fixtures.engineFixture(true,output);assert.equal(engine.window.ScopePreviewRuntime.snapshot().typography.family,font);assert.equal(engine.window.ScopePreviewRuntime.snapshot().components.global.buttons.fontFamily,font);
  assert(engine.elements.get('#scope-design-overrides').textContent.includes('font-family:"'+font+'"'));
}
assert.throws(()=>E.composeFinal({...payload.resources,html:payload.resources.html.replace('</body>','<main id="studio-layout"></main></body>')},C.defaults,presets),/Studio UI found/);

// Model document cloning from an already-rendered operator DOM. The old bug
// retained these nodes, then runtime startup inserted another toolbar.
function installClone(engine,source){
  const stale='<nav class="operator-bar" data-sync-fixture="toolbar">Existing toolbar</nav><button class="operator-divider" data-sync-fixture="divider">Divider</button>';
  const dom=source.replace('</body>',stale+'</body>');
  engine.document.documentElement={cloneNode(){
    let copy=dom;const nodes=[];
    const clone={
      querySelectorAll(selector){const remove=[];
        function match(re){for(const m of copy.matchAll(re))remove.push({remove(){copy=copy.replace(m[0],'');}});}
        if(selector.includes('.operator-bar'))match(/<nav class="operator-bar" data-sync-fixture="toolbar">[\s\S]*?<\/nav>/g);
        if(selector.includes('.operator-divider'))match(/<button class="operator-divider" data-sync-fixture="divider">[\s\S]*?<\/button>/g);
        for(const name of ['data-scope-preview-bridge','data-scope-saved-config','data-scope-folder-params','data-scope-portable-launch'])if(selector.includes(name))match(new RegExp('<script '+name+'(?:="")?>[\\s\\S]*?<\\/script>','g'));
        return remove;
      },
      querySelector(name){return name==='head'?{prepend:el=>nodes.unshift(['head',el])}:{append:el=>nodes.push(['body',el])};},
      get outerHTML(){let out=copy;for(const [where,el] of nodes){const attributes=Object.keys(el.dataset||{}).map(k=>' data-'+k.replace(/[A-Z]/g,c=>'-'+c.toLowerCase())+'=""').join('');const script='<script'+attributes+'>'+el.textContent+'</script>';out=where==='head'?out.replace('<head>','<head>'+script):out.replace('</body>',script+'</body>');}return out;}
    };return clone;
  }};
}
(async()=>{
  const design=C.validate({...C.defaults,theme:'disco',typography:{...C.defaults.typography,family:'Aptos'},parameters:{branding:{name:'Corrected Customer Console'},applications:{blos:{name:'Link Manager'}}},operator:{left:'blos',right:'display',ratio:55,allowed:['single','split','popout']}});
  const output=E.composeFinal(payload.resources,design,presets);operatorOnly(output);
  const parent=fixtures.engineFixture(true,output);installClone(parent,output);
  for(let index=0;index<4;index++){
    const url=parent.run('appWindowURL('+index+')'),childHTML=await(await fetch(url)).text();operatorOnly(childHTML);
    assert(!markup(childHTML).includes('data-sync-fixture'),'Existing toolbar/divider retained by pop-out clone');
    const child=fixtures.engineFixture(true,childHTML);assert.equal(child.insertions.filter(n=>n.className==='operator-bar').length,1);assert.equal(child.run('detachedContext.app'),index);assert.equal(child.window.ScopePreviewRuntime.snapshot().typography.family,'Aptos');assert.equal(child.run('appConfig.branding.name'),'Corrected Customer Console');assert.equal(child.run('apps[0].name'),'Link Manager');assert.equal(child.run('appConfig.logoPath'),payload.resources.logo);
    // A second generation must also strip the previous rendered toolbar.
    installClone(child,childHTML);const secondURL=child.run('appWindowURL('+index+')'),secondHTML=await(await fetch(secondURL)).text();assert(!markup(secondHTML).includes('data-sync-fixture'));const second=fixtures.engineFixture(true,secondHTML);assert.equal(second.insertions.filter(n=>n.className==='operator-bar').length,1);URL.revokeObjectURL(secondURL);URL.revokeObjectURL(url);
  }
  // Exercise Save Updated Mockup's real handler and Blob download, not a copy.
  const button=new parent.Element();button.dataset={operator:'save-html'};
  for(const fn of parent.listeners.click)await fn({target:button,preventDefault(){},stopImmediatePropagation(){}});
  const saved=parent.downloads.find(d=>d.name==='SCOPE-Operator-Configured.html');assert(saved,'Updated operator filename missing');
  const configuredHTML=await(await fetch(saved.href)).text();operatorOnly(configuredHTML);assert(!markup(configuredHTML).includes('data-sync-fixture'));const configured=fixtures.engineFixture(true,configuredHTML);assert.equal(configured.insertions.filter(n=>n.className==='operator-bar').length,1);assert.equal(configured.window.ScopePreviewRuntime.snapshot().typography.family,'Aptos');URL.revokeObjectURL(saved.href);
  const editor=await fixtures.editorFixture(payload),standalone=editor.downloaded.find(d=>d[1]==='SCOPE-Operator-Standalone.html');assert(standalone);operatorOnly(standalone[0]);
  await editor.click({step:'3'});for(const font of fonts)assert(editor.get('controls').innerHTML.includes('value="'+font+'"'),'Missing Guided font: '+font);
  await editor.click({mode:'advanced'});for(const font of fonts)assert(editor.get('controls').innerHTML.includes('value="'+font+'"'),'Missing component font: '+font);
  for(const font of fonts){editor.input({path:'typography.family'},font,'','select');await editor.click({action:'export-json'});const json=editor.downloaded.at(-1)[0];assert.equal(JSON.parse(json).typography.family,font);editor.get('import-file').files=[{size:Buffer.byteLength(json),text:async()=>json}];await editor.get('import-file').events.change({target:editor.get('import-file')});assert.equal(editor.context.fixture.store.value.typography.family,font);}
  editor.get('checkpoint').value='Candidate A';await editor.click({action:'save-candidate'});editor.input({path:'typography.family'},'Aptos','','select');await editor.click({action:'restore-candidate'});assert.equal(editor.context.fixture.store.value.typography.family,'Arial Narrow');
  assert(fs.readFileSync(path.join(root,'dist/SCOPE-Design-Studio.html')).equals(distBefore),'Validation must not overwrite dist');
  console.log(JSON.stringify({reference,output:built.file,exactBytes:'pass',sha256:crypto.createHash('sha256').update(candidate).digest('hex'),fontChoices:fonts.length,fontJSONAndOperatorRoundTrips:'pass',operatorOnlyExportsAndGuard:'pass',popOutApplications:4,repeatedPopOutAndSavedToolbarCleanup:'pass (controlled DOM serialization)',existingWorkflowFixture:'pass',distUntouched:true,unreconciledFeatures:[],browser:'NOT RUN: no browser automation surface; native windowing, typography rendering, downloads and file:// remain unverified'},null,2));
})().catch(error=>{console.error(error);process.exitCode=1;});

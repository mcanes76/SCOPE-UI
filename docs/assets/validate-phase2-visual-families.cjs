/* Phase 2: shared Phase 1 resolver, curated families and state contrast. */
'use strict';
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict'),crypto=require('node:crypto');
const root=path.resolve(__dirname,'../..'),C=require('../../design-studio/design-core.js'),V=require('../../design-studio/visual-system.js'),T=require('../../design-studio/theme-tokens.js'),P=require('../../design-studio/parameters.js');globalThis.ScopeDesign=C;
const E=require('../../design-studio/exports.js'),builder=require('../../scripts/build-standalone.cjs'),fixtures=require('./validate-design-studio.cjs');
const built=builder.build({output:'.validation/phase2/candidate.html'}),source=fs.readFileSync(built.file,'utf8'),payload=JSON.parse(source.match(/id="scope-offline-assets">([\s\S]*?)<\/script>/)[1]),presets=payload.themes.presets;
const curated=presets.filter(p=>p.visualFamily),by=id=>presets.find(p=>p.id===id),resolve=(d,c)=>V.resolveShellStyle(d,by(d.theme),c);
assert.equal(Object.keys(V.visualFamilies).length,5);assert.equal(curated.length,8);assert.equal(presets.length,33);
assert.equal(crypto.createHash('sha256').update(JSON.stringify(presets.slice(0,31).map(p=>[p.id,p.tokens]))).digest('hex'),'da36c4ca1bc918fa43cf5107dff6a2bf08da5de63ed09a6ccfae881b6d1a5a7c','All 31 Phase 1 identifiers and role maps remain unchanged');
assert.equal(by('frosted-white').variant.mode,'dark');assert.equal(by('frosted-white-glass').mode,'light');
assert.equal(C.validate({...C.defaults,theme:'frosted-white'}).theme,'frosted-white');
const legacyShell=C.validate({...C.defaults,theme:'command-dark',components:{global:{buttons:{radius:9}}}});
assert.equal(resolve(legacyShell,'buttons').values.radius,9,'Existing global component overrides remain effective');
assert.equal(resolve(legacyShell,'buttons').sources.radius,'Legacy component override');
const regionCSS=V.compileShellComponents({...legacyShell,regions:{header:{radius:19}}},by('command-dark'));
assert(regionCSS.includes('border-radius:19px!important'),'Existing explicit region geometry remains effective');
const instanceCSS=C.compileDesign({...legacyShell,components:{instances:{'shell.button.example':{background:'#112233',radius:13}}}},by('command-dark'));
assert(instanceCSS.includes('--scope-shell-background:#112233!important'),'Semantic shell instance colors bridge into Phase 1 tokens');
const reports=[];let minText=Infinity,minFocus=Infinity;
function blended(fg,bg,a){return '#'+[0,1,2].map(i=>Math.round(parseInt(fg.slice(1+i*2,3+i*2),16)*a+parseInt(bg.slice(1+i*2,3+i*2),16)*(1-a)).toString(16).padStart(2,'0')).join('');}
for(const p of curated){
  const d=C.validate({...C.defaults,theme:p.id}),t=V.tokens(d,p),checks=[];
  const check=(name,fg,bg,target=4.5)=>{const ratio=V.contrast(fg,bg);assert(ratio>=target,p.id+' '+name+' '+ratio.toFixed(2));checks.push({state:name,ratio:Number(ratio.toFixed(2)),minimum:target});if(target===4.5)minText=Math.min(minText,ratio);else minFocus=Math.min(minFocus,ratio);};
  for(const c of Object.keys(V.shellFields)){
    const {values:v,sources}=resolve(d,c);for(const key of V.shellFields[c])assert.notEqual(v[key],undefined,p.id+' '+c+'.'+key);
    if(v.text&&v.background)check(c,v.text,blended(v.background,t.workspace,v.opacity??1));
    if(c==='buttons'){check('button hover',v.hoverText,v.hoverBg);check('button active',v.pressedText,v.pressedBg);check('button disabled',v.disabledText,v.disabledBg);check('button selected',v.selectedText,v.selectedBg);check('button focus ring',v.focusColor,v.background,3);check('focus against panel',v.focusColor,t.panel,3);}
    if(c==='tabs'){check('tab selected',v.selectedText,v.selectedBg);check('tab hover',v.hoverText,v.hoverBg);}
    if(c==='inputs'){check('input focus text',v.focusText,v.focusBg);check('input focus ring',v.focusColor,v.background,3);}
    if(Object.keys(p.shellComponents[c]||{}).length)assert(Object.values(sources).some(s=>s.startsWith('Family default:')));
  }
  const css=V.compileShellComponents(d,p);assert(css.includes('--scope-shell-blur:'));assert(css.includes('dialog:not(#demo-action-dialog)'));assert(css.includes('[data-shell-status="warning"]'));assert(css.includes(':focus-visible'));assert(css.includes('opacity:1!important;border-style:dashed!important'),'Disabled text uses measured opaque fills; inherited engine dimming must not lower contrast');assert(!css.includes('undefined'));
  for(const rule of css.split('\n'))assert(rule.slice(0,rule.indexOf('{')).includes(':not(:where([data-demo-host],[data-demo-host] *,#demo-action-dialog,#demo-action-dialog *))'));
  reports.push({id:p.id,family:p.visualFamily,checks});
  assert.equal(P.validate({schemaVersion:1,initial:{theme:p.id}}).initial.theme,p.id);
}
(async()=>{
 const editor=await fixtures.editorFixture(payload),store=editor.context.fixture.store;
 const original=C.clone(store.value);
 await editor.click({mode:'advanced'});
 editor.input({shellCategory:'buttons',shellProperty:'radius'},11);
 editor.input({shellCategory:'panels',shellProperty:'background'},'#123456','','color');
 editor.input({shellCategory:'dialogs',shellProperty:'paddingX'},20);
 const overrides=C.clone(store.value.shellComponents);
 for(const [family,info] of Object.entries(V.visualFamilies)){
  await editor.click({visualFamilyChoice:family});assert.equal(store.value.theme,info.primary);assert.deepEqual(store.value.shellComponents,overrides);
  assert.equal(resolve(store.value,'buttons').values.radius,11);assert.equal(resolve(store.value,'buttons').sources.radius,'Component override');assert(resolve(store.value,'buttons').sources.borderWidth.startsWith('Family default:'));
  await editor.click({action:'export-json'});const json=editor.downloaded.at(-1)[0];editor.get('import-file').files=[{size:json.length,text:async()=>json}];await editor.get('import-file').events.change({target:editor.get('import-file')});assert.equal(store.value.theme,info.primary);assert.deepEqual(store.value.shellComponents,overrides);
  await editor.click({action:'export-css'});assert(editor.downloaded.at(-1)[0].includes('--scope-shell-radius:11px'));
  const html=E.composeFinal(payload.resources,store.value,presets),engine=fixtures.engineFixture(true,html);assert.equal(engine.window.ScopePreviewRuntime.snapshot().theme,info.primary);assert.equal(engine.elements.get('#scope-design-overrides').textContent,C.compileDesign(store.value,by(info.primary)));
  for(const navigation of C.navigation){const d={...store.value,navigation};assert(C.compileDesign(d,by(info.primary)).includes('--scope-shell-radius:11px'));}
 }
 editor.get('checkpoint').value='Candidate A';await editor.click({action:'save-candidate'});await editor.click({visualFamilyChoice:'command-dark'});await editor.click({},'undo');assert.equal(store.value.theme,'slate-light');await editor.click({},'redo');assert.equal(store.value.theme,'command-dark');await editor.click({action:'restore-candidate'});assert.equal(store.value.theme,'slate-light');
 await editor.click({action:'compare'});assert.equal(editor.get('compare-grid').children.length,2);await editor.click({action:'close-compare'});
 await editor.click({action:'compare-themes'});editor.input({},'frosted-white-glass','theme-compare-right','select');await editor.click({showTheme:'right'});assert.deepEqual(store.value.shellComponents,overrides);await editor.click({action:'close-theme-comparison'});
 await editor.click({action:'reset-family-style'});assert.equal(store.value.theme,'slate-light');assert.equal(store.value.shellComponents,undefined);assert.equal(resolve(store.value,'buttons').values.radius,by('slate-light').shellComponents.buttons.radius);await editor.click({},'undo');assert.deepEqual(store.value.shellComponents,overrides);
 const engine=fixtures.engineFixture(true,E.composeFinal(payload.resources,store.value,presets)),runtime=engine.window.ScopePreviewRuntime;
 engine.run("DemoMulticastGroupStore.create('Phase 2 retained',['N07']);demoView('single',0).draft='Phase 2 draft'");const groups=engine.run('JSON.stringify(DemoMulticastGroupStore.list())');let renders=0;engine.context.countPhase2=()=>renders++;engine.run('const phase2Render=render;render=function(){countPhase2();return phase2Render();}');
 for(const p of curated)runtime.apply({...store.value,theme:p.id},presets,{presentation:true});assert.equal(renders,0);assert.equal(engine.run("demoView('single',0).draft"),'Phase 2 draft');assert.equal(engine.run('JSON.stringify(DemoMulticastGroupStore.list())'),groups);
 globalThis.ScopeOfflineAssets=payload;const zip=await E.folder(store.value,presets);delete globalThis.ScopeOfflineAssets;assert(Buffer.from(zip).toString().includes('"radius": 11'));
 store.set(original);await editor.click({mode:'guided'});await editor.click({step:'1'});const markup=editor.get('controls').innerHTML;assert.equal((markup.match(/data-visual-family-choice=/g)||[]).length,5);assert(markup.includes('Legacy themes'));assert(markup.includes('data-theme="frosted-white"'));
 // Export a self-contained review sheet using actual compiled CSS, not a screenshot claim.
 const cards=Object.entries(V.visualFamilies).map(([family,info])=>{
  const p=by(info.primary),d=C.validate({...C.defaults,theme:p.id});
  const inner='<!doctype html><html><head><meta charset="utf-8"><style>body{margin:0;padding:12px;font:15px system-ui}.shell{padding:12px}.shell-top{padding:8px}.deck-nav{display:flex;padding:8px;gap:4px}button,input,select{padding:8px;border:1px solid;min-height:36px}.shell-context-card{margin:12px 0}dialog[open]{position:static;margin:12px 0;width:auto}.states{display:flex;flex-wrap:wrap;gap:8px}.status-pill,.offline,[data-shell-status]{display:inline-block;padding:5px 8px;border-radius:5px}h2{margin:6px 0}p{line-height:1.5}.operator-config{margin-top:12px}</style><style>'+C.compileDesign(d,p)+'</style></head><body data-scope-design="true" data-theme="'+p.id+'"><section class="shell"><header class="shell-top"><h2>'+info.name+'</h2><p>'+p.id+' · live token specimen</p></header><nav class="deck-nav"><button aria-pressed="true">Selected tab</button><button>Inactive tab</button><button disabled>Disabled</button></nav><section class="shell-context-card"><h3>Shell panel</h3><p>Body text remains legible on the resolved panel fill.</p><div class="states"><button>Default / hover</button><button aria-pressed="true">Selected</button><button disabled>Disabled</button></div><p><label>Focus using Tab <input value="Editable shell input"></label></p><select aria-label="Shell select"><option>Operator choice</option></select></section><div class="states"><span data-shell-status="success">✓ Success</span><span data-shell-status="warning">△ Warning</span><span data-shell-status="error">× Error</span><span data-shell-status="neutral">○ Neutral</span></div><dialog open><h3>Shell dialog</h3><p>Dialog text and controls share the family.</p><button>Continue</button></dialog></section></body></html>';
  const escaped=inner.replace(/&/g,'&amp;').replace(/"/g,'&quot;');return '<article><h2>'+info.name+'</h2><iframe title="'+info.name+' live specimen" srcdoc="'+escaped+'"></iframe><p>Minimum text contrast: '+Math.min(...reports.find(r=>r.id===p.id).checks.filter(c=>c.minimum===4.5).map(c=>c.ratio)).toFixed(2)+':1</p></article>';
 }).join('');
 const sheet='<!doctype html><html lang="en"><meta charset="utf-8"><title>SCOPE Phase 2 visual verification</title><style>body{margin:24px;background:#E7EDF5;color:#172536;font:15px system-ui}main{display:grid;grid-template-columns:repeat(auto-fit,minmax(390px,1fr));gap:20px}article{background:white;padding:16px;border:1px solid #7B8EA5;border-radius:8px}iframe{width:100%;height:760px;border:0}h1{font-size:26px}p{max-width:1100px;line-height:1.5}</style><h1>SCOPE Phase 2 visual verification</h1><p>Five live specimens rendered from the actual shared Phase 1/2 CSS compiler. Inspect hover and active states with the pointer; use Tab to inspect focus. Text/disabled/selected/status states are measured at ≥4.5:1, focus rings at ≥3:1. This generated review sheet is not evidence of a completed browser screenshot test. It has no external resources or server requirement.</p><main>'+cards+'</main></html>';
 fs.writeFileSync(path.join(root,'docs/SCOPE-Phase-2-Visual-Verification.html'),sheet);fs.writeFileSync(path.join(root,'.validation/phase2/contrast.json'),JSON.stringify(reports,null,2));
 console.log(JSON.stringify({phase2:'pass',visualFamilies:5,curatedChoices:curated.length,totalPreservedAndNewPresets:presets.length,preservedPhase1RoleMaps:31,minimumTextContrast:minText.toFixed(2),minimumFocusContrast:minFocus.toFixed(2),liveSwitchingOverridesHistoryCandidatesReset:'pass',JSONCSSHTMLFolderAndLegacyImports:'pass',applicationDOMDraftStoreRetention:'pass',visualSheet:'docs/SCOPE-Phase-2-Visual-Verification.html',contrastReport:'.validation/phase2/contrast.json',browserScreenshots:'not captured'},null,2));
})().catch(error=>{console.error(error);process.exitCode=1;});

/* Packaging and runtime contracts, not a browser rendering test. */
'use strict';
const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm'),assert=require('node:assert/strict');
const root=path.resolve(__dirname,'../..'),builder=require('../../scripts/build-standalone.cjs');
const C=require('../../design-studio/design-core.js'),E=require('../../design-studio/exports.js');
const fixtures=require('./validate-design-studio.cjs');
const result=builder.build(),html=fs.readFileSync(result.file,'utf8');
const payload=JSON.parse(html.match(/<script type="application\/json" id="scope-offline-assets">([\s\S]*?)<\/script>/)[1]);
assert(payload.resources.html.startsWith('<!doctype html>'));assert.equal(payload.themes.presets.length,JSON.parse(fs.readFileSync(path.join(root,'design-studio/theme-presets.json'),'utf8')).presets.length);
function audit(document){
  const scripts=[...document.matchAll(/<script(?:\s([^>]*))?>([\s\S]*?)<\/script>/g)];
  for(const script of scripts)if(!script[1]?.includes('application/json'))new vm.Script(script[2]);
  const markup=document.replace(/<script(?:\s[^>]*)?>[\s\S]*?<\/script>/g,'');
  for(const match of markup.matchAll(/<(?:script|link|img|iframe|source)[^>]*?\s(?:src|href)="([^"]+)"/g))assert(/^(?:data:|about:blank$|#)/.test(match[1]),'Unbundled automatic resource: '+match[1]);
  for(const match of markup.matchAll(/url\(\s*["']?([^)'"\s]+)/g))assert(match[1].startsWith('data:')||match[1].startsWith('#'),'External CSS resource');
  return scripts.length;
}
audit(html);
assert.equal(fs.readFileSync(result.file,'utf8'),(builder.build(),fs.readFileSync(result.file,'utf8')),'Build must be deterministic');
(async()=>{
  const editor=await fixtures.editorFixture(payload),frame=editor.get('preview');audit(frame.srcdoc);
  const preview=fixtures.engineFixture(true,frame.srcdoc),messages=[];
  // The embedded bridge was executed from the actual assembled frame source.
  preview.window.parent.postMessage=m=>messages.push(m);
  const embedded=preview.window.ScopeEmbeddedTransport;assert(embedded.channel);assert.equal(embedded.parentOrigin,'null');
  const handler=preview.windowEvents.message;
  const message={source:preview.window.parent,origin:'null',data:{namespace:'scope-design-studio',version:1,channel:embedded.channel,type:'configure',design:payload.initial,presets:payload.themes.presets,options:{editing:true,application:'blos'}}};
  handler({...message,source:{}});assert.equal(messages.length,0);handler({...message,origin:'https://unexpected.invalid'});assert.equal(messages.length,0);handler(message);assert.equal(messages.at(-1).type,'applied');
  preview.run("DemoMulticastGroupStore.create('Offline retention',['N07']);demoView('left',0).node='N06';");
  const groups=preview.run('JSON.stringify(DemoMulticastGroupStore.list())');let combinations=0;
  for(const navigation of C.navigation)for(const preset of payload.themes.presets){
    const design=C.validate({...payload.initial,navigation,theme:preset.id,typography:preset.typography});
    handler({...message,data:{...message.data,design}});assert.equal(messages.at(-1).type,'applied');assert.equal(preview.run('state.look'),preset.engineLook);assert.equal(preview.run('JSON.stringify(DemoMulticastGroupStore.list())'),groups);
    const output=E.css(design,payload.themes.presets);
    if(preset.engineLook==='white-trim'&&preset.id!=='white-trim'){assert(output.includes(preset.colors.background));assert(preview.elements.get('#scope-design-overrides').textContent.includes(preset.colors.background));}
    combinations++;
  }
  // All export types used by the offline editor have already run with fetch throwing.
  const final=editor.downloaded.find(d=>d[1]==='scope-final-mockup.html')[0];audit(final);
  const exported=fixtures.engineFixture(true,final);assert.equal(exported.run('presentation.detailsVisible'),true);assert.equal(exported.run('DemoNodeStore.nodes().length'),10);
  // Run the embedded window factory and inspect its actual local Blob output.
  // The clone fixture models document serialization, not native pop-up behavior.
  preview.document.documentElement={cloneNode(){
    let source=frame.srcdoc;const launch=[],restore=[];
    return {querySelectorAll(){return [...source.matchAll(/<script data-scope-preview-bridge>[\s\S]*?<\/script>/g)].map(m=>({remove(){source=source.replace(m[0],'');}}));},querySelector(s){return s==='head'?{prepend:el=>launch.push(el.textContent)}:{append:el=>restore.push(el.textContent)};},get outerHTML(){return source.replace('<head>','<head>'+launch.map(s=>'<script>'+s+'</script>').join('')).replace('</body>',restore.map(s=>'<script>'+s+'</script>').join('')+'</body>');}};
  }};
  const popupURL=preview.run('appWindowURL(2)');assert(popupURL.startsWith('blob:'));
  const popupHTML=await(await fetch(popupURL)).text();audit(popupHTML);assert(!popupHTML.includes('<script data-scope-preview-bridge>'));
  const popup=fixtures.engineFixture(true,popupHTML);assert.equal(popup.run('detachedContext.app'),2);assert.equal(popup.run('state.look'),payload.themes.presets.at(-1).engineLook);assert.equal(popup.run('DemoMulticastGroupStore.list().some(g=>g.name==="Offline retention")'),false,'Independent windows start fresh simulations');URL.revokeObjectURL(popupURL);
  // Documentation IDs, links and script syntax remain intact after targeted edits.
  for(const name of ['SCOPE-Design-Studio-Architecture.html','SCOPE-UI-Documentation.html','SCOPE-Demo-Notes.html']){
    const doc=fs.readFileSync(path.join(root,'docs',name),'utf8'),ids=[...doc.matchAll(/\sid="([^"]+)"/g)].map(m=>m[1]);assert.equal(new Set(ids).size,ids.length,name+' duplicate ID');
    for(const link of doc.matchAll(/href="#([^"]+)"/g))assert(ids.includes(link[1]),name+' missing section '+link[1]);
    for(const script of doc.matchAll(/<script>([\s\S]*?)<\/script>/g))new vm.Script(script[1]);
  }
  console.log(JSON.stringify({file:result.file,bytes:result.bytes,sha256:result.sha256,deterministicBuild:'pass',automaticExternalResources:0,networkRequestsInOfflineFixtures:0,shellThemeCombinations:combinations,opaqueOriginAuthentication:'pass',guidedAdvancedFinalHistoryCandidatesAndExports:'pass (controlled fixtures)',documentationLinksAndSyntax:'pass',edgeChromeFileBrowserTest:'NOT RUN: no browser surface available; fixtures do not prove native browser execution'},null,2));
})().catch(error=>{console.error(error);process.exitCode=1;});

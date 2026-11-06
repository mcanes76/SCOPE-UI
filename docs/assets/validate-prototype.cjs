/* Optional developer validation: node docs/assets/validate-prototype.cjs
 * No packages required. This is a controlled DOM fixture, not browser testing.
 */
'use strict';
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const assert = require('node:assert/strict');
const root = path.resolve(__dirname, '../..');
const deliverables=['README.md','.gitignore','docs/SCOPE-UI-Architecture.md','docs/SCOPE-UI-Design-Requirements.md','docs/SCOPE-UI-Style-Comparison.md','docs/Validation.md','docs/assets/.gitkeep','docs/assets/validate-prototype.cjs','mockups/scope-ui-concepts.html','src/.gitkeep'];
for(const relative of deliverables){
  const filename=path.join(root,relative);assert(fs.existsSync(filename),'Required file '+relative);
  const source=fs.readFileSync(filename,'utf8');assert(!/[^\S\r\n]+\r?$/m.test(source),'Trailing whitespace in '+relative);
  if(relative.endsWith('.md'))for(const match of source.matchAll(/\]\(([^)]+)\)/g)){
    if(!/^https?:/.test(match[1]))assert(fs.existsSync(path.resolve(path.dirname(filename),match[1])),'Broken local document link '+match[1]);
  }
}
const html = fs.readFileSync(path.join(root, 'mockups/scope-ui-concepts.html'), 'utf8');
const script = html.match(/<script>([\s\S]*?)<\/script>/)[1];
new vm.Script(script); // syntax check, independent of the fixture
assert(!/<(?:script|link|img)[^>]+(?:src|href)\s*=/i.test(html), 'No external runtime assets');
assert(!/\b(?:fetch|XMLHttpRequest|WebSocket|localStorage)\s*\(/.test(script));
const elements = new Map(), handlers = {}, windowHandlers = {}, timers = [];
class Element {
  constructor(id = '') { this.id=id; this.innerHTML=''; this.textContent=''; this.dataset={}; this.attrs={}; this.disabled=false; this.isConnected=true; this.value=''; this.checked=false; this.classList={add(){},remove(){},toggle(){}}; }
  setAttribute(k,v){this.attrs[k]=String(v);}
  getAttribute(k){return this.attrs[k];}
  removeAttribute(k){delete this.attrs[k];}
  focus(){document.activeElement=this;}
  blur(){document.activeElement=null;}
  insertAdjacentHTML(position,markup){this.innerHTML+=markup;}
  querySelector(){return new Element();}
  querySelectorAll(){return [];}
  closest(){return this;}
  addEventListener(type,fn){this[type]=fn;}
  showModal(){this.open=true;}
  close(value=''){this.open=false;this.returnValue=value;this['close-event']?.();}
}
const document={title:'SCOPE',activeElement:null,
  querySelector(q){if(!elements.has(q))elements.set(q,new Element(q.replace(/^#/,'')));return elements.get(q);},
  querySelectorAll(){return [];},
  addEventListener(type,fn){handlers[type]=fn;}
};
// close is both an API and an event name: keep the callback separate.
document.querySelector('#confirmation').addEventListener=(type,fn)=>{elements.get('#confirmation')[type==='close'?'close-event':type]=fn;};
let printHTML='';
const context=vm.createContext({document,console,setTimeout:fn=>timers.push(fn),window:{addEventListener(type,fn){windowHandlers[type]=fn;},print(){windowHandlers.beforeprint?.();printHTML=elements.get('#print-root').innerHTML;windowHandlers.afterprint?.();}}});
vm.runInContext(script,context);
const run=code=>vm.runInContext(code,context);
const get=id=>document.querySelector('#'+id);
function click(data){const button=new Element();button.dataset=data;handlers.click({target:{closest:()=>button}});return button;}
function change(id,value,checked){const target=get(id);target.value=value;target.checked=checked;handlers.change({target});}
function verifyRelationships(markup){
  const ids=new Set(), refs=[];
  for(const match of markup.matchAll(/<[a-z][\w-]*(\s[^<>]*?)?>/gi)){
    const attrs={};for(const a of match[0].matchAll(/([\w-]+)="([^"]*)"/g))attrs[a[1]]=a[2];
    if(attrs.id){assert(!ids.has(attrs.id),'Duplicate ID '+attrs.id);ids.add(attrs.id);}
    for(const key of ['aria-controls','aria-labelledby','aria-describedby','for'])if(attrs[key])refs.push(...attrs[key].split(/\s+/));
  }
  for(const id of refs)assert(ids.has(id),'Missing relationship target '+id);
}
const snapshots=[];
const requiredNames=['Mission Control Console','Modern Engineering Dashboard','Gaming-Inspired Operator Console','Minimal Dark Console','Modular Engineering Workspace','Tactical Flat Interface','Industrial HMI','Command Center Dashboard','Precision Instrument Console','Contemporary Desktop Interface','Adaptive Information Dashboard','Hybrid Operator Console'];
assert.equal(run('concepts.length'),12);
assert.deepEqual(Array.from(run('concepts.map(c=>c.name)')),requiredNames);
for(let i=0;i<13;i++){
  run(`state.concept=${i}; state.view='workspace';render();`);
  const nav=get('concept-tabs').innerHTML, content=get('primary-workspace').innerHTML;
  assert.equal((nav.match(/role="tab"/g)||[]).length,13);
  assert.equal((nav.match(/aria-selected="true"/g)||[]).length,1);
  verifyRelationships(nav+content);
  if(i===12){assert.equal((content.match(/<td>/g)||[]).length,12*11);continue;}
  const c=run(`concepts[${i}]`);
  assert(content.includes('class="theme '+c.id+'"'));
  assert(html.includes('.'+c.id+' .workspace'),c.id+' has distinct layout rules');
  assert.equal((content.match(/data-app=/g)||[]).length,4);
  for(const control of ['demo-preset','demo-check','demo-toggle','workspace-name','data-action="apply"','data-action="reset"','data-action="increment"','data-action="error"','data-action="tooltip"','<details>'])assert(content.includes(control),control);
  const before=run('state.value');click({action:'increment'});assert.equal(run('state.value'),before+1);
  click({app:'Native LOS'});assert(get('app-boundary').innerHTML.includes('Application unavailable'));
  click({app:'Display'});assert(get('application-title').textContent.includes('Display'));
  change('demo-toggle','',false);assert.equal(get('feedback-state').textContent,'Paused');
  change('demo-toggle','',true);assert.equal(get('feedback-state').textContent,'Enabled');
  change('demo-check','',false);assert.equal(get('annotation').hidden,true);
  change('demo-check','',true);assert.equal(get('annotation').hidden,false);
  change('demo-preset','Expanded');assert.equal(run('state.preset'),'Expanded');
  const radio=new Element();radio.name='demo-mode';radio.value='Compare';handlers.change({target:radio});assert.equal(run('state.mode'),'Compare');
  click({card:'Context'});assert.equal(run('state.card'),'Context');
  get('workspace-name').value='   ';click({action:'apply'});assert.equal(get('workspace-name').getAttribute('aria-invalid'),'true');
  get('workspace-name').value='Review label';click({action:'apply'});assert.equal(get('confirmation').open,true);
  const rev=run('state.revision');get('cancel-dialog').onclick();assert.equal(run('state.revision'),rev);
  click({action:'apply'});get('confirm-dialog').onclick();assert.equal(run('state.revision'),rev+1);
  get('workspace-name').value='Unsaved label';handlers.input({target:get('workspace-name')});assert.equal(run('state.dirty'),true);
  assert(run('summary()').includes('id="config-state">Draft'));
  click({action:'error'});assert(get('notification').textContent.includes('Sample error'));
  run("state.view='guide';render();");const guide=run(`guide(concepts[${i}])`);
  assert.equal((guide.match(/<h3>/g)||[]).length,10);
  for(const label of ['Disabled selected','Disabled unselected','Keyboard focused','Export Style Guide to PDF',c.accent,'Accessibility','Working…'])assert(guide.includes(label),label);
  const busy=click({action:'busy'});assert.equal(busy.disabled,true);assert.equal(run('state.busy'),true);timers.shift()();assert.equal(run('state.busy'),false);
  run('exportGuide()');assert(printHTML.includes(c.name));assert(!printHTML.includes('concept-tabs'));assert(!printHTML.includes('Export Style Guide to PDF'));verifyRelationships(printHTML);
  snapshots.push({name:c.name,guideLength:guide.length,printLength:printHTML.length});
  click({action:'reset'});get('confirm-dialog').onclick();assert.equal(run('state.value'),42);assert.equal(run('state.app'),'Display');
}
// Screen text contrast on all actual surface tokens (WCAG relative luminance).
function luminance(hex){const channels=hex.slice(1).match(/../g).map(v=>parseInt(v,16)/255).map(v=>v<=.04045?v/12.92:((v+.055)/1.055)**2.4);return channels[0]*.2126+channels[1]*.7152+channels[2]*.0722;}
function contrast(a,b){const x=luminance(a),y=luminance(b);return (Math.max(x,y)+.05)/(Math.min(x,y)+.05);}
let minimum=21;const contrastIssues=[];
for(const c of run('concepts'))for(const bg of [c.bg,c.panel,c.raised])for(const fg of ['#E0E8F0','#B5C2CF','#87CBA8','#EAC17C','#F3A2A2','#9EBDE8']){const ratio=contrast(fg,bg);minimum=Math.min(minimum,ratio);if(ratio<4.5)contrastIssues.push({concept:c.id,fg,bg,ratio:ratio.toFixed(2)});}
for(const c of run('concepts'))assert(contrast(c.accent,'#0C1720')>=4.5,'Primary label contrast');
assert.deepEqual(contrastIssues,[],'Normal-size token text contrast');
console.log(JSON.stringify({syntax:'pass',concepts:12,comparisonCriteria:11,renderRelationships:'pass',interactionHandlers:'pass in controlled fixture',printGuides:'12 concept-specific fragments; actual browser print not tested',minimumTextContrast:minimum.toFixed(2),snapshots},null,2));

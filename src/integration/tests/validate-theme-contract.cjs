'use strict';
const assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
const T=require('../theme-contract.js'),C=require('../contracts.js'),Host=require('../adapter-host.js'),A=require('../reference-application.js');
let checks=0;function check(name,fn){fn();checks++;console.log('PASS '+name);}
const basic={level:1,versions:[1],tokens:[...T.basic],dynamic:false};
const full={level:2,versions:[1],tokens:Object.keys(T.catalog),dynamic:true};
const values={color:'#182638',family:'system',size:16,scale:1,weight:400,density:'comfortable',boolean:true};
const theme={type:'scope.theme',version:1,revision:1,mode:'dark',tokens:Object.fromEntries(Object.entries(T.catalog).map(([k,type])=>[k,values[type]]))};
const clone=x=>JSON.parse(JSON.stringify(x));
check('old manifests remain independent; optional declarations are validated',()=>{
  assert.deepEqual(C.manifest(A.manifest),A.manifest);assert.equal(T.declaration().level,0);
  for(const declaration of [basic,full,{level:0,versions:[],tokens:[],dynamic:false}])assert.deepEqual(C.manifest({...A.manifest,theme:declaration}).theme,declaration);
  for(const declaration of [{...basic,level:3},{...basic,unknown:true},{...basic,tokens:[]},{...full,dynamic:false},{...basic,tokens:[...T.basic,'button.text']},{...full,versions:[1,1]},{...full,tokens:['alarm.critical']}])assert.throws(()=>C.manifest({...A.manifest,theme:declaration}));
});
check('typed token catalog covers controls, surfaces, typography, density and accessibility',()=>{
  assert.deepEqual(T.validate(theme),theme);
  for(const [name,value] of [['color.text','red'],['button.background','url(evil)'],['type.family','evil; color:red'],['type.baseSize',0],['type.scale',3],['border.width',Infinity],['accessibility.reducedMotion','false'],['layout.density','tiny'],['alarm.critical','#ffffff'],['status.error','#ffffff'],['visualization.series','#ffffff']])assert.throws(()=>T.validate({...theme,tokens:{...theme.tokens,[name]:value}}));
  for(const patch of [{version:2},{revision:0},{mode:'auto'},{type:'scope-design'},{extra:1}])assert.throws(()=>T.validate({...theme,...patch}));
  assert.throws(()=>T.validate({...theme,tokens:JSON.parse('{"__proto__":"#ffffff"}')}));
});
check('negotiation filters supported tokens, reports unknowns and rejects missing basics',()=>{
  const before=clone(theme),result=T.negotiate(basic,theme);assert.equal(result.status,'ready');assert.deepEqual(Object.keys(result.theme.tokens),T.basic);
  assert.equal(T.negotiate(undefined,theme).status,'independent');
  assert.equal(T.negotiate({...basic,versions:[2]},theme).status,'unsupported-version');
  assert.deepEqual(T.negotiate({...full,tokens:[...full.tokens,'future.visual']},theme).unsupported,['future.visual']);
  const missing=clone(theme);delete missing.tokens['type.family'];assert.deepEqual(T.negotiate(full,missing).missing,['type.family']);
  result.theme.tokens['color.text']='#ffffff';assert.deepEqual(theme,before,'No mutation of source or another application delivery');
});
check('JSON round trip and browser-local helper match Node behavior without DOM access',()=>{
  assert.deepEqual(T.validate(JSON.parse(JSON.stringify(theme))),theme);
  const context=vm.createContext({});vm.runInContext(fs.readFileSync(require.resolve('../theme-contract.js'),'utf8'),context);
  const result=vm.runInContext('ScopeIntegrationTheme.negotiate('+JSON.stringify(basic)+','+JSON.stringify(theme)+')',context);
  assert.equal(result.status,'ready');assert.equal(result.theme.tokens['type.baseSize'],16);
  assert(!/document\.|window\.|fetch\(|eval\(|require\(/.test(fs.readFileSync(require.resolve('../theme-contract.js'),'utf8')));
});
// Protocol conformance fixture only: this is intentionally NOT a production receiver.
check('receiver policy fixture: initial, dynamic, stale, rejection and last-good fallback',()=>{
  let last=null;const operational={alarm:'#ff0000',series:['#11aa44'],count:42};const before=clone(operational);
  const receive=(declaration,input,appAccepts=true)=>{
    const result=T.negotiate(declaration,input);
    if(result.status!=='ready')return result.status;
    if(last&&(!declaration.dynamic||input.revision<=last.revision))return 'ignored';
    if(!appAccepts)return 'application-rejected';
    last=result.theme;return 'applied';
  };
  assert.equal(receive(full,theme),'applied');assert.equal(receive(full,theme),'ignored');
  assert.equal(receive(full,{...theme,revision:2,mode:'light'}),'applied');
  assert.equal(receive(full,{...theme,revision:3},false),'application-rejected');assert.equal(last.revision,2);
  assert.throws(()=>receive(full,{...theme,revision:3,tokens:{'alarm.critical':'#ffffff'}}));assert.equal(last.revision,2);
  assert.equal(receive({...full,versions:[2]},theme),'unsupported-version');assert.equal(last.revision,2);
  assert.equal(receive(basic,{...theme,revision:4}),'ignored');assert.deepEqual(operational,before);
});
check('manifest schema advertises optional metadata; host grants do not expand',()=>{
  const schema=require('../application-manifest.schema.json');assert(schema.properties.theme);assert(!schema.required.includes('theme'));
  const host=new Host({schemas:A.schemas});host.register({...A.manifest,theme:full},A.create,{grants:A.manifest.capabilities});
  assert.deepEqual(host.status(A.manifest.id).capabilities,A.manifest.capabilities);assert.equal(typeof host.applyTheme,'undefined','No automatic application styling or new runtime transport');
});
console.log('Theme contract: '+checks+' groups passed. Receiver fixture is proposed policy, not a live transport.');

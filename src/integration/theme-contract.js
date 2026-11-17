/* Optional theme contract reference v1. No DOM access or Studio runtime wiring. */
(function(root){
  'use strict';
  const catalog={};
  const group=(prefix,names,type)=>names.split(' ').forEach(name=>{catalog[prefix+'.'+name]=type;});
  group('color','canvas surface raised inset text secondary border primary onPrimary','color');
  group('type','family','family');
  group('type','baseSize headingSize','size');
  group('type','scale','scale');
  group('type','weight','weight');
  group('layout','density','density');
  group('space','unit controlX controlY panel gap','size');
  group('border','width radius','size');
  group('focus','color','color');
  group('focus','width offset','size');
  group('accessibility','reducedMotion','boolean');
  for(const control of ['button','tab','input']){
    group(control,'background text border hoverBackground hoverText activeBackground activeText disabledBackground disabledText','color');
    group(control,'radius borderWidth','size');
  }
  group('tab','selectedBackground selectedText','color');
  group('input','focusBackground focusText focusBorder','color');
  const basic=['color.canvas','color.surface','color.text','color.primary','color.onPrimary','type.family','type.baseSize','type.scale'];
  const fail=message=>{throw Error(message);};
  const exact=(value,keys)=>{if(!value||typeof value!=='object'||Array.isArray(value)||![Object.prototype,null].includes(Object.getPrototypeOf(value))||Object.getOwnPropertySymbols(value).length||Object.keys(value).some(k=>!keys.includes(k)))fail('Unknown or invalid theme field');};
  function declaration(value){
    if(value===undefined)return {level:0,versions:[],tokens:[],dynamic:false};
    exact(value,['level','versions','tokens','dynamic']);
    if(![0,1,2].includes(value.level)||!Array.isArray(value.versions)||!Array.isArray(value.tokens)||typeof value.dynamic!=='boolean')fail('Invalid theme declaration');
    if(value.versions.length>8||value.versions.some(v=>!Number.isSafeInteger(v)||v<1)||new Set(value.versions).size!==value.versions.length)fail('Invalid theme versions');
    if(value.tokens.length>128||new Set(value.tokens).size!==value.tokens.length||value.tokens.some(t=>typeof t!=='string'||t.length>100||!/^([a-z][a-zA-Z]*\.)+[a-z][a-zA-Z]*$/.test(t)))fail('Invalid supported theme tokens');
    if(value.level===0&&(value.versions.length||value.tokens.length||value.dynamic)||value.level>0&&(!value.versions.length||!basic.every(t=>value.tokens.includes(t)))||value.level===1&&value.tokens.some(t=>!basic.includes(t))||value.level===2&&!value.dynamic)fail('Theme level requirements not met');
    return {level:value.level,versions:[...value.versions],tokens:[...value.tokens],dynamic:value.dynamic};
  }
  function token(name,value){
    if(!Object.hasOwn(catalog,name))fail('Unsupported or protected token: '+name);
    const type=catalog[name];
    const valid=type==='color'?typeof value==='string'&&/^#[0-9a-f]{6}$/i.test(value):
      type==='family'?['system','sans','serif','mono'].includes(value):
      type==='density'?['compact','comfortable','spacious'].includes(value):
      type==='boolean'?typeof value==='boolean':
      typeof value==='number'&&Number.isFinite(value)&&(type==='weight'?Number.isInteger(value)&&value>=100&&value<=900:type==='scale'?value>=0.75&&value<=2:value>=0&&value<=128);
    if(!valid||['type.baseSize','type.headingSize'].includes(name)&&value<8)fail('Invalid value for theme token: '+name);
    return value;
  }
  function validate(input){
    exact(input,['type','version','revision','mode','tokens']);
    if(input.type!=='scope.theme'||input.version!==1)fail('Unsupported theme document/version');
    if(!Number.isSafeInteger(input.revision)||input.revision<1||!['light','dark'].includes(input.mode))fail('Invalid theme revision/mode');
    exact(input.tokens,Object.keys(catalog));const tokens={};
    if(Object.keys(input.tokens).length>128)fail('Too many theme tokens');
    for(const [name,value] of Object.entries(input.tokens))tokens[name]=token(name,value);
    return {type:'scope.theme',version:1,revision:input.revision,mode:input.mode,tokens};
  }
  function negotiate(capabilities,input){
    const c=declaration(capabilities);
    if(c.level===0)return {status:'independent',unsupported:[],missing:[],theme:null};
    if(!c.versions.includes(1))return {status:'unsupported-version',unsupported:[],missing:[],theme:null};
    const theme=validate(input),unsupported=c.tokens.filter(t=>!Object.hasOwn(catalog,t)),missing=basic.filter(t=>!Object.hasOwn(theme.tokens,t));
    if(missing.length)return {status:'missing-required',unsupported,missing,theme:null};
    const tokens={};for(const name of c.tokens)if(Object.hasOwn(theme.tokens,name))tokens[name]=theme.tokens[name];
    return {status:'ready',unsupported,missing,theme:{...theme,tokens}};
  }
  const api=Object.freeze({version:1,catalog:Object.freeze(catalog),basic:Object.freeze(basic),declaration,validate,negotiate});
  root.ScopeIntegrationTheme=api;if(typeof module!=='undefined')module.exports=api;
})(typeof globalThis!=='undefined'?globalThis:this);

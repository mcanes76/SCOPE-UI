/* Synthetic application fixture. No BLOS/Display/Calibration/LOS code or data. */
(function(root){
  'use strict';
  const manifest={schemaVersion:1,id:'reference.status',name:'Reference integration sample',version:'0.1.0',contractVersion:1,integration:'module',singleton:true,capabilities:['state','commands','context'],publishes:['reference.status.changed'],commands:['reference.status.increment','reference.status.fail'],contexts:['shell.selection']};
  const count=value=>{if(!Number.isSafeInteger(value)||value<0||value>999)throw Error('Count must be an integer from 0 to 999');return value;};
  const only=(input,keys)=>{if(!input||typeof input!=='object'||Array.isArray(input)||Object.keys(input).some(k=>!keys.includes(k)))throw Error('Invalid reference payload');};
  const schemas={
    events:{'reference.status.changed':value=>{only(value,['count']);return {count:count(value.count)};}},
    commands:{
      'reference.status.increment':{request:value=>{only(value,['amount']);if(value.amount!==1)throw Error('Only a unit increment is supported');return {amount:1};},response:value=>{only(value,['count']);return {count:count(value.count)};}},
      'reference.status.fail':{request:value=>{only(value,[]);return {};},response:value=>value}
    },
    contexts:{'shell.selection':value=>{only(value,['id']);if(!['sample-a','sample-b',null].includes(value.id))throw Error('Unknown sample context');return {id:value.id};}}
  };
  function create(){
    let context=null,container=null,section=null,output=null,selection=null,dimensions=null,button=null,active=false,state={count:0,selection:null},disposed=false;
    const draw=()=>{if(!section)return;output.textContent='Local counter: '+state.count;selection.textContent='Approved sample context: '+(state.selection||'none');button.disabled=!active;};
    const increment=()=>{if(!active)throw Error('Reference application is inactive');state.count=count(state.count+1);draw();context.emit('reference.status.changed',{count:state.count});return {count:state.count};};
    return {
      initialize(value){context=value;context.onDispose(()=>{button?.removeEventListener('click',onClick);});context.report({level:'healthy',code:'reference.ready',message:'Synthetic reference only; no backend connection.'});},
      mount(target){
        if(context.signal.aborted)throw Error('Mount cancelled');container=target;const doc=target.ownerDocument;
        section=doc.createElement('section');const title=doc.createElement('h2');title.textContent='Application-owned reference UI';
        const note=doc.createElement('p');note.textContent='Synthetic counter and context. This is not an operational application.';
        output=doc.createElement('p');selection=doc.createElement('p');dimensions=doc.createElement('p');button=doc.createElement('button');button.textContent='Increment inside application';button.addEventListener('click',onClick);
        section.append(title,note,output,selection,dimensions,button);container.append(section);draw();
      },
      activate(){active=true;draw();},deactivate(){active=false;draw();},
      resize(size){if(dimensions)dimensions.textContent='Resize notification: '+size.width+' × '+size.height;},
      handleCommand(name){if(name==='reference.status.fail'){context.report({level:'degraded',code:'reference.simulated',message:'A recoverable sample command failed.'});throw Error('Simulated reference command failure');}return increment();},
      receiveContext(name,value){state.selection=value.id;draw();},
      saveState(){return {...state};},
      restoreState(value){only(value,['count','selection']);const selected=schemas.contexts['shell.selection']({id:value.selection});state={count:count(value.count),selection:selected.id};draw();},
      dispose(){if(disposed)return;disposed=true;active=false;button?.removeEventListener('click',onClick);section?.remove();container=null;}
    };
    function onClick(){try{increment();}catch{context.report({level:'degraded',code:'reference.limit',message:'Reference counter limit reached.'});}}
  }
  const api={manifest,schemas,create};root.ScopeReferenceApplication=api;if(typeof module!=='undefined')module.exports=api;
})(typeof globalThis!=='undefined'?globalThis:this);

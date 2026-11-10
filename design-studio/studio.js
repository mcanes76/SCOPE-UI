(async function(){
  'use strict';
  const C=ScopeDesign,$=s=>document.querySelector(s),escape=s=>String(s).replace(/[&<>"']/g,x=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[x]));
  const steps=[['navigation','Navigation','3 min','Choose a way of working.','Four navigation philosophies. Start with the shell; reveal application details when ready.'],['theme','Material','2 min','Set the visual character.','Existing materials, preserved across all four navigation models.'],['colors','Colors & edges','3 min','Make the structure legible.','Decorative tokens apply only to the shell. Operational controls retain their meaning.'],['typography','Type & density','2 min','Tune for viewing distance.','Use comfortable text and spacing for the intended console.'],['layout','Layout','2 min','Give work room to breathe.','Dimensions respect the selected navigation model and responsive breakpoints.'],['review','Final review','3 min','Bring the design to life.','Present the chosen shell with all simulated applications available.']];
  const regionNames={shell:'SCOPE Shell',header:'Header',branding:'Branding / Logo',navigation:'Navigation',workspace:'Main Workspace Container',context:'Context Rail',footer:'Footer / Status Area'};
  const navDescriptions={aperture:'One focused workspace; navigation on demand.',mosaic:'Concurrent applications on a spatial workbench.',portal:'Application directory leading to dedicated rooms.',deck:'Persistent navigation and a context rail.'};
  let presets=[],params={},store,mode='guided',step=0,region='shell',application='blos',rightApplication='display',presenting=false,priorMode='guided',noticeTimer;
  const clients=new Map(),origin=location.origin;
  function notice(message,error=false){$('#notice').textContent=message;$('#notice').dataset.error=String(error);clearTimeout(noticeTimer);noticeTimer=setTimeout(()=>$('#notice').textContent='',6500);}
  function register(frame,design=null){const channel=crypto.randomUUID();clients.set(channel,{frame,design,ready:false});frame.src='../mockups/scope-integrated-electric-glass.html?studio=1&studioChannel='+encodeURIComponent(channel);return channel;}
  function send(client,channel){if(!client.ready)return;client.frame.contentWindow.postMessage({namespace:'scope-design-studio',version:1,channel,type:'configure',design:client.design||store.value,presets,options:{editing:!client.design&&mode==='advanced'&&!presenting,region:client.design?'':region,application:client.design?'blos':application,rightApplication:client.design?'display':rightApplication,presentation:!client.design&&presenting}},origin);}
  function sync(){for(const [channel,client] of clients)send(client,channel);}
  window.addEventListener('message',event=>{
    const m=event.data;if(event.origin!==origin||m?.namespace!=='scope-design-studio'||m.version!==1)return;
    const client=clients.get(m.channel);if(!client||event.source!==client.frame.contentWindow)return;
    if(m.type==='ready'){client.ready=true;send(client,m.channel);if(!client.design)$('#preview-status').textContent='Connected · live';}
    else if(m.type==='error')notice(m.message,true);
    else if(!client.design&&m.type==='application'&&['blos','display','calibration','los'].includes(m.application)){
      application=m.application;$('#application').value=application;
      if(['blos','display','calibration','los'].includes(m.rightApplication)){rightApplication=m.rightApplication;$('#right-application').value=rightApplication;}
    }
    else if(!client.design&&m.type==='selection'&&Object.hasOwn(C.regions,m.region)&&mode==='advanced'){region=m.region;renderControls();sync();}
    else if(!client.design&&m.type==='resize'&&['navigation','context'].includes(m.region)&&mode==='advanced'){
      store.update(d=>{(d.regions[m.region]??={}).width=m.width;},'resize-'+m.region);renderControls();
    }
  });
  function theme(){return presets.find(p=>p.id===store.value.theme);}
  function read(path){return path.split('.').reduce((v,k)=>v?.[k],store.value);}
  function set(path,value){store.update(d=>{const keys=path.split('.');let node=d;for(const k of keys.slice(0,-1))node=node[k]??=( {} );node[keys.at(-1)]=value;},path);}
  function field(label,path,value,min,max,stepSize=1,disabled=false){return `<div class="field"><label for="${path}">${label}<output id="output-${path}">${value}</output></label><input id="${path}" type="range" min="${min}" max="${max}" step="${stepSize}" value="${value}" data-path="${path}" ${disabled?'disabled':''}></div>`;}
  function select(label,path,options,value){return `<div class="field"><label for="${path}">${label}</label><select id="${path}" data-path="${path}">${options.map(o=>{const [id,name]=Array.isArray(o)?o:[o,o];return `<option value="${id}" ${id===value?'selected':''}>${escape(name)}</option>`;}).join('')}</select></div>`;}
  function checkbox(label,path,value,disabled=false){return `<div class="field"><label class="check"><span>${label}</span><input type="checkbox" data-path="${path}" ${value?'checked':''} ${disabled?'disabled':''}></label></div>`;}
  function color(label,path,value){return `<div class="field"><label for="${path}">${label}</label><div class="color-row"><input type="color" id="${path}" data-path="${path}" value="${value}"><code id="output-${path}">${value}</code></div></div>`;}
  function colorsPanel(){const d=store.value,t=theme();return ['background','header','navigation','workspace','panel','accent','text','border'].map(k=>color(({background:'Main background',header:'Header',navigation:'Navigation',workspace:'Workspace',panel:'Panel fill',accent:'Decorative accent',text:'Shell text',border:'Border'})[k],'colors.'+k,d.colors[k]||t.colors[k])).join('')+field('Border thickness','material.borderWidth',d.material.borderWidth??t.material.borderWidth,0,3,.5)+field('Corner radius','material.radius',d.material.radius??t.material.radius,0,28)+field('Glass opacity','material.opacity',d.material.opacity??t.material.opacity,.6,.98,.01)+field('Glass blur','material.blur',d.material.blur??t.material.blur,0,28)+`<div class="semantic" aria-label="Preserved operational colors"><span style="background:#00d96c"></span><span style="background:#d91f35"></span><span style="background:#ffd000"></span><span style="background:#00bfff"></span><span style="background:#7040d9"></span></div><p class="hint">Join / Enable · Leave / Disable · Warning · Info · Configuration. Semantic colors are protected.</p><button style="margin-top:14px" data-action="reset-global">Reset color & material overrides</button>`;}
  function typographyPanel(){const t=store.value.typography;return select('Font family','typography.family',['system-ui','Segoe UI','Arial','Trebuchet MS','Georgia'],t.family)+field('Base size (px)','typography.baseSize',t.baseSize,14,20)+field('Heading size (px)','typography.headingSize',t.headingSize,18,36)+field('Font weight','typography.weight',t.weight,400,700,100)+select('Density','typography.density',['compact','comfortable','spacious'],t.density)+field('Interface spacing (px)','typography.spacing',t.spacing,8,28);}
  function layoutPanel(){const d=store.value,l=d.layout,deck=d.navigation==='deck'&&l.mode==='single';return select('Application arrangement','layout.mode',[['single','Shell-native layout'],['split','Side-by-side applications']],l.mode)+field('Navigation width','layout.navWidth',l.navWidth,140,280,1,!deck)+field('Context rail width','layout.contextWidth',l.contextWidth,180,360,1,!deck)+checkbox('Context rail visible','layout.contextVisible',l.contextVisible,!deck)+checkbox('Header visible','layout.headerVisible',l.headerVisible)+checkbox('Footer visible','layout.footerVisible',l.footerVisible)+field('Header minimum height','layout.headerHeight',l.headerHeight,56,112)+field('Workspace padding','layout.workspacePadding',l.workspacePadding,8,40)+field('Panel gap','layout.panelGap',l.panelGap,8,28)+`<p class="hint">Navigation and context widths apply to Command Deck in its native layout. On narrower previews, the context rail moves below the workspace. Aperture, Mosaic and Portal retain their own structure.</p>`;}
  function inspectorPanel(){const d=store.value,v=d.regions[region]||{},t=theme(),prefix='regions.'+region+'.';let html=`<div class="section-kicker">Shell inspector / editable</div><h2>${regionNames[region]}</h2><p class="intro">Local changes appear immediately. Click the preview chrome or choose a shell region in the tree.</p>`;
    html+=color('Background',prefix+'background',v.background||d.colors[region==='shell'?'background':region]||t.colors[region==='shell'?'background':region]||t.colors.panel)+color('Text',prefix+'text',v.text||d.colors.text||t.colors.text)+color('Border',prefix+'border',v.border||d.colors.border||t.colors.border);
    for(const [key,label] of [['borderWidth','Border thickness'],['radius','Corner radius'],['opacity','Glass opacity'],['blur','Glass blur'],['padding','Padding'],['gap','Spacing']]){const b=C.bounds[key];html+=field(label,prefix+key,v[key]??d.material[key]??t.material[key]??(key==='gap'?16:12),...b,key==='opacity'?.01:key==='borderWidth'?.5:1);}
    if(region==='branding')html+=field('Logo size (aspect preserved)',prefix+'width',v.width||40,24,64);
    if(['navigation','context'].includes(region))html+=field('Region width',prefix+'width',v.width||d.layout[region==='navigation'?'navWidth':'contextWidth'],region==='navigation'?140:180,region==='navigation'?280:360,1,d.navigation!=='deck'||d.layout.mode!=='single');
    if(region==='header')html+=field('Minimum height',prefix+'height',v.height||d.layout.headerHeight,56,112);
    html+=checkbox('Visible',prefix+'visible',v.visible!==false,['shell','branding','navigation','workspace'].includes(region));
    html+=`<div class="inspector-actions"><button data-action="apply-selected" class="primary">Apply to Selected</button><button data-action="apply-global">Apply Globally</button><button data-action="reset-region">Reset to Theme Default</button></div><p class="hint">Apply Globally promotes color, material and spacing overrides to compatible shell containers. Dimensions and visibility stay local. Semantic controls remain unchanged.</p>`;
    return html;
  }
  function guidedPanel(){const d=store.value,s=steps[step];let html=`<div class="section-kicker">Step ${step+1} / 6 · ${s[2]}</div><h2>${s[3]}</h2><p class="intro">${s[4]}</p>`;
    if(step===0)html+=`<div class="choices">${C.navigation.map(id=>`<button class="choice" data-navigation="${id}" aria-pressed="${d.navigation===id}"><span class="thumbnail ${id}" aria-hidden="true"></span><span><strong>${escape(params.labels?.shells?.[id]||id)}</strong><small>${navDescriptions[id]}</small></span></button>`).join('')}</div>`;
    if(step===1)html+=`<div class="choices">${presets.map(p=>`<button class="choice theme-choice" data-theme="${p.id}" aria-pressed="${d.theme===p.id}"><span class="theme-chip" style="--swatch:linear-gradient(130deg,${p.colors.background},${p.colors.panel} 55%,${p.colors.accent})" aria-hidden="true"></span><span><strong>${escape(p.name)}</strong><small>${escape(p.description)}</small></span></button>`).join('')}</div>`;
    if(step===2)html+=colorsPanel();if(step===3)html+=typographyPanel();if(step===4)html+=layoutPanel();
    if(step===5)html+=`<dl class="review-list"><div><dt>Navigation</dt><dd>${escape(params.labels?.shells?.[d.navigation]||d.navigation)}</dd></div><div><dt>Material</dt><dd>${escape(theme().name)}</dd></div><div><dt>Typography</dt><dd>${escape(d.typography.family)} · ${d.typography.baseSize}px · ${d.typography.density}</dd></div><div><dt>Workspace</dt><dd>${d.layout.mode==='split'?'Side-by-side':'Shell-native'} · ${d.layout.workspacePadding}px padding</dd></div></dl><button data-action="present" class="primary">Present Final Design ↗</button><p class="hint">All details become visible. Applications remain interactive. Use Return to Studio to keep editing.</p><div class="inspector-actions"><button data-action="export-json">Save design JSON</button><button data-action="export-final">Export standalone mockup</button><button data-action="export-summary">Export decision summary</button></div>`;
    return html;
  }
  function renderControls(){
    const advanced=mode==='advanced';document.body.classList.toggle('advanced',advanced);$('#structure').hidden=!advanced;$('#steps').hidden=advanced;$('#workshop-note').hidden=advanced;$('#step-actions').hidden=advanced;
    document.querySelectorAll('[data-mode]').forEach(b=>b.setAttribute('aria-pressed',b.dataset.mode===mode));
    $('#steps').innerHTML=steps.map((s,i)=>`<button data-step="${i}" ${i===step?'aria-current="step"':''}><span class="number">${i+1}</span><span><strong>${s[1]}</strong><small>${s[2]}</small></span></button>`).join('');
    if(advanced)$('#structure').innerHTML=`<h3>Shell structure</h3><div class="compact-selects">${select('Navigation','navigation',C.navigation.map(id=>[id,params.labels?.shells?.[id]||id]),store.value.navigation)}${select('Theme','theme',presets.map(p=>[p.id,p.name]),store.value.theme)}</div><hr style="border:0;border-top:1px solid #29374c;margin:18px 0">${Object.keys(C.regions).map(id=>`<button class="tree-item" data-region="${id}" aria-pressed="${region===id}">${regionNames[id]}</button>`).join('')}<div class="locked"><strong>APPLICATION BOUNDARIES / LOCKED</strong><p>Use applications in the preview. Internal controls are read-only to this editor.</p>${Object.entries(params.applications||{}).map(([,app])=>`<span>▣ ${escape(app.name)}</span>`).join('')}</div><details style="margin:20px 8px 0"><summary>Global typography & layout</summary>${typographyPanel()}${layoutPanel()}</details>`;
    if(!advanced)$('#structure').replaceChildren();
    $('#controls').innerHTML=advanced?inspectorPanel():guidedPanel();$('#decision-note').value=store.value.notes[steps[step][0]];$('#back').disabled=step===0;$('#next').textContent=step===5?'Present design ↗':'Next →';
    updateStatus();
  }
  function updateStatus(){if(!store)return;$('#undo').disabled=!store.past.length;$('#redo').disabled=!store.future.length;$('#details').checked=store.value.detailsVisible;$('#design-name').value=store.value.name;$('#right-app-label').hidden=store.value.layout.mode!=='split';}
  function present(){priorMode=mode;presenting=true;store.update(d=>{d.detailsVisible=true;});document.body.classList.add('presenting');$('#presentation-actions').hidden=false;sync();$('#presentation-actions button').focus?.();document.documentElement.requestFullscreen?.().catch(()=>{});}
  function returnStudio(){presenting=false;mode=priorMode;document.body.classList.remove('presenting');$('#presentation-actions').hidden=true;if(document.fullscreenElement)document.exitFullscreen?.().catch(()=>{});renderControls();sync();$('[data-action=present]').focus?.();}
  function compare(){
    const names=Object.keys(store.candidates);if(names.length<2){notice('Save Candidate A, B or C before comparing with Baseline.');return;}
    for(const id of ['compare-left','compare-right'])$('#'+id).innerHTML=names.map(n=>`<option>${n}</option>`).join('');$('#compare-left').value=names[0];$('#compare-right').value=names[1];$('#comparison').showModal();renderComparison();
  }
  function clearComparison(){for(const [channel,client] of clients)if(client.design)clients.delete(channel);$('#compare-grid').replaceChildren();}
  function renderComparison(){clearComparison();for(const side of ['left','right']){const name=$('#compare-'+side).value,section=document.createElement('section'),heading=document.createElement('h3'),box=document.createElement('div'),frame=document.createElement('iframe');heading.textContent=name+' / '+store.candidates[name].name;frame.title=name+' shell comparison';box.append(frame);section.append(heading,box);$('#compare-grid').append(section);const d=C.clone(store.candidates[name]);d.detailsVisible=false;register(frame,d);}}
  async function exportAction(kind){const d=C.clone(store.value);if(kind==='json')ScopeExports.download(JSON.stringify(d,null,2),'scope-design.json','application/json');if(kind==='css')ScopeExports.download(ScopeExports.css(d,presets),'scope-design.css','text/css');if(kind==='summary')ScopeExports.download(ScopeExports.summary(d,presets,params),'scope-decisions.html','text/html');if(kind==='final'){notice('Preparing standalone mockup with embedded CSS, configuration, logos and Earth texture…');const html=await ScopeExports.finalHTML(d,presets);ScopeExports.download(html,'scope-final-mockup.html','text/html');notice('Standalone mockup exported. It starts a fresh local simulation.');}}
  document.addEventListener('click',async event=>{
    const b=event.target.closest('button');if(!b||b.disabled||!store)return;
    try{
      if(b.dataset.mode){mode=b.dataset.mode;renderControls();sync();}
      if(b.dataset.step!==undefined){step=Number(b.dataset.step);renderControls();}
      if(b.dataset.region){region=b.dataset.region;renderControls();sync();}
      if(b.dataset.navigation){set('navigation',b.dataset.navigation);renderControls();}
      if(b.dataset.theme){chooseTheme(b.dataset.theme);renderControls();}
      if(b.id==='undo'){store.undo();renderControls();}if(b.id==='redo'){store.redo();renderControls();}
      if(b.id==='back'){step=Math.max(0,step-1);renderControls();}if(b.id==='next'){if(step===5)present();else {step++;renderControls();}}
      const action=b.dataset.action;if(!action)return;
      if(action==='present')present();if(action==='return')returnStudio();
      if(action==='save-candidate'){const name=$('#checkpoint').value;store.save(name);$('#candidate-status').textContent=name+' saved';notice(name+' saved in this session. Export JSON to keep it.');}
      if(action==='restore-candidate'){store.restore($('#checkpoint').value);renderControls();notice('Checkpoint restored.');}
      if(action==='compare')compare();if(action==='close-compare')$('#comparison').close();
      if(action==='defaults'){store.set(C.defaults);renderControls();}
      if(action==='import')$('#import-file').click();
      if(action.startsWith('export-'))await exportAction(action.slice(7));
      if(action==='apply-selected')notice('Local overrides applied to '+regionNames[region]+'.');
      if(action==='apply-global'){
        store.update(d=>{const v=d.regions[region]||{};for(const [k,x] of Object.entries(v)){if(['background','text','border'].includes(k)){if(k==='background')for(const target of ['background','header','navigation','workspace','panel'])d.colors[target]=x;else d.colors[k]=x;}if(['borderWidth','radius','opacity','blur'].includes(k))d.material[k]=x;if(k==='gap'){d.layout.panelGap=x;d.typography.spacing=x;}if(k==='padding')d.layout.workspacePadding=Math.max(8,x);}
          for(const local of Object.values(d.regions))for(const k of Object.keys(v))if(!['width','height','visible'].includes(k))delete local[k];});renderControls();notice('Appearance tokens applied to compatible shell containers.');
      }
      if(action==='reset-region'){store.update(d=>{delete d.regions[region];});renderControls();}
      if(action==='reset-global'){store.update(d=>{d.colors={};d.material={};});renderControls();}
    }catch(error){notice(error.message,true);}
  });
  function chooseTheme(id){const preset=presets.find(p=>p.id===id);store.update(d=>{d.theme=id;d.typography=C.clone(preset.typography);});}
  document.addEventListener('input',event=>{
    const el=event.target;if(!store)return;
    try{
      if(el.dataset.path){const value=el.type==='checkbox'?el.checked:el.type==='range'?Number(el.value):el.value;if(el.dataset.path==='theme')chooseTheme(value);else set(el.dataset.path,value);const out=document.getElementById('output-'+el.dataset.path);if(out)out.textContent=el.value;if(['navigation','theme','layout.mode'].includes(el.dataset.path))renderControls();}
      if(el.id==='details')set('detailsVisible',el.checked);
      if(el.id==='decision-note')set('notes.'+steps[step][0],el.value);
      if(el.id==='design-name'&&el.value.trim())set('name',el.value);
      if(el.id==='zoom'){const z=Number(el.value);$('#preview').style.transform='scale('+z+')';$('#preview').style.width=100/z+'%';$('#preview').style.height=100/z+'%';}
      if(el.id==='application'){application=el.value;sync();}if(el.id==='right-application'){rightApplication=el.value;sync();}
    }catch(error){notice(error.message,true);}
  });
  document.addEventListener('keydown',event=>{if(presenting&&event.key==='Escape'){returnStudio();return;}if((event.ctrlKey||event.metaKey)&&event.key.toLowerCase()==='z'&&!event.target.matches('input,textarea,select')){event.preventDefault();if(event.shiftKey)store.redo();else store.undo();renderControls();}});
  $('#comparison').addEventListener('close',clearComparison);for(const id of ['compare-left','compare-right'])$('#'+id).addEventListener('change',renderComparison);
  $('#import-file').addEventListener('change',async event=>{try{const file=event.target.files[0];if(!file)return;if(file.size>100000)throw Error('Configuration exceeds 100 KB');store.set(JSON.parse(await file.text()));renderControls();notice('Design imported. Application simulation state was retained.');}catch(error){notice('Import failed: '+error.message,true);}finally{event.target.value='';}});
  try{
    if(origin==='null')throw Error('Open the Studio over HTTP. From the repository root run: python -m http.server 8080');
    const results=await Promise.all(['theme-presets.json','design-config.json','../mockups/params.json'].map(async url=>{const r=await fetch(url,{cache:'no-store'});if(!r.ok)throw Error('Cannot load '+url);return r.json();}));
    [presets,,params]=[results[0].presets,results[1],results[2]];store=new C.DesignStore(results[1]);
    // Keep preset input under the same trusted schema as imported design tokens.
    for(const p of presets)C.validate({...C.defaults,theme:p.id,colors:p.colors,material:p.material,typography:p.typography});
    store.subscribe(()=>{sync();updateStatus();});
    $('#studio-brand').textContent=params.branding?.name||'SCOPE';document.title=(params.branding?.name||'SCOPE')+' Design Studio';
    const logo=$('#studio-logo'),path=params.logoPath||'assets/logo.png';if(!/^(?:[a-z][a-z0-9+.-]*:|\/|\\)/i.test(path)&&!path.includes('\\'))logo.src=new URL(path,new URL('../mockups/',location.href)).href;logo.addEventListener('error',()=>{if(!logo.dataset.fallback){logo.dataset.fallback='1';logo.src='../mockups/assets/scope-logo.svg';}else logo.hidden=true;});
    for(const id of ['application','right-application'])$('#'+id).innerHTML=Object.entries(params.applications).map(([key,value])=>`<option value="${key}">${escape(value.name)}</option>`).join('');$('#right-application').value=rightApplication;
    renderControls();register($('#preview'));
    setTimeout(()=>{if(![...clients.values()].some(c=>c.ready))notice('Preview not connected. Check that the repository root is served over HTTP.',true);},12000);
  }catch(error){notice(error.message,true);$('#controls').textContent=error.message;$('#preview-status').textContent='Not connected';}
})();

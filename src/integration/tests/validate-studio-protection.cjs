/* Read-only change-control gate; never resets, rewrites or commits Studio files. */
'use strict';
const cp=require('node:child_process'),path=require('node:path'),fs=require('node:fs'),assert=require('node:assert/strict');
const root=path.resolve(__dirname,'../../..'),base='30bf8d6f0c0ca38a38273fe99114fa0062c57f1b';
const git=args=>cp.execFileSync('git',args,{cwd:root,encoding:'utf8',stdio:['pipe','pipe','pipe']}).trim();
assert.equal(git(['branch','--show-current']),'feature/scope-app-integration','Wrong branch: stop before integration changes');
const paths=git(['ls-tree','-r','--name-only',base]).split('\n');
// The original baseline remains fixed. User-authorized runtime changes require
// documented, exact Git blob hashes rather than a general path exemption.
const approval=JSON.parse(fs.readFileSync(path.join(__dirname,'studio-approved-changes.json'),'utf8'));
assert.equal(approval.baseline,base);assert.equal(approval.feature,'SCOPE - Standalone Design JSON Switching');
assert(Array.isArray(approval.files)&&new Set(approval.files.map(x=>x.path)).size===approval.files.length);
for(const item of approval.files){assert(paths.includes(item.path)&&typeof item.purpose==='string'&&typeof item.impact==='string'&&/^[a-f0-9]{40}$/.test(item.gitBlob),'Invalid change approval');assert.equal(git(['hash-object','--path',item.path,item.path]),item.gitBlob,'Approved file drifted: '+item.path);}
const changes=git(['diff','--name-only',base,'--',...paths]).split('\n').filter(Boolean);
assert(changes.every(file=>approval.files.some(item=>item.path===file)),'An unapproved pre-existing tracked file changed: '+changes.join(', '));
const runtimeRoots=['design-studio/','dist/','mockups/','scripts/'];
const files=[...git(['ls-files','--cached','--others','--exclude-standard']).split('\n')];
assert(!files.some(p=>runtimeRoots.some(prefix=>p.startsWith(prefix))&&!paths.includes(p)),'New runtime/Studio files require explicit review');
assert.equal(git(['rev-parse','2730fdf^{tree}']),git(['rev-parse','791e4bf^{tree}']),'Phase 2 revert baseline changed');
const C=require('../../../design-studio/design-core.js'),W=require('../../../design-studio/workspace.js'),presets=JSON.parse(fs.readFileSync(path.join(root,'design-studio/theme-presets.json'),'utf8')).presets;
assert.equal(presets.length,31);assert(!presets.some(p=>p.visualFamily||['command-dark','frosted-white-glass'].includes(p.id)));assert(W.defaults.windowed);assert(C.validate({...C.defaults,shellComponents:{buttons:{radius:6}}}).shellComponents.buttons.radius===6);
console.log(JSON.stringify({protection:'pass',baseline:base,branch:git(['branch','--show-current']),unchangedExistingFiles:paths.length-changes.length,approvedExactFileChanges:changes.length,approvalFeature:approval.feature,newStudioRuntimeFiles:0,phase1:'retained',phase2:'reverted',phase3:'retained',themes:presets.length},null,2));

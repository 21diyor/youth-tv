import assert from 'node:assert/strict'
import {readFileSync} from 'node:fs'
import vm from 'node:vm'
import ts from 'typescript'
const source=readFileSync('src/hooks/useDeploymentUpdate.ts','utf8').replaceAll('import.meta.env.DEV','false')
const code=ts.transpileModule(source,{compilerOptions:{module:ts.ModuleKind.CommonJS}}).outputText
let check,reloads=0,version='build-one',fail=false
const context={exports:{},require:()=>({useEffect:fn=>fn()}),__TV_RELEASE__:'build-one',AbortController,Date,console,
 setTimeout:()=>0,clearTimeout(){},setInterval:fn=>{check=fn;return 1},clearInterval(){},
 fetch:async()=>{if(fail)throw new Error('offline');return {ok:true,json:async()=>({version})}},
 sessionStorage:{getItem(){throw new Error('TV storage disabled')},setItem(){throw new Error('TV storage disabled')}},
 window:{location:{reload(){reloads++}},addEventListener(){},removeEventListener(){}},document:{addEventListener(){},removeEventListener(){}}}
vm.runInNewContext(code,context);context.exports.useDeploymentUpdate()
await new Promise(r=>setImmediate(r));assert.equal(reloads,0)
fail=true;await check();assert.equal(reloads,0)
fail=false;version='build-two';await check();assert.equal(reloads,1)
await check();assert.equal(reloads,1)
console.log('PASS: unchanged builds, offline retry, deployment reload, disabled TV storage, reload-loop guard')

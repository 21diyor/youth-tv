import assert from 'node:assert/strict'
import {loadEnvFile} from 'node:process'
import {createClient} from '@supabase/supabase-js'
import sharp from 'sharp'
import handler from '../api/tv-image.ts'
loadEnvFile('.env.local')
const db=createClient(process.env.VITE_SUPABASE_URL,process.env.VITE_SUPABASE_PUBLISHABLE_KEY,{auth:{persistSession:false}})
const {data,error}=await db.rpc('current_hr_slides');assert.ifError(error)
const path=data.employees[0].photoPath
const run=async path=>{let body;const res={statusCode:200,setHeader(){},end(value){body=value}};await handler({method:'GET',url:'/api/tv-image?path='+encodeURIComponent(path)},res);return {status:res.statusCode,body}}
const result=await run(path);assert.equal(result.status,200)
const meta=await sharp(result.body).metadata();assert.equal(meta.format,'jpeg');assert.ok(meta.width<=1200&&meta.height<=1400)
const original=await db.storage.from('tv-media').download(path);assert.ifError(original.error)
assert.ok(result.body.length<original.data.size)
assert.equal((await run('../private')).status,400)
assert.equal((await run('birthday/nonexistent.jpg')).status,404)
console.log(`PASS optimized JPEG: ${original.data.size} -> ${result.body.length} bytes; ${meta.width}x${meta.height}; forbidden and missing paths rejected`)

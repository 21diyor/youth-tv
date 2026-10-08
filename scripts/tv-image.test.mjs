import test from 'node:test'
import assert from 'node:assert/strict'
import sharp from 'sharp'
import handler from '../api/tv-image.ts'

test('TV proxy returns compact baseline JPEG and respects unavailable images',async()=>{
 const original=await sharp({create:{width:2400,height:3200,channels:3,background:'#4280a0'}}).png().toBuffer()
 const saved=globalThis.fetch
 const oldUrl=process.env.VITE_SUPABASE_URL,oldKey=process.env.VITE_SUPABASE_PUBLISHABLE_KEY
 process.env.VITE_SUPABASE_URL='https://example.supabase.co';process.env.VITE_SUPABASE_PUBLISHABLE_KEY='test'
 try {
  let called=0
  globalThis.fetch=async()=>{called++;return new Response(original,{status:200})}
  const headers={};let body
  const res={statusCode:200,setHeader:(k,v)=>headers[k]=v,end:v=>body=v}
  await handler({method:'GET',url:'/api/tv-image?path=birthday/test.png'},res)
  const meta=await sharp(body).metadata()
  assert.equal(meta.format,'jpeg');assert.ok(meta.width<=800&&meta.height<=1000);assert.equal(meta.isProgressive,false)
  assert.equal(headers['Cache-Control'],'no-store');assert.ok(body.length<100000)
  globalThis.fetch=async()=>new Response(null,{status:403})
  await handler({method:'GET',url:'/api/tv-image?path=birthday/test.png'},res)
  assert.equal(res.statusCode,404)
  await handler({method:'GET',url:'/api/tv-image?path=../private.png'},res)
  assert.equal(res.statusCode,400);assert.equal(called,1)
 }finally{
  globalThis.fetch=saved
  if(oldUrl===undefined)delete process.env.VITE_SUPABASE_URL;else process.env.VITE_SUPABASE_URL=oldUrl
  if(oldKey===undefined)delete process.env.VITE_SUPABASE_PUBLISHABLE_KEY;else process.env.VITE_SUPABASE_PUBLISHABLE_KEY=oldKey
 }
})

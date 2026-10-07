import sharp from 'sharp'
import type {IncomingMessage,ServerResponse} from 'node:http'

// Never use an admin/service key here. Anonymous Storage RLS restricts this
// endpoint to the same currently published portraits the TV may already read.
export default async function handler(req:IncomingMessage,res:ServerResponse) {
 res.setHeader('Cache-Control','no-store')
 if(req.method!=='GET'){res.statusCode=405;res.end();return}
 const path=new URL(req.url||'/', 'https://tv.local').searchParams.get('path')||''
 if(!/^(birthday|employee|president|schedule|managers)\/[a-zA-Z0-9-]+\.(jpg|jpeg|png|webp)$/.test(path)){res.statusCode=400;res.end();return}
 const base=process.env.VITE_SUPABASE_URL,key=process.env.VITE_SUPABASE_PUBLISHABLE_KEY
 if(!base||!key){res.statusCode=503;res.end();return}
 try {
  const upstream=await fetch(`${base}/storage/v1/object/authenticated/tv-media/${path}`,{headers:{apikey:key,...(key.startsWith('eyJ')?{Authorization:`Bearer ${key}`}:{})},signal:AbortSignal.timeout(20000)})
  if(!upstream.ok){res.statusCode=404;res.end();return}
  if(Number(upstream.headers.get('content-length'))>6*1024*1024){res.statusCode=413;res.end();return}
  const original=Buffer.from(await upstream.arrayBuffer())
  if(original.length>6*1024*1024){res.statusCode=413;res.end();return}
  const image=await sharp(original,{limitInputPixels:50000000}).rotate().resize({width:1200,height:1400,fit:'inside',withoutEnlargement:true}).flatten({background:'#ffffff'}).jpeg({quality:82,progressive:false}).toBuffer()
  res.setHeader('Content-Type','image/jpeg');res.setHeader('Content-Length',image.length);res.end(image)
 }catch{res.statusCode=502;res.end()}
}

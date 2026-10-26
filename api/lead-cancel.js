// "Cancel my tour request" from the no-show email. GET only shows a confirm button:
// email scanners open links, and a link alone must never cancel anything. POST (the
// button) checks the signature and has Nana's Brain archive the lead.
import { cancelSigOk } from '../lib/brain.js';
const page=(title,body,status=200)=>new Response(`<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><meta name="robots" content="noindex"><title>${title} | Nana’s Cozy Corner</title><style>body{margin:0;background:#fff8ed;font-family:Arial,Helvetica,sans-serif;color:#30281f}main{max-width:520px;margin:48px auto;background:#fff;border-radius:16px;padding:32px 28px}h1{font-size:24px;margin:0 0 16px}p{line-height:1.6}button{display:inline-block;background:#425b42;color:#fffdf8;border:0;border-radius:999px;padding:14px 28px;font-size:16px;font-weight:bold;cursor:pointer}a{color:#425b42}</style></head><body><main>${body}</main></body></html>`,{status,headers:{'Content-Type':'text/html; charset=utf-8','Cache-Control':'no-store'}});
const valid=(id,sig)=>typeof id==='string'&&/^[a-z0-9]{10,100}$/i.test(id)&&cancelSigOk(id,sig);
const invalid=()=>page('Link not valid','<h1>This link is not valid</h1><p>Please call us at <a href="tel:+14144426262">414-442-6262</a> or reply to our email and we’ll take care of it.</p>',400);
export function GET(request){
 const u=new URL(request.url);const id=u.searchParams.get('id'),sig=u.searchParams.get('sig');
 if(!valid(id,sig))return invalid();
 return page('Cancel your tour request',`<h1>Cancel your tour request?</h1><p>We won’t contact you about this tour again. You’re always welcome back: book a visit any time at <a href="/schedule-a-tour.html">nanascozycorner.com</a>.</p><form method="post"><input type="hidden" name="id" value="${id}"><input type="hidden" name="sig" value="${sig}"><button type="submit">Yes, cancel my request</button></form><p><a href="/schedule-a-tour.html?ref=${encodeURIComponent(id)}#inquiry">Pick a new tour time instead</a></p>`);
}
export async function POST(request){
 let id,sig;try{const f=await request.formData();id=f.get('id');sig=f.get('sig');}catch{return invalid();}
 if(!valid(id,sig))return invalid();
 try{
  const r=await fetch('https://www.nanascozycorner.app/api/leads/cancel',{method:'POST',headers:{Authorization:`Bearer ${process.env.WEBSITE_INTAKE_SECRET}`,'Content-Type':'application/json'},body:JSON.stringify({id}),signal:AbortSignal.timeout(10000)});
  if(!r.ok)throw Error();
 }catch{return page('Something went wrong','<h1>We couldn’t cancel that just now</h1><p>Please try again in a minute, or call us at <a href="tel:+14144426262">414-442-6262</a>.</p>',502);}
 return page('Request cancelled','<h1>Your tour request is cancelled</h1><p>Thank you for letting us know. If you’re ever looking for care again, we’d love to meet you: <a href="/schedule-a-tour.html">book a visit</a> or call <a href="tel:+14144426262">414-442-6262</a>.</p><p><strong>Nana’s Cozy Corner</strong></p>');
}

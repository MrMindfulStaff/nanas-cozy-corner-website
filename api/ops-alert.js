// Operational alerts from Nana's Brain (first user: ELV Attendance Sync failures),
// sent here because this project holds the email key. Bridge-secret only, and the
// recipients are fixed (the center inbox in INQUIRY_TO plus Reginald), so the
// endpoint can never be used to email anyone else.
import { bridgeAuthorized } from '../lib/brain.js';
export async function POST(request){
 if(!bridgeAuthorized(request))return Response.json({ok:false},{status:401});
 let data;try{const raw=await request.text();if(raw.length>4000)throw Error();data=JSON.parse(raw);}catch{return Response.json({ok:false},{status:400});}
 const subject=typeof data.subject==='string'?data.subject.replace(/[\r\n]/g,' ').slice(0,160):'';
 const text=typeof data.text==='string'?data.text.slice(0,3000):'';
 if(!subject||!text)return Response.json({ok:false},{status:400});
 const to=[...new Set([process.env.INQUIRY_TO||'ms.kelly@nanascozycorner.com','reginald@mindfulstaff.com'])];
 try{
  const r=await fetch('https://api.resend.com/emails',{method:'POST',headers:{Authorization:`Bearer ${process.env.RESEND_API_KEY}`,'Content-Type':'application/json'},body:JSON.stringify({from:process.env.INQUIRY_FROM,to,subject:`[Nana’s Brain] ${subject}`,text}),signal:AbortSignal.timeout(8000)});
  const sent=await r.json().catch(()=>({}));
  const ok=r.ok&&!!sent.id;
  return Response.json({ok},{status:ok?200:502});
 }catch{return Response.json({ok:false},{status:502});}
}

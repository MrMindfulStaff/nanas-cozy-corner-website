// The no-show email, called by Nana's Brain when a lead is marked "No show" in Tours &
// Leads. Answers {ok:true} only when Resend accepted it. One email per missed tour: the
// idempotency key is the lead plus the missed tour's start time.
import { bridgeAuthorized, brain, noShowEmail } from '../lib/brain.js';
export async function POST(request){
 if(!bridgeAuthorized(request))return Response.json({ok:false},{status:401});
 let data;try{const raw=await request.text();if(raw.length>500)throw Error();data=JSON.parse(raw);}catch{return Response.json({ok:false},{status:400});}
 if(typeof data.id!=='string'||!/^[a-z0-9]{10,100}$/i.test(data.id))return Response.json({ok:false},{status:400});
 try{
  const {lead:l}=await brain('GET',null,'?id='+encodeURIComponent(data.id));
  if(!l.email||l.status!=='NO_SHOW')return Response.json({ok:false,skipped:true},{status:409});
  const w=noShowEmail(l);
  const r=await fetch('https://api.resend.com/emails',{method:'POST',headers:{Authorization:`Bearer ${process.env.RESEND_API_KEY}`,'Content-Type':'application/json','Idempotency-Key':`nana-${data.id}-noshow-${l.slot?new Date(l.slot.startsAt).getTime():'none'}`},body:JSON.stringify({from:process.env.INQUIRY_FROM,to:[l.email],reply_to:process.env.INQUIRY_TO||'ms.kelly@nanascozycorner.com',subject:w.subject,text:w.text,html:w.html}),signal:AbortSignal.timeout(8000)});
  const sent=await r.json().catch(()=>({}));
  const ok=r.ok&&!!sent.id;
  return Response.json({ok},{status:ok?200:502});
 }catch{return Response.json({ok:false},{status:502});}
}

// Pipeline emails, called by Nana's Brain when a lead moves to a new stage in Tours &
// Leads (the tour confirmation, reminders and no-show email have their own routes).
// Answers {ok:true} only when Resend accepted it. One email per lead, per stage, per day.
import { bridgeAuthorized, brain, stageEmail, STAGE_EMAILS } from '../lib/brain.js';
export async function POST(request){
 if(!bridgeAuthorized(request))return Response.json({ok:false},{status:401});
 let data;try{const raw=await request.text();if(raw.length>500)throw Error();data=JSON.parse(raw);}catch{return Response.json({ok:false},{status:400});}
 if(typeof data.id!=='string'||!/^[a-z0-9]{10,100}$/i.test(data.id)||!Object.hasOwn(STAGE_EMAILS,data.stage))return Response.json({ok:false},{status:400});
 try{
  const {lead:l}=await brain('GET',null,'?id='+encodeURIComponent(data.id));
  // A referral's address belongs to the person referring, not the family.
  if(!l.email||l.kind==='referral'||l.status!==data.stage)return Response.json({ok:false,skipped:true},{status:409});
  const w=stageEmail(l,data.stage);
  const day=new Intl.DateTimeFormat('en-CA',{timeZone:'America/Chicago'}).format(new Date());
  const r=await fetch('https://api.resend.com/emails',{method:'POST',headers:{Authorization:`Bearer ${process.env.RESEND_API_KEY}`,'Content-Type':'application/json','Idempotency-Key':`nana-${data.id}-stage-${data.stage}-${day}`},body:JSON.stringify({from:process.env.INQUIRY_FROM,to:[l.email],reply_to:process.env.INQUIRY_TO||'ms.kelly@nanascozycorner.com',subject:w.subject,text:w.text,html:w.html}),signal:AbortSignal.timeout(8000)});
  const sent=await r.json().catch(()=>({}));
  const ok=r.ok&&!!sent.id;
  return Response.json({ok},{status:ok?200:502});
 }catch{return Response.json({ok:false},{status:502});}
}

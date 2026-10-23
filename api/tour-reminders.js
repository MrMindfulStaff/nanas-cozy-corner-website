// Tour reminder emails, called by Nana's Brain's hourly cron (src/lib/tour-reminders.ts
// there decides what is due). Sends the day-before or morning-of reminder to the parent
// and answers {ok:true} only when Resend accepted it, so the Brain records it as sent.
import { bridgeAuthorized, brain } from '../lib/brain.js';
const KINDS=['day_before','morning'];
export async function POST(request){
 if(!bridgeAuthorized(request))return Response.json({ok:false},{status:401});
 let data;try{const raw=await request.text();if(raw.length>500)throw Error();data=JSON.parse(raw);}catch{return Response.json({ok:false},{status:400});}
 if(typeof data.id!=='string'||!/^[a-z0-9]{10,100}$/i.test(data.id)||!KINDS.includes(data.kind)||typeof data.startsAt!=='string')return Response.json({ok:false},{status:400});
 try{
  const {lead:l}=await brain('GET',null,'?id='+encodeURIComponent(data.id));
  // The tour must still be booked, and still at the time the Brain asked about.
  if(!l.slot||l.slot.state!=='BOOKED'||!l.email||new Date(l.slot.startsAt).getTime()!==new Date(data.startsAt).getTime())return Response.json({ok:false,skipped:true},{status:409});
  const start=new Date(l.slot.startsAt);
  const day=new Intl.DateTimeFormat('en-US',{timeZone:'America/Chicago',weekday:'long',month:'long',day:'numeric'}).format(start);
  const time=new Intl.DateTimeFormat('en-US',{timeZone:'America/Chicago',hour:'numeric',minute:'2-digit'}).format(start);
  const minutes=Math.round((new Date(l.slot.endsAt)-start)/60000);
  const subject=data.kind==='day_before'?`Reminder: your Nana’s Cozy Corner tour is tomorrow at ${time}`:`See you today at ${time}: your Nana’s Cozy Corner tour`;
  const opening=data.kind==='day_before'?`This is a reminder that your tour is tomorrow, ${day}, at ${time} (Milwaukee time).`:`We’re looking forward to seeing you today, ${day}, at ${time} for your tour.`;
  const text=`Hello ${l.name},\n\n${opening}\nLength: ${minutes} minutes.\nLocation: 4006 N 42nd Street, Milwaukee, WI 53216.\n\nIf you need to cancel or reschedule, reply to this email or call 414-442-6262.\n\nNana’s Cozy Corner`;
  const r=await fetch('https://api.resend.com/emails',{method:'POST',headers:{Authorization:`Bearer ${process.env.RESEND_API_KEY}`,'Content-Type':'application/json','Idempotency-Key':`nana-${data.id}-${data.kind}-${start.getTime()}`},body:JSON.stringify({from:process.env.INQUIRY_FROM,to:[l.email],reply_to:process.env.INQUIRY_TO||'ms.kelly@nanascozycorner.com',subject,text}),signal:AbortSignal.timeout(8000)});
  const sent=await r.json().catch(()=>({}));
  const ok=r.ok&&!!sent.id;
  return Response.json({ok},{status:ok?200:502});
 }catch{return Response.json({ok:false},{status:502});}
}

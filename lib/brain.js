import { timingSafeEqual } from 'node:crypto';
export const brainReady=()=>Boolean(process.env.WEBSITE_INTAKE_SECRET);
export function bridgeAuthorized(request){const key=process.env.WEBSITE_INTAKE_SECRET;const supplied=request.headers.get('authorization')?.replace(/^Bearer /,'')||'';return !!key && key.length>=32 && Buffer.byteLength(key)===Buffer.byteLength(supplied)&&timingSafeEqual(Buffer.from(key),Buffer.from(supplied));}
export async function brain(method='GET',data,query=''){
 if(!brainReady())throw Error('INTAKE_UNAVAILABLE');
 const r=await fetch('https://www.nanascozycorner.app/api/website-intake'+query,{method,headers:{Authorization:`Bearer ${process.env.WEBSITE_INTAKE_SECRET}`,'Content-Type':'application/json'},...(data?{body:JSON.stringify(data)}:{}),signal:AbortSignal.timeout(10000)});
 const result=await r.json();if(!r.ok){const e=new Error(result.error||'Unable to save inquiry');e.status=r.status;throw e;}return result;
}
export async function notify(id){
 const {lead:l}=await brain('GET',null,'?id='+encodeURIComponent(id));
 const version=l.notificationVersion;
 const cancelled=l.slot?.state==='CANCELLED';
 const when=l.slot?new Intl.DateTimeFormat('en-US',{timeZone:'America/Chicago',dateStyle:'full',timeStyle:'short'}).format(new Date(l.slot.startsAt)):'';
 const send=async(to,subject,text,key)=>{
  try{const r=await fetch('https://api.resend.com/emails',{method:'POST',headers:{Authorization:`Bearer ${process.env.RESEND_API_KEY}`,'Content-Type':'application/json','Idempotency-Key':`nana-${id}-${version}-${key}`},body:JSON.stringify({from:process.env.INQUIRY_FROM,to:[to],reply_to:process.env.INQUIRY_TO||'ms.kelly@nanascozycorner.com',subject,text}),signal:AbortSignal.timeout(8000)});const data=await r.json();return r.ok&&!!data.id;}catch{return false;}
 };
 const results={id,version};
 if(l.notificationState!=='ACCEPTED')results.notificationState=await send(process.env.INQUIRY_TO||'ms.kelly@nanascozycorner.com',`[Nana’s website] ${l.slot?(cancelled?'Tour cancelled':'Tour booked'):l.kind+' inquiry'}`,[`Name: ${l.name}`,`Contact: ${l.contact}`,l.email?`Email: ${l.email}`:'',l.phone?`Phone: ${l.phone}`:'',when?`Tour: ${when} (Milwaukee time)`:'',`Status: ${cancelled?'CANCELLED':l.status}`,'',...Object.entries(l.details).filter(([k,v])=>v&&!['request_id','slot_id'].includes(k)).map(([k,v])=>`${k}: ${v}`),'','Manage this lead: https://www.nanascozycorner.app/tours-leads'].filter(Boolean).join('\n'),'team')?'ACCEPTED':'FAILED';
 if(l.slot&&l.email&&l.confirmationState!=='ACCEPTED')results.confirmationState=await send(l.email,cancelled?'Your Nana’s Cozy Corner tour has been cancelled':'Your Nana’s Cozy Corner tour is booked',cancelled?`Hello ${l.name},\n\nYour tour on ${when} (Milwaukee time) has been cancelled.\n\nChoose another available time at https://www.nanascozycorner.com/schedule-a-tour.html or call 414-442-6262.\n\nNana’s Cozy Corner`:`Hello ${l.name},\n\nYour tour is booked for ${when} (Milwaukee time).\nLength: ${Math.round((new Date(l.slot.endsAt)-new Date(l.slot.startsAt))/60000)} minutes.\nLocation: 4006 N 42nd Street, Milwaukee, WI 53216.\n\nWe look forward to meeting you. To cancel or reschedule, reply to this email or call 414-442-6262. A tour does not reserve a childcare place.\n\nNana’s Cozy Corner`,'parent')?'ACCEPTED':'FAILED';
 await brain('PATCH',results);
 return !Object.values(results).includes('FAILED');
}

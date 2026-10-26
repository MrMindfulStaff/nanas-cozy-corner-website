import { createHmac, timingSafeEqual } from 'node:crypto';
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
 const send=async(to,subject,text,key,html)=>{
  try{const r=await fetch('https://api.resend.com/emails',{method:'POST',headers:{Authorization:`Bearer ${process.env.RESEND_API_KEY}`,'Content-Type':'application/json','Idempotency-Key':`nana-${id}-${version}-${key}`},body:JSON.stringify({from:process.env.INQUIRY_FROM,to:[to],reply_to:process.env.INQUIRY_TO||'ms.kelly@nanascozycorner.com',subject,text,...(html?{html}:{})}),signal:AbortSignal.timeout(8000)});const data=await r.json();return r.ok&&!!data.id;}catch{return false;}
 };
 const results={id,version};
 if(l.notificationState!=='ACCEPTED')results.notificationState=await send(process.env.INQUIRY_TO||'ms.kelly@nanascozycorner.com',`[Nana’s website] ${l.slot?(cancelled?'Tour cancelled':'Tour booked'):(l.kind==='facebook_ad'?'New Facebook/Instagram ad lead':l.kind==='referral'?'New family referral':l.kind+' inquiry')}`,[`Name: ${l.name}`,`Contact: ${l.contact}`,l.email?`Email: ${l.email}`:'',l.phone?`Phone: ${l.phone}`:'',when?`Tour: ${when} (Milwaukee time)`:'',`Status: ${cancelled?'CANCELLED':l.status}`,'',...Object.entries(l.details).filter(([k,v])=>v&&!['request_id','slot_id'].includes(k)).map(([k,v])=>`${k}: ${v}`),'','Manage this lead: https://www.nanascozycorner.app/tours-leads'].filter(Boolean).join('\n'),'team')?'ACCEPTED':'FAILED';
 if(l.slot&&l.email&&l.confirmationState!=='ACCEPTED')results.confirmationState=await send(l.email,cancelled?'Your Nana’s Cozy Corner tour has been cancelled':'Your Nana’s Cozy Corner tour is booked',cancelled?`Hello ${l.name},\n\nYour tour on ${when} (Milwaukee time) has been cancelled.\n\nChoose another available time at https://www.nanascozycorner.com/schedule-a-tour.html or call 414-442-6262.\n\nNana’s Cozy Corner`:`Hello ${l.name},\n\nYour tour is booked for ${when} (Milwaukee time).\nLength: ${Math.round((new Date(l.slot.endsAt)-new Date(l.slot.startsAt))/60000)} minutes.\nLocation: 4006 N 42nd Street, Milwaukee, WI 53216.\n\nWe look forward to meeting you. To cancel or reschedule, reply to this email or call 414-442-6262. A tour does not reserve a childcare place.\n\nNana’s Cozy Corner`,'parent')?'ACCEPTED':'FAILED';
 // Inquiries and ad leads without a tour: the welcome email, whose button books a tour
 // onto this same lead (the Brain sets confirmationState PENDING only for those kinds).
 else if(!l.slot&&l.email&&l.confirmationState==='PENDING'){const w=welcomeEmail(l);results.confirmationState=await send(l.email,w.subject,w.text,'parent',w.html)?'ACCEPTED':'FAILED';}
 await brain('PATCH',results);
 return !Object.values(results).includes('FAILED');
}

// The welcome email for a family who asked about care or answered an ad: thanks, what
// happens next, and one big button to choose a tour time — families who pick a time
// themselves are far less likely to go quiet than ones waiting on a call back.
const escapeHtml=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
// followUp: the version for a family who asked a while ago and has not booked (sent from
// Tours & Leads, api/lead-followup.js) — same button, no "we received your request".
export function welcomeEmail(l,followUp=false){
 const first=(l.name||'').trim().split(/\s+/)[0]||'there';
 const link=`https://www.nanascozycorner.com/schedule-a-tour.html?ref=${encodeURIComponent(l.id)}#inquiry`;
 const subject=followUp?'Still looking for childcare? Choose your tour time at Nana’s Cozy Corner':l.kind==='facebook_ad'?'Next step: choose your tour time at Nana’s Cozy Corner':'Thanks for reaching out to Nana’s Cozy Corner';
 const lines=followUp?[`Thanks again for your interest in Nana’s Cozy Corner. We’d love to show you around.`,`Choose a tour time that works for you. It takes less than a minute, and you’ll get a confirmation right away.`]:[`Thank you for your interest in Nana’s Cozy Corner! We received your request, and Ms. Kelly will be in touch soon.`,`The best way to get to know us is to visit. Choose a tour time that works for you. It takes less than a minute, and you’ll get a confirmation right away.`];
 const text=`Hi ${first},

${lines[0]}

${lines[1]}

Choose your tour time: ${link}

Tours are Monday–Friday at 4006 N 42nd Street, Milwaukee, WI 53216. Questions? Reply to this email or call 414-442-6262.

Nana’s Cozy Corner`;
 const html=`<!doctype html><html><body style="margin:0;background:#fff8ed;font-family:Arial,Helvetica,sans-serif;color:#30281f"><table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#fff8ed;padding:24px 12px"><tr><td align="center"><table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;background:#ffffff;border-radius:16px;padding:32px 28px"><tr><td style="font-size:22px;font-weight:bold;padding-bottom:16px">Hi ${escapeHtml(first)},</td></tr><tr><td style="font-size:16px;line-height:1.6;padding-bottom:14px">${lines[0]}</td></tr><tr><td style="font-size:16px;line-height:1.6;padding-bottom:24px">${lines[1]}</td></tr><tr><td align="center" style="padding-bottom:24px"><a href="${link}" style="display:inline-block;background:#425b42;color:#fffdf8;text-decoration:none;font-size:18px;font-weight:bold;padding:16px 32px;border-radius:999px">Choose my tour time</a></td></tr><tr><td style="font-size:14px;line-height:1.6;color:#655e51">Tours are Monday–Friday at 4006 N 42nd Street, Milwaukee, WI 53216.<br>Questions? Reply to this email or call <a href="tel:+14144426262" style="color:#425b42">414-442-6262</a>.</td></tr><tr><td style="font-size:15px;padding-top:20px;font-weight:bold">Nana’s Cozy Corner</td></tr></table></td></tr></table></body></html>`;
 return {subject,text,html};
}

// The cancel link in the no-show email: lead id + a signature made with the bridge
// secret, so only the family that got the email can cancel their own request.
export const cancelSig=id=>createHmac('sha256',process.env.WEBSITE_INTAKE_SECRET||'').update('cancel:'+id).digest('hex').slice(0,32);
export function cancelSigOk(id,sig){const want=cancelSig(id);return typeof sig==='string'&&sig.length===want.length&&timingSafeEqual(Buffer.from(sig),Buffer.from(want));}

// The no-show email (sent when Ms. Kelly marks "No show" in Tours & Leads): we missed
// you, pick a new time, or tell us you're no longer looking, which archives the lead.
export function noShowEmail(l){
 const first=(l.name||'').trim().split(/\s+/)[0]||'there';
 const start=l.slot?new Date(l.slot.startsAt):null;
 const when=start?new Intl.DateTimeFormat('en-US',{timeZone:'America/Chicago',weekday:'long',month:'long',day:'numeric',hour:'numeric',minute:'2-digit'}).format(start):'';
 const book=`https://www.nanascozycorner.com/schedule-a-tour.html?ref=${encodeURIComponent(l.id)}#inquiry`;
 const cancel=`https://www.nanascozycorner.com/api/lead-cancel?id=${encodeURIComponent(l.id)}&sig=${cancelSig(l.id)}`;
 const subject='We missed you at Nana’s Cozy Corner. Want to pick a new time?';
 const lines=[`It looks like you missed your tour${when?` on ${when}`:''}. No worries. We know life with little ones gets busy.`,`We’d still love to show you around. Choose a new time that works for you; it takes less than a minute.`,`If you’re no longer looking for care, just let us know and we won’t contact you about this tour again.`];
 const text=`Hi ${first},\n\n${lines[0]}\n\n${lines[1]}\n\nPick a new tour time: ${book}\n\n${lines[2]}\nCancel my tour request: ${cancel}\n\nQuestions? Reply to this email or call 414-442-6262.\n\nNana’s Cozy Corner`;
 const html=`<!doctype html><html><body style="margin:0;background:#fff8ed;font-family:Arial,Helvetica,sans-serif;color:#30281f"><table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#fff8ed;padding:24px 12px"><tr><td align="center"><table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;background:#ffffff;border-radius:16px;padding:32px 28px"><tr><td style="font-size:22px;font-weight:bold;padding-bottom:16px">Hi ${escapeHtml(first)},</td></tr><tr><td style="font-size:16px;line-height:1.6;padding-bottom:14px">${lines[0]}</td></tr><tr><td style="font-size:16px;line-height:1.6;padding-bottom:24px">${lines[1]}</td></tr><tr><td align="center" style="padding-bottom:28px"><a href="${book}" style="display:inline-block;background:#425b42;color:#fffdf8;text-decoration:none;font-size:18px;font-weight:bold;padding:16px 32px;border-radius:999px">Pick a new tour time</a></td></tr><tr><td style="font-size:15px;line-height:1.6;padding-bottom:10px">${lines[2]}</td></tr><tr><td align="center" style="padding-bottom:24px"><a href="${cancel}" style="display:inline-block;color:#425b42;text-decoration:underline;font-size:15px;padding:10px 20px;border:1px solid #b3ae9e;border-radius:999px">Cancel my tour request</a></td></tr><tr><td style="font-size:14px;line-height:1.6;color:#655e51">Questions? Reply to this email or call <a href="tel:+14144426262" style="color:#425b42">414-442-6262</a>.</td></tr><tr><td style="font-size:15px;padding-top:20px;font-weight:bold">Nana’s Cozy Corner</td></tr></table></td></tr></table></body></html>`;
 return {subject,text,html};
}

import { createHash } from 'node:crypto';
import { brain,brainReady,notify } from '../lib/brain.js';

const titles = { availability:'Childcare availability', tour:'Tour request', ehs:'Early Head Start question', contact:'Website inquiry', referral:'Referral question' };
const labels = { parent_name:'Name', contact:'Reply by phone or email', child_age:'Child’s age', start_timing:'Start timing', schedule:'Days and hours needed', transportation:'Transportation', message:'Message', zip_code:'ZIP code', preferred_date:'Preferred tour date', preferred_time:'Preferred time of day', reason:'Question about', referrer_type:'Connection to Nana’s' };
const fields = {
  availability:['parent_name','contact','child_age','start_timing','schedule','transportation','message'],
  tour:['parent_name','contact','email','phone','child_age','slot_id','message'],
  ehs:['parent_name','contact','child_age','zip_code','message'],
  contact:['parent_name','contact','reason','message'],
  referral:['parent_name','contact','referrer_type','message']
};
const required = {
  availability:['parent_name','contact','child_age','start_timing','schedule'],
  tour:['parent_name','contact','email','phone','child_age','slot_id'], ehs:['parent_name','contact','child_age'],
  contact:['parent_name','contact','reason','message'], referral:['parent_name','contact','referrer_type']
};
const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const configuration = () => ({
  key:process.env.RESEND_API_KEY,
  from:process.env.INQUIRY_FROM,
  to:process.env.INQUIRY_TO || 'Info@nanascozycorner.com',
  siteKey:process.env.TURNSTILE_SITE_KEY,
  secret:process.env.TURNSTILE_SECRET_KEY,
  hosts:(process.env.INQUIRY_ALLOWED_HOSTS || 'www.nanascozycorner.com,nanascozycorner.com').split(',').map(s=>s.trim()).filter(Boolean)
});
const isReady = c => Boolean(c.key && c.from && c.siteKey && c.secret);
const reply = (data,status=200) => Response.json(data,{status,headers:{'Cache-Control':'no-store','X-Content-Type-Options':'nosniff'}});
const failure = (message,status=400) => reply({ok:false,message},status);
export function GET() {
  const c = configuration();
  return reply({ready:isReady(c),siteKey:isReady(c)?c.siteKey:null});
}
export async function POST(request) {
  const c = configuration();
  if (!isReady(c)) return failure('Online delivery is unavailable. Please call 414-442-6262 or email Info@nanascozycorner.com.',503);
  let origin;
  try { origin = new URL(request.headers.get('origin')); } catch { return failure('Invalid request origin.',403); }
  if (origin.protocol !== 'https:' || !c.hosts.includes(origin.hostname) || origin.port) return failure('Invalid request origin.',403);
  if (!request.headers.get('content-type')?.startsWith('application/json')) return failure('Use the website form to send a request.',415);
  const raw = await request.text();
  if (Buffer.byteLength(raw,'utf8') > 12000) return failure('This request is too long.',413);
  let input;
  try { input = JSON.parse(raw); } catch { return failure('Invalid form data.'); }
  if (!input || typeof input !== 'object' || Array.isArray(input)) return failure('Invalid form data.');
  if (input.website) return failure('Please contact the center directly.',400);
  if (!Object.hasOwn(fields,input.kind)) return failure('Unknown inquiry type.');
  const data = {};
  for (const key of fields[input.kind]) {
    if (input[key] !== undefined && typeof input[key] !== 'string') return failure('Invalid field value.');
    data[key] = (input[key] || '').trim();
    if (data[key].length > (key === 'message' ? 1200 : 160)) return failure('Please shorten your response.');
    if (key !== 'message' && /[\r\n\x00]/.test(data[key])) return failure('Invalid field value.');
  }
  if (required[input.kind].some(key=>!data[key])) return failure('Please complete the required fields.');
  if(input.kind==='tour' && (!emailPattern.test(data.email)||data.phone.replace(/\D/g,'').length<10)) return failure('Enter your email address and phone number.');
  const phoneDigits = data.contact.replace(/\D/g,'');
  if (!emailPattern.test(data.contact) && !(/^[+()\d\s.\-]+$/.test(data.contact) && phoneDigits.length >= 10 && phoneDigits.length <= 15)) return failure('Enter a valid phone number or email address.');
  if (data.zip_code && !/^\d{5}$/.test(data.zip_code)) return failure('Enter a five-digit ZIP code.');
  if (data.preferred_date) {
    const parts = new Intl.DateTimeFormat('en-US',{timeZone:'America/Chicago',year:'numeric',month:'2-digit',day:'2-digit'}).formatToParts(new Date());
    const part = name => parts.find(p=>p.type===name).value;
    const today = `${part('year')}-${part('month')}-${part('day')}`;
    const parsed = new Date(`${data.preferred_date}T12:00:00Z`);
    if (!/^\d{4}-\d{2}-\d{2}$/.test(data.preferred_date) || Number.isNaN(parsed.valueOf()) || parsed.toISOString().slice(0,10) !== data.preferred_date || data.preferred_date < today) return failure('Choose a valid future tour date.');
  }
  if (typeof input.request_id !== 'string' || !/^[a-f\d]{8}-[a-f\d]{4}-4[a-f\d]{3}-[89ab][a-f\d]{3}-[a-f\d]{12}$/i.test(input.request_id)) return failure('Please refresh the form and try again.');
  if (typeof input.turnstile_token !== 'string' || !input.turnstile_token || input.turnstile_token.length > 2048) return failure('Please complete the security check.');
  try {
    const challenge = await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify',{
      method:'POST',headers:{'Content-Type':'application/json'},
      body:JSON.stringify({secret:c.secret,response:input.turnstile_token}),signal:AbortSignal.timeout(6000)
    });
    const verification = await challenge.json();
    if (!challenge.ok || verification.success !== true || verification.action !== 'website_inquiry' || !c.hosts.includes(verification.hostname) || verification.hostname !== origin.hostname) return failure('Please complete a new security check.',403);
    if(brainReady()) {
      let saved;
      try { saved=await brain('POST',{...data,kind:input.kind,request_id:input.request_id}); }
      catch(error) { return failure(error.status===409?error.message:'We could not save your request. Please retry or contact the center.',error.status===409?409:503); }
      let emailAccepted=false;
      try { emailAccepted=await notify(saved.id); } catch { /* Saved record exposes pending email for staff retry. */ }
      return reply({ok:true,id:saved.id,saved:true,booked:saved.booked,emailAccepted},202);
    }
    if(input.kind==='tour')return failure('Tour booking is temporarily unavailable. Please call the center.',503);
    const text = [titles[input.kind],'',...fields[input.kind].filter(key=>data[key]).map(key=>`${labels[key]}: ${data[key]}`),'',input.kind==='tour'?'Status: Tour requested — staff confirmation required.':'Status: New website inquiry.',`Reference: ${input.request_id}`].join('\n');
    const idempotency = createHash('sha256').update(JSON.stringify({id:input.request_id,kind:input.kind,data})).digest('hex');
    const payload = {from:c.from,to:[c.to],subject:`[Nana’s website] ${titles[input.kind]}`,text};
    if (emailPattern.test(data.contact)) payload.reply_to = data.contact;
    const delivered = await fetch('https://api.resend.com/emails',{
      method:'POST',headers:{Authorization:`Bearer ${c.key}`,'Content-Type':'application/json','Idempotency-Key':`website-inquiry/${idempotency}`},
      body:JSON.stringify(payload),signal:AbortSignal.timeout(8000)
    });
    const receipt = await delivered.json();
    if (!delivered.ok || typeof receipt.id !== 'string' || !receipt.id) {
      console.error('website_inquiry_delivery_failed',{kind:input.kind,status:delivered.status});
      return failure('Delivery could not be confirmed. Please call or email the center.',502);
    }
    console.info('website_inquiry_accepted',{kind:input.kind,reference:input.request_id});
    return reply({ok:true,id:receipt.id},202);
  } catch {
    // Never log contact details, form contents, provider responses, or secrets.
    console.error('website_inquiry_dependency_unavailable',{kind:input.kind});
    return failure('Delivery could not be confirmed. Please call or email the center.',502);
  }
}

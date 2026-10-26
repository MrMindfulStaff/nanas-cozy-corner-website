import test from 'node:test';
import assert from 'node:assert/strict';
import {POST} from '../api/tour-reminders.js';
const env={WEBSITE_INTAKE_SECRET:'a'.repeat(64),RESEND_API_KEY:'test',INQUIRY_FROM:'forms@example.com',INQUIRY_TO:'kelly@example.com'};
const lead={id:'c1234567890',name:'QA',email:'parent@example.com',slot:{state:'BOOKED',startsAt:'2026-10-27T15:00:00Z',endsAt:'2026-10-27T15:30:00Z'}};
const call=body=>POST(new Request('https://example.com/api/tour-reminders',{method:'POST',headers:{Authorization:'Bearer '+env.WEBSITE_INTAKE_SECRET},body:JSON.stringify(body)}));
async function withFetch(current,fn){const prior=globalThis.fetch;const previous={...process.env};Object.assign(process.env,env);const sent=[];globalThis.fetch=async(url,options)=>{if(url.includes('resend.com')){sent.push({body:JSON.parse(options.body),key:options.headers['Idempotency-Key']});return Response.json({id:'receipt'});}return Response.json({lead:current});};try{await fn(sent);}finally{globalThis.fetch=prior;for(const k of Object.keys(env)){if(previous[k]===undefined)delete process.env[k];else process.env[k]=previous[k];}}}
test('day-before and morning reminders go to the parent with stable, distinct keys',()=>withFetch(lead,async sent=>{
 assert.equal((await call({id:lead.id,kind:'day_before',startsAt:lead.slot.startsAt})).status,200);
 assert.equal((await call({id:lead.id,kind:'morning',startsAt:lead.slot.startsAt})).status,200);
 assert.deepEqual(sent.map(s=>s.body.to),[['parent@example.com'],['parent@example.com']]);
 assert.match(sent[0].body.subject,/tomorrow at 10:00 AM/);assert.match(sent[0].body.text,/Tuesday, October 27, at 10:00 AM/);
 assert.match(sent[1].body.subject,/today at 10:00 AM/);assert.match(sent[1].body.text,/4006 N 42nd Street/);
 assert.notEqual(sent[0].key,sent[1].key);
}));
test('no reminder when the tour was moved or cancelled',()=>withFetch({...lead,slot:{...lead.slot,state:'CANCELLED'}},async sent=>{
 assert.equal((await call({id:lead.id,kind:'morning',startsAt:lead.slot.startsAt})).status,409);
 assert.equal((await call({id:lead.id,kind:'morning',startsAt:'2026-10-28T15:00:00Z'})).status,409);
 assert.equal(sent.length,0);
}));
test('reminder endpoint refuses a wrong secret and an unknown kind',async()=>{
 const old=process.env.WEBSITE_INTAKE_SECRET;process.env.WEBSITE_INTAKE_SECRET='a'.repeat(64);
 try{assert.equal((await POST(new Request('https://example.com',{method:'POST',headers:{Authorization:'Bearer wrong'},body:'{}'}))).status,401);assert.equal((await call({id:lead.id,kind:'weekly',startsAt:lead.slot.startsAt})).status,400);}
 finally{if(old===undefined)delete process.env.WEBSITE_INTAKE_SECRET;else process.env.WEBSITE_INTAKE_SECRET=old;}
});
test('follow-up email: same tour button, follow-up wording, refused once a tour is booked',async()=>{
 const {POST:followUp}=await import('../api/lead-followup.js');
 const req=id=>followUp(new Request('https://example.com/api/lead-followup',{method:'POST',headers:{Authorization:'Bearer '+env.WEBSITE_INTAKE_SECRET},body:JSON.stringify({id})}));
 await withFetch({...lead,kind:'facebook_ad',name:'Jordan Smith',slot:null},async sent=>{
  assert.equal((await req(lead.id)).status,200);
  assert.match(sent[0].body.subject,/Still looking for childcare/);assert.match(sent[0].body.html,/Choose my tour time/);assert.match(sent[0].body.html,/\?ref=c1234567890#inquiry/);assert.doesNotMatch(sent[0].body.text,/We received your request/);assert.match(sent[0].key,/^nana-c1234567890-followup-\d{4}-\d{2}-\d{2}$/);
 });
 await withFetch(lead,async sent=>{assert.equal((await req(lead.id)).status,409);assert.equal(sent.length,0);});
});
test('no-show email: missed time, reschedule button on the same lead, signed cancel link; cancelling needs a button press',async()=>{
 const {POST:noShow}=await import('../api/lead-noshow.js');const cancel=await import('../api/lead-cancel.js');const {cancelSig}=await import('../lib/brain.js');
 const req=id=>noShow(new Request('https://example.com/api/lead-noshow',{method:'POST',headers:{Authorization:'Bearer '+env.WEBSITE_INTAKE_SECRET},body:JSON.stringify({id})}));
 await withFetch({...lead,status:'NO_SHOW',slot:{...lead.slot,state:'MISSED'}},async sent=>{
  assert.equal((await req(lead.id)).status,200);
  assert.match(sent[0].body.subject,/We missed you/);assert.match(sent[0].body.text,/missed your tour on Tuesday, October 27 at 10:00 AM/);
  assert.match(sent[0].body.html,/Pick a new tour time/);assert.match(sent[0].body.html,/\?ref=c1234567890#inquiry/);
  assert.ok(sent[0].body.html.includes(`/api/lead-cancel?id=c1234567890&sig=${cancelSig(lead.id)}`));
  assert.match(sent[0].key,/^nana-c1234567890-noshow-\d+$/);
  const page=await cancel.GET(new Request(`https://example.com/api/lead-cancel?id=${lead.id}&sig=${cancelSig(lead.id)}`));
  assert.equal(page.status,200);assert.match(await page.text(),/method="post"/);
  assert.equal((await cancel.GET(new Request(`https://example.com/api/lead-cancel?id=${lead.id}&sig=bad`))).status,400);
 });
 await withFetch(lead,async sent=>{assert.equal((await req(lead.id)).status,409);assert.equal(sent.length,0);});
});

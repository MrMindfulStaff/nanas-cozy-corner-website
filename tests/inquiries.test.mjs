import test from 'node:test';
import assert from 'node:assert/strict';
import { GET, POST } from '../api/inquiries.js';

// No external requests or email are sent: provider boundaries are stubbed.
const configured = {WEBSITE_INTAKE_SECRET:'',RESEND_API_KEY:'test-only-key',INQUIRY_FROM:'test@example.com',INQUIRY_TO:'inbox@example.com',TURNSTILE_SITE_KEY:'test-site',TURNSTILE_SECRET_KEY:'test-secret',INQUIRY_ALLOWED_HOSTS:'www.nanascozycorner.com'};
const valid = {kind:'availability',parent_name:'Website QA',contact:'qa@example.com',child_age:'2 years',start_timing:'Later / planning ahead',schedule:'Monday–Friday',request_id:'550e8400-e29b-41d4-a716-446655440000',turnstile_token:'test-token'};
const request = (body=valid,origin='https://www.nanascozycorner.com') => new Request('https://www.nanascozycorner.com/api/inquiries',{method:'POST',headers:{origin,'Content-Type':'application/json'},body:JSON.stringify(body)});
const withEnvironment = async (env,fn) => {
  const previous = Object.fromEntries(Object.keys(configured).map(k=>[k,process.env[k]]));
  for (const k of Object.keys(configured)) { delete process.env[k]; if (env[k]) process.env[k]=env[k]; }
  try { await fn(); } finally { for (const [k,v] of Object.entries(previous)) v===undefined?delete process.env[k]:process.env[k]=v; }
};
const fakeFetch = async (fn,run) => {const prior=globalThis.fetch;globalThis.fetch=fn;try{await run();}finally{globalThis.fetch=prior;}};
const verified = () => Response.json({success:true,action:'website_inquiry',hostname:'www.nanascozycorner.com'});

test('missing configuration cannot return success or expose credentials',async()=>withEnvironment({},async()=>{
  assert.deepEqual(await GET().json(),{ready:false,siteKey:null});
  const response=await POST(request()); assert.equal(response.status,503); assert.equal((await response.json()).ok,false);
}));
test('only public site key is returned from configured status endpoint',async()=>withEnvironment(configured,async()=>{
  assert.deepEqual(await GET().json(),{ready:true,siteKey:'test-site'});
}));
test('foreign origins, missing contact, malformed fields and spam cannot call providers',async()=>withEnvironment(configured,async()=>{
  await fakeFetch(()=>{throw new Error('Provider should not be called');},async()=>{
    assert.equal((await POST(request(valid,'https://example.com'))).status,403);
    for(const change of [{contact:''},{contact:'abc'},{parent_name:{}},{website:'spam'},{message:'x'.repeat(1201)},{kind:'__proto__'},{request_id:'bad'}]) {
      assert.equal((await POST(request({...valid,...change}))).status,400);
    }
  });
}));
test('invalid security token cannot send an email',async()=>withEnvironment(configured,async()=>{
  let calls=0;
  await fakeFetch(async()=>{calls++;return Response.json({success:false});},async()=>assert.equal((await POST(request())).status,403));
  assert.equal(calls,1);
}));
test('mail failure never reports received',async()=>withEnvironment(configured,async()=>{
  await fakeFetch(async url=>url.includes('siteverify')?verified():Response.json({message:'failure'},{status:500}),async()=>{
    const response=await POST(request());assert.equal(response.status,502);assert.equal((await response.json()).ok,false);
  });
}));
test('success requires provider receipt, uses fixed recipient, and deduplicates retries',async()=>withEnvironment(configured,async()=>{
  const deliveries=[];
  await fakeFetch(async(url,options)=>{
    if(url.includes('siteverify'))return verified();
    deliveries.push(options);return Response.json({id:'provider-test-id'});
  },async()=>{
    for(let i=0;i<2;i++) {
      const response=await POST(request({...valid,to:'attacker@example.com',pipeline_status:'Enrolled'}));
      assert.equal(response.status,202);assert.deepEqual(await response.json(),{ok:true,id:'provider-test-id'});
    }
  });
  const payload=JSON.parse(deliveries[0].body);
  assert.deepEqual(payload.to,['inbox@example.com']);assert.equal(payload.reply_to,'qa@example.com');
  assert.doesNotMatch(payload.text,/attacker|Enrolled/);
  assert.equal(deliveries[0].headers['Idempotency-Key'],deliveries[1].headers['Idempotency-Key']);
}));

const tour={...valid,kind:'tour',email:'qa@example.com',phone:'4145550100',slot_id:'slot-test'};
test('tours require a real time, email, and phone; never fall back to a fake booking',async()=>withEnvironment(configured,async()=>{
 assert.equal((await POST(request({...valid,kind:'tour'}))).status,400);
 await fakeFetch(async()=>verified(),async()=>assert.equal((await POST(request(tour))).status,503));
}));
test('an unavailable slot cannot send confirmations',async()=>withEnvironment({...configured,WEBSITE_INTAKE_SECRET:'a'.repeat(64)},async()=>{
 let mails=0;
 await fakeFetch(async(url)=>{if(url.includes('siteverify'))return verified();if(url.includes('resend'))mails++;return Response.json({error:'Time unavailable'},{status:409});},async()=>assert.equal((await POST(request(tour))).status,409));
 assert.equal(mails,0);
}));
test('saved tour survives email failure and reports it honestly',async()=>withEnvironment({...configured,WEBSITE_INTAKE_SECRET:'a'.repeat(64)},async()=>{
 await fakeFetch(async(url,options)=>{
  if(url.includes('siteverify'))return verified();
  if(url.includes('website-intake')&&options.method==='POST')return Response.json({ok:true,id:'lead-test',booked:true});
  throw Error('mail service unavailable');
 },async()=>{const result=await (await POST(request(tour))).json();assert.equal(result.booked,true);assert.equal(result.saved,true);assert.equal(result.emailAccepted,false);});
}));

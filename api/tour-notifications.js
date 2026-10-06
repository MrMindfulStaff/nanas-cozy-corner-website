import { bridgeAuthorized,notify } from '../lib/brain.js';
export async function POST(request){
 if(!bridgeAuthorized(request))return Response.json({ok:false},{status:401});
 let data;try{const raw=await request.text();if(raw.length>500)throw Error();data=JSON.parse(raw);}catch{return Response.json({ok:false},{status:400});}
 if(typeof data.id!=='string'||!/^[a-z0-9]{10,100}$/i.test(data.id))return Response.json({ok:false},{status:400});
 try{const ok=await notify(data.id);return Response.json({ok},{status:ok?200:502});}catch{return Response.json({ok:false},{status:502});}
}

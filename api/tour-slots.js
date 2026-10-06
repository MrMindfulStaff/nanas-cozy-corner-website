import { brain } from '../lib/brain.js';
export async function GET(){try{const {slots}=await brain();return Response.json({slots},{headers:{'Cache-Control':'no-store'}});}catch{return Response.json({slots:[],unavailable:true},{status:503,headers:{'Cache-Control':'no-store'}});}}

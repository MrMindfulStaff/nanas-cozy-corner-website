import { createServer } from 'node:http';
import { readFile } from 'node:fs/promises';
import { resolve, extname } from 'node:path';
import { GET, POST } from '../api/inquiries.js';
const root=resolve('public');
const mime={'.html':'text/html; charset=utf-8','.css':'text/css; charset=utf-8','.js':'application/javascript; charset=utf-8','.png':'image/png','.ico':'image/x-icon','.xml':'application/xml','.txt':'text/plain'};
createServer(async(req,res)=>{
  const url=new URL(req.url,'http://localhost:4173');
  try {
    if(url.pathname==='/api/inquiries') {
      let result;
      if(req.method==='GET') result=GET();
      else if(req.method==='POST') {
        const chunks=[];for await(const chunk of req)chunks.push(chunk);
        result=await POST(new Request(url,{method:'POST',headers:req.headers,body:Buffer.concat(chunks)}));
      } else result=new Response('Method not allowed',{status:405});
      res.writeHead(result.status,Object.fromEntries(result.headers));res.end(await result.text());return;
    }
    const path=resolve(root,'.'+decodeURIComponent(url.pathname==='/'?'/index.html':url.pathname));
    if(!path.startsWith(root+'/')){res.writeHead(403);res.end();return;}
    const content=await readFile(path);res.writeHead(200,{'Content-Type':mime[extname(path)]||'application/octet-stream'});res.end(content);
  } catch {res.writeHead(404,{'Content-Type':'text/html'});res.end(await readFile(root+'/404.html'));}
}).listen(4173,'0.0.0.0',()=>console.log('Website preview: http://localhost:4173'));

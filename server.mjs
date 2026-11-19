import { createServer } from 'node:http';
import { readFile } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { DrawStore } from './draw-store.mjs';

const root = dirname(fileURLToPath(import.meta.url));
const database = process.env.SPIN_DB_PATH || join(root, 'draws.sqlite');
const host = process.env.SPIN_HOST || '127.0.0.1';
const port = Number(process.env.SPIN_PORT || '3201');
const store = new DrawStore(database);
const assets = new Map([
  ['/', ['index.html', 'text/html; charset=utf-8']],
  ['/index.html', ['index.html', 'text/html; charset=utf-8']],
  ['/style.css', ['style.css', 'text/css; charset=utf-8']],
  ['/app.js', ['app.js', 'text/javascript; charset=utf-8']],
  ['/assets/logo.svg', ['assets/logo.svg', 'image/svg+xml']],
  ['/assets/erdenet-showroom.jpg', ['assets/erdenet-showroom.jpg', 'image/jpeg']],
  ['/assets/zona-bold.woff2', ['assets/zona-bold.woff2', 'font/woff2']],
  ['/assets/inter.woff2', ['assets/inter.woff2', 'font/woff2']],
]);
function json(res, code, data){res.writeHead(code,{'Content-Type':'application/json; charset=utf-8','Cache-Control':'no-store','X-Content-Type-Options':'nosniff'});res.end(JSON.stringify(data))}
const server=createServer(async(req,res)=>{
  const url=new URL(req.url || '/', 'http://localhost');
  const path=url.pathname;
  if(req.method==='GET' && path==='/api/draw'){
    const id=url.searchParams.get('id');
    if(!id || !/^[-a-f0-9]{36}$/.test(id)){json(res,400,{error:'Хүсэлтийг шалгана уу.'});return}
    const draw=store.lookup(id);
    json(res,200,{prize:draw?.result ?? null});
    return;
  }
  if(req.method==='POST'&&path==='/api/draw'){
    let body='';
    for await(const chunk of req){body+=chunk;if(body.length>4096){json(res,413,{error:'Хүсэлт хэт урт байна.'});return}}
    let id;try{id=JSON.parse(body).id}catch{json(res,400,{error:'Хүсэлтийг шалгана уу.'});return}
    if(typeof id!=='string'||!/^[-a-f0-9]{36}$/.test(id)){json(res,400,{error:'Хүсэлтийг шалгана уу.'});return}
    try {const draw=store.draw(id);if(draw.status==='sold_out')json(res,410,{error:'Сугалаа дууссан байна.'});else json(res,200,{prize:draw.result})}
    catch(e){console.error('Draw failed',e);json(res,503,{error:'Түр алдаа гарлаа. Дахин оролдоно уу.'})}
    return;
  }
  const asset=assets.get(path);
  if(req.method==='GET'&&asset){try{const body=await readFile(join(root,asset[0]));res.writeHead(200,{'Content-Type':asset[1],'Cache-Control':'no-store','X-Content-Type-Options':'nosniff'});res.end(body)}catch{res.writeHead(500);res.end('File unavailable')}return}
  res.writeHead(404);res.end('Not found');
});
server.listen(port,host,()=>console.log(`Азын хүрд: http://${host}:${port}`));
function shutdown(){server.close(()=>{store.close();process.exit(0)})}
process.on('SIGINT',shutdown);process.on('SIGTERM',shutdown);

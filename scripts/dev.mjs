import './build.mjs';
import {createServer} from 'node:http';
import {readFile} from 'node:fs/promises';
const server=createServer(async(req,res)=>{
 if(req.url!=='/'&&req.url!=='/index.html'){res.writeHead(404).end();return;}
 try{res.writeHead(200,{'Content-Type':'text/html; charset=utf-8'});res.end(await readFile(new URL('../dist/index.html',import.meta.url)));}catch{res.writeHead(500).end('Build failed');}
});
server.listen(Number(process.env.PORT||5173),'127.0.0.1',()=>console.log('Local: http://127.0.0.1:'+server.address().port));

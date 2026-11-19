import test from 'node:test';
import assert from 'node:assert/strict';
import { createDrawHandler } from '../netlify/lib/draw-handler.mjs';

const id='cbe13206-e6d5-4592-8468-e2bb9c46f33c';
const request = (method, body) => new Request(`https://example.test/api/draw${method==='GET' ? '?id='+id : ''}`, { method, ...(body ? {body:JSON.stringify(body), headers:{'content-type':'application/json'}} : {}) });

test('GET looks up an existing result without allocating', async () => {
 let allocated=false;
 const handler=createDrawHandler({lookup:async()=>null,allocate:async()=>{allocated=true}});
 const response=await handler(request('GET'));
 assert.equal(response.status,200); assert.deepEqual(await response.json(),{prize:null}); assert.equal(allocated,false);
});
test('POST returns the allocated prize', async () => {
 const handler=createDrawHandler({lookup:async()=>null,allocate:async()=>({prize:'towel'})});
 const response=await handler(request('POST',{id}));
 assert.equal(response.status,200);assert.deepEqual(await response.json(),{prize:'towel'});
});
test('sold out and invalid IDs receive clear failure responses', async () => {
 const handler=createDrawHandler({lookup:async()=>null,allocate:async()=>({status:'sold_out'})});
 assert.equal((await handler(request('POST',{id}))).status,410);
 assert.equal((await handler(request('POST',{id:'bad'}))).status,400);
});
test('temporary contention is retryable and backend failures do not invent a result', async () => {
 let handler=createDrawHandler({lookup:async()=>null,allocate:async()=>({status:'busy'})});
 assert.equal((await handler(request('POST',{id}))).status,503);
 handler=createDrawHandler({lookup:async()=>{throw new Error('offline')},allocate:async()=>{throw new Error('offline')}});
 assert.equal((await handler(request('GET'))).status,503);
});

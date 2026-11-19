import test from 'node:test';
import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import { randomUUID } from 'node:crypto';
import { mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { once } from 'node:events';

test('the HTTP service allocates every prize exactly once under simultaneous requests', {timeout:30000}, async () => {
 const dir = await mkdtemp(join(tmpdir(), 'spin-http-'));
 const port = 33000 + Math.floor(Math.random()*20000);
 const child = spawn(process.execPath, ['server.mjs'], {env:{...process.env,SPIN_PORT:String(port),SPIN_DB_PATH:join(dir,'test.sqlite')},stdio:['ignore','pipe','pipe']});
 try {
  await Promise.race([once(child.stdout,'data'), once(child,'exit').then(()=>{throw new Error('Server did not start')})]);
  const draw = id => fetch(`http://127.0.0.1:${port}/api/draw`,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({id})});
  const ids=Array.from({length:300},()=>randomUUID());
  const responses=await Promise.all(ids.map(draw));
  assert.ok(responses.every(r=>r.status===200));
  const prizes=await Promise.all(responses.map(r=>r.json()));
  for(const name of ['towel','freshener','foam'])assert.equal(prizes.filter(x=>x.prize===name).length,30);
  assert.equal(prizes.filter(x=>x.prize==='loss').length,210);
  assert.equal((await draw(randomUUID())).status,410);
  assert.deepEqual(await (await draw(ids[0])).json(),prizes[0]);
 } finally {
  child.kill();
  if(child.exitCode===null) await once(child,'exit');
  await rm(dir,{recursive:true,force:true});
 }
});

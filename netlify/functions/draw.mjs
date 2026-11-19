import { getDatabase } from '@netlify/database';
import { createDrawHandler } from '../lib/draw-handler.mjs';
import { createPostgresStore } from '../lib/postgres-store.mjs';

export const config = { path: '/api/draw', method: ['GET', 'POST'] };
export default async function draw(request) {
  try { return await createDrawHandler(createPostgresStore(getDatabase()))(request); }
  catch (error) {
    console.error('Database unavailable:', error);
    return Response.json({error:'Түр алдаа гарлаа. Дахин оролдоно уу.'}, {status:503, headers:{'Cache-Control':'no-store'}});
  }
}

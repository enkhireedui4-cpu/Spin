const validId = value => typeof value === 'string' && /^[a-f0-9]{8}-[a-f0-9]{4}-4[a-f0-9]{3}-[89ab][a-f0-9]{3}-[a-f0-9]{12}$/.test(value);
const json = (body, status=200) => Response.json(body,{status,headers:{'Cache-Control':'no-store','X-Content-Type-Options':'nosniff'}});

export function createDrawHandler(store) {
  return async function handle(request) {
    if (!['GET','POST'].includes(request.method)) return json({error:'Зөвшөөрөгдөөгүй хүсэлт.'},405);
    let id;
    try { id = request.method === 'GET' ? new URL(request.url).searchParams.get('id') : (await request.json()).id; }
    catch { return json({error:'Хүсэлтийг шалгана уу.'},400); }
    if (!validId(id)) return json({error:'Хүсэлтийг шалгана уу.'},400);
    try {
      if (request.method === 'GET') return json({prize:await store.lookup(id)});
      const result=await store.allocate(id);
      if (result.status==='sold_out') return json({error:'Сугалаа дууссан байна.'},410);
      if (result.status==='busy') return json({error:'Оролцогчид зэрэг эргүүлж байна. Түр хүлээгээд дахин дарна уу.'},503);
      return json({prize:result.prize});
    } catch (error) {
      console.error('Draw service unavailable:', error);
      return json({error:'Түр алдаа гарлаа. Дахин оролдоно уу.'},503);
    }
  };
}

const segments=[
 {key:'towel',icon:'✦',title:'Алчуур'},{key:'loss',icon:'♡',title:'Дараа дахин'},
 {key:'freshener',icon:'✿',title:'Үнэртүүлэгч'},{key:'fuel',icon:'◈',title:'Шатахууны талон'},
 {key:'foam',icon:'✧',title:'Хөөс цэвэрлэгч'},{key:'loss',icon:'♡',title:'Дараа дахин'},
 {key:'gift',icon:'◇',title:'Бэлгийн багц'},{key:'loss',icon:'♡',title:'Дараа дахин'}
];
const titles={towel:'Алчуур',freshener:'Цацдаг үнэртүүлэгч',foam:'Салоны хөөс цэвэрлэгч',loss:'Энэ удаа хонжворгүй'};
const key='azyn-hurd-entry-v1';
const wheel=document.querySelector('#wheel'),button=document.querySelector('#spin'),error=document.querySelector('#error');
const modal=document.querySelector('#result-modal');
for (const [i,s] of segments.entries()) {
 const el=document.createElement('div');el.className='segment';el.style.setProperty('--angle',`${i*45+22.5}deg`);
 const icon=document.createElement('span');icon.className='segment-icon';icon.textContent=s.icon;
 const title=document.createElement('span');title.textContent=s.title;el.append(icon,title);
 if(s.key==='fuel'||s.key==='gift'){const small=document.createElement('small');small.textContent='Дууссан';el.append(small)}
 wheel.insertBefore(el,wheel.querySelector('.hub'));
}
function reveal(prize){
 button.disabled=true;button.textContent='Оролцсон';
 document.querySelector('#result-spark').textContent=prize==='loss'?'♡':'✳';
 document.querySelector('#result-kicker').textContent=prize==='loss'?'Оролцсонд баярлалаа':'Баяр хүргэе!';
 document.querySelector('#result-title').textContent=titles[prize];
 document.querySelector('#result-copy').textContent=prize==='loss'?'Танд дараагийн удаа аз таарах болтугай.':'Та бэлэг хожлоо! Энэ дэлгэцээ зохион байгуулагчид үзүүлээрэй.';
 modal.hidden=false;
}
function makeId(){const bytes=crypto.getRandomValues(new Uint8Array(16));bytes[6]=(bytes[6]&15)|64;bytes[8]=(bytes[8]&63)|128;const h=Array.from(bytes,n=>n.toString(16).padStart(2,'0')).join('');return `${h.slice(0,8)}-${h.slice(8,12)}-${h.slice(12,16)}-${h.slice(16,20)}-${h.slice(20)}`}
button.disabled=true;
async function restore(){
 try{
  const id=localStorage.getItem(key);
  if(id){
   const response=await fetch('/api/draw?id='+encodeURIComponent(id),{cache:'no-store'});
   if(!response.ok)throw Error('Үр дүнг сэргээхэд алдаа гарлаа. Хуудсыг дахин ачаална уу.');
   const data=await response.json();
   if(data.prize && Object.hasOwn(titles,data.prize)){reveal(data.prize);return}
  }
  button.disabled=false;
 }catch(e){error.textContent=e instanceof Error?e.message:'Хөтчийн хадгалах тохиргоог шалгана уу.'}
}
restore();
button.addEventListener('click',async()=>{
 if(button.disabled)return;button.disabled=true;button.textContent='Эргэж байна...';error.textContent='';
 try {
  let id=localStorage.getItem(key);if(!id){id=makeId();localStorage.setItem(key,id)}
  const response=await fetch('/api/draw',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({id})});
  const data=await response.json();if(!response.ok||!Object.hasOwn(titles,data.prize))throw Error(data.error||'Дахин оролдоно уу.');
  const index=segments.findIndex(s=>s.key===data.prize);wheel.style.transform=`rotate(${360*6-(index*45+22.5)}deg)`;
  setTimeout(()=>reveal(data.prize),matchMedia('(prefers-reduced-motion: reduce)').matches?100:5200);
 }catch(e){error.textContent=e instanceof Error?e.message:'Түр алдаа гарлаа. Дахин оролдоно уу.';button.disabled=false;button.innerHTML='Хүрдээ эргүүлэх <span>✦</span>'}
});

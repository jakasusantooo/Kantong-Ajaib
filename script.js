let KEY='dompetku-v1';const BASE='dompetku-v1';
const OUT=[['🍜','Makan & minum'],['🚌','Transportasi'],['🛒','Belanja'],['🏠','Rumah & tagihan'],['🎮','Hiburan'],['💊','Kesehatan'],['📚','Pendidikan'],['🧩','Lainnya']];
const IN=[['💼','Gaji'],['🎁','Hadiah'],['📈','Usaha'],['💰','Lainnya']];
let S={tx:[],goals:[],budget:0},type='out',fresh=0,Q='',F='all';
const COL=['#FFB020','#FF5C4D','#2FD39B','#4DA3FF','#B77CFF','#FF8AD1','#7BD8FF','#9AA7B5'];
const iso=d=>new Date(d-d.getTimezoneOffset()*6e4).toISOString().slice(0,10);
const sum=(a,t)=>a.filter(x=>x.type===t).reduce((s,x)=>s+x.amount,0);
function loadData(){S={tx:[],goals:[],budget:0};try{const r=localStorage.getItem(KEY);if(r)S=JSON.parse(r)}catch(e){}fixS();$('budget').value=S.budget?S.budget.toLocaleString('id-ID'):''}
const $=id=>document.getElementById(id);
const rp=n=>'Rp'+Math.round(n).toLocaleString('id-ID');
const num=v=>parseInt(String(v).replace(/\D/g,''))||0;
const save=()=>{try{localStorage.setItem(KEY,JSON.stringify(S))}catch(e){}};
const esc=s=>String(s).replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
const today=()=>{const d=new Date();return new Date(d-d.getTimezoneOffset()*6e4).toISOString().slice(0,10)};
function toast(t){const e=$('toast');e.textContent=t;e.classList.add('show');setTimeout(()=>e.classList.remove('show'),1800)}
$('bulan').value=today().slice(0,7);$('date').value=today();

function fillCats(){$('cat').innerHTML=(type==='out'?OUT:IN).map(c=>`<option value="${c[1]}">${c[0]} ${c[1]}</option>`).join('')}
function setType(t){type=t;$('tOut').className=t==='out'?'on o':'';$('tIn').className=t==='in'?'on i':'';fillCats()}
$('tOut').onclick=()=>setType('out');$('tIn').onclick=()=>setType('in');
[$('amt'),$('gTarget'),$('budget')].forEach(el=>el.addEventListener('input',()=>{const n=num(el.value);el.value=n?n.toLocaleString('id-ID'):''}));

$('add').onclick=()=>{
  const a=num($('amt').value);
  if(!a){toast('Isi nominal dulu');$('amt').focus();return}
  fresh=Date.now();S.tx.push({id:fresh,type,amount:a,w:$('wal').value,cat:$('cat').value,note:$('note').value.trim(),date:$('date').value||today()});
  $('amt').value='';$('note').value='';save();render();toast('Transaksi tersimpan');burst($('add'),type==='in'?'🪙':'💸',type==='in');
};
$('gAdd').onclick=()=>{
  const n=$('gName').value.trim(),t=num($('gTarget').value);
  if(!n||!t){toast('Isi nama dan harga barang');return}
  S.goals.push({id:Date.now(),name:n,target:t,saved:0});
  $('gName').value='';$('gTarget').value='';save();render();toast('Target ditambahkan');
};
$('csv').onclick=()=>{
  const rows=[['Tanggal','Jenis','Kategori','Catatan','Nominal'],...S.tx.map(t=>[t.date,t.type==='in'?'Pemasukan':'Pengeluaran',t.cat,'"'+t.note.replace(/"/g,'""')+'"',t.amount])];
  const b=new Blob([rows.map(r=>r.join(',')).join('\n')],{type:'text/csv'});
  const a=document.createElement('a');a.href=URL.createObjectURL(b);a.download='keuangan.csv';a.click();
};
window.delTx=id=>{S.tx=S.tx.filter(t=>t.id!==id);save();render()};
window.delGoal=id=>{const g=S.goals.find(g=>g.id===id);if(g&&g.saved)toast('Tabungan target kembali ke saldo bebas');S.goals=S.goals.filter(g=>g.id!==id);save();render()};
window.moveGoal=(id,sign)=>{
  const g=S.goals.find(g=>g.id===id),v=num($('g'+id).value);
  if(!v){toast('Isi nominal');return}
  const free=freeBal();
  if(sign>0&&v>free){toast('Saldo bebas tidak cukup');return}
  if(sign<0&&v>g.saved){toast('Tabungan target kurang');return}
  const was=g.saved;g.saved+=sign*v;if(sign>0&&was<g.target&&g.saved>=g.target)confetti();save();render();toast(sign>0?'Ditabung ke target':'Diambil dari target');
};
const totalBal=()=>S.tx.reduce((s,t)=>s+(t.type==='in'?t.amount:-t.amount),0);
const freeBal=()=>totalBal()-S.goals.reduce((s,g)=>s+g.saved,0);
const icon=(t)=>(t.type==='in'?IN:OUT).find(c=>c[1]===t.cat)?.[0]||'💸';

function render(){
  const m=$('bulan').value,mt=S.tx.filter(t=>t.date.startsWith(m)).sort((a,b)=>b.date.localeCompare(a.date)||b.id-a.id);
  const inn=mt.filter(t=>t.type==='in').reduce((s,t)=>s+t.amount,0),out=mt.filter(t=>t.type==='out').reduce((s,t)=>s+t.amount,0);
  cnt($('saldo'),totalBal());cnt($('bebas'),freeBal());
  cnt($('sIn'),inn);cnt($('sOut'),out);
  $('wallets').innerHTML=S.wallets.map(n=>{const b=S.tx.filter(t=>(t.w||'Tunai')===n).reduce((s,t)=>s+(t.type==='in'?t.amount:-t.amount),0)+S.tf.reduce((s,x)=>s+(x.to===n?x.amount:0)-(x.from===n?x.amount:0),0);return `<div class="wl"><small>${{Tunai:'💵',Bank:'🏦','E-wallet':'📱'}[n]||'👛'} ${esc(n)}</small><b class="${b<0?'out':''}">${rp(b)}</b></div>`}).join('');
  const cw=$('wal').value;$('wal').innerHTML=S.wallets.map(n=>`<option>${esc(n)}</option>`).join('');if(S.wallets.includes(cw))$('wal').value=cw;
  $('bebas').closest('.free').classList.toggle('neg',freeBal()<0);
  $('welcome').hidden=!(S.tx.length===0&&!S.welcomed);
  const t0=today(),wk=iso(new Date(Date.now()-6*864e5)),tdo=sum(S.tx.filter(t=>t.date===t0),'out'),wko=sum(S.tx.filter(t=>t.date>=wk),'out'),big=mt.filter(t=>t.type==='out').sort((a,b)=>b.amount-a.amount)[0];
  $('insights').innerHTML=[['🔥','Hari ini',rp(tdo),'pengeluaran hari ini'],['📅','7 hari terakhir',rp(wko),`rata-rata ${rp(wko/7)} per hari`],['🏆','Terbesar bulan ini',big?rp(big.amount):'-',big?esc(big.note||big.cat):'belum ada pengeluaran'],['💎','Rasio tabungan',inn?Math.round((inn-out)/inn*100)+'%':'-',inn?'dari pemasukan bulan ini':'catat pemasukan dulu']].map(([i,a,b,c],k)=>`<div class="ins" style="animation-delay:${.15+k*.08}s"><span class="ib">${i}</span><div><small>${a}</small><b>${b}</b><em>${c}</em></div></div>`).join('');
  const SD=30,vals=[];for(let i=SD-1;i>=0;i--){const d=iso(new Date(Date.now()-i*864e5));vals.push(S.tx.reduce((s,t)=>t.date<=d?s+(t.type==='in'?t.amount:-t.amount):s,0))}
  const lo=Math.min(...vals),rg=(Math.max(...vals)-lo)||1,ln=vals.map((v,i)=>(i?'L':'M')+(i/(SD-1)*600).toFixed(1)+','+(70-(v-lo)/rg*56).toFixed(1)).join('');
  $('spark').innerHTML=`<svg viewBox="0 0 600 80" preserveAspectRatio="none" aria-hidden="true"><defs><linearGradient id="sg" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#fff" stop-opacity=".38"/><stop offset="1" stop-color="#fff" stop-opacity="0"/></linearGradient></defs><path class="sa" d="${ln}L600,80L0,80Z"/><path class="sl" pathLength="1" d="${ln}"/></svg>`;
  const now=new Date(),dl=new Date(now.getFullYear(),now.getMonth()+1,0).getDate()-now.getDate()+1;
  const bg=S.budget||0,pc=bg?out/bg*100:0;
  $('bBar').dataset.w=Math.min(100,pc);$('bBar').className=pc>=100?'over':pc>=80?'warn':'ok';
  $('bTxt').textContent=bg?(out>bg?`Lewat ${rp(out-bg)} dari batas. Rem dulu belanjanya!`:`Sisa ${rp(bg-out)} · terpakai ${pc.toFixed(0)}%${pc>=80?' (hampir habis)':''}${m===today().slice(0,7)?` · boleh ±${rp((bg-out)/dl)} per hari`:''}`):'Atur batas supaya kamu tahu kapan harus berhenti belanja.';
  const [yy,mm]=m.split('-').map(Number),mo=[];
  for(let i=5;i>=0;i--){const d=new Date(yy,mm-1-i,1),k=d.getFullYear()+'-'+String(d.getMonth()+1).padStart(2,'0'),a=S.tx.filter(t=>t.date.startsWith(k));mo.push({l:d.toLocaleDateString('id-ID',{month:'short'}),i:sum(a,'in'),o:sum(a,'out')})}
  const mx=Math.max(1,...mo.flatMap(x=>[x.i,x.o])),pv=mo[4].o;
  const rate=Math.max(0,mo.slice(3).reduce((s,x)=>s+x.i-x.o,0)/3);
  $('insight').textContent=pv?(out<=pv?`Hemat ${((1-out/pv)*100).toFixed(0)}% dibanding bulan lalu 👍`:`Pengeluaran naik ${((out/pv-1)*100).toFixed(0)}% dibanding bulan lalu`):'';
  $('trend').innerHTML=`<div class="tr">${mo.map(x=>`<div class="col"><div class="pair"><i class="ti" data-h="${x.i/mx*100}" title="Masuk ${rp(x.i)}"></i><i class="to" data-h="${x.o/mx*100}" title="Keluar ${rp(x.o)}"></i></div><span>${x.l}</span></div>`).join('')}</div><div class="lg2"><span><s class="in2"></s>Masuk</span><span><s class="out2"></s>Keluar</span></div>`;
  const lt=mt.filter(t=>(F==='all'||t.type===F)&&(t.cat+' '+t.note).toLowerCase().includes(Q));
  $('list').innerHTML=lt.length?lt.map((t,ix)=>`<div class="tx${t.id===fresh?' new':''}" style="animation-delay:${Math.min(ix,10)*45}ms"><div class="ico">${icon(t)}</div><div class="m"><b>${esc(t.note||t.cat)}</b><span>${t.cat} · ${esc(t.w||'Tunai')} · ${new Date(t.date+'T00:00').toLocaleDateString('id-ID',{day:'numeric',month:'short'})}</span></div><b class="${t.type==='in'?'in':'out'}">${t.type==='in'?'+':'−'}${rp(t.amount)}</b><button class="x" aria-label="Ubah transaksi" onclick="editTx(${t.id})">✎</button><button class="x" aria-label="Hapus transaksi" onclick="delTx(${t.id})">✕</button></div>`).join(''):'<div class="empty">Belum ada transaksi di bulan ini. Catat yang pertama di atas.</div>';
  const by={};mt.filter(t=>t.type==='out').forEach(t=>by[t.cat]=(by[t.cat]||0)+t.amount);
  const ent=Object.entries(by).sort((a,b)=>b[1]-a[1]);
  let acc=0;
  const dn=ent.map(([k,v],i)=>{const p=v/out*100,c=`<circle class="seg-d" r="15.915" cx="21" cy="21" fill="none" stroke="${COL[i%8]}" stroke-width="6" stroke-dasharray="${p} ${100-p}" stroke-dashoffset="${25-acc}"/>`;acc+=p;return c}).join('');
  $('cats').innerHTML=ent.length?`<div class="donutwrap"><svg viewBox="0 0 42 42" class="donut" role="img" aria-label="Diagram pengeluaran"><circle r="15.915" cx="21" cy="21" fill="none" stroke="var(--bg)" stroke-width="6"/>${dn}<text x="21" y="21" text-anchor="middle" class="dt1">${(ent[0][1]/out*100).toFixed(0)}%</text><text x="21" y="26" text-anchor="middle" class="dt2">${ent[0][0].split(' ')[0]}</text></svg><div class="leg">${ent.map(([k,v],i)=>`<div class="cat"><span><s style="background:${COL[i%8]}"></s>${k}</span><b>${rp(v)}</b></div>`).join('')}</div></div>`:'<div class="empty">Belum ada pengeluaran.</div>';
  $('goals').innerHTML=S.goals.length?S.goals.map(g=>{
    const p=Math.min(100,g.saved/g.target*100),ok=g.saved>=g.target;
    return `<div class="goal${ok?' full':''}"><div class="top"><div><b>${esc(g.name)}</b><div style="color:var(--mute);font-size:13px">${rp(g.saved)} dari ${rp(g.target)}</div></div><button class="x" aria-label="Hapus target" onclick="delGoal(${g.id})">✕</button></div>
    <div class="bar"><i data-w="${p}"></i></div>
    <div style="font-size:13px">${ok?'<span class="done">Dana terkumpul — siap dibeli! 🎉</span>':`${p.toFixed(0)}% · kurang ${rp(g.target-g.saved)}${rate>0?(n=>n>120?' · butuh lebih dari 10 tahun, naikkan tabunganmu':n>=12?` · ± ${(n/12).toFixed(1)} tahun lagi`:` · ± ${n} bulan lagi`)(Math.ceil((g.target-g.saved)/rate)):''}`}</div>
    <div class="act"><input id="g${g.id}" inputmode="numeric" placeholder="Nominal" aria-label="Nominal tabung" oninput="const n=parseInt(this.value.replace(/\\D/g,''))||0;this.value=n?n.toLocaleString('id-ID'):''"><button onclick="moveGoal(${g.id},1)">Tabung</button><button onclick="moveGoal(${g.id},-1)">Ambil</button></div></div>`}).join(''):'<div class="empty">Tulis barang impianmu, lalu tabung sedikit demi sedikit.</div>';
  renderExtra();renderSide();renderBadges();growBars();fresh=0;
}
$('bulan').onchange=render;
setType('out');

function calm(){return matchMedia('(prefers-reduced-motion:reduce)').matches}
function cnt(el,to){const from=+el.dataset.v||0;el.dataset.v=to;if(from!==to&&!calm()){el.classList.remove('bump');void el.offsetWidth;el.classList.add('bump')}if(calm()||from===to){el.textContent=rp(to);return}
  const t0=performance.now(),d=800;(function f(t){const p=Math.min(1,(t-t0)/d),e=1-Math.pow(1-p,3);el.textContent=rp(from+(to-from)*e);if(p<1)requestAnimationFrame(f);else el.textContent=rp(to)})(t0)}
function growBars(){requestAnimationFrame(()=>requestAnimationFrame(()=>{document.querySelectorAll('.bar i[data-w]').forEach(i=>i.style.width=i.dataset.w+'%');document.querySelectorAll('[data-h]').forEach(i=>i.style.height=i.dataset.h+'%')}))}
function confetti(){if(calm())return;const c=['#FFB020','#2FD39B','#FF5C4D','#4DA3FF','#ffffff'];
  for(let i=0;i<50;i++){const e=document.createElement('i');e.className='conf';
    e.style.cssText=`left:${Math.random()*100}vw;background:${c[i%5]};--dx:${(Math.random()-.5)*200}px;animation-delay:${Math.random()*.4}s;animation-duration:${1.4+Math.random()}s`;
    document.body.appendChild(e);setTimeout(()=>e.remove(),2800)}}

function quiet(){document.body.classList.add('quiet');render();requestAnimationFrame(()=>requestAnimationFrame(()=>document.body.classList.remove('quiet')))}
$('q').oninput=e=>{Q=e.target.value.toLowerCase();quiet()};
$('f').onchange=e=>{F=e.target.value;quiet()};
$('budget').value=S.budget?S.budget.toLocaleString('id-ID'):'';
$('bSave').onclick=()=>{S.budget=num($('budget').value);save();render();toast(S.budget?'Batas disimpan':'Batas dihapus')};
$('theme').onclick=()=>{const r=document.documentElement,dark=r.dataset.theme?r.dataset.theme==='dark':!matchMedia('(prefers-color-scheme:light)').matches;r.dataset.theme=dark?'light':'dark';try{localStorage.setItem('dompetku-theme',r.dataset.theme)}catch(e){}};

$('wAdd').onclick=async()=>{const r=await ask('Dompet baru',[{label:'Nama dompet (mis. BCA, Dana, Celengan)'}]);const n=r?r[0]:'';if(!n||S.wallets.includes(n))return;S.wallets.push(n);save();render();$('wal').value=n;toast('Dompet ditambahkan')};
$('chips').innerHTML=[10000,20000,50000,100000,500000].map(v=>`<button type="button" data-v="${v}">+${v/1000}rb</button>`).join('');
$('chips').onclick=e=>{const v=+e.target.dataset.v;if(v)$('amt').value=(num($('amt').value)+v).toLocaleString('id-ID')};
$('bk').onclick=()=>{const a=document.createElement('a');a.href=URL.createObjectURL(new Blob([JSON.stringify(S)],{type:'application/json'}));a.download='kantong-ajaib-cadangan.json';a.click()};
$('rs').onclick=()=>$('file').click();
$('file').onchange=e=>{const f=e.target.files[0];e.target.value='';if(!f)return;f.text().then(t=>{try{const d=JSON.parse(t);if(!Array.isArray(d.tx)||!Array.isArray(d.goals))throw 0;S=d;fixS();applyCats();fillCats();save();$('budget').value=S.budget?S.budget.toLocaleString('id-ID'):'';render();toast('Data dipulihkan')}catch(x){toast('File cadangan tidak valid')}})};
let dispName='';
function greet(){const h=new Date().getHours();$('hi').textContent='Selamat '+(h<11?'pagi':h<15?'siang':h<18?'sore':'malam')+', '+dispName+'! Total saldomu'}

/* ===== Login & animasi ===== */
const UK='dompetku-users';
const getU=()=>{try{return JSON.parse(localStorage.getItem(UK))||{}}catch(e){return{}}};
async function hash(p,salt){const s=salt+':'+p;try{const b=await crypto.subtle.digest('SHA-256',new TextEncoder().encode(s));return [...new Uint8Array(b)].map(x=>x.toString(16).padStart(2,'0')).join('')}catch(e){let h=5381;for(const c of s)h=(h*33^c.charCodeAt(0))>>>0;return 'x'+h}}
let mode='login';
/* Mode Masuk: hanya sandi. Mode Daftar: nama + sandi + ulangi sandi. */
function setMode(m){mode=m;$('tLogin').classList.toggle('on',m==='login');$('tReg').classList.toggle('on',m==='reg');$('tInd').style.transform=m==='reg'?'translateX(100%)':'none';$('lName').hidden=m==='login';$('lPass2').hidden=m==='login';$('aGo').textContent=m==='login'?'Masuk':'Buat akun';$('aerr').textContent='';$('uPass').autocomplete=m==='login'?'current-password':'new-password'}
function aerr(t){$('aerr').textContent=t;const c=$('aform');c.classList.remove('shake');void c.offsetWidth;c.classList.add('shake')}
async function go(){
  const raw=$('uName').value.trim(),p=$('uPass').value,U=getU();
  let n=raw.toLowerCase();
  if(!p||(mode==='reg'&&!n))return aerr(mode==='reg'?'Isi nama dan sandi dulu':'Isi sandi dulu');
  $('aGo').classList.add('load');
  try{
    if(mode==='reg'){
      if(p.length<4)return aerr('Sandi minimal 4 karakter');
      if(p!==$('uPass2').value)return aerr('Ulangi sandi tidak sama');
      if(U[n])return aerr('Nama sudah dipakai, pakai nama lain');
      /* Karena masuk hanya dengan sandi, sandi harus unik antar akun */
      for(const k in U){if(await hash(p,U[k].salt)===U[k].h)return aerr('Sandi ini sudah dipakai akun lain, pilih sandi berbeda')}
      const salt=Math.random().toString(36).slice(2);U[n]={salt,h:await hash(p,salt),name:raw};
      try{localStorage.setItem(UK,JSON.stringify(U));if(Object.keys(U).length===1){const old=localStorage.getItem(BASE);if(old)localStorage.setItem(BASE+'-'+n,old)}}catch(e){}
    }else{
      n=null;
      for(const k in U){if(await hash(p,U[k].salt)===U[k].h){n=k;break}}
      if(!n)return aerr('Sandi salah');
    }
    enter(n,U[n].name||n);
  }finally{$('aGo').classList.remove('load')}
}
function enter(n,name){
  KEY=BASE+'-'+n;dispName=name;try{sessionStorage.setItem('dompetku-user',n)}catch(e){}
  badgeReady=false;loadData();applyCats();fillCats();$('uPass').value=$('uPass2').value='';
  ['saldo','bebas','sIn','sOut'].forEach(i=>delete $(i).dataset.v);
  $('who').innerHTML=`<i>${esc(name[0].toUpperCase())}</i><b>${esc(name)}</b>`;
  const a=$('auth');a.classList.add('leave');setTimeout(()=>{a.hidden=true},550);
  $('app').hidden=false;greet();applyRec();render();moveInd();showView('dash');
}
$('tLogin').onclick=()=>setMode('login');$('tReg').onclick=()=>setMode('reg');$('aGo').onclick=go;
['uName','uPass','uPass2'].forEach(i=>$(i).addEventListener('keydown',e=>{if(e.key==='Enter')go()}));
$('logout').onclick=()=>{try{sessionStorage.removeItem('dompetku-user')}catch(e){}$('app').hidden=true;const a=$('auth');a.hidden=false;a.classList.remove('leave');setMode('login');$('uName').value='';$('uPass').focus()};
function burst(el,em,up){if(calm())return;const r=el.getBoundingClientRect();for(let i=0;i<14;i++){const e=document.createElement('i');e.className='bst';e.textContent=em;e.style.cssText=`left:${r.left+r.width/2}px;top:${r.top}px;--dx:${(Math.random()-.5)*260}px;--dy:${(up?-1:1)*(80+Math.random()*140)}px;animation-delay:${Math.random()*.15}s`;document.body.appendChild(e);setTimeout(()=>e.remove(),1500)}}
document.addEventListener('pointerdown',e=>{const b=e.target.closest&&e.target.closest('.btn,.ghost,.seg button,.chips button,.goal .act button,.tabs button');if(!b||calm())return;const r=b.getBoundingClientRect(),s=Math.max(r.width,r.height)*2,x=document.createElement('span');x.className='rip';x.style.cssText=`width:${s}px;height:${s}px;left:${e.clientX-r.left-s/2}px;top:${e.clientY-r.top-s/2}px`;b.appendChild(x);setTimeout(()=>x.remove(),650)});
document.addEventListener('pointermove',e=>{const t=e.target.closest&&e.target.closest('.hero,.stat');if(!t||calm())return;const r=t.getBoundingClientRect(),x=(e.clientX-r.left)/r.width-.5,y=(e.clientY-r.top)/r.height-.5;t.style.transform=`perspective(700px) rotateY(${x*9}deg) rotateX(${-y*9}deg) translateY(-3px)`});
document.addEventListener('pointerout',e=>{const t=e.target.closest&&e.target.closest('.hero,.stat');if(t&&!t.contains(e.relatedTarget))t.style.transform=''});
document.querySelectorAll('.acard>*').forEach((e,i)=>e.style.animationDelay=(.15+i*.07)+'s');
if(!calm()){const a=$('auth');for(let i=0;i<16;i++){const e=document.createElement('i');e.className='coin';e.textContent=['🪙','💰','💵','Rp'][i%4];e.style.cssText=`left:${Math.random()*100}%;font-size:${16+Math.random()*22}px;animation-duration:${9+Math.random()*10}s;animation-delay:${-Math.random()*14}s`;a.appendChild(e)}}
setMode(Object.keys(getU()).length?'login':'reg');

/* ===== Modul lanjutan ===== */
let rType='out',dType='utang';
const mk=(y,m)=>y+'-'+String(m).padStart(2,'0'),curM=()=>$('bulan').value;
function fixS(){S.wallets=S.wallets&&S.wallets.length?S.wallets:['Tunai','Bank','E-wallet'];S.budget=S.budget||0;S.catBudgets=S.catBudgets||{};['rec','tf','debts','badges','cats'].forEach(k=>S[k]=S[k]||[])}
function fmtIn(el){const n=num(el.value);el.value=n?n.toLocaleString('id-ID'):''}
function fill(id,arr){const e=$(id),c=e.value;e.innerHTML=arr.map(n=>`<option>${esc(n)}</option>`).join('');if(arr.includes(c))e.value=c}
function delRec(id){S.rec=S.rec.filter(r=>r.id!==id);save();render()}
function delTf(id){S.tf=S.tf.filter(r=>r.id!==id);save();render()}
function delDebt(id){S.debts=S.debts.filter(r=>r.id!==id);save();render()}
function payDebt(id){const d=S.debts.find(x=>x.id===id),v=num($('d'+id).value);if(!v){toast('Isi nominal');return}
  const a=Math.min(v,d.amount-d.paid);d.paid+=a;
  S.tx.push({id:Date.now(),type:d.kind==='utang'?'out':'in',amount:a,w:$('wal').value||S.wallets[0],cat:d.kind==='utang'?'Bayar utang':'Terima piutang',note:d.who,date:today()});
  save();render();toast(d.kind==='utang'?'Cicilan dicatat di riwayat':'Pembayaran dicatat di riwayat');if(d.paid>=d.amount)confetti()}
function applyRec(){const cm=today().slice(0,7);let n=0;
  S.rec.forEach(r=>{let [y,m]=r.last.split('-').map(Number);for(let g=0;g<600;g++){m++;if(m>12){m=1;y++}const k=mk(y,m);if(k>cm)break;const dd=Math.min(r.day,new Date(y,m,0).getDate()),date=k+'-'+String(dd).padStart(2,'0');if(date>today())break;S.tx.push({id:Date.now()+n++,type:r.type,amount:r.amount,w:r.w,cat:r.cat,note:r.note||'Otomatis',date,rid:r.id});r.last=k}});
  if(n){save();toast(n+' transaksi berulang dicatat otomatis')}}
function budUpd(){let tl=0,ts=0;document.querySelectorAll('.lim').forEach(i=>{const l=num(i.value),sp=+i.dataset.sp,p=l?sp/l*100:0,row=i.closest('.brow'),b=row.querySelector('.bar i');tl+=l;ts+=sp;b.dataset.w=Math.min(100,p);b.style.width=Math.min(100,p)+'%';b.className=p>=100?'over':p>=80?'warn':'ok';row.querySelector('.cat span').textContent=rp(sp)+(l?' / '+rp(l):'')});
  $('budSum').textContent=tl?`Total batas ${rp(tl)} · terpakai ${rp(ts)} (${(ts/tl*100).toFixed(0)}%)`:'Isi batas tiap kategori, atau pakai tombol otomatis.'}
function renderExtra(){
  const m=curM(),[y,mo]=m.split('-').map(Number),mt=S.tx.filter(t=>t.date.startsWith(m)),out=sum(mt,'out'),inn=sum(mt,'in');
  const by={};mt.filter(t=>t.type==='out').forEach(t=>by[t.cat]=(by[t.cat]||0)+t.amount);
  $('budList').innerHTML=OUT.map(([ic,c])=>{const l=S.catBudgets[c]||0;return `<div class="brow"><div class="ico">${ic}</div><div class="bm"><div class="cat"><b>${c}</b><span></span></div><div class="bar"><i data-w="0" class="ok"></i></div></div><input class="lim" data-c="${c}" data-sp="${by[c]||0}" inputmode="numeric" placeholder="Batas" value="${l?l.toLocaleString('id-ID'):''}" aria-label="Batas ${c}"></div>`}).join('');budUpd();
  fill('rWal',S.wallets);fill('tFrom',S.wallets);fill('tTo',S.wallets);fill('rCat',(rType==='out'?OUT:IN).map(c=>c[1]));
  if(!$('tTo').dataset.i&&S.wallets.length>1){$('tTo').value=S.wallets[1];$('tTo').dataset.i=1}
  $('recList').innerHTML=S.rec.length?S.rec.map(r=>`<div class="tx"><div class="ico">${r.type==='in'?'💼':'🔁'}</div><div class="m"><b>${esc(r.note||r.cat)}</b><span>tgl ${r.day} tiap bulan · ${esc(r.w)}</span></div><b class="${r.type==='in'?'in':'out'}">${r.type==='in'?'+':'−'}${rp(r.amount)}</b><button class="x" aria-label="Hapus" onclick="delRec(${r.id})">✕</button></div>`).join(''):'<div class="empty">Belum ada jadwal. Contoh: gaji tiap tgl 25, listrik tiap tgl 5.</div>';
  $('tfList').innerHTML=S.tf.length?[...S.tf].sort((a,b)=>b.id-a.id).slice(0,8).map(x=>`<div class="tx"><div class="ico">↔️</div><div class="m"><b>${esc(x.from)} → ${esc(x.to)}</b><span>${x.date}</span></div><b>${rp(x.amount)}</b><button class="x" aria-label="Hapus" onclick="delTf(${x.id})">✕</button></div>`).join(''):'<div class="empty">Belum ada transfer.</div>';
  const td=today();let su=0,sp=0;
  $('debtList').innerHTML=S.debts.length?S.debts.map(d=>{const left=d.amount-d.paid,done=left<=0,late=!done&&d.due&&d.due<td;if(!done){d.kind==='utang'?su+=left:sp+=left}
    return `<div class="goal${done?' full':''}"><div class="top"><div><b>${d.kind==='utang'?'🔻 Utang ke ':'🔺 Piutang dari '}${esc(d.who)}</b><div class="dn">${rp(d.paid)} dari ${rp(d.amount)}${d.due?' · tempo '+d.due:''}${d.note?' · '+esc(d.note):''}</div></div><button class="x" aria-label="Hapus" onclick="delDebt(${d.id})">✕</button></div><div class="bar"><i data-w="${Math.min(100,d.paid/d.amount*100)}" class="${done?'ok':late?'over':'warn'}"></i></div><div style="font-size:13px">${done?'<span class="done">Lunas 🎉</span>':late?`<span class="out">Lewat jatuh tempo · sisa ${rp(left)}</span>`:`Sisa ${rp(left)}`}</div>${done?'':`<div class="act"><input id="d${d.id}" inputmode="numeric" placeholder="Nominal" aria-label="Nominal" oninput="fmtIn(this)"><button onclick="payDebt(${d.id})">${d.kind==='utang'?'Bayar':'Terima'}</button></div>`}</div>`}).join(''):'<div class="empty">Tidak ada utang atau piutang. Aman! 🙌</div>';
  cnt($('sU'),su);cnt($('sP'),sp);
  const dm=new Date(y,mo,0).getDate(),de=m===today().slice(0,7)?+today().slice(8):dm,pd=Array(dm+1).fill(0);
  mt.filter(t=>t.type==='out').forEach(t=>pd[+t.date.slice(8)]+=t.amount);
  const mxD=Math.max(...pd),mxDay=pd.indexOf(mxD),avg=out/de,sr=inn?(inn-out)/inn:0,top=Object.entries(by).sort((a,b)=>b[1]-a[1])[0];
  $('kpis').innerHTML=[['Rata-rata per hari',rp(avg)],['Perkiraan akhir bulan',rp(avg*dm)],['Hari terboros',mxD?`tgl ${mxDay} · ${rp(mxD)}`:'-'],['Kategori terbesar',top?top[0]:'-'],['Rasio tabungan',inn?(sr*100).toFixed(0)+'%':'-'],['Jumlah transaksi',mt.length]].map(([a,b])=>`<div class="kpi"><small>${a}</small><b>${b}</b></div>`).join('');
  const lead=(new Date(y,mo-1,1).getDay()+6)%7;
  let cells=['Sen','Sel','Rab','Kam','Jum','Sab','Min'].map(d=>`<i class="hd">${d}</i>`).join('')+'<i></i>'.repeat(lead);
  for(let d=1;d<=dm;d++)cells+=`<i class="hc" style="--r:${mxD?(pd[d]/mxD*100).toFixed(0):0}%;animation-delay:${d*20}ms" title="Tgl ${d}: ${rp(pd[d])}">${d}</i>`;
  $('heat').innerHTML=`<div class="hm">${cells}</div><div class="bnote" style="margin-top:8px">Makin merah, makin boros.</div>`;
  const tracked=new Set(mt.map(t=>t.date)).size,bgt=S.budget||0,s1=Math.max(0,Math.min(1,sr/.2))*40,s2=bgt?(out<=bgt?30:Math.max(0,30*(1-(out-bgt)/bgt))):15,s3=Math.min(1,tracked/Math.max(1,de))*30,sc=Math.round(inn||out?s1+s2+s3:0);
  const col=sc>=70?'var(--in)':sc>=40?'var(--goal)':'var(--out)',lab=sc>=70?'Sehat 💪':sc>=40?'Waspada ⚠️':inn||out?'Perlu dibenahi 🚨':'Belum ada data';
  $('ring').innerHTML=`<circle r="15.915" cx="21" cy="21" fill="none" stroke="var(--bg)" stroke-width="4.5"/><circle class="seg-d" r="15.915" cx="21" cy="21" fill="none" stroke="${col}" stroke-width="4.5" stroke-linecap="round" stroke-dasharray="${sc} ${100-sc}" stroke-dashoffset="25"/><text x="21" y="22.5" text-anchor="middle" class="dt1">${sc}</text><text x="21" y="27.5" text-anchor="middle" class="dt2">dari 100</text>`;
  const row=(n,v,mx)=>`<div><div class="cat"><span>${n}</span><b>${v.toFixed(0)}/${mx}</b></div><div class="bar"><i class="ok" data-w="${v/mx*100}"></i></div></div>`;
  $('scoreTxt').innerHTML=`<b style="font-size:20px;color:${col}">${lab}</b>${row('Menabung',s1,40)}${row('Disiplin anggaran',s2,30)}${row('Rajin mencatat',s3,30)}`;
  let rows='';for(let i=1;i<=12;i++){const a=S.tx.filter(t=>t.date.startsWith(mk(y,i))),ii=sum(a,'in'),oo=sum(a,'out');rows+=`<tr class="${i===mo?'cur':''}"><td>${new Date(y,i-1,1).toLocaleDateString('id-ID',{month:'short'})}</td><td class="in">${rp(ii)}</td><td class="out">${rp(oo)}</td><td>${rp(ii-oo)}</td></tr>`}
  const fi=[],fo=[];for(let i=1;i<=12;i++){const a=S.tx.filter(t=>t.date.startsWith(mk(y,i)));fi.push(sum(a,'in'));fo.push(sum(a,'out'))}
  const fm=Math.max(1,...fi,...fo),X=i=>30+i*(540/11),Y=v=>150-v/fm*120,pth=a=>a.map((v,i)=>(i?'L':'M')+X(i).toFixed(1)+','+Y(v).toFixed(1)).join('');
  $('flow').innerHTML=`<svg viewBox="0 0 600 180" class="fsvg" id="fsvg" role="img" aria-label="Grafik arus kas">${[0,.5,1].map(g=>`<line x1="30" x2="570" y1="${Y(fm*g)}" y2="${Y(fm*g)}" class="gl"/>`).join('')}<path d="${pth(fi)}L570,150L30,150Z" fill="var(--in)" opacity=".13"/><path pathLength="1" class="fl fin" d="${pth(fi)}"/><path pathLength="1" class="fl fout" d="${pth(fo)}"/>${'JFMAMJJASOND'.split('').map((l,i)=>`<text x="${X(i)}" y="170" class="fx">${l}</text>`).join('')}<line id="fg" y1="20" y2="150" class="fg"/><circle id="fd1" r="5" class="fdi"/><circle id="fd2" r="5" class="fdo"/></svg><div class="ftip" id="ftip"></div>`;
  const sv=$('fsvg'),tp=$('ftip');
  sv.onpointermove=e=>{const r=sv.getBoundingClientRect(),i=Math.max(0,Math.min(11,Math.round(((e.clientX-r.left)/r.width*600-30)/(540/11))));
    $('fg').setAttribute('x1',X(i));$('fg').setAttribute('x2',X(i));$('fd1').setAttribute('cx',X(i));$('fd1').setAttribute('cy',Y(fi[i]));$('fd2').setAttribute('cx',X(i));$('fd2').setAttribute('cy',Y(fo[i]));
    ['fg','fd1','fd2'].forEach(k=>$(k).style.opacity=1);tp.style.opacity=1;tp.style.left=Math.max(14,Math.min(86,X(i)/6))+'%';
    tp.innerHTML=`<b>${new Date(y,i,1).toLocaleDateString('id-ID',{month:'long'})}</b><br><span class="in">Masuk ${rp(fi[i])}</span><br><span class="out">Keluar ${rp(fo[i])}</span>`};
  sv.onpointerleave=()=>{['fg','fd1','fd2'].forEach(k=>$(k).style.opacity=0);tp.style.opacity=0};
  $('yearTbl').innerHTML=`<div class="tw"><table><thead><tr><th>Bulan</th><th>Masuk</th><th>Keluar</th><th>Selisih</th></tr></thead><tbody>${rows}</tbody></table></div>`;
}
function moveInd(){const b=document.querySelector('#tabbar button.on'),i=$('tbInd');if(b){i.style.width=b.offsetWidth+'px';i.style.height=b.offsetHeight+'px';i.style.transform=`translate(${b.offsetLeft}px,${b.offsetTop}px)`}}
function showView(v){document.querySelectorAll('.view').forEach(e=>{e.hidden=e.id!=='v-'+v});document.querySelectorAll('#tabbar button').forEach(b=>b.classList.toggle('on',b.dataset.v===v));moveInd();
  const el=$('v-'+v);el.classList.remove('vin');void el.offsetWidth;el.classList.add('vin');el.querySelectorAll('.bar i[data-w]').forEach(i=>i.style.width='0');growBars()}
$('tabbar').onclick=e=>{const b=e.target.closest('button');if(b&&b.dataset.v)showView(b.dataset.v)};
addEventListener('resize',moveInd);
['rAmt','tAmt','dAmt'].forEach(i=>$(i).addEventListener('input',e=>fmtIn(e.target)));
$('budList').addEventListener('input',e=>{if(e.target.classList.contains('lim')){fmtIn(e.target);S.catBudgets[e.target.dataset.c]=num(e.target.value);save();budUpd()}});
$('auto').onclick=()=>{const inc=sum(S.tx.filter(t=>t.date.startsWith(curM())),'in');if(!inc){toast('Catat pemasukan bulan ini dulu');return}
  const nd=['Makan & minum','Transportasi','Rumah & tagihan','Kesehatan','Pendidikan'],wn=['Belanja','Hiburan','Lainnya'],r=v=>Math.round(v/1000)*1000;
  nd.forEach(c=>S.catBudgets[c]=r(inc*.5/nd.length));wn.forEach(c=>S.catBudgets[c]=r(inc*.3/wn.length));save();renderExtra();showView('bud');toast('Terisi! Sisa 20% pemasukan untuk ditabung')};
$('rOut').onclick=()=>{rType='out';$('rOut').className='on o';$('rIn').className='';renderExtra()};
$('rIn').onclick=()=>{rType='in';$('rIn').className='on i';$('rOut').className='';renderExtra()};
$('rAdd').onclick=()=>{const a=num($('rAmt').value),day=Math.min(31,Math.max(1,+$('rDay').value||0));if(!a||!+$('rDay').value){toast('Isi nominal dan tanggal');return}
  const now=new Date(),cm=today().slice(0,7),p=new Date(now.getFullYear(),now.getMonth()-1,1);
  S.rec.push({id:Date.now(),type:rType,amount:a,cat:$('rCat').value,w:$('rWal').value,note:$('rNote').value.trim(),day,last:day<=now.getDate()?cm:mk(p.getFullYear(),p.getMonth()+1)});
  $('rAmt').value=$('rNote').value=$('rDay').value='';applyRec();save();render();toast('Jadwal ditambahkan')};
$('tDate').value=today();
$('tAdd').onclick=()=>{const a=num($('tAmt').value),f=$('tFrom').value,t=$('tTo').value;if(!a){toast('Isi nominal');return}if(f===t){toast('Dompet asal dan tujuan sama');return}
  S.tf.push({id:Date.now(),from:f,to:t,amount:a,date:$('tDate').value||today()});$('tAmt').value='';save();render();toast('Transfer berhasil');burst($('tAdd'),'🔁',true)};
$('dU').onclick=()=>{dType='utang';$('dU').className='on o';$('dP').className=''};
$('dP').onclick=()=>{dType='piutang';$('dP').className='on i';$('dU').className=''};
$('dAdd').onclick=()=>{const w=$('dWho').value.trim(),a=num($('dAmt').value);if(!w||!a){toast('Isi nama dan nominal');return}
  S.debts.push({id:Date.now(),kind:dType,who:w,amount:a,paid:0,due:$('dDue').value,note:$('dNote').value.trim()});['dWho','dAmt','dNote','dDue'].forEach(i=>$(i).value='');save();render();toast('Tersimpan')};
$('print').onclick=()=>window.print();


function ask(title,fields){return new Promise(res=>{const m=document.createElement('div');m.className='mdl';
  m.innerHTML=`<div class="mbox" role="dialog" aria-modal="true" aria-label="${esc(title)}"><h2>${esc(title)}</h2>${fields.map((f,i)=>`<label>${esc(f.label)}<input data-i="${i}" value="${esc(f.val||'')}" ${f.num?'inputmode="numeric"':''}></label>`).join('')}<div class="mact"><button class="ghost" data-a="0">Batal</button><button class="btn" data-a="1">Simpan</button></div></div>`;
  document.body.appendChild(m);const ins=[...m.querySelectorAll('input')];
  ins.forEach((e,i)=>{if(fields[i].num)e.addEventListener('input',()=>fmtIn(e));e.addEventListener('keydown',ev=>{if(ev.key==='Enter')done(1);if(ev.key==='Escape')done(0)})});ins[0].focus();
  function done(ok){const r=ok?ins.map(e=>e.value.trim()):null;m.remove();res(r)}
  m.onclick=e=>{const a=e.target.dataset.a;if(a!==undefined)done(+a);else if(e.target===m)done(0)}})}
async function editTx(id){const t=S.tx.find(x=>x.id===id);if(!t)return;
  const r=await ask('Ubah transaksi',[{label:'Nominal (Rp)',val:t.amount.toLocaleString('id-ID'),num:1},{label:'Catatan',val:t.note||''},{label:'Tanggal (TTTT-BB-HH)',val:t.date}]);if(!r)return;
  const a=num(r[0]);if(!a){toast('Nominal tidak valid');return}t.amount=a;t.note=r[1];if(/^\d{4}-\d{2}-\d{2}$/.test(r[2]))t.date=r[2];save();render();toast('Transaksi diubah')}

const TIPS=['Bayar dirimu dulu: sisihkan tabungan di awal bulan, bukan dari sisa.','Aturan 24 jam: tunda belanja impulsif sehari, banyak yang batal dibeli.','Dana darurat idealnya 3 sampai 6 kali pengeluaran bulanan.','Catat pengeluaran kecil. Kopi harian bisa jadi jutaan sebulan.','Pecah target besar jadi cicilan tabungan mingguan supaya ringan.','Utang dengan bunga tinggi dilunasi lebih dulu daripada menabung banyak.','Bandingkan harga di 3 toko sebelum membeli barang di atas Rp500.000.','Tinjau anggaran tiap akhir bulan dan sesuaikan untuk bulan depan.'];
let tipI=0;
function renderSide(){const t0=today(),days=new Set(S.tx.map(t=>t.date));let st=0;
  for(let i=days.has(t0)?0:1;i<400;i++){if(days.has(iso(new Date(Date.now()-i*864e5))))st++;else break}
  const g=[...S.goals].sort((a,b)=>b.saved/b.target-a.saved/a.target)[0];
  $('side').innerHTML=`<div class="swc" id="lvl"></div><div class="swc streak"><span class="fl">🔥</span><div><b>${st} hari</b><small>${st?'beruntun mencatat. Pertahankan!':'Catat hari ini untuk memulai'}</small></div></div>${g?`<div class="swc"><small>Target terdekat</small><b>${esc(g.name)}</b><div class="bar"><i class="ok" data-w="${Math.min(100,g.saved/g.target*100)}"></i></div><small>${Math.round(g.saved/g.target*100)}% terkumpul</small></div>`:''}<div class="swc tip" id="tip"><small>💡 Tips</small>${TIPS[tipI%TIPS.length]}</div><button class="qbtn" type="button" id="qadd">＋ Catat cepat</button>`;
  $('qadd').onclick=()=>{showView('dash');$('amt').scrollIntoView({behavior:'smooth',block:'center'});$('amt').focus()}}
setInterval(()=>{tipI++;const e=$('tip');if(e){e.innerHTML='<small>💡 Tips</small>'+TIPS[tipI%TIPS.length];e.classList.remove('sw-in');void e.offsetWidth;e.classList.add('sw-in')}},9000);
try{const th=localStorage.getItem('dompetku-theme');if(th)document.documentElement.dataset.theme=th}catch(e){}


/* ===== Pencapaian, level, palet perintah ===== */
const BADGES=[
 ['🌱','Langkah Pertama','Catat 1 transaksi',s=>s.tx.length>=1],
 ['📝','Rajin Mencatat','Catat 20 transaksi',s=>s.tx.length>=20],
 ['🔥','Seminggu Penuh','Catat 7 hari beruntun',(s,st)=>st>=7],
 ['🎯','Pemburu Target','Buat 1 target belanja',s=>s.goals.length>=1],
 ['🏆','Target Tercapai','Selesaikan 1 target',s=>s.goals.some(g=>g.saved>=g.target)],
 ['🛡️','Disiplin Anggaran','Pengeluaran di bawah batas bulanan',(s,st,c)=>s.budget>0&&c.out>0&&c.out<=s.budget],
 ['💎','Penabung Sejati','Rasio tabungan 20% atau lebih',(s,st,c)=>c.inn>0&&(c.inn-c.out)/c.inn>=.2],
 ['🏦','Multi Dompet','Punya 4 dompet atau lebih',s=>s.wallets.length>=4],
 ['🤝','Bebas Utang','Ada utang yang sudah lunas',s=>s.debts.some(d=>d.paid>=d.amount)]];
let badgeReady=false;
function calcStreak(){const days=new Set(S.tx.map(t=>t.date));let st=0;for(let i=days.has(today())?0:1;i<400;i++){if(days.has(iso(new Date(Date.now()-i*864e5))))st++;else break}return st}
function renderBadges(){const m=curM(),mt=S.tx.filter(t=>t.date.startsWith(m)),c={out:sum(mt,'out'),inn:sum(mt,'in')},st=calcStreak();
  const names=BADGES.filter(b=>b[3](S,st,c)).map(b=>b[1]),nw=names.filter(n=>!S.badges.includes(n));
  if(nw.length){S.badges=[...new Set([...S.badges,...names])];save();if(badgeReady)setTimeout(()=>{toast('🏅 Pencapaian baru: '+nw[0]);confetti()},1200)}
  badgeReady=true;$('bcount').textContent=names.length+'/'+BADGES.length;
  $('badges').innerHTML=BADGES.map((b,i)=>`<div class="bd${names.includes(b[1])?' on':''}" title="${esc(b[2])}" style="animation-delay:${i*50}ms"><span class="be">${b[0]}</span><b>${b[1]}</b><small>${b[2]}</small></div>`).join('');
  const xp=S.tx.length*10+S.goals.length*25+S.badges.length*50+st*5,lv=Math.floor(Math.sqrt(xp/25))+1,lo=25*(lv-1)**2,hi=25*lv*lv,T=['Pemula','Penabung Muda','Pengatur Uang','Juragan','Sultan','Legenda'];
  $('lvl').innerHTML=`<div class="lv"><span class="lb">${lv}</span><div><b>${T[Math.min(lv-1,5)]}</b><small>${xp} XP · ${hi-xp} XP lagi ke level ${lv+1}</small></div></div><div class="bar"><i class="ok" data-w="${(xp-lo)/(hi-lo)*100}"></i></div>`}
function palette(){if(document.querySelector('.pal'))return;
  const acts=[['🏠','Buka Dasbor',()=>showView('dash')],['🎯','Buka Anggaran',()=>showView('bud')],['🔁','Buka Berulang & Transfer',()=>showView('rec')],['🤝','Buka Utang',()=>showView('debt')],['📊','Buka Laporan',()=>showView('rep')],['➖','Catat pengeluaran',()=>{showView('dash');setType('out');$('amt').focus()}],['➕','Catat pemasukan',()=>{showView('dash');setType('in');$('amt').focus()}],['🎁','Tambah target belanja',()=>{showView('dash');$('gName').focus()}],['🌓','Ganti tema',()=>$('theme').click()],['💾','Cadangkan data',()=>$('bk').click()],['📄','Unduh CSV',()=>$('csv').click()],['🧪','Muat data contoh',()=>S.tx.length?toast('Data contoh hanya untuk akun yang masih kosong'):loadDemo()],['🚪','Keluar',()=>$('logout').click()]];
  const m=document.createElement('div');m.className='mdl pal';m.innerHTML='<div class="mbox pbox"><input id="pq" placeholder="Ketik perintah atau cari transaksi…" aria-label="Palet perintah"><div id="pl"></div><small class="phint">↑↓ pilih · Enter jalankan · Esc tutup</small></div>';
  document.body.appendChild(m);const q=m.querySelector('#pq'),pl=m.querySelector('#pl');let sel=0,cur=[];
  const draw=()=>{const k=q.value.toLowerCase().trim();cur=acts.filter(a=>a[1].toLowerCase().includes(k));
    if(k)S.tx.filter(t=>(t.cat+' '+t.note).toLowerCase().includes(k)).slice(-5).reverse().forEach(t=>cur.push([t.type==='in'?'💰':'🧾',`${t.note||t.cat} · ${rp(t.amount)} · ${t.date}`,()=>{$('bulan').value=t.date.slice(0,7);showView('dash');render()}]));
    sel=Math.min(sel,Math.max(0,cur.length-1));pl.innerHTML=cur.length?cur.map((a,i)=>`<div class="pi${i===sel?' on':''}" data-i="${i}"><span>${a[0]}</span>${esc(a[1])}</div>`).join(''):'<div class="empty">Tidak ada hasil</div>'};
  const run=i=>{const a=cur[i];m.remove();if(a)a[2]()};
  q.oninput=()=>{sel=0;draw()};
  q.onkeydown=e=>{if(e.key==='ArrowDown'){sel=Math.min(cur.length-1,sel+1);draw();e.preventDefault()}else if(e.key==='ArrowUp'){sel=Math.max(0,sel-1);draw();e.preventDefault()}else if(e.key==='Enter')run(sel);else if(e.key==='Escape')m.remove()};
  pl.onclick=e=>{const p=e.target.closest('.pi');if(p)run(+p.dataset.i)};m.onclick=e=>{if(e.target===m)m.remove()};
  draw();q.focus()}
$('pal').onclick=palette;
document.addEventListener('keydown',e=>{if((e.ctrlKey||e.metaKey)&&e.key.toLowerCase()==='k'&&!$('app').hidden){e.preventDefault();palette()}});
document.addEventListener('pointermove',e=>{const c=e.target.closest&&e.target.closest('.card,.ins,.wl,.stat,.bd');if(!c)return;const r=c.getBoundingClientRect();c.style.setProperty('--mx',(e.clientX-r.left)+'px');c.style.setProperty('--my',(e.clientY-r.top)+'px')});


/* ===== Kategori sendiri & sembunyikan saldo ===== */
const DOUT=OUT.map(c=>c.slice()),DIN=IN.map(c=>c.slice());
function applyCats(){OUT.length=0;DOUT.forEach(c=>OUT.push(c));IN.length=0;DIN.forEach(c=>IN.push(c));(S.cats||[]).forEach(c=>(c.t==='in'?IN:OUT).push([c.i,c.n]))}
$('catAdd').onclick=async()=>{const r=await ask('Kategori baru ('+(type==='out'?'pengeluaran':'pemasukan')+')',[{label:'Emoji (mis. 🐶)',val:'🏷️'},{label:'Nama kategori'}]);if(!r||!r[1])return;
  const n=r[1],list=type==='out'?OUT:IN;if(list.some(c=>c[1].toLowerCase()===n.toLowerCase())){toast('Kategori sudah ada');return}
  S.cats.push({t:type,i:r[0]||'🏷️',n});applyCats();save();fillCats();$('cat').value=n;render();toast('Kategori ditambahkan')};
$('catDel').onclick=()=>{const n=$('cat').value,k=S.cats.findIndex(c=>c.n===n&&c.t===type);if(k<0){toast('Hanya kategori buatanmu yang bisa dihapus');return}
  S.cats.splice(k,1);applyCats();save();fillCats();render();toast('Kategori dihapus')};
$('eye').onclick=()=>{const h=document.body.classList.toggle('hide');$('eye').textContent=h?'🙈':'👁';try{localStorage.setItem('dompetku-hide',h?'1':'')}catch(e){}};
try{if(localStorage.getItem('dompetku-hide')){document.body.classList.add('hide');$('eye').textContent='🙈'}}catch(e){}


/* ===== Data contoh & latar konstelasi ===== */
function loadDemo(){
  const R=(a,b)=>Math.round((a+Math.random()*(b-a))/1000)*1000,P=a=>a[Math.floor(Math.random()*a.length)],now=new Date(),tx=[],tf=[];let id=Date.now();
  const add=(d,type,amount,cat,note,w)=>tx.push({id:id++,type,amount,cat,note,w,date:iso(d)});
  for(let k=2;k>=0;k--){const y=now.getFullYear(),m=now.getMonth()-k,last=k?new Date(y,m+1,0).getDate():now.getDate(),D=n=>new Date(y,m,n);
    add(D(1),'in',7500000,'Gaji','Gaji bulanan','Bank');
    if(last>=12)add(D(12),'in',R(600000,1800000),'Usaha','Proyek freelance','E-wallet');
    if(last>=2)tf.push({id:id++,from:'Bank',to:'Tunai',amount:1500000,date:iso(D(2))},{id:id++,from:'Bank',to:'E-wallet',amount:1200000,date:iso(D(2))});
    if(last>=5){add(D(5),'out',450000,'Rumah & tagihan','Listrik','Bank');add(D(5),'out',350000,'Rumah & tagihan','Internet','Bank')}
    for(let d=1;d<=last;d++){
      if(Math.random()<.9)add(D(d),'out',R(15000,55000),'Makan & minum',P(['Makan siang','Kopi','Warteg','Sarapan','Bakso']),P(['Tunai','E-wallet']));
      if(Math.random()<.55)add(D(d),'out',R(10000,40000),'Transportasi',P(['Ojek online','Bensin','Parkir']),P(['E-wallet','Tunai']));
      if(Math.random()<.14)add(D(d),'out',R(60000,320000),'Belanja',P(['Baju','Skincare','Belanja bulanan','Aksesoris gadget']),'E-wallet');
      if(Math.random()<.1)add(D(d),'out',R(35000,150000),'Hiburan',P(['Nonton bioskop','Langganan streaming','Nongkrong']),'E-wallet');
      if(Math.random()<.04)add(D(d),'out',R(50000,250000),'Kesehatan','Obat & vitamin','Tunai')}}
  const due=n=>iso(new Date(Date.now()+n*864e5));
  S.tx=tx;S.tf=tf;S.budget=4500000;S.welcomed=true;
  S.catBudgets={'Makan & minum':1500000,'Transportasi':500000,'Belanja':800000,'Hiburan':400000,'Rumah & tagihan':900000,'Kesehatan':300000};
  S.goals=[{id:id++,name:'Laptop Baru',target:12000000,saved:4500000},{id:id++,name:'Liburan ke Bali',target:6000000,saved:1500000},{id:id++,name:'Sepatu Lari',target:1500000,saved:1500000}];
  S.debts=[{id:id++,kind:'utang',who:'Budi',amount:500000,paid:200000,due:due(10),note:'Pinjam darurat'},{id:id++,kind:'piutang',who:'Rina',amount:300000,paid:0,due:due(-5),note:'Patungan makan'}];
  S.rec=[{id:id++,type:'out',amount:350000,cat:'Rumah & tagihan',w:'Bank',note:'Internet',day:5,last:today().slice(0,7)}];
  $('bulan').value=today().slice(0,7);$('budget').value=S.budget.toLocaleString('id-ID');save();render();toast('Data contoh dimuat. Jelajahi semua menu!');confetti()}
$('demoBtn').onclick=loadDemo;
$('skipBtn').onclick=()=>{S.welcomed=true;save();render()};
(function(){const c=document.createElement('canvas');c.id='fx';c.setAttribute('aria-hidden','true');document.body.prepend(c);if(calm())return;const x=c.getContext&&c.getContext('2d');if(!x)return;
  let W,H,P=[],mx=-999,my=-999;
  const rs=()=>{W=c.width=innerWidth;H=c.height=innerHeight;P=Array.from({length:Math.min(70,Math.floor(W*H/22000))},()=>({x:Math.random()*W,y:Math.random()*H,vx:(Math.random()-.5)*.35,vy:(Math.random()-.5)*.35}))};
  rs();addEventListener('resize',rs);addEventListener('pointermove',e=>{mx=e.clientX;my=e.clientY});
  (function f(){x.clearRect(0,0,W,H);const col=getComputedStyle(document.documentElement).getPropertyValue('--acc').trim()||'#22D3EE';
    P.forEach((p,i)=>{p.x+=p.vx;p.y+=p.vy;if(p.x<0||p.x>W)p.vx*=-1;if(p.y<0||p.y>H)p.vy*=-1;
      const dm=Math.hypot(p.x-mx,p.y-my);if(dm>0&&dm<140){p.x+=(p.x-mx)/dm*.8;p.y+=(p.y-my)/dm*.8}
      x.globalAlpha=.5;x.fillStyle=col;x.beginPath();x.arc(p.x,p.y,1.6,0,6.3);x.fill();
      for(let j=i+1;j<P.length;j++){const q=P[j],d=Math.hypot(p.x-q.x,p.y-q.y);if(d<120){x.globalAlpha=(1-d/120)*.24;x.strokeStyle=col;x.beginPath();x.moveTo(p.x,p.y);x.lineTo(q.x,q.y);x.stroke()}}});
    requestAnimationFrame(f)})()})();

{const f=document.getElementById('fav'),t=new Image();t.onerror=()=>{const r=new Image();r.onload=()=>{f.href='assets/images.png'};r.onerror=()=>{if(f.dataset.fb)f.href=f.dataset.fb};r.src='assets/images.png'};t.src='assets/kantongajaib.png'}
try{const u=sessionStorage.getItem('dompetku-user'),U=getU();if(u&&U[u])enter(u,U[u].name||u)}catch(e){}

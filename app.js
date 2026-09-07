const SUPABASE_URL = 'https://qzgtjuxiqmixjriiczxm.supabase.co';
const SUPABASE_KEY = 'sb_publishable_Q_HEnAkqk9jrMOjcF2krtA_KhTEZJaA';
const sb = supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

const $ = (id)=>document.getElementById(id);
const loginView=$('loginView'), appView=$('appView');

async function login(){
  $('loginMsg').textContent='';
  const email=$('email').value.trim(), password=$('password').value;
  if(!email||!password){$('loginMsg').textContent='اكتب البريد وكلمة المرور';return}
  $('loginBtn').disabled=true;
  const {data,error}=await sb.auth.signInWithPassword({email,password});
  $('loginBtn').disabled=false;
  if(error){$('loginMsg').textContent=error.message;return}
  showApp(data.user);
}

async function logout(){ await sb.auth.signOut(); appView.classList.add('hidden'); loginView.classList.remove('hidden'); }

function showApp(user){
  loginView.classList.add('hidden'); appView.classList.remove('hidden');
  $('userLabel').textContent=user?.email||'';
  loadAll();
}

async function countTable(table, el){
  const {count,error}=await sb.from(table).select('*',{count:'exact',head:true});
  $(el).textContent=error?'!':(count??0);
}

async function renderTable(table, target, limit=30){
  const {data,error}=await sb.from(table).select('*').limit(limit);
  if(error){$(target).innerHTML=`<div class="muted">تعذر تحميل البيانات: ${escapeHtml(error.message)}</div>`;return}
  if(!data?.length){$(target).innerHTML='<div class="muted">لا توجد بيانات</div>';return}
  const cols=Object.keys(data[0]).slice(0,8);
  $(target).innerHTML=`<div class="table-wrap"><table class="data-table"><thead><tr>${cols.map(c=>`<th>${escapeHtml(c)}</th>`).join('')}</tr></thead><tbody>${data.map(r=>`<tr>${cols.map(c=>`<td>${escapeHtml(formatVal(r[c]))}</td>`).join('')}</tr>`).join('')}</tbody></table></div>`;
}

function formatVal(v){ if(v===null||v===undefined)return ''; if(typeof v==='object')return JSON.stringify(v); return String(v)}
function escapeHtml(s){return String(s).replace(/[&<>'"]/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[m]))}

async function loadAll(){
  await Promise.all([
    countTable('dresses','dressCount'),countTable('bookings','bookingCount'),countTable('customers','customerCount'),
    countTable('branches','branchCount'),countTable('preparation_tasks','prepCount'),countTable('payments','paymentCount'),
    renderTable('dresses','dressesTable'),renderTable('bookings','bookingsTable'),renderTable('customers','customersTable'),
    renderTable('branches','branchesTable'),renderTable('preparation_tasks','prepTable'),renderTable('payments','paymentsTable')
  ]);
}

$('loginBtn').addEventListener('click',login);
$('password').addEventListener('keydown',e=>{if(e.key==='Enter')login()});
$('logoutBtn').addEventListener('click',logout);
$('refreshBtn').addEventListener('click',loadAll);
document.querySelectorAll('[data-section]').forEach(btn=>btn.addEventListener('click',()=>{
  document.querySelectorAll('[data-section]').forEach(b=>b.classList.remove('active')); btn.classList.add('active');
  document.querySelectorAll('.section').forEach(s=>s.classList.remove('active-section'));
  $(btn.dataset.section).classList.add('active-section'); $('pageTitle').textContent=btn.textContent;
}));

sb.auth.getSession().then(({data})=>{ if(data.session?.user) showApp(data.session.user); });

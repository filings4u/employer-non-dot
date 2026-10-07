(()=>{'use strict';
const C=window.PORTAL_CONFIG;
const STORAGE_SCHEMA='workforce-nondot-separated-v4';
if(localStorage.getItem('s4u_workforce_storage_schema')!==STORAGE_SCHEMA){
  ['ctpa_workforce','employer_workforce','employee_workforce','driver_workforce'].forEach(code=>{
    localStorage.removeItem(`s4u_${code}_membership`);
    localStorage.removeItem(`s4u_${code}_subscription`);
  });
  localStorage.setItem('s4u_workforce_storage_schema',STORAGE_SCHEMA);
}
const sb=window.supabase.createClient(C.workforceUrl,C.workforceKey,{auth:{persistSession:true,autoRefreshToken:true,detectSessionInUrl:true}});
const FONT_KEY='s4u_employer_nondot_font_size_v2';
const FONT_DEFAULT=13,FONT_MIN=12,FONT_MAX=18;
function readFontSize(){const n=Number(localStorage.getItem(FONT_KEY));return Number.isFinite(n)?Math.min(FONT_MAX,Math.max(FONT_MIN,n)):FONT_DEFAULT}
function applyFontSize(n){const v=Math.min(FONT_MAX,Math.max(FONT_MIN,Number(n)||FONT_DEFAULT));document.documentElement.style.setProperty('--portal-font-root',v+'px');localStorage.setItem(FONT_KEY,String(v));const label=document.getElementById('fontSizeValue');if(label)label.textContent=v===FONT_DEFAULT?'Default':String(v);return v}
let portalFontSize=readFontSize();applyFontSize(portalFontSize);
const $=(s,r=document)=>r.querySelector(s), $$=(s,r=document)=>[...r.querySelectorAll(s)];
const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const pretty=v=>String(v??'—').replaceAll('_',' ').replace(/\b\w/g,x=>x.toUpperCase());
const fmt=v=>{if(!v)return'—';const d=new Date(v);return Number.isNaN(d.getTime())?String(v):new Intl.DateTimeFormat('en-US',{month:'short',day:'numeric',year:'numeric'}).format(d)};
const money=(v,c='USD')=>new Intl.NumberFormat('en-US',{style:'currency',currency:String(c||'USD')}).format(Number(v||0));
const badge=v=>`<span class="badge ${/active|complete|paid|eligible|final|negative|enabled|yes/i.test(String(v))?'good':/cancel|inactive|terminated|positive|failed|closed|archived|expired/i.test(String(v))?'bad':'warn'}">${esc(pretty(v))}</span>`;
const page=()=>location.pathname.split('/').pop()?.replace('.html','')||'dashboard';
const norm=v=>String(v||'').trim().toLowerCase().replaceAll('_','-');
const storageKey=()=>`s4u_${C.portalCode}_membership`, subKey=()=>`s4u_${C.portalCode}_subscription`;
const stored=()=>localStorage.getItem(storageKey())||'', storedSub=()=>localStorage.getItem(subKey())||'';
const cfgPage=id=>norm(id)==='person'?{id:'person',label:'Person Management',icon:'◎'}:norm(id)==='contact'?{id:'contact',label:'Contact Management',icon:'■'}:norm(id)==='program'?{id:'program',label:'Program Management',icon:'≡'}:norm(id)==='pool'?{id:'pool',label:'Pool Management',icon:'⊙'}:norm(id)==='selection'?{id:'selection',label:'Random Selection Management',icon:'✦'}:norm(id)==='testing-order'?{id:'testing-order',label:'Testing Order',icon:'◆'}:(C.pages.find(x=>norm(x.id)===norm(id))||{id,label:pretty(id),icon:'•'});
const apiName=()=>C.kind==='ctpa'?'nondot-ctpa-portal':C.kind==='employer'?'nondot-employer-portal':'workforce-employer-employee-access';
let ctx=null,data=null,NAV=[];

async function session(){const {data:{session},error}=await sb.auth.getSession();if(error)throw error;return session}
async function invoke(name,body={}){
  const s=await session();
  if(!s)throw new Error('Your session has expired. Please sign in again.');
  const payload={portal_code:C.portalCode,membership_id:stored()||undefined,subscription_id:storedSub()||undefined,...body};
  const r=await fetch(`${C.workforceUrl}/functions/v1/${name}`,{method:'POST',headers:{'Content-Type':'application/json','Authorization':`Bearer ${s.access_token}`,'apikey':C.workforceKey},body:JSON.stringify(payload)});
  const d=await r.json().catch(()=>({}));
  if(!r.ok||d.error)throw new Error(d.error||d.reason||`Request failed (${r.status}).`);
  return d;
}
async function access(){return invoke(apiName(),{action:'session_context',portal_code:C.portalCode,requested_portal_code:C.portalCode,requested_page:page()})}
async function load(){const p=page();if(p==='billing'&&C.kind!=='self')return invoke('workforce-invoice-portal',{action:'list'});if(C.kind==='employer'&&p==='company')return invoke('nondot-employer-company',{action:'workspace'});if(C.kind==='employer'&&p==='people')return invoke('nondot-employer-people',{action:'workspace'});if(C.kind==='employer'&&p==='person'){const id=new URLSearchParams(location.search).get('id');return id?invoke('nondot-employer-people',{action:'detail',id}):Promise.resolve({ok:true,employee:null,profile:null})}if(C.kind==='employer'&&p==='contact'){const id=new URLSearchParams(location.search).get('id');const d=await invoke('nondot-employer-company',{action:'workspace'});d.contact=id?(d.contacts||[]).find(x=>String(x.id)===String(id))||null:null;return d}if(C.kind==='employer'&&p==='programs')return invoke('nondot-employer-programs',{action:'workspace'});if(C.kind==='employer'&&p==='program'){const id=new URLSearchParams(location.search).get('id');return id?invoke('nondot-employer-programs',{action:'detail',id}):invoke('nondot-employer-programs',{action:'new'})}if(C.kind==='employer'&&p==='pools')return invoke('nondot-employer-pools',{action:'workspace'});if(C.kind==='employer'&&p==='pool'){const id=new URLSearchParams(location.search).get('id');return id?invoke('nondot-employer-pools',{action:'detail',id}):invoke('nondot-employer-pools',{action:'new'})}if(C.kind==='employer'&&p==='selections')return invoke('nondot-employer-selections',{action:'workspace'});if(C.kind==='employer'&&p==='selection'){const id=new URLSearchParams(location.search).get('id');return id?invoke('nondot-employer-selections',{action:'detail',id}):invoke('nondot-employer-selections',{action:'new'})}if(C.kind==='employer'&&p==='testing')return invoke('nondot-employer-testing',{action:'workspace'});if(C.kind==='employer'&&p==='testing-order'){const id=new URLSearchParams(location.search).get('id');return id?invoke('nondot-employer-testing',{action:'detail',id}):invoke('nondot-employer-testing',{action:'new'})}if(C.kind==='employer'&&p==='results')return invoke('nondot-employer-results',{action:'workspace'});return invoke(apiName(),{action:'workspace',page:p})}

function displayName(c){
  return String(c?.organization?.legal_name||c?.employer?.legal_name||c?.membership?.organization_name||c?.organization_name||c?.workspace?.organization_name||c?.plan?.name||c?.subscription?.plan_name||C.label||'screenings4u Workforce');
}
function navRows(c){
  const allowed=Array.isArray(c?.navigation)&&c.navigation.length?c.navigation:C.pages;
  return allowed.map(n=>{const id=norm(n.id);const local=cfgPage(id);return {...n,id,label:local.label||n.label||pretty(id),icon:local.icon||n.icon||'•',href:n.href||`/${id}.html`}});
}
function shell(c){
  const current=norm(page());
  document.body.dataset.portalPage=current;
  NAV=navRows(c);
  const planLabel=displayName(c);
  const links=NAV.map(x=>{const active=current===norm(x.id)||(current==='person'&&norm(x.id)==='people')||(current==='program'&&norm(x.id)==='programs')||(current==='pool'&&norm(x.id)==='pools')||(current==='selection'&&norm(x.id)==='selections')||(current==='testing-order'&&norm(x.id)==='testing');return `<a href="${esc(x.href)}" class="${active?'active':''}"${active?' aria-current="page"':''}><span class="ico">${esc(x.icon||'•')}</span><span>${esc(x.label||pretty(x.id))}</span></a>`}).join('');
  document.title=`${cfgPage(current).label} | ${planLabel}`;
  document.body.className='loading';
  document.body.innerHTML=`<div class="app">
    <aside class="side" id="side">
      <div class="brand"><img class="brand-logo brand-logo-ready" src="/images/workforce-non-dot.png" alt="screenings4u"></div>
      <nav class="nav"><div class="nav-title">${esc(planLabel)}</div>${links}</nav>
      <div class="side-foot"><div style="font-size:9px;color:#9fb3c7">Portal</div><div style="font-size:11px;font-weight:800;color:#fff;margin-top:3px">${esc(C.domain)}</div></div>
    </aside>
    <main class="main">
      <header class="top">
        <div class="top-left"><button class="menu" id="menu" type="button" aria-label="Open navigation" aria-expanded="false" aria-controls="mobileNav"><span class="menu-bars" aria-hidden="true"><span></span><span></span><span></span></span></button><span class="crumb">${esc(planLabel)} / ${esc(cfgPage(current).label)}</span></div>
        <div class="top-right"><div class="font-sizer" role="group" aria-label="Page font size"><button type="button" id="fontDown" aria-label="Decrease font size">A−</button><button type="button" class="font-reset" id="fontSizeValue" aria-label="Reset font size">${portalFontSize===FONT_DEFAULT?'Default':portalFontSize}</button><button type="button" id="fontUp" aria-label="Increase font size">A+</button></div><span class="pill">${esc(C.kind==='self'?'Self Service':'Management')}</span><span class="pill">NON-DOT</span><button class="signout" id="logout" type="button">Sign out</button></div>
      </header>
      <section class="mobile-nav" id="mobileNav" aria-hidden="true" aria-label="Portal navigation"><div class="mobile-nav-inner"><div class="mobile-nav-head"><div><span>Portal navigation</span><strong>${esc(planLabel)}</strong></div><span class="mobile-nav-current">${esc(cfgPage(current).label)}</span></div><nav class="mobile-nav-links">${links}</nav><div class="mobile-nav-foot"><span>${esc(C.domain)}</span><small>Select a page to close this menu.</small></div></div></section>
      <div class="content"><div id="toast"></div><section class="hero"><span class="hero-kicker">${esc(planLabel)}</span><h1>${esc(cfgPage(current).label)}</h1><p id="subtitle">Loading NON-DOT Workforce workspace.</p><div class="hero-actions" id="actions"></div></section><section class="section" id="content"><div class="panel"><div class="loading-msg">Loading…</div></div></section></div>
    </main>
  </div>`;
  const menuBtn=$('#menu'),mobileNav=$('#mobileNav');
  const setMobileNav=open=>{
    const isMobile=window.matchMedia('(max-width: 820px)').matches;
    const next=!!open&&isMobile;
    mobileNav?.classList.toggle('open',next);
    document.body.classList.toggle('mobile-nav-open',next);
    menuBtn?.classList.toggle('open',next);
    menuBtn?.setAttribute('aria-expanded',String(next));
    menuBtn?.setAttribute('aria-label',next?'Close navigation':'Open navigation');
    mobileNav?.setAttribute('aria-hidden',String(!next));
  };
  if(menuBtn&&mobileNav){
    menuBtn.onclick=()=>setMobileNav(!mobileNav.classList.contains('open'));
    mobileNav.addEventListener('click',e=>{if(e.target.closest('a'))setMobileNav(false)});
    window.addEventListener('resize',()=>{if(window.innerWidth>820)setMobileNav(false)},{passive:true});
    document.addEventListener('keydown',e=>{if(e.key==='Escape')setMobileNav(false)});
  }
  const fontDown=$('#fontDown'),fontUp=$('#fontUp'),fontReset=$('#fontSizeValue');
  if(fontDown)fontDown.onclick=()=>{portalFontSize=applyFontSize(portalFontSize-1)};
  if(fontUp)fontUp.onclick=()=>{portalFontSize=applyFontSize(portalFontSize+1)};
  if(fontReset)fontReset.onclick=()=>{portalFontSize=applyFontSize(FONT_DEFAULT)};
  $('#logout').onclick=async()=>{localStorage.removeItem(storageKey());localStorage.removeItem(subKey());await sb.auth.signOut();location.replace('/login.html')};
}

function notice(message,type='bad'){
  const t=$('#toast');if(!t)return;
  t.innerHTML=`<div class="notice" style="border-left:4px solid ${type==='good'?'#17764a':'#ef6c00'};margin-bottom:14px"><strong>${type==='good'?'Success':'Notice'}</strong><div style="margin-top:4px">${esc(message)}</div></div>`;
  setTimeout(()=>{if(t)t.innerHTML=''},5500);
}
function modalShell(title,body,buttons='',wide=false){const b=document.createElement('div');b.className='modal-backdrop';b.innerHTML=`<div class="modal${wide?' modal-wide':''}"><div class="brand-modal-head"><img src="/images/workforce-non-dot.png" alt="Workforce NON DOT"><div><small>Workforce NON DOT</small><h2>${esc(title)}</h2></div></div>${body}<div class="modal-actions">${buttons}</div></div>`;document.body.appendChild(b);return b}
function confirmBox(title,message){return new Promise(resolve=>{const b=modalShell(title,`<p style="line-height:1.6;color:#52657a">${esc(message)}</p>`,`<button class="btn ghost" data-no type="button">Cancel</button><button class="btn primary" data-yes type="button">Continue</button>`);b.querySelector('[data-no]').onclick=()=>{b.remove();resolve(false)};b.querySelector('[data-yes]').onclick=()=>{b.remove();resolve(true)}})}
function fieldHtml(f,v={}){
  const value=v[f.name]??f.value??'';
  if(f.type==='select')return `<div class="field ${f.full?'full':''}"><label>${esc(f.label)}</label><select name="${esc(f.name)}" ${f.required?'required':''}>${(f.options||[]).map(o=>`<option value="${esc(o.value)}" ${String(o.value)===String(value)?'selected':''}>${esc(o.label)}</option>`).join('')}</select></div>`;
  if(f.type==='textarea')return `<div class="field ${f.full?'full':''}"><label>${esc(f.label)}</label><textarea name="${esc(f.name)}" rows="4" ${f.required?'required':''}>${esc(value)}</textarea></div>`;
  return `<div class="field ${f.full?'full':''}"><label>${esc(f.label)}</label><input type="${esc(f.type||'text')}" name="${esc(f.name)}" value="${esc(value)}" ${f.min!==undefined?`min="${esc(f.min)}"`:''} ${f.max!==undefined?`max="${esc(f.max)}"`:''} ${f.step!==undefined?`step="${esc(f.step)}"`:''} ${f.required?'required':''}></div>`;
}
function formModal(title,fields,initial,onSave){
  const b=document.createElement('div');b.className='modal-backdrop';
  b.innerHTML=`<form class="modal"><h2>${esc(title)}</h2><div class="modal-grid">${fields.map(f=>fieldHtml(f,initial||{})).join('')}</div><div class="modal-actions"><button type="button" class="btn ghost" data-cancel>Cancel</button><button type="submit" class="btn primary">Save</button></div></form>`;
  document.body.appendChild(b);b.querySelector('[data-cancel]').onclick=()=>b.remove();
  b.querySelector('form').onsubmit=async e=>{e.preventDefault();const vals=Object.fromEntries(new FormData(e.currentTarget).entries());try{await onSave(vals);b.remove();notice('Saved successfully.','good');await refresh()}catch(err){notice(err.message||String(err))}};
}
function addAction(label,fn,kind='primary'){const b=document.createElement('button');b.className=`btn ${kind}`;b.type='button';b.textContent=label;b.onclick=fn;$('#actions')?.appendChild(b)}
function read(o,keys){for(const k of keys){let v=o;for(const p of k.split('.'))v=v?.[p];if(v!==undefined&&v!==null&&v!=='')return v}return'—'}
const personName=r=>[r?.first_name,r?.middle_name,r?.last_name].filter(Boolean).join(' ')||r?.display_name||'—';
const percent=v=>v===null||v===undefined||v===''?'—':`${Number(v)}%`;

const COLS={
  employers:[['Employer',['legal_name','workforce_display_name']],['Status',['status'],v=>badge(v)],['Primary Contact',['primary_contact_email']],['State',['state']]],
  employees:[['Name',['first_name'],(v,r)=>esc(personName(r))],['Type',['workforce_worker_type'],v=>badge(v==='driver'?'NON-DOT Driver':'Employee')],['Employee #',['employee_number']],['Department',['department']],['Job Title',['job_title']],['Contact',['email'],(v,r)=>`<strong>${esc(r.email||'—')}</strong><br><small>${esc(r.mobile||'—')}</small>`],['Safety Sensitive',['safety_sensitive'],v=>badge(v===true?'yes':v===false?'no':'—')],['Status',['employment_status'],v=>badge(v)]],
  programs:[['Program',['name']],['Workforce',['enrolled_count'],v=>`${esc(v||0)} enrolled`],['Panel',['testing_panel']],['Method',['testing_method']],['Schedule',['testing_frequency'],v=>pretty(v)],['Drug Rate',['drug_random_rate'],v=>percent(v)],['Alcohol Rate',['alcohol_random_rate'],v=>percent(v)],['Effective',['effective_date'],v=>fmt(v)],['Status',['status'],v=>badge(v)]],
  pools:[['Pool',['name']],['Type',['pool_type']],['Program',['program_id']],['Schedule',['selection_schedule']],['Drug Rate',['drug_testing_rate'],v=>percent(v)],['Alcohol Rate',['alcohol_testing_rate'],v=>percent(v)],['Effective',['effective_date'],v=>fmt(v)],['Status',['status'],v=>badge(v)]],
  selections:[['Date',['selection_date','selected_at'],v=>fmt(v)],['Type',['selection_type']],['Population',['population_size']],['Selected',['selected_count','drug_selection_count','drug_selected']],['Status',['status'],v=>badge(v)]],
  testing:[['Order',['order_number']],['Person',['employee.first_name'],(_,r)=>esc(personName(r.employee||{}))],['Reason',['reason'],v=>pretty(v)],['Service',['service_name','testing_panel']],['Program',['program.name','program_id']],['Status',['status'],v=>badge(v)],['Created',['created_at'],v=>fmt(v)]],
  results:[['Order',['testing_orders.order_number','order_number']],['Result',['final_status','verified_result','result'],v=>badge(v)],['Date',['result_date','finalized_at','created_at'],v=>fmt(v)],['Status',['notification_status','status'],v=>badge(v)]],
  compliance:[['Case',['case_number','id']],['Event',['event_type','case_type']],['Priority',['priority'],v=>badge(v)],['Opened',['opened_at','created_at'],v=>fmt(v)],['Status',['status'],v=>badge(v)]],
  documents:[['File',['file_name','title']],['Type',['document_type']],['Uploaded',['uploaded_at','created_at'],v=>fmt(v)],['Expires',['expires_at'],v=>fmt(v)],['Status',['status','access_level'],v=>badge(v)]],
  notifications:[['Subject',['subject','event_type']],['Channel',['channel']],['Status',['status'],v=>badge(v)],['Queued',['queued_at','created_at'],v=>fmt(v)]],
  invoices:[['Invoice',['invoice_number']],['Status',['status'],v=>badge(v)],['Total',['total'],v=>money(v)],['Paid',['amount_paid'],v=>money(v)],['Due',['amount_due'],v=>money(v)],['Issued',['issued_at','created_at'],v=>fmt(v)]],
  members:[['User',['profiles.display_name','profiles.first_name','user_id']],['Role',['roles.name','roles.code','role_name']],['Status',['status'],v=>badge(v)],['Primary',['is_primary'],v=>badge(v===true?'yes':v===false?'no':'—')]],
  locations:[['Location',['name']],['Type',['location_type']],['City',['city']],['State',['state']],['Primary',['is_primary'],v=>badge(v===true?'yes':v===false?'no':'—')],['Status',['status'],v=>badge(v)]],
  integrations:[['Integration',['provider','name','integration_type']],['Status',['status'],v=>badge(v)],['Updated',['updated_at'],v=>fmt(v)]],
  audit:[['Event',['event_type','action']],['Object',['object_type','entity_type']],['Actor',['actor_email','actor_user_id','user_id']],['Date',['event_at','created_at'],v=>fmt(v)]],
  contacts:[['Contact',['full_name','first_name'],(v,r)=>esc(r?.full_name||[r?.first_name,r?.last_name].filter(Boolean).join(' ')||'—')],['Type',['contact_type']],['Title',['title']],['Email',['email']],['Phone',['phone']],['Status',['status'],v=>badge(v)]],
  consents:[['Document',['title','form_snapshot.title','form_type']],['Type',['form_type']],['Status',['status'],v=>badge(v)],['Sent',['sent_at','created_at'],v=>fmt(v)],['Completed',['completed_at'],v=>fmt(v)]],
  training:[['Training',['training_title','title']],['Provider',['provider']],['Status',['status'],v=>badge(v)],['Completed',['completed_at'],v=>fmt(v)],['Expires',['expires_at'],v=>fmt(v)]],
  credentials:[['Credential',['credential_type']],['Number',['credential_number']],['State',['issuing_state']],['Expires',['expires_at'],v=>fmt(v)],['Status',['status'],v=>badge(v)]]
};
function table(title,rows,cols,actions){
  rows=Array.isArray(rows)?rows:[];
  const body=rows.length?rows.map(r=>`<tr>${cols.map(c=>{const v=read(r,c[1]);return `<td>${c[2]?c[2](v,r):esc(v)}</td>`}).join('')}${actions?`<td class="row-actions">${actions(r)}</td>`:''}</tr>`).join(''):`<tr><td colspan="${cols.length+(actions?1:0)}"><div class="empty">No records available.</div></td></tr>`;
  return `<div class="panel"><div class="panel-head"><div><h2>${esc(title)}</h2></div><span class="badge">${rows.length} record${rows.length===1?'':'s'}</span></div><div class="table-wrap"><table><thead><tr>${cols.map(c=>`<th>${esc(c[0])}</th>`).join('')}${actions?'<th>Actions</th>':''}</tr></thead><tbody>${body}</tbody></table></div></div>`;
}
function metrics(items){return `<div class="metrics">${items.map(([a,b,c])=>`<div class="metric"><small>${esc(a)}</small><strong>${esc(b)}</strong><span>${esc(c||'')}</span></div>`).join('')}</div>`}
function quickCards(){
  const rows=NAV.filter(x=>norm(x.id)!=='dashboard').slice(0,6);
  if(!rows.length)return'';
  return `<div class="panel" style="margin-top:14px"><div class="panel-head"><div><h2>Quick Actions</h2><p>Open another area of your NON-DOT Workforce portal.</p></div></div><div class="cards" style="padding:14px">${rows.map(x=>`<a class="card" href="${esc(x.href)}"><strong>${esc(x.label)}</strong><span>${esc(cardCopy(norm(x.id)))}</span></a>`).join('')}</div></div>`;
}
function cardCopy(id){const m={employers:'Manage customer Employer accounts.',company:'Review company and contact information.',people:'Manage Employees and NON-DOT Drivers.',programs:'Create and maintain NON-DOT testing programs.',pools:'Manage NON-DOT random testing pools.',selections:'Review NON-DOT random selection events.',testing:'Create and track NON-DOT testing orders.',results:'Review testing results available to this account.',compliance:'Track company-policy compliance cases and tasks.',documents:'Review Workforce program documents.',consents:'Manage consents and acknowledgments.',reports:'Review available Workforce reporting.',notifications:'Review portal notifications.',billing:'Review billing and invoices.',team:'Review users and roles.',locations:'Manage company locations.',branding:'Review portal branding.',integrations:'Review enabled integrations.','audit-history':'Review account activity history.',profile:'Review your Workforce profile.','my-testing':'Review testing assigned to you.','my-results':'Review results available to you.',training:'Review your training records.',credentials:'Review your credentials.'};return m[id]||'Open this portal area.'}
function rowButtons(r,type){if(C.kind==='self')return'';if(type==='employee'&&C.kind==='employer')return `<a class="btn primary" style="padding:6px 9px;text-decoration:none" href="/person.html?id=${encodeURIComponent(r.id)}">View / Manage</a>`;if(type==='contact'&&C.kind==='employer')return `<a class="btn primary" style="padding:6px 9px;text-decoration:none" href="/contact.html?id=${encodeURIComponent(r.id)}">View / Manage</a>`;if(type==='program'&&C.kind==='employer')return `<a class="btn primary" style="padding:6px 9px;text-decoration:none" href="/program.html?id=${encodeURIComponent(r.id)}">View / Manage</a>`;if(type==='pool'&&C.kind==='employer')return `<a class="btn primary" style="padding:6px 9px;text-decoration:none" href="/pool.html?id=${encodeURIComponent(r.id)}">View / Manage</a>`;return `<button class="btn ghost" style="padding:6px 9px" data-edit="${type}" data-id="${esc(r.id)}" type="button">Edit</button><button class="btn ghost" style="padding:6px 9px" data-delete="${type}" data-id="${esc(r.id)}" type="button">Delete</button>`}

const employerFields=[
  {name:'legal_name',label:'Legal company name',required:true},{name:'dba_name',label:'DBA name'},
  {name:'primary_contact_email',label:'Primary contact email',type:'email'},{name:'phone',label:'Phone'},
  {name:'state',label:'State'}
];
const employeeFields=(employers=[])=>[
  ...(C.kind==='ctpa'?[{name:'employer_id',label:'Employer',type:'select',required:true,options:employers.map(x=>({value:x.id,label:x.legal_name||x.workforce_display_name||x.id}))}]:[]),
  {name:'first_name',label:'First name',required:true},{name:'last_name',label:'Last name',required:true},
  {name:'employee_number',label:'Employee number'},{name:'email',label:'Email',type:'email'},
  {name:'mobile',label:'Mobile'},{name:'job_title',label:'Job title'},
  {name:'workforce_worker_type',label:'Worker type',type:'select',required:true,options:[{value:'employee',label:'Employee'},{value:'driver',label:'NON-DOT Driver'}]},
  {name:'safety_sensitive',label:'Safety-sensitive position',type:'select',options:[{value:'false',label:'No'},{value:'true',label:'Yes'}]},
  {name:'employment_status',label:'Employment status',type:'select',options:[{value:'active',label:'Active'},{value:'inactive',label:'Inactive'},{value:'terminated',label:'Terminated'}]}
];
const programFields=(employers=[])=>[
  ...(C.kind==='ctpa'?[{name:'employer_id',label:'Employer',type:'select',required:true,options:employers.map(x=>({value:x.id,label:x.legal_name||x.id}))}]:[]),
  {name:'name',label:'Program name',required:true},
  {name:'regulatory_category',label:'Program category',type:'select',options:[{value:'workplace_testing',label:'Workplace Testing'},{value:'drug_free_workplace',label:'Drug-Free Workplace'},{value:'safety_program',label:'Safety Program'},{value:'company_policy',label:'Company Policy'}]},
  {name:'testing_panel',label:'Testing panel'},
  {name:'testing_method',label:'Testing method',type:'select',options:[{value:'urine',label:'Urine'},{value:'oral_fluid',label:'Oral Fluid'},{value:'hair',label:'Hair'},{value:'other',label:'Other'}]},
  {name:'drug_random_rate',label:'Drug random rate (%)',type:'number',min:0,max:100,step:'0.01'},
  {name:'alcohol_random_rate',label:'Alcohol random rate (%)',type:'number',min:0,max:100,step:'0.01'},
  {name:'testing_frequency',label:'Testing frequency',type:'select',options:[{value:'monthly',label:'Monthly'},{value:'quarterly',label:'Quarterly'},{value:'semiannual',label:'Semiannual'},{value:'annual',label:'Annual'},{value:'as_needed',label:'As Needed'}]},
  {name:'effective_date',label:'Effective date',type:'date'},
  {name:'status',label:'Status',type:'select',options:[{value:'active',label:'Active'},{value:'inactive',label:'Inactive'}]}
];
const poolFields=(employers=[],programs=[])=>[
  ...(C.kind==='ctpa'?[{name:'employer_id',label:'Client Employer (optional for consortium)',type:'select',options:[{value:'',label:'C/TPA Consortium Pool'},...employers.map(x=>({value:x.id,label:x.legal_name||x.id}))]}]:[]),
  {name:'name',label:'Pool name',required:true},
  ...(C.kind==='ctpa'?[{name:'pool_type',label:'Pool type',type:'select',options:[{value:'consortium',label:'C/TPA Consortium'},{value:'employer',label:'Employer Pool'}]}]:[]),
  {name:'program_id',label:'NON-DOT program',type:'select',options:[{value:'',label:'No program selected'},...programs.map(x=>({value:x.id,label:x.name||x.id}))]},
  {name:'drug_testing_rate',label:'Drug testing rate (%)',type:'number',min:0,max:100,step:'0.01'},
  {name:'alcohol_testing_rate',label:'Alcohol testing rate (%)',type:'number',min:0,max:100,step:'0.01'},
  {name:'selection_schedule',label:'Selection schedule',type:'select',options:[{value:'monthly',label:'Monthly'},{value:'quarterly',label:'Quarterly'},{value:'semiannual',label:'Semiannual'},{value:'annual',label:'Annual'}]},
  {name:'effective_date',label:'Effective date',type:'date'},
  {name:'status',label:'Status',type:'select',options:[{value:'active',label:'Active'},{value:'inactive',label:'Inactive'}]}
];
const locationFields=[{name:'name',label:'Location name',required:true},{name:'location_type',label:'Location type'},{name:'address_line1',label:'Address'},{name:'city',label:'City'},{name:'state',label:'State'},{name:'postal_code',label:'ZIP / Postal code'},{name:'phone',label:'Phone'},{name:'timezone',label:'Timezone'},{name:'status',label:'Status',type:'select',options:[{value:'active',label:'Active'},{value:'inactive',label:'Inactive'}]}];
const contactFields=[{name:'contact_type',label:'Contact type',type:'select',options:[{value:'primary',label:'Primary'},{value:'staff',label:'Staff'},{value:'hr',label:'HR'},{value:'safety',label:'Safety'},{value:'billing',label:'Billing'},{value:'other',label:'Other'}]},{name:'first_name',label:'First name'},{name:'last_name',label:'Last name'},{name:'title',label:'Title'},{name:'email',label:'Email',type:'email'},{name:'phone',label:'Phone'},{name:'status',label:'Status',type:'select',options:[{value:'active',label:'Active'},{value:'inactive',label:'Inactive'}]}];

function findRow(type,id){const map={employer:data?.employers,employee:data?.employees,program:data?.programs,pool:data?.pools,location:data?.locations,contact:data?.contacts};return (map[type]||[]).find(x=>String(x.id)===String(id))||{}}
function edit(type,id){
  const row=findRow(type,id);
  const action=`save_${type}`;
  const fields=type==='employer'?employerFields:type==='employee'?employeeFields(data?.employers||[]):type==='program'?programFields(data?.employers||[]):type==='pool'?poolFields(data?.employers||[],data?.programs||[]):type==='location'?locationFields:contactFields;
  const initial={...row,safety_sensitive:String(!!row.safety_sensitive)};
  formModal(`Edit ${type==='employee'?'Employee / NON-DOT Driver':pretty(type)}`,fields,initial,async v=>type==='contact'?invoke('nondot-employer-company',{action:'save_contact',contact:{...row,...v,id:row.id}}):invoke(apiName(),{action,[type]:{...row,...v,id:row.id,safety_sensitive:v.safety_sensitive==='true'}}));
}
async function remove(type,id){
  const ok=await confirmBox(`Delete ${pretty(type)}`,`Remove this ${type} from active NON-DOT Workforce records? Historical activity is retained where the system requires it.`);if(!ok)return;
  try{if(type==='contact')await invoke('nondot-employer-company',{action:'delete_contact',id});else await invoke(apiName(),{action:`delete_${type}`,id});notice('Record removed.','good');await refresh()}catch(err){notice(err.message||String(err))}
}

function invoiceButtons(r){return `<button class="btn ghost" style="padding:6px 9px" data-invoice-view="${esc(r.id)}" type="button">View</button>${Number(r.amount_due||0)>0&&!['paid','void','refunded'].includes(String(r.status||'').toLowerCase())?`<button class="btn primary" style="padding:6px 9px" data-invoice-pay="${esc(r.id)}" type="button">Pay</button>`:''}`}
async function viewInvoice(id){
  try{
    const d=await invoke('workforce-invoice-portal',{action:'detail',invoice_id:id});const i=d.invoice||{};const items=i.invoice_items||[];
    const body=`${metrics([['Invoice',i.invoice_number||'—'],['Status',pretty(i.status||'—')],['Total',money(i.total||0,i.currency)],['Amount Due',money(i.amount_due||0,i.currency)]])}<div class="panel" style="margin-top:14px"><div class="panel-head"><h3>Invoice Items</h3></div><div class="table-wrap"><table><thead><tr><th>Description</th><th>Qty</th><th>Amount</th></tr></thead><tbody>${items.length?items.map(x=>`<tr><td>${esc(x.description||x.name||'Service')}</td><td>${esc(x.quantity??1)}</td><td>${esc(money(x.amount||x.total||0,i.currency))}</td></tr>`).join(''):'<tr><td colspan="3"><div class="empty">No item detail available.</div></td></tr>'}</tbody></table></div></div>`;
    const b=modalShell(`Invoice ${i.invoice_number||''}`,body,'<button class="btn ghost" data-close type="button">Close</button>',true);b.querySelector('[data-close]').onclick=()=>b.remove();
  }catch(err){notice(err.message||String(err))}
}
async function payInvoice(id){try{const d=await invoke('workforce-invoice-portal',{action:'payment_link',invoice_id:id});if(!d.checkout_url)throw new Error('No payment link is available for this invoice.');location.href=d.checkout_url}catch(err){notice(err.message||String(err))}}

function bindRows(){
  $$('[data-edit]').forEach(b=>b.onclick=()=>edit(b.dataset.edit,b.dataset.id));
  $$('[data-delete]').forEach(b=>b.onclick=()=>remove(b.dataset.delete,b.dataset.id));
  $$('[data-invite]').forEach(b=>b.onclick=async()=>{try{const d=await invoke(apiName(),{action:'invite_employee',employee_id:b.dataset.invite});notice(`Self-service invitation sent${d.portal_code?` to ${pretty(d.portal_code)}`:''}.`,'good')}catch(err){notice(err.message||String(err))}});
  $$('[data-invoice-view]').forEach(b=>b.onclick=()=>viewInvoice(b.dataset.invoiceView));
  $$('[data-invoice-pay]').forEach(b=>b.onclick=()=>payInvoice(b.dataset.invoicePay));
  $$('[data-result-view]').forEach(b=>b.onclick=()=>viewResult(b.dataset.resultView));
  $$('[data-result-download]').forEach(b=>b.onclick=()=>downloadResultPdf(b.dataset.resultDownload));
}

function selfNotice(){return `<div class="notice" style="margin-top:14px"><strong>NON-DOT Workforce self-service</strong><div style="margin-top:4px">Your Employer manages these records. You can review your information and complete assigned Consents & Acknowledgments from this portal.</div></div>`}
function renderSelf(p){
  const employee=data?.employee||{};
  if(p==='dashboard')return `${metrics([['Name',personName(employee),'Workforce profile'],['Worker Type',employee.workforce_worker_type==='driver'?'NON-DOT Driver':'Employee','NON-DOT Workforce'],['Employee #',employee.employee_number||'—','Employer-assigned identifier'],['Status',pretty(employee.employment_status||'—'),'Employment status']])}${quickCards()}${selfNotice()}`;
  if(p==='profile')return `<div class="panel"><div class="panel-head"><div><h2>My Profile</h2><p>NON-DOT Workforce employment information.</p></div></div><div style="padding:16px">${metrics([['Name',personName(employee)],['Employee #',employee.employee_number||'—'],['Worker Type',employee.workforce_worker_type==='driver'?'NON-DOT Driver':'Employee'],['Status',pretty(employee.employment_status||'—')]])}${selfNotice()}</div></div>`;
  if(p==='my-testing')return table('My NON-DOT Testing',data.testing_orders||[],COLS.testing);
  if(p==='my-results')return table('My NON-DOT Results',data.results||[],COLS.results);
  if(p==='documents')return table('My Documents',data.documents||[],COLS.documents);
  if(p==='training')return table('Training Records',data.training||[],COLS.training);
  if(p==='credentials')return table('My Credentials',data.credentials||[],COLS.credentials);
  if(p==='consents')return table('Consents & Acknowledgments',data.consent_assignments||[],COLS.consents,r=>['pending','viewed'].includes(String(r.status))?`<button class="btn primary" style="padding:6px 9px" data-consent="${esc(r.id)}" type="button">Complete</button>`:'');
  return '<div class="panel"><div class="empty">No records available.</div></div>';
}
function renderMgmt(p){
  if(p==='dashboard'){
    const top=C.kind==='ctpa'?
      [['Client Employers',(data.employers||[]).length,'Managed Employer accounts'],['People',(data.employees||[]).length,'Employees + NON-DOT Drivers'],['NON-DOT Programs',(data.programs||[]).length,'Company-policy programs'],['Testing Orders',(data.testing_orders||[]).length,'NON-DOT testing activity']]:
      [['People',(data.employees||[]).length,'Employees + NON-DOT Drivers'],['NON-DOT Programs',(data.programs||[]).length,'Company-policy programs'],['Testing Orders',(data.testing_orders||[]).length,'NON-DOT testing activity'],['Plan',ctx?.plan?.name||ctx?.subscription?.plan_name||data?.plan?.name||data?.subscription?.workforce_plans?.name||data?.subscription?.plan_name||'—','Workforce subscription']];
    return `${metrics(top)}${quickCards()}`;
  }
  if(p==='employers')return table('Client Employers',data.employers||[],COLS.employers,r=>rowButtons(r,'employer'));
  if(p==='contact')return renderContact();
  if(p==='people')return `${metrics([['People',(data.employees||[]).length,'Employees + NON-DOT Drivers'],['Employees',(data.employees||[]).filter(x=>x.workforce_worker_type!=='driver').length,'Employee records'],['NON-DOT Drivers',(data.employees||[]).filter(x=>x.workforce_worker_type==='driver').length,'Driver records'],['Active',(data.employees||[]).filter(x=>x.employment_status==='active').length,'Currently active']])}<div style="height:14px"></div>${table('People',data.employees||[],COLS.employees,r=>rowButtons(r,'employee'))}`;if(p==='person')return renderPerson();
  if(p==='programs')return `${metrics([['Programs',(data.programs||[]).length,'Random testing programs'],['Active',(data.programs||[]).filter(x=>x.status==='active').length,'Currently active'],['Enrolled',(data.programs||[]).reduce((n,x)=>n+Number(x.enrolled_count||0),0),'Program enrollments'],['Surface','NON-DOT','Company policy']])}<div style="height:14px"></div>${table('Random Testing Programs',data.programs||[],COLS.programs,r=>rowButtons(r,'program'))}`;if(p==='program')return renderProgram();
  if(p==='pools')return table('NON-DOT Random Testing Pools',data.pools||[],[['Pool',['name']],['Members',['member_count']],['Program',['program.name','program_id']],['Schedule',['selection_schedule']],['Drug Rate',['drug_testing_rate'],v=>percent(v)],['Alcohol Rate',['alcohol_testing_rate'],v=>percent(v)],['Effective',['effective_date'],v=>fmt(v)],['Status',['status'],v=>badge(v)]],r=>rowButtons(r,'pool'));if(p==='pool')return renderPool();
  if(p==='selections')return renderSelectionsIndex();if(p==='selection')return renderSelection();
  if(p==='testing')return table('NON-DOT Testing Orders',data.testing_orders||[],COLS.testing,r=>`<a class="btn primary" style="padding:6px 9px;text-decoration:none" href="/testing-order.html?id=${encodeURIComponent(r.id)}">View Order</a>`);if(p==='testing-order')return renderTestingOrder();
  if(p==='results')return renderResultsIndex();
  if(p==='compliance')return `${table('NON-DOT Compliance Cases',data.cases||[],COLS.compliance)}${(data.tasks||[]).length?table('Compliance Tasks',data.tasks||[],[['Task',['title','task_type']],['Due',['due_at'],v=>fmt(v)],['Status',['status'],v=>badge(v)]]):''}`;
  if(p==='documents')return table('Workforce Documents',data.documents||[],COLS.documents);
  if(p==='notifications')return table('Notifications',data.notifications||[],COLS.notifications);
  if(p==='team')return table('Users & Roles',data.members||[],COLS.members);
  if(p==='locations')return table('Locations',data.locations||[],COLS.locations,r=>C.kind==='employer'?rowButtons(r,'location'):'');
  if(p==='integrations')return table('Integrations',data.integrations||[],COLS.integrations);
  if(p==='audit-history')return table('Audit History',data.audit_events||[],COLS.audit);
  if(p==='consents'){
    const forms=data.forms||[],assignments=data.assignments||[];
    return `${table('Consent & Acknowledgment Forms',forms,COLS.consents)}${assignments.length?`<div style="height:14px"></div>${table('Assignments',assignments,COLS.consents)}`:''}`;
  }
  if(p==='reports')return `<div class="panel"><div class="panel-head"><div><h2>NON-DOT Workforce Reports</h2><p>Reporting availability follows your selected Workforce plan and entitlements.</p></div></div><div style="padding:16px">${metrics([['Plan',ctx?.subscription?.plan_name||data?.subscription?.plan_name||'—','Current subscription'],['Business Surface','NON-DOT','Workforce'],['Portal',C.kind==='ctpa'?'C/TPA':'Employer','Management access'],['Status',pretty(ctx?.subscription?.status||data?.subscription?.status||'active'),'Subscription status']])}<div class="notice" style="margin-top:14px">This page is intentionally NON-DOT. DOT MIS and agency-specific reporting do not appear in the Workforce portal.</div></div></div>`;
  if(p==='billing')return `${metrics([['Invoices',(data.invoices||[]).length,'Sent invoices'],['Outstanding',(data.outstanding||[]).length,'Balances due'],['Paid / Closed',(data.history||[]).length,'Invoice history'],['Surface','NON-DOT','Workforce billing']])}<div style="height:14px"></div>${table('Invoices',data.invoices||[],COLS.invoices,invoiceButtons)}`;
  if(p==='branding')return `<div class="panel"><div class="panel-head"><div><h2>Portal Branding</h2><p>Branding used for your Workforce experience.</p></div></div><div style="padding:16px">${metrics([['Portal Name',data.branding?.portal_name||'screenings4u Workforce'],['Primary Color',data.branding?.primary_color||'Default'],['Accent Color',data.branding?.accent_color||'Default'],['Custom Domain',data.branding?.custom_domain||'Not configured']])}</div></div>`;
  if(p==='company')return `<div class="panel"><div class="panel-head"><div><h2>${esc(data.employer?.legal_name||ctx?.membership?.organization_name||'Company')}</h2><p>NON-DOT Workforce company profile.</p></div></div><div style="padding:16px">${metrics([['Status',pretty(data.employer?.status||'active')],['State',data.employer?.state||'—'],['Phone',data.employer?.phone||'—'],['Plan',ctx?.subscription?.plan_name||'—']])}</div></div><div style="height:14px"></div>${table('Company Contacts',data.contacts||[],COLS.contacts,r=>rowButtons(r,'contact'))}`;
  return '<div class="panel"><div class="empty">No records available.</div></div>';
}

function renderProgram(){
  const pr=data?.program||{},cfg=pr.agency_configuration||{},selected=new Set(data?.enrolled_employee_ids||[]),workers=data?.employees||[];
  const v={regulatory_category:'workplace_testing',testing_panel:'5-panel',testing_method:'urine',drug_random_rate:25,alcohol_random_rate:10,testing_frequency:'quarterly',status:'active',effective_date:new Date().toISOString().slice(0,10),random_selection_method:'computer_random',enrollment_mode:'selected_workers',...pr,...cfg};
  const workerRows=workers.length?workers.map(w=>`<label class="program-worker-row"><input type="checkbox" name="employee_ids" value="${esc(w.id)}" ${selected.has(w.id)?'checked':''}><span class="program-worker-main"><strong>${esc(personName(w))}</strong><small>${esc(w.employee_number||'No employee #')} · ${esc(w.job_title||'No job title')}</small></span><span class="badge ${w.workforce_worker_type==='driver'?'warn':'good'}">${w.workforce_worker_type==='driver'?'NON-DOT Driver':'Employee'}</span></label>`).join(''):'<div class="empty">No People records are available yet. Add employees or NON-DOT drivers first.</div>';
  return `<form id="programForm" class="person-form program-form">
    <div class="person-page-head"><div><span>Random Testing Program Management</span><h2>${pr.id?`Manage ${esc(pr.name)}`:'Create Random Testing Program'}</h2><p>Build the employer’s NON-DOT random testing program, define testing rates and schedule, and control which employees or NON-DOT drivers participate.</p></div><span class="badge ${String(v.status)==='active'?'good':'warn'}">${esc(pretty(v.status))}</span></div>
    <div id="programPageNotice"></div>
    <div class="person-form-grid">
      <section class="person-card"><div class="person-card-head"><span>01</span><div><h3>Program Identity</h3><p>Name the company-policy program and set its effective status.</p></div></div><div class="person-fields">
        ${personInput('name','Program name',v,true)}${personSelect('regulatory_category','Program category',v.regulatory_category,[['workplace_testing','Workplace Testing'],['drug_free_workplace','Drug-Free Workplace'],['safety_program','Safety Program'],['company_policy','Company Policy']],true)}${personInput('effective_date','Effective date',v,true,'date')}${personSelect('status','Program status',v.status,[['draft','Draft'],['active','Active'],['suspended','Suspended'],['inactive','Inactive']],true)}
      </div></section>
      <section class="person-card"><div class="person-card-head"><span>02</span><div><h3>Random Testing Design</h3><p>Define the panel, specimen method, annual selection rates, and selection schedule.</p></div></div><div class="person-fields">
        ${personSelect('testing_panel','Drug testing panel',v.testing_panel,[['5-panel','5-Panel'],['10-panel','10-Panel'],['12-panel','12-Panel'],['custom','Custom Panel']],true)}${personSelect('testing_method','Primary testing method',v.testing_method,[['urine','Urine'],['oral_fluid','Oral Fluid'],['hair','Hair'],['breath','Breath Alcohol'],['mixed','Mixed / Multiple Methods']],true)}${programNumber('drug_random_rate','Annual drug random rate (%)',v.drug_random_rate,0,100,0.1)}${programNumber('alcohol_random_rate','Annual alcohol random rate (%)',v.alcohol_random_rate,0,100,0.1)}${personSelect('testing_frequency','Selection schedule',v.testing_frequency,[['monthly','Monthly'],['quarterly','Quarterly'],['semiannual','Semiannual'],['annual','Annual']],true)}${personSelect('random_selection_method','Selection method',v.random_selection_method,[['computer_random','Computer Random'],['third_party_random','Third-Party Random Selection']],true)}
      </div></section>
      <section class="person-card program-enrollment-card"><div class="person-card-head"><span>03</span><div><h3>Workforce Enrollment</h3><p>Choose whether all active workers participate or manage selected employees and NON-DOT drivers individually.</p></div></div><div class="person-fields program-enrollment-fields">
        ${personSelect('enrollment_mode','Enrollment mode',v.enrollment_mode,[['selected_workers','Selected Workers'],['all_active','All Active Workers']],true)}
        <div class="person-field full"><label>Program participants</label><div class="program-worker-list" id="programWorkerList">${workerRows}</div></div>
      </div></section>
      <section class="person-card"><div class="person-card-head"><span>04</span><div><h3>Program Notes</h3><p>Internal employer notes about this random testing program.</p></div></div><div class="person-fields"><div class="person-field full"><label>Notes</label><textarea name="notes" rows="6">${esc(v.notes||'')}</textarea></div></div></section>
    </div>
    <div class="person-savebar"><a class="btn ghost" href="/programs.html">Cancel</a><button class="btn primary" type="submit">${pr.id?'Save Program':'Create Program'}</button></div>
  </form>`;
}

function renderPool(){
  const pool=data?.pool||{},selected=new Set(data?.member_employee_ids||[]),workers=data?.employees||[],programs=data?.programs||[];
  const v={name:'',program_id:'',drug_testing_rate:25,alcohol_testing_rate:10,selection_schedule:'quarterly',effective_date:new Date().toISOString().slice(0,10),status:'active',...pool};
  const programOpts=[['','No linked program'],...programs.map(x=>[x.id,x.name||x.id])];
  const rows=workers.length?workers.map(w=>`<label class="program-worker-row"><input type="checkbox" name="employee_ids" value="${esc(w.id)}" ${selected.has(w.id)?'checked':''}><span class="program-worker-main"><strong>${esc(personName(w))}</strong><small>${esc(w.employee_number||'No employee #')} · ${esc(w.job_title||'No job title')}</small></span><span class="badge ${w.workforce_worker_type==='driver'?'warn':'good'}">${w.workforce_worker_type==='driver'?'NON-DOT Driver':'Employee'}</span></label>`).join(''):'<div class="empty">No People records are available yet. Add employees or NON-DOT drivers first.</div>';
  return `<form id="poolForm" class="person-form"><div class="person-page-head"><div><span>Random Pool Management</span><h2>${pool.id?`Manage ${esc(pool.name)}`:'Create NON-DOT Pool'}</h2><p>Create the pool, connect it to a NON-DOT program if needed, and manage exactly which employees or NON-DOT drivers are included.</p></div><span class="badge ${String(v.status)==='active'?'good':'warn'}">${esc(pretty(v.status))}</span></div><div id="poolPageNotice"></div><div class="person-form-grid">
  <section class="person-card"><div class="person-card-head"><span>01</span><div><h3>Pool Setup</h3><p>Name the pool and connect it to the appropriate random testing program.</p></div></div><div class="person-fields">${personInput('name','Pool name',v,true)}${personSelect('program_id','NON-DOT program',v.program_id||'',programOpts)}${personInput('effective_date','Effective date',v,true,'date')}${personSelect('status','Pool status',v.status,[['draft','Draft'],['active','Active'],['suspended','Suspended'],['inactive','Inactive']],true)}</div></section>
  <section class="person-card"><div class="person-card-head"><span>02</span><div><h3>Selection Settings</h3><p>Set the random testing rates and how often selections are generated.</p></div></div><div class="person-fields">${programNumber('drug_testing_rate','Drug testing rate (%)',v.drug_testing_rate,0,100,0.1)}${programNumber('alcohol_testing_rate','Alcohol testing rate (%)',v.alcohol_testing_rate,0,100,0.1)}${personSelect('selection_schedule','Selection schedule',v.selection_schedule,[['monthly','Monthly'],['quarterly','Quarterly'],['semiannual','Semiannual'],['annual','Annual']],true)}</div></section>
  <section class="person-card program-enrollment-card"><div class="person-card-head"><span>03</span><div><h3>Pool Members</h3><p>Select the employees and NON-DOT drivers who belong to this pool.</p></div></div><div class="person-fields program-enrollment-fields"><div class="person-field full"><label>Employees / NON-DOT Drivers</label><div class="program-worker-list">${rows}</div></div></div></section>
  </div><div class="person-savebar"><a class="btn ghost" href="/pools.html">Cancel</a>${pool.id?'<button class="btn ghost danger" type="button" id="archivePool">Archive Pool</button>':''}<button class="btn primary" type="submit">${pool.id?'Save Pool':'Create Pool'}</button></div></form>`;
}
function poolPageNotice(message,type='good'){const el=$('#poolPageNotice');if(!el)return;el.innerHTML=`<div class="notice ${type==='bad'?'error':''}" style="margin-bottom:12px">${esc(message)}</div>`}
function bindPool(){const f=$('#poolForm');if(!f)return;f.onsubmit=async ev=>{ev.preventDefault();const fd=new FormData(f),vals=Object.fromEntries(fd.entries());vals.id=data?.pool?.id||undefined;const ids=fd.getAll('employee_ids');try{const out=await invoke('nondot-employer-pools',{action:'save',pool:vals,employee_ids:ids});poolPageNotice(data?.pool?.id?'Pool updated.':'Pool created.');setTimeout(()=>location.href=`/pool.html?id=${encodeURIComponent(out.pool.id)}`,300)}catch(err){poolPageNotice(err.message||String(err),'bad')}};const a=$('#archivePool');if(a)a.onclick=async()=>{const ok=await confirmBox('Archive Pool','Archive this pool and remove its active members? Historical records will remain available where required.');if(!ok)return;try{await invoke('nondot-employer-pools',{action:'archive',id:data.pool.id});location.href='/pools.html'}catch(err){poolPageNotice(err.message||String(err),'bad')}}}

function programNumber(name,label,value,min,max,step){return `<div class="person-field"><label>${esc(label)}</label><input name="${esc(name)}" type="number" min="${min}" max="${max}" step="${step}" value="${esc(value??'')}"></div>`}
function programPageNotice(message,type='good'){const el=$('#programPageNotice');if(!el)return;el.innerHTML=`<div class="notice ${type==='bad'?'error':''}" style="margin-bottom:12px">${esc(message)}</div>`}
function bindProgram(){const f=$('#programForm');if(!f)return;const mode=f.elements.enrollment_mode,list=$('#programWorkerList');const sync=()=>{const all=mode.value==='all_active';if(list)list.classList.toggle('program-worker-list-disabled',all);$$('input[name="employee_ids"]',f).forEach(x=>x.disabled=all)};mode.onchange=sync;sync();f.onsubmit=async ev=>{ev.preventDefault();const fd=new FormData(f),vals=Object.fromEntries(fd.entries());vals.id=data?.program?.id||undefined;const ids=mode.value==='all_active'?[]:fd.getAll('employee_ids');try{const out=await invoke('nondot-employer-programs',{action:'save',program:vals,employee_ids:ids});programPageNotice(data?.program?.id?'Random testing program updated.':'Random testing program created.');setTimeout(()=>location.href=`/program.html?id=${encodeURIComponent(out.program.id)}`,300)}catch(err){programPageNotice(err.message||String(err),'bad')}}}

function renderContact(){
  const c=data?.contact||{},isEdit=!!c.id,v={contact_type:'staff',status:'active',...c};
  return `<form id="contactForm" class="person-form contact-form">
    <div class="person-page-head"><div><span>Company Contact Management</span><h2>${isEdit?`Manage ${esc(c.full_name||[c.first_name,c.last_name].filter(Boolean).join(' ')||'Contact')}`:'Add Company Contact'}</h2><p>Create or maintain a company contact record for Staff, HR, Safety, Billing, Primary, or other account contacts.</p></div><span class="badge ${String(v.status)==='active'?'good':'bad'}">${esc(pretty(v.status||'active'))}</span></div>
    <div id="contactPageNotice"></div>
    <div class="person-form-grid">
      <section class="person-card"><div class="person-card-head"><span>01</span><div><h3>Contact Role</h3><p>Define how this person supports the account.</p></div></div><div class="person-fields">
        ${personSelect('contact_type','Contact type',v.contact_type||'staff',[['primary','Primary'],['staff','Staff'],['hr','HR'],['safety','Safety'],['billing','Billing'],['other','Other']],true)}${personInput('title','Title / Position',v)}
      </div></section>
      <section class="person-card"><div class="person-card-head"><span>02</span><div><h3>Contact Information</h3><p>Name and direct contact details.</p></div></div><div class="person-fields">
        ${personInput('first_name','First name',v,true)}${personInput('last_name','Last name',v,true)}${personInput('email','Email',v,false,'email')}${personInput('phone','Phone',v,false,'tel')}
      </div></section>
      <section class="person-card"><div class="person-card-head"><span>03</span><div><h3>Account Status</h3><p>Control whether this contact remains active on the company account.</p></div></div><div class="person-fields">
        ${personSelect('status','Status',v.status||'active',[['active','Active'],['inactive','Inactive']],true)}
      </div></section>
    </div>
    <div class="person-savebar"><a class="btn ghost" href="/company.html">Cancel</a>${isEdit?'<button class="btn ghost danger" type="button" id="deactivateContact">Deactivate Contact</button>':''}<button class="btn primary" type="submit">${isEdit?'Save Changes':'Add Contact'}</button></div>
  </form>`;
}
function contactPageNotice(message,type='good'){const el=$('#contactPageNotice');if(!el)return;el.innerHTML=`<div class="notice ${type==='bad'?'error':''}" style="margin-bottom:12px">${esc(message)}</div>`}
function bindContact(){const f=$('#contactForm');if(!f)return;f.onsubmit=async ev=>{ev.preventDefault();const vals=Object.fromEntries(new FormData(f).entries());if(data?.contact?.id)vals.id=data.contact.id;try{const out=await invoke('nondot-employer-company',{action:'save_contact',contact:vals});contactPageNotice(data?.contact?.id?'Contact updated.':'Contact added.');setTimeout(()=>location.href=`/contact.html?id=${encodeURIComponent(out.contact.id)}`,250)}catch(err){contactPageNotice(err.message||String(err),'bad')}};const d=$('#deactivateContact');if(d)d.onclick=async()=>{try{await invoke('nondot-employer-company',{action:'delete_contact',id:data.contact.id});contactPageNotice('Contact deactivated.');setTimeout(()=>location.href='/company.html',250)}catch(err){contactPageNotice(err.message||String(err),'bad')}}}

function renderPerson(){
  const e=data?.employee||{},p=data?.profile||{},v={country:'US',...e,...p};
  const type=e.workforce_worker_type||'employee';
  return `<form id="personForm" class="person-form">
    <div class="person-page-head"><div><span>People Management</span><h2>${e.id?`Manage ${esc(personName(e))}`:'Create Person'}</h2><p>Create a complete workforce record. Employee and NON-DOT Driver records remain clearly distinguished across the portal.</p></div><span class="badge ${type==='driver'?'warn':'good'}" id="personTypeBadge">${type==='driver'?'NON-DOT Driver':'Employee'}</span></div>
    <div class="person-form-grid">
      <section class="person-card"><div class="person-card-head"><span>01</span><div><h3>Personal Information</h3><p>Identity and primary contact details.</p></div></div><div class="person-fields">
        ${personInput('first_name','First name',v,true)}${personInput('middle_name','Middle name',v)}${personInput('last_name','Last name',v,true)}${personInput('date_of_birth','Birthdate',v,false,'date')}
        ${personInput('email','Email',v,false,'email')}${personInput('mobile','Mobile phone',v,false,'tel')}${personInput('alternate_email','Alternate email',v,false,'email')}${personInput('work_phone','Work phone',v,false,'tel')}
      </div></section>
      <section class="person-card"><div class="person-card-head"><span>02</span><div><h3>Employment</h3><p>Role, department, worker classification, and status.</p></div></div><div class="person-fields">
        ${personSelect('workforce_worker_type','Person type',type,[['employee','Employee'],['driver','NON-DOT Driver']],true)}${personInput('employee_number','Employee number',v)}${personInput('department','Department',v)}${personInput('job_title','Job title',v)}
        ${personInput('hire_date','Hire date',v,false,'date')}${personInput('termination_date','Termination date',v,false,'date')}${personSelect('safety_sensitive','Safety-sensitive position',String(!!e.safety_sensitive),[['false','No'],['true','Yes']])}${personSelect('employment_status','Employment status',e.employment_status||'active',[['invited','Invited'],['pending_enrollment','Pending Enrollment'],['active','Active'],['suspended','Suspended'],['leave','Leave'],['inactive','Inactive'],['terminated','Terminated'],['compliance_hold','Compliance Hold']])}
      </div></section>
      <section class="person-card"><div class="person-card-head"><span>03</span><div><h3>Home Address</h3><p>Address maintained on the person record.</p></div></div><div class="person-fields">
        ${personInput('address_line1','Street address',v,false,'text',true)}${personInput('address_line2','Address line 2',v,false,'text',true)}${personInput('city','City',v)}${personInput('state','State',v)}${personInput('postal_code','ZIP / Postal code',v)}${personInput('country','Country',v||{country:'US'})}
      </div></section>
      <section class="person-card"><div class="person-card-head"><span>04</span><div><h3>Emergency Contact</h3><p>Optional emergency contact for this person.</p></div></div><div class="person-fields">
        ${personInput('emergency_contact_name','Contact name',v)}${personInput('emergency_contact_relationship','Relationship',v)}${personInput('emergency_contact_phone','Phone',v,false,'tel')}
      </div></section>
      <section class="person-card driver-card" id="driverSection"><div class="person-card-head"><span>05</span><div><h3>NON-DOT Driver & Vehicle</h3><p>Vehicle information appears only for NON-DOT Driver records.</p></div></div><div class="person-fields">
        ${personInput('vehicle_type','Vehicle type',v)}${personInput('vehicle_year','Year',v,false,'number')}${personInput('vehicle_make','Make',v)}${personInput('vehicle_model','Model',v)}${personInput('vehicle_color','Color',v)}${personInput('vehicle_unit_number','Unit / Fleet number',v)}${personInput('vehicle_vin','VIN',v,false,'text',true)}${personInput('vehicle_plate','License plate',v)}${personInput('vehicle_plate_state','Plate state',v)}
      </div></section>
      <section class="person-card"><div class="person-card-head"><span>06</span><div><h3>Internal Notes</h3><p>Employer-only notes about this workforce record.</p></div></div><div class="person-fields"><div class="person-field full"><label>Notes</label><textarea name="notes" rows="5">${esc(v.notes||'')}</textarea></div></div></section>
    </div>
    <div class="person-savebar"><a class="btn ghost" href="/people.html">Cancel</a>${e.id?'<button class="btn ghost danger" type="button" id="archivePerson">Archive Record</button>':''}<button class="btn primary" type="submit">${e.id?'Save Changes':'Create Person'}</button></div>
  </form>`;
}
function personInput(name,label,v,required=false,type='text',full=false){return `<div class="person-field ${full?'full':''}"><label>${esc(label)}${required?' *':''}</label><input name="${esc(name)}" type="${esc(type)}" value="${esc(v?.[name]??'')}" ${required?'required':''}></div>`}
function personSelect(name,label,value,options,required=false){return `<div class="person-field"><label>${esc(label)}${required?' *':''}</label><select name="${esc(name)}" ${required?'required':''}>${options.map(([a,b])=>`<option value="${esc(a)}" ${String(value)===String(a)?'selected':''}>${esc(b)}</option>`).join('')}</select></div>`}
function bindPerson(){const f=$('#personForm');if(!f)return;const type=f.elements.workforce_worker_type,driver=$('#driverSection'),badgeEl=$('#personTypeBadge');const sync=()=>{const is=type.value==='driver';driver.hidden=!is;badgeEl.textContent=is?'NON-DOT Driver':'Employee';badgeEl.className=`badge ${is?'warn':'good'}`};type.onchange=sync;sync();f.onsubmit=async ev=>{ev.preventDefault();const vals=Object.fromEntries(new FormData(f).entries());vals.id=data?.employee?.id||undefined;vals.safety_sensitive=vals.safety_sensitive==='true';try{const out=await invoke('nondot-employer-people',{action:'save',employee:vals});notice(data?.employee?.id?'Person record updated.':'Person record created.','good');setTimeout(()=>location.href=`/person.html?id=${encodeURIComponent(out.employee.id)}`,350)}catch(err){brandedMessage('Unable to save person',err.message||String(err))}};const a=$('#archivePerson');if(a)a.onclick=async()=>{const ok=await confirmBox('Archive Person','Archive this person from active People records? Historical testing and compliance records will remain available where required.');if(!ok)return;try{await invoke('nondot-employer-people',{action:'archive',id:data.employee.id});location.href='/people.html'}catch(err){brandedMessage('Unable to archive person',err.message||String(err))}}}
function brandedMessage(title,message){const b=modalShell(title,`<p class="modal-message">${esc(message)}</p>`,`<button class="btn primary" data-close type="button">OK</button>`);b.querySelector('[data-close]').onclick=()=>b.remove()}


function renderSelectionsIndex(){
  const rows=data?.selections||[];
  const cols=[['Created',['created_at'],v=>fmt(v)],['Run Date',['selection_date'],v=>fmt(v)],['Pool',['pool.name','pool_id']],['Type',['selection_type'],v=>pretty(v)],['Population',['population_size']],['Selected',['selected_count']],['Drug',['drug_selection_count']],['Alcohol',['alcohol_selection_count']],['Status',['status'],v=>badge(v)]];
  return `<div class="selection-help"><div><strong>How random selections work</strong><p>Create a selection, choose one of your existing NON-DOT pools, review the eligible population, then run the selection. The system randomly selects workers using the pool's testing rates and schedule. After the selection is run, the record is permanently locked and cannot be edited or have people added or removed.</p></div><span class="selection-tip" tabindex="0" aria-label="How random selections work">?</span></div><div style="height:14px"></div>${table('NON-DOT Random Selections',rows,cols,r=>`<a class="btn primary" style="padding:6px 9px;text-decoration:none" href="/selection.html?id=${encodeURIComponent(r.id)}">View${r.status==='locked'?' Record':' / Manage'}</a>`)}`;
}
function selectionPoolOptions(){return (data?.pools||[]).map(x=>[x.id,`${x.name||'Pool'}${x.selection_schedule?` · ${pretty(x.selection_schedule)}`:''}`])}
function renderSelection(){
  const e=data?.event||{},p=data?.pool||{},locked=e.status==='locked'||!!e.locked_at;
  if(locked){
    const members=data?.selected_members||[];
    return `<div class="person-page-head"><div><span>Random Selection Record</span><h2>${esc(p.name||'Completed Selection')}</h2><p>This selection was run and is permanently locked. The original population snapshot and selected members cannot be changed.</p></div><span class="badge good">Locked</span></div>${metrics([['Created',fmt(e.created_at),'Draft created'],['Run Date',fmt(e.selection_date),'Selection executed'],['Population',e.population_size||0,'Eligible people at run time'],['Selected',members.length,'Selected records']])}<div style="height:14px"></div><div class="panel"><div class="panel-head"><div><h3>Selection Details</h3><p>Immutable audit record.</p></div></div><div style="padding:16px">${metrics([['Pool',p.name||'—'],['Schedule',pretty((e.randomization_metadata||{}).selection_schedule||p.selection_schedule||'—')],['Drug Rate',percent(e.drug_required_rate)],['Alcohol Rate',percent(e.alcohol_required_rate)]])}</div></div><div style="height:14px"></div>${table('Selected People',members,[['Name',['workforce_employees.first_name'],(_,r)=>esc(personName(r.workforce_employees||{}))],['Employee #',['workforce_employees.employee_number']],['Worker Type',['workforce_employees.workforce_worker_type'],v=>pretty(v==='driver'?'NON_DOT Driver':v)],['Test Type',['test_type'],v=>pretty(v)],['Selected At',['selected_at'],v=>fmt(v)],['Order',['ordinal']]])}`;
  }
  const pools=data?.pools||[];
  return `<form id="selectionForm" class="person-form"><div class="person-page-head"><div><span>Random Selection Management</span><h2>${e.id?'Prepare Random Selection':'Create Random Selection'}</h2><p>Choose an existing NON-DOT pool and review the population before running. Once run, the selection is locked permanently.</p></div><span class="badge warn">Draft</span></div><div id="selectionPageNotice"></div><div class="person-form-grid"><section class="person-card"><div class="person-card-head"><span>01</span><div><h3>Selection Setup</h3><p>Select the source pool. Rates and schedule come from the pool.</p></div></div><div class="person-fields">${personSelect('pool_id','NON-DOT Pool',e.pool_id||'',selectionPoolOptions(),true)}${personSelect('selection_type','Selection type',e.selection_type||'manual_trigger',[['manual_trigger','Manual Trigger'],['scheduled','Scheduled']])}<div class="person-field full"><label>Internal Notes</label><textarea name="notes" rows="4">${esc((e.randomization_metadata||{}).notes||'')}</textarea></div></div></section><section class="person-card"><div class="person-card-head"><span>02</span><div><h3>Pool Preview</h3><p>Preview the eligible active population and calculated selection counts before running.</p></div></div><div id="selectionPreview" class="selection-preview"><div class="empty">Choose a pool to preview its population.</div></div></section></div><div class="person-savebar"><a class="btn ghost" href="/selections.html">Cancel</a>${e.id?'<button class="btn ghost danger" type="button" id="cancelSelection">Cancel Draft</button>':''}<button class="btn ghost" type="button" id="saveSelection">Save Draft</button><button class="btn primary" type="button" id="runSelection">Run & Lock Selection</button></div></form>`;
}
function selectionPageNotice(msg,kind='good'){const x=$('#selectionPageNotice');if(x)x.innerHTML=`<div class="notice ${kind==='bad'?'bad':''}">${esc(msg)}</div>`}
async function previewSelection(poolId){const box=$('#selectionPreview');if(!box)return;if(!poolId){box.innerHTML='<div class="empty">Choose a pool to preview its population.</div>';return}box.innerHTML='<div class="loading-msg">Loading pool population…</div>';try{const d=await invoke('nondot-employer-selections',{action:'preview',pool_id:poolId});const people=d.population||[];box.innerHTML=`${metrics([['Population',d.population_size||0,'Eligible active people'],['Drug Selections',d.drug_selection_count||0,'For this cycle'],['Alcohol Selections',d.alcohol_selection_count||0,'For this cycle'],['Schedule',pretty(d.pool?.selection_schedule||'—'),'Pool schedule']])}<div style="height:12px"></div>${table('Eligible Pool Members',people,[['Name',['workforce_employees.first_name'],(_,r)=>esc(personName(r.workforce_employees||{}))],['Employee #',['workforce_employees.employee_number']],['Worker Type',['workforce_employees.workforce_worker_type'],v=>pretty(v==='driver'?'NON_DOT Driver':v)],['Job Title',['workforce_employees.job_title']]])}`;}catch(err){box.innerHTML=`<div class="notice bad">${esc(err.message||String(err))}</div>`}}
async function saveSelectionDraft(){const f=$('#selectionForm');if(!f)return null;const vals=Object.fromEntries(new FormData(f).entries());vals.id=data?.event?.id||undefined;const out=await invoke('nondot-employer-selections',{action:'save_draft',selection:vals});data.event=out.event;return out}
function bindSelection(){const f=$('#selectionForm');if(!f)return;const pool=f.elements.pool_id;pool.onchange=()=>previewSelection(pool.value);if(pool.value)previewSelection(pool.value);const save=$('#saveSelection');if(save)save.onclick=async()=>{try{const out=await saveSelectionDraft();selectionPageNotice('Draft saved.');if(!new URLSearchParams(location.search).get('id'))setTimeout(()=>location.href=`/selection.html?id=${encodeURIComponent(out.event.id)}`,250)}catch(err){selectionPageNotice(err.message||String(err),'bad')}};const run=$('#runSelection');if(run)run.onclick=async()=>{try{const out=await saveSelectionDraft();const ok=await confirmBox('Run and Lock Selection','Run this random selection now? After it runs, the selection, population snapshot, and selected people are permanently locked and cannot be edited or have people added or removed.');if(!ok)return;await invoke('nondot-employer-selections',{action:'run',id:out.event.id});location.href=`/selection.html?id=${encodeURIComponent(out.event.id)}`}catch(err){selectionPageNotice(err.message||String(err),'bad')}};const cancel=$('#cancelSelection');if(cancel)cancel.onclick=async()=>{const ok=await confirmBox('Cancel Draft','Cancel this draft selection? Completed locked selections cannot be cancelled.');if(!ok)return;try{await invoke('nondot-employer-selections',{action:'cancel',id:data.event.id});location.href='/selections.html'}catch(err){selectionPageNotice(err.message||String(err),'bad')}}}


function serviceOptionLabel(x){return `${x.name} — ${x.specimen||'Specimen'} — ${money(x.unit_price,x.currency||'USD')} billed to account`}
function renderTestingOrder(){
  const o=data?.order||null;
  if(o){
    const ch=data?.charge||{}, emp=data?.employee||{}, program=data?.program||{}, pool=data?.pool||{};
    return `<div class="person-page-head"><div><span>NON-DOT Testing Order</span><h2>${esc(o.order_number||'Testing Order')}</h2><p>This order is sent directly to screenings4u Management for processing and account billing.</p></div>${badge(o.status||'created')}</div><div id="testingOrderNotice"></div>${metrics([['Person',personName(emp),'Employee / NON-DOT Driver'],['Service',ch.service_name||o.testing_panel||'—','Testing service'],['Charge',money(ch.unit_price||0,ch.currency||'USD'),'Bill to account'],['Billing',pretty(ch.billing_status||'unbilled'),'Management billing queue']])}<div style="height:14px"></div><div class="person-form-grid"><section class="person-card"><div class="person-card-head"><span>01</span><div><h3>Order Details</h3><p>Testing instructions and source records.</p></div></div><div class="person-fields"><div class="person-field"><label>Order Number</label><strong>${esc(o.order_number||'—')}</strong></div><div class="person-field"><label>Status</label><strong>${esc(pretty(o.status||'—'))}</strong></div><div class="person-field"><label>Reason</label><strong>${esc(pretty(o.reason||'—'))}</strong></div><div class="person-field"><label>Test Type</label><strong>${esc(pretty(o.test_type||'—'))}</strong></div><div class="person-field"><label>Program</label><strong>${esc(program.name||'—')}</strong></div><div class="person-field"><label>Pool</label><strong>${esc(pool.name||'Not linked')}</strong></div><div class="person-field"><label>Created</label><strong>${esc(fmt(o.created_at))}</strong></div><div class="person-field"><label>Collection Deadline</label><strong>${esc(fmt(o.collection_deadline))}</strong></div></div></section><section class="person-card"><div class="person-card-head"><span>02</span><div><h3>Person</h3><p>Employee or NON-DOT Driver assigned to this order.</p></div></div><div class="person-fields"><div class="person-field"><label>Name</label><strong>${esc(personName(emp))}</strong></div><div class="person-field"><label>Employee #</label><strong>${esc(emp.employee_number||'—')}</strong></div><div class="person-field"><label>Email</label><strong>${esc(emp.email||'—')}</strong></div><div class="person-field"><label>Phone</label><strong>${esc(emp.mobile||'—')}</strong></div></div></section></div><div class="person-savebar"><a class="btn ghost" href="/testing.html">Back to Testing Orders</a>${['created','assigned','employee_notified','scheduled'].includes(String(o.status))?'<button class="btn ghost danger" type="button" id="cancelTestingOrder">Cancel Order</button>':''}</div>`;
  }
  const services=data?.services||[], employees=data?.employees||[], programs=data?.programs||[], pools=data?.pools||[];
  const serviceOpts=services.map(x=>`<option value="${esc(x.id)}">${esc(serviceOptionLabel(x))}</option>`).join('');
  const employeeOpts=employees.map(x=>`<option value="${esc(x.id)}">${esc(personName(x))}${x.employee_number?` — ${esc(x.employee_number)}`:''}${x.workforce_worker_type==='driver'?' — NON-DOT Driver':''}</option>`).join('');
  const programOpts=programs.map(x=>`<option value="${esc(x.id)}">${esc(x.name)}${x.status!=='active'?` — ${esc(pretty(x.status))}`:''}</option>`).join('');
  const poolOpts=['<option value="">No pool / direct order</option>',...pools.map(x=>`<option value="${esc(x.id)}" data-program="${esc(x.program_id||'')}">${esc(x.name)}</option>`)].join('');
  return `<form id="testingOrderForm" class="person-form"><div class="person-page-head"><div><span>NON-DOT Testing Order</span><h2>Create Testing Order</h2><p>Choose a NON-DOT drug or alcohol test for an employee or driver. No payment is collected here — the order is billed to your company account and sent directly to screenings4u Management.</p></div><span class="badge good">Bill to Account</span></div><div id="testingOrderNotice"></div><div class="notice" style="margin-bottom:14px"><strong>No checkout or card payment.</strong><div style="margin-top:4px">Submitting this form creates the testing order in the screenings4u NON-DOT Management portal and places the service charge in the unbilled account queue.</div></div><div class="person-form-grid"><section class="person-card"><div class="person-card-head"><span>01</span><div><h3>Employee / Driver</h3><p>Select the person who will complete the test.</p></div></div><div class="person-fields"><div class="person-field full"><label>Employee / NON-DOT Driver *</label><select name="employee_id" required><option value="">Select a person</option>${employeeOpts}</select></div><div class="person-field"><label>NON-DOT Program *</label><select name="program_id" required><option value="">Select a program</option>${programOpts}</select></div><div class="person-field"><label>Random Pool</label><select name="pool_id">${poolOpts}</select></div></div></section><section class="person-card"><div class="person-card-head"><span>02</span><div><h3>Testing Service</h3><p>Live NON-DOT testing services from the screenings4u catalog.</p></div></div><div class="person-fields"><div class="person-field full"><label>Drug / Alcohol Test *</label><select name="service_id" id="testingServiceSelect" required><option value="">Select a testing service</option>${serviceOpts}</select></div><div class="person-field full" id="testingServiceDetail"><div class="empty">Choose a testing service to see specimen, turnaround, and billing amount.</div></div></div></section><section class="person-card"><div class="person-card-head"><span>03</span><div><h3>Reason & Collection</h3><p>Tell screenings4u why the test is being ordered and any collection deadline.</p></div></div><div class="person-fields">${personSelect('reason','Testing reason','pre_employment',[['pre_employment','Pre-Employment'],['random','Random'],['reasonable_suspicion','Reasonable Suspicion'],['post_accident','Post-Accident'],['return_to_work','Return to Work'],['follow_up','Follow-Up'],['other','Other']],true)}${personSelect('collection_type','Collection handling','management_assigns',[['management_assigns','screenings4u Assigns Collection'],['collection_site','Collection Site'],['onsite','On-Site / Mobile Collection']])}${personInput('collection_deadline','Collection deadline',{},false,'datetime-local')}</div></section></div><div class="person-savebar"><a class="btn ghost" href="/testing.html">Cancel</a><button class="btn primary" type="submit">Submit Testing Order</button></div></form>`;
}
function testingOrderNotice(msg,kind='good'){const x=$('#testingOrderNotice');if(x)x.innerHTML=`<div class="notice ${kind==='bad'?'bad':''}">${esc(msg)}</div>`}
function bindTestingOrder(){
  const cancel=$('#cancelTestingOrder');if(cancel)cancel.onclick=async()=>{const ok=await confirmBox('Cancel Testing Order','Cancel this NON-DOT testing order? The unbilled charge will be voided.');if(!ok)return;try{await invoke('nondot-employer-testing',{action:'cancel',id:data.order.id});location.reload()}catch(err){testingOrderNotice(err.message||String(err),'bad')}};
  const f=$('#testingOrderForm');if(!f)return;
  const services=data?.services||[], select=$('#testingServiceSelect'),detail=$('#testingServiceDetail');
  const update=()=>{const x=services.find(v=>String(v.id)===String(select.value));if(!detail)return;if(!x){detail.innerHTML='<div class="empty">Choose a testing service to see specimen, turnaround, and billing amount.</div>';return}detail.innerHTML=`<div class="testing-service-summary"><strong>${esc(x.name)}</strong><span>${esc(x.category||'NON-DOT Testing')}</span><p>${esc(x.description||'')}</p><div>${esc(x.specimen||'Specimen not listed')} · ${esc(x.results||'Turnaround varies')} · <strong>${esc(money(x.unit_price,x.currency||'USD'))} billed to account</strong></div></div>`};
  select.onchange=update;update();
  const program=f.elements.program_id,pool=f.elements.pool_id;const syncPools=()=>{[...pool.options].forEach(o=>{const pid=o.dataset.program||'';o.hidden=!!pid&&!!program.value&&pid!==program.value;if(o.hidden&&o.selected)pool.value=''})};program.onchange=syncPools;syncPools();
  f.onsubmit=async ev=>{ev.preventDefault();const vals=Object.fromEntries(new FormData(f).entries());try{const out=await invoke('nondot-employer-testing',{action:'create',order:vals});testingOrderNotice(`Testing order ${out.order.order_number} submitted to screenings4u Management for account billing.`);setTimeout(()=>location.href=`/testing-order.html?id=${encodeURIComponent(out.order.id)}`,350)}catch(err){testingOrderNotice(err.message||String(err),'bad')}};
}


function resultWorkflow(record){
  const labels=['Ordered','Processing','At Lab','MRO Confirmation','Completed'];
  const current=Math.max(1,Math.min(5,Number(record?.workflow_step||1)));
  return `<div class="result-workflow" aria-label="Testing workflow">${labels.map((label,i)=>{const n=i+1;const state=n<current?'done':n===current?'current':'';return `<div class="result-step ${state}"><span>${n<current?'✓':n}</span><strong>${esc(label)}</strong></div>`}).join('')}</div>`;
}
function resultStatus(record){
  const r=record?.result;
  if(r&&r.final_status&&String(r.final_status)!=='pending')return badge(r.final_status);
  return badge(record?.workflow_label||'Ordered');
}
function resultButtons(r){
  return `<button class="btn ghost" style="padding:6px 9px" data-result-view="${esc(r.id)}" type="button">View</button><button class="btn primary" style="padding:6px 9px" data-result-download="${esc(r.id)}" type="button" ${r.download_ready?'':'disabled title="PDF becomes available when the result is completed"'}>Download PDF</button>`;
}
function renderResultsIndex(){
  const rows=Array.isArray(data?.results)?data.results:[];
  const cols=[
    ['Order',['order_number']],
    ['Person',['employee.first_name'],(_,r)=>esc(personName(r.employee||{}))],
    ['Service',['charge.service_name','testing_panel']],
    ['Result',['result.final_status'],(_,r)=>resultStatus(r)],
    ['Workflow',['workflow_label'],(_,r)=>`<strong>${esc(r.workflow_label||'Ordered')}</strong>`],
    ['Updated',['result.finalized_at','result.updated_at','updated_at','created_at'],v=>fmt(v)]
  ];
  const help=`<div class="notice results-help"><strong>Testing workflow</strong><div>Orders move through <b>Ordered</b> → <b>Processing</b> → <b>At Lab</b> → <b>MRO Confirmation</b> → <b>Completed</b>. Status updates and final results appear here as screenings4u testing management processes the order.</div></div>`;
  return `${help}<div style="height:14px"></div>${table('NON-DOT Testing Results & Status',rows,cols,resultButtons)}`;
}
function primitivePayload(payload){
  if(!payload||typeof payload!=='object')return [];
  return Object.entries(payload).filter(([k,v])=>['string','number','boolean'].includes(typeof v)&&v!==''&&v!==null).slice(0,24);
}
async function viewResult(id){
  try{
    const d=await invoke('nondot-employer-results',{action:'detail',id});
    const x=d.record||{},r=x.result||{},e=x.employee||{},payload=primitivePayload(r.sensitive_payload);
    const details=`<div class="result-modal-body">${resultWorkflow(x)}<div class="result-summary-grid">
      <div><small>Order</small><strong>${esc(x.order_number||'—')}</strong></div>
      <div><small>Person</small><strong>${esc(personName(e))}</strong></div>
      <div><small>Service</small><strong>${esc(x.charge?.service_name||x.testing_panel||'—')}</strong></div>
      <div><small>Reason</small><strong>${esc(pretty(x.reason||'—'))}</strong></div>
      <div><small>Workflow</small><strong>${esc(x.workflow_label||'Ordered')}</strong></div>
      <div><small>Final Result</small><strong>${esc(pretty(r.final_status||'Pending'))}</strong></div>
      <div><small>Result Date</small><strong>${esc(fmt(r.result_date||r.finalized_at))}</strong></div>
      <div><small>MRO Status</small><strong>${esc(pretty(r.mro_status||'Pending'))}</strong></div>
    </div>${payload.length?`<div class="result-detail-card"><h3>Result Details</h3><div class="result-kv">${payload.map(([k,v])=>`<div><span>${esc(pretty(k))}</span><strong>${esc(v)}</strong></div>`).join('')}</div></div>`:''}</div>`;
    const b=modalShell(`Result ${x.order_number||''}`,details,`<button class="btn ghost" data-close type="button">Close</button>${x.download_ready?`<button class="btn primary" data-download type="button">Download PDF</button>`:''}`,true);
    b.querySelector('[data-close]').onclick=()=>b.remove();
    const dl=b.querySelector('[data-download]');if(dl)dl.onclick=()=>downloadResultPdfRecord(x);
  }catch(err){notice(err.message||String(err))}
}
function pdfEsc(v){return String(v??'').replace(/\\/g,'\\\\').replace(/\(/g,'\\(').replace(/\)/g,'\\)').replace(/[\r\n]+/g,' ')}
function buildSimplePdf(lines){
  const content=[];let y=760;
  content.push('BT /F1 11 Tf');
  for(const line of lines){content.push(`1 0 0 1 54 ${y} Tm (${pdfEsc(line)}) Tj`);y-=18;if(y<60)break}
  content.push('ET');
  const stream=content.join('\\n');
  const objects=[
    '<< /Type /Catalog /Pages 2 0 R >>',
    '<< /Type /Pages /Kids [3 0 R] /Count 1 >>',
    '<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Resources << /Font << /F1 5 0 R >> >> /Contents 4 0 R >>',
    `<< /Length ${stream.length} >>\\nstream\\n${stream}\\nendstream`,
    '<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>'
  ];
  let pdf='%PDF-1.4\\n',offsets=[0];
  objects.forEach((o,i)=>{offsets.push(pdf.length);pdf+=`${i+1} 0 obj\\n${o}\\nendobj\\n`});
  const xref=pdf.length;pdf+=`xref\\n0 ${objects.length+1}\\n0000000000 65535 f \\n`;
  for(let i=1;i<offsets.length;i++)pdf+=String(offsets[i]).padStart(10,'0')+' 00000 n \\n';
  pdf+=`trailer << /Size ${objects.length+1} /Root 1 0 R >>\\nstartxref\\n${xref}\\n%%EOF`;
  return new Blob([pdf],{type:'application/pdf'});
}
function downloadResultPdfRecord(x){
  const r=x.result||{},e=x.employee||{},payload=primitivePayload(r.sensitive_payload);
  const lines=[
    'screenings4u Workforce NON-DOT Testing Result',
    '',
    `Order: ${x.order_number||'—'}`,
    `Employee / Driver: ${personName(e)}`,
    `Employee #: ${e.employee_number||'—'}`,
    `Service: ${x.charge?.service_name||x.testing_panel||'—'}`,
    `Program: ${x.program?.name||'—'}`,
    `Reason: ${pretty(x.reason||'—')}`,
    `Workflow Status: ${x.workflow_label||'Completed'}`,
    `Final Result: ${pretty(r.final_status||'Pending')}`,
    `Preliminary Result: ${pretty(r.preliminary_status||'Pending')}`,
    `MRO Status: ${pretty(r.mro_status||'Pending')}`,
    `Result Date: ${fmt(r.result_date||r.finalized_at)}`,
    `Finalized: ${fmt(r.finalized_at)}`,
    '',
    ...payload.map(([k,v])=>`${pretty(k)}: ${String(v)}`),
    '',
    'This report was generated from the screenings4u Workforce Employer portal.'
  ];
  const blob=buildSimplePdf(lines),url=URL.createObjectURL(blob),a=document.createElement('a');
  a.href=url;a.download=`${String(x.order_number||'NON-DOT-result').replace(/[^a-zA-Z0-9_-]+/g,'-')}.pdf`;document.body.appendChild(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),1000);
}
async function downloadResultPdf(id){
  try{const d=await invoke('nondot-employer-results',{action:'detail',id});if(!d.record?.download_ready)throw new Error('The PDF will be available after the testing result is completed.');downloadResultPdfRecord(d.record)}catch(err){notice(err.message||String(err))}
}

function managementActions(p){
  if(C.kind==='self')return;
  if(p==='people')addAction('Add Person',()=>location.href='/person.html');if(p==='person')addAction('Back to People',()=>location.href='/people.html');if(p==='contact')addAction('Back to Company',()=>location.href='/company.html');if(p==='programs')addAction('Add Random Testing Program',()=>location.href='/program.html');if(p==='program')addAction('Back to Programs',()=>location.href='/programs.html');if(p==='pools')addAction('Add NON-DOT Pool',()=>location.href='/pool.html');if(p==='pool')addAction('Back to Pools',()=>location.href='/pools.html');if(p==='selections')addAction('Create Random Selection',()=>location.href='/selection.html');if(p==='selection')addAction('Back to Random Selections',()=>location.href='/selections.html');
  if(p==='testing')addAction('Create Testing Order',()=>location.href='/testing-order.html');if(p==='testing-order')addAction('Back to Testing Orders',()=>location.href='/testing.html');
  if(C.kind==='employer'&&p==='company')addAction('Add Contact',()=>location.href='/contact.html');
  if(C.kind==='employer'&&p==='locations')addAction('Add Location',()=>formModal('Add Location',locationFields,{},async v=>invoke(apiName(),{action:'save_location',location:v})));
  }
function subtitleFor(p){
  const common={
    dashboard:C.kind==='self'?'Your secure NON-DOT Workforce self-service dashboard.':C.kind==='ctpa'?'Manage customer Employers and their NON-DOT workforce programs, pools, testing, results, and compliance.':'Manage your company’s NON-DOT workforce program, employees / drivers, testing, and compliance.',
    employers:'Manage customer Employer accounts under your NON-DOT Workforce C/TPA program.',
    company:'Review your company profile and Workforce contacts.',
    contact:'Create or manage a company contact record.',
    people:'Your employee and NON-DOT driver record center. Use View / Manage to open a complete person account.',person:'Create or manage the complete employee or NON-DOT driver account.',
    programs:'Create and manage your company’s NON-DOT random testing programs for employees and NON-DOT drivers.',program:'Create or manage a complete NON-DOT random testing program and its workforce enrollment.',
    pools:'Your NON-DOT random testing pool records. Use View / Manage to control pool membership and settings.',pool:'Create or manage a NON-DOT random testing pool and its employee membership.',
    selections:'Create and review NON-DOT random selection events. Completed selections are permanently locked.',selection:'Prepare, run, and review a NON-DOT random selection. Once run, the selection is locked and cannot be changed.',
    testing:'Order NON-DOT drug and alcohol tests for employees and drivers. Orders are billed to your company account and sent directly to screenings4u Management.','testing-order':'Create or review a bill-to-account NON-DOT testing order.',
    results:'Track NON-DOT testing from order through lab and MRO review, then view or download completed results.',
    compliance:'Track company-policy NON-DOT compliance cases and follow-up tasks.',
    documents:'Review documents associated with the NON-DOT Workforce program.',
    consents:'Review and complete company-policy consents and acknowledgments.',
    reports:'Review reporting available for the NON-DOT Workforce program.',
    notifications:'Review Workforce notifications and delivery activity.',
    billing:'Review NON-DOT Workforce invoices and balances.',
    team:'Review portal users and roles.',
    locations:'Manage Workforce locations.',
    branding:'Review Workforce portal branding.',
    integrations:'Review Workforce integrations available to this account.',
    'audit-history':'Review account activity recorded for the Workforce portal.',
    profile:'Review your NON-DOT Workforce profile.',
    'my-testing':'Review NON-DOT testing assigned to you.',
    'my-results':'Review NON-DOT testing results available to you.',
    training:'Review your Workforce training records.',
    credentials:'Review credentials maintained for your NON-DOT Driver profile.'
  };
  return common[p]||'Manage NON-DOT Workforce information for this portal.';
}
async function refresh(){
  try{
    data=await load();
    if($('#actions'))$('#actions').innerHTML='';
    const p=norm(page());
    if($('#subtitle'))$('#subtitle').textContent=subtitleFor(p);
    if($('#content'))$('#content').innerHTML=C.kind==='self'?renderSelf(p):renderMgmt(p);
    managementActions(p);bindRows();if(p==='person')bindPerson();if(p==='contact')bindContact();if(p==='program')bindProgram();if(p==='pool')bindPool();if(p==='selection')bindSelection();if(p==='testing-order')bindTestingOrder();
    $$('[data-cancel-testing]').forEach(b=>b.onclick=async()=>{const ok=await confirmBox('Cancel Testing Order','Cancel this NON-DOT testing order? Completed testing history is not removed.');if(!ok)return;try{await invoke(apiName(),{action:'cancel_testing',id:b.dataset.cancelTesting});notice('Testing order cancelled.','good');await refresh()}catch(err){notice(err.message||String(err))}});
    $$('[data-consent]').forEach(b=>b.onclick=()=>formModal('Complete Consent / Acknowledgment',[{name:'acknowledged_name',label:'Type your full name',required:true},{name:'accepted',label:'I acknowledge and accept',type:'select',options:[{value:'true',label:'Yes'}]}],{},async v=>invoke(apiName(),{action:'complete_consent_assignment',assignment_id:b.dataset.consent,acknowledged_name:v.acknowledged_name,accepted:v.accepted==='true'})));
  }catch(err){notice(err.message||String(err));if($('#content'))$('#content').innerHTML='<div class="panel"><div class="empty">Unable to load this page.</div></div>'}
  finally{document.body.classList.remove('loading')}
}
window.S4UDialogs={message:brandedMessage,confirm:confirmBox};
async function boot(){
  try{
    ctx=await access();
    if(ctx.requires_workspace_selection){location.replace('/workspace.html');return}
    if(ctx.membership?.id)localStorage.setItem(storageKey(),ctx.membership.id);
    if(ctx.subscription?.id)localStorage.setItem(subKey(),ctx.subscription.id);
    shell(ctx);window.portalCtx=ctx;await refresh();
  }catch(err){
    const msg=String(err?.message||err||'');
    if(/unauthorized|session|jwt|sign in/i.test(msg)){location.replace('/login.html');return}
    document.body.className='';
    document.body.innerHTML=`<main class="login-page"><section class="login-card"><img class="login-logo" src="/images/workforce-non-dot.png" alt="screenings4u"><h1>Portal unavailable</h1><p>${esc(msg||'This NON-DOT Workforce portal could not be loaded.')}</p><a class="btn primary" href="/login.html">Return to sign in</a></section></main>`;
  }
}
boot();
})();

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
const cfgPage=id=>norm(id)==='person'?{id:'person',label:'Person Management',icon:'◎'}:norm(id)==='contact'?{id:'contact',label:'Contact Management',icon:'■'}:norm(id)==='program'?{id:'program',label:'Program Management',icon:'≡'}:(C.pages.find(x=>norm(x.id)===norm(id))||{id,label:pretty(id),icon:'•'});
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
async function load(){const p=page();if(p==='billing'&&C.kind!=='self')return invoke('workforce-invoice-portal',{action:'list'});if(C.kind==='employer'&&p==='company')return invoke('nondot-employer-company',{action:'workspace'});if(C.kind==='employer'&&p==='people')return invoke('nondot-employer-people',{action:'workspace'});if(C.kind==='employer'&&p==='person'){const id=new URLSearchParams(location.search).get('id');return id?invoke('nondot-employer-people',{action:'detail',id}):Promise.resolve({ok:true,employee:null,profile:null})}if(C.kind==='employer'&&p==='contact'){const id=new URLSearchParams(location.search).get('id');const d=await invoke('nondot-employer-company',{action:'workspace'});d.contact=id?(d.contacts||[]).find(x=>String(x.id)===String(id))||null:null;return d}if(C.kind==='employer'&&p==='programs')return invoke('nondot-employer-programs',{action:'workspace'});if(C.kind==='employer'&&p==='program'){const id=new URLSearchParams(location.search).get('id');return id?invoke('nondot-employer-programs',{action:'detail',id}):invoke('nondot-employer-programs',{action:'new'})}return invoke(apiName(),{action:'workspace',page:p})}

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
  const links=NAV.map(x=>{const active=current===norm(x.id)||(current==='person'&&norm(x.id)==='people')||(current==='program'&&norm(x.id)==='programs');return `<a href="${esc(x.href)}" class="${active?'active':''}"${active?' aria-current="page"':''}><span class="ico">${esc(x.icon||'•')}</span><span>${esc(x.label||pretty(x.id))}</span></a>`}).join('');
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
  testing:[['Order',['order_number']],['Reason',['reason']],['Test',['test_type']],['Program Type',['program_type'],v=>badge(v||'NON_DOT')],['Status',['status'],v=>badge(v)],['Created',['created_at'],v=>fmt(v)]],
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
function rowButtons(r,type){if(C.kind==='self')return'';if(type==='employee'&&C.kind==='employer')return `<a class="btn primary" style="padding:6px 9px;text-decoration:none" href="/person.html?id=${encodeURIComponent(r.id)}">View / Manage</a>`;if(type==='contact'&&C.kind==='employer')return `<a class="btn primary" style="padding:6px 9px;text-decoration:none" href="/contact.html?id=${encodeURIComponent(r.id)}">View / Manage</a>`;if(type==='program'&&C.kind==='employer')return `<a class="btn primary" style="padding:6px 9px;text-decoration:none" href="/program.html?id=${encodeURIComponent(r.id)}">View / Manage</a>`;return `<button class="btn ghost" style="padding:6px 9px" data-edit="${type}" data-id="${esc(r.id)}" type="button">Edit</button><button class="btn ghost" style="padding:6px 9px" data-delete="${type}" data-id="${esc(r.id)}" type="button">Delete</button>`}

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
  if(p==='pools')return table('NON-DOT Random Testing Pools',data.pools||[],COLS.pools,r=>rowButtons(r,'pool'));
  if(p==='selections')return table('NON-DOT Random Selections',data.selections||[],COLS.selections);
  if(p==='testing')return table('NON-DOT Testing Orders',data.testing_orders||[],COLS.testing,r=>['created','assigned','employee_notified','scheduled'].includes(String(r.status))?`<button class="btn ghost" style="padding:6px 9px" data-cancel-testing="${esc(r.id)}" type="button">Cancel</button>`:'');
  if(p==='results')return table('NON-DOT Testing Results',data.results||[],COLS.results);
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

function managementActions(p){
  if(C.kind==='self')return;
  if(p==='people')addAction('Add Person',()=>location.href='/person.html');if(p==='person')addAction('Back to People',()=>location.href='/people.html');if(p==='contact')addAction('Back to Company',()=>location.href='/company.html');if(p==='programs')addAction('Add Random Testing Program',()=>location.href='/program.html');if(p==='program')addAction('Back to Programs',()=>location.href='/programs.html');
  if(p==='pools')addAction('Add NON-DOT Pool',()=>formModal('Add NON-DOT Random Testing Pool',poolFields(data.employers||[],data.programs||[]),{},async v=>invoke(apiName(),{action:'save_pool',pool:v})));
  if(p==='testing')addAction('Create Testing Order',()=>formModal('Create NON-DOT Testing Order',[
    ...(C.kind==='ctpa'?[{name:'employer_id',label:'Employer',type:'select',required:true,options:(data.employers||[]).map(x=>({value:x.id,label:x.legal_name||x.id}))}]:[]),
    {name:'employee_id',label:'Employee / NON-DOT Driver',type:'select',required:true,options:(data.employees||[]).map(x=>({value:x.id,label:personName(x)=== '—'?x.id:personName(x)}))},
    {name:'program_id',label:'NON-DOT Program',type:'select',required:true,options:(data.programs||[]).map(x=>({value:x.id,label:x.name||x.id}))},
    {name:'reason',label:'Reason',type:'select',options:['pre_employment','random','reasonable_suspicion','post_accident','return_to_work','follow_up','other'].map(x=>({value:x,label:pretty(x)}))},
    {name:'test_type',label:'Test type',type:'select',options:[{value:'drug',label:'Drug'},{value:'alcohol',label:'Alcohol'},{value:'drug_and_alcohol',label:'Drug + Alcohol'}]}
  ],{},async v=>invoke(apiName(),{action:'create_testing',testing:v})));
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
    pools:'Manage NON-DOT random testing pools, rates, and selection schedules.',
    selections:'Review NON-DOT random selection events.',
    testing:'Create and track NON-DOT testing orders under company policy.',
    results:'Review NON-DOT testing results available to this account.',
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
    managementActions(p);bindRows();if(p==='person')bindPerson();if(p==='contact')bindContact();if(p==='program')bindProgram();
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

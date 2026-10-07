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
const auth=window.S4UAuth;
const FONT_KEY='s4u_employer_nondot_font_size_v2';
const FONT_DEFAULT=13,FONT_MIN=12,FONT_MAX=18;
function readFontSize(){const n=Number(localStorage.getItem(FONT_KEY));return Number.isFinite(n)?Math.min(FONT_MAX,Math.max(FONT_MIN,n)):FONT_DEFAULT}
function applyFontSize(n){const v=Math.min(FONT_MAX,Math.max(FONT_MIN,Number(n)||FONT_DEFAULT));document.documentElement.style.setProperty('--portal-font-root',v+'px');localStorage.setItem(FONT_KEY,String(v));const label=document.getElementById('fontSizeValue');if(label)label.textContent=v===FONT_DEFAULT?'Default':String(v);return v}
let portalFontSize=readFontSize();applyFontSize(portalFontSize);
const $=(s,r=document)=>r.querySelector(s), $$=(s,r=document)=>[...r.querySelectorAll(s)];
const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const pretty=v=>String(v??'—').replaceAll('_',' ').replace(/\b\w/g,x=>x.toUpperCase());
const fmt=v=>{if(!v)return'—';const d=new Date(v);return Number.isNaN(d.getTime())?String(v):new Intl.DateTimeFormat('en-US',{month:'short',day:'numeric',year:'numeric'}).format(d)};
const fmtDateTime=v=>{if(!v)return'—';const d=new Date(v);return Number.isNaN(d.getTime())?String(v):new Intl.DateTimeFormat('en-US',{month:'short',day:'numeric',year:'numeric',hour:'numeric',minute:'2-digit'}).format(d)};
const money=(v,c='USD')=>new Intl.NumberFormat('en-US',{style:'currency',currency:String(c||'USD')}).format(Number(v||0));
const badge=v=>`<span class="badge ${/active|complete|paid|eligible|final|negative|enabled|yes/i.test(String(v))?'good':/cancel|inactive|terminated|positive|failed|closed|archived|expired/i.test(String(v))?'bad':'warn'}">${esc(pretty(v))}</span>`;
const page=()=>location.pathname.split('/').pop()?.replace('.html','')||'dashboard';
const norm=v=>String(v||'').trim().toLowerCase().replaceAll('_','-');
const storageKey=()=>`s4u_${C.portalCode}_membership`, subKey=()=>`s4u_${C.portalCode}_subscription`;
const stored=()=>localStorage.getItem(storageKey())||'', storedSub=()=>localStorage.getItem(subKey())||'';
const CTX_CACHE='s4u_employer_ctx_v1',BRAND_CACHE='s4u_employer_brand_v1',DATA_CACHE='s4u_employer_page_cache_v2:';
const CTX_CHECK_KEY='s4u_employer_ctx_checked_v1',BRAND_CHECK_KEY='s4u_employer_brand_checked_v1';
const conn=navigator.connection||navigator.mozConnection||navigator.webkitConnection||null;
const MOBILE_FAST_PATH=matchMedia('(max-width: 820px)').matches||matchMedia('(pointer: coarse)').matches;
const REDUCED_NETWORK=!!(conn&&(conn.saveData||/^(slow-2g|2g|3g)$/i.test(String(conn.effectiveType||''))));
const canBackgroundValidate=(key,ttl)=>Date.now()-Number(localStorage.getItem(key)||0)>ttl;
const markValidated=key=>{try{localStorage.setItem(key,String(Date.now()))}catch{}};

const jsonGet=(store,key)=>{try{return JSON.parse(store.getItem(key)||'null')}catch{return null}},jsonSet=(store,key,val)=>{try{store.setItem(key,JSON.stringify(val))}catch{}};
const cacheKeyFor=(pathname,search='')=>DATA_CACHE+pathname+search;
const pageCacheKey=()=>cacheKeyFor(location.pathname,location.search);
const cachedPage=()=>{const x=jsonGet(sessionStorage,pageCacheKey())||jsonGet(localStorage,pageCacheKey());return x&&Date.now()-Number(x.t||0)<86400000?x.data:null};
const cachePage=v=>{const x={t:Date.now(),data:v};jsonSet(sessionStorage,pageCacheKey(),x);jsonSet(localStorage,pageCacheKey(),x)};
const cachePageFor=(pathname,v,search='')=>{const x={t:Date.now(),data:v};jsonSet(sessionStorage,cacheKeyFor(pathname,search),x);jsonSet(localStorage,cacheKeyFor(pathname,search),x)};
const hasFreshCache=(pathname,search='')=>{const x=jsonGet(sessionStorage,cacheKeyFor(pathname,search))||jsonGet(localStorage,cacheKeyFor(pathname,search));return !!(x&&Date.now()-Number(x.t||0)<600000)};
const cachedCtx=()=>jsonGet(localStorage,CTX_CACHE),cachedBrand=()=>jsonGet(localStorage,BRAND_CACHE);
const cfgPage=id=>norm(id)==='invoice'?{id:'invoice',label:'Invoice',icon:'$'}:norm(id)==='notification'?{id:'notification',label:'Notification',icon:'●'}:norm(id)==='internal-message'?{id:'internal-message',label:'Internal Message',icon:'✉'}:norm(id)==='support-ticket'?{id:'support-ticket',label:'Support Ticket',icon:'?'}:norm(id)==='person'?{id:'person',label:'Person Management',icon:'◎'}:norm(id)==='contact'?{id:'contact',label:'Contact Management',icon:'■'}:norm(id)==='program'?{id:'program',label:'Program Management',icon:'≡'}:norm(id)==='pool'?{id:'pool',label:'Pool Management',icon:'⊙'}:norm(id)==='selection'?{id:'selection',label:'Random Selection Management',icon:'✦'}:norm(id)==='testing-order'?{id:'testing-order',label:'Testing Order',icon:'◆'}:norm(id)==='document-upload'?{id:'document-upload',label:'Upload Document',icon:'▣'}:norm(id)==='schedule-entry'?{id:'schedule-entry',label:'Schedule Management',icon:'▦'}:norm(id)==='time-off'?{id:'time-off',label:'Time Off Management',icon:'◷'}:norm(id)==='task'?{id:'task',label:'Task Management',icon:'✓'}:norm(id)==='location'?{id:'location',label:'Location Management',icon:'⌖'}:norm(id)==='integration'?{id:'integration',label:'Integration Setup',icon:'↔'}:(C.pages.find(x=>norm(x.id)===norm(id))||{id,label:pretty(id),icon:'•'});
const apiName=()=>C.kind==='ctpa'?'nondot-ctpa-portal':C.kind==='employer'?'nondot-employer-portal':'workforce-employer-employee-access';
let ctx=null,data=null,NAV=[],brandState=null;
function brandInfo(){const d=brandState||{},b=d.branding||{},x=d.branding_defaults||{};return{enabled:!!d.can_edit,logo:b.logo_path||x.default_logo_url||'/images/workforce-non-dot.png',favicon:b.favicon_path||x.default_favicon_url||'/images/fav.png',name:b.portal_name||'',primary:b.primary_color||x.primary_color||'#24467f',accent:b.accent_color||x.accent_color||'#ff6b00',tagline:b.login_tagline||'',applyPortal:b.apply_portal!==false,applyDialogs:b.apply_dialogs!==false};}
function applyBranding(){const b=brandInfo();if(!b.enabled||!b.applyPortal)return;document.documentElement.style.setProperty('--navy',b.primary);document.documentElement.style.setProperty('--navy2',b.primary);document.documentElement.style.setProperty('--blue',b.primary);document.documentElement.style.setProperty('--orange',b.accent);document.body.dataset.whiteLabel='true';const fav=document.querySelector('link[rel="icon"]');if(fav&&b.favicon)fav.href=b.favicon;}
async function loadBranding(){if(C.kind!=='employer')return null;try{return await invoke('nondot-employer-branding',{action:'workspace'})}catch(e){return null}}

async function session(){return auth.getSession()}
async function invoke(name,body={}){
  const payload={portal_code:C.portalCode,membership_id:stored()||undefined,subscription_id:storedSub()||undefined,...body};
  const call=async s=>fetch(`${C.workforceUrl}/functions/v1/${name}`,{method:'POST',headers:{'Content-Type':'application/json','Authorization':`Bearer ${s.access_token}`,'apikey':C.workforceKey},body:JSON.stringify(payload)});
  let s=await session();
  if(!s)throw new Error('Your session has expired. Please sign in again.');
  let r=await call(s);
  if(r.status===401){
    const fresh=await auth.refreshSession?.().catch(()=>null);
    if(fresh?.access_token){s=fresh;r=await call(s)}
  }
  const d=await r.json().catch(()=>({}));
  if(r.status===401){
    try{await auth.signOut()}catch{}
    throw new Error('Your session has expired. Please sign in again.');
  }
  if(!r.ok||d.error)throw new Error(d.error||d.reason||`Request failed (${r.status}).`);
  return d;
}
window.Portal={invoke};
const GUIDE_CATALOG_URL=C.workforceUrl+'/functions/v1/guide-catalog-public';
async function publicGuideCatalog(){
  const r=await fetch(GUIDE_CATALOG_URL,{method:'POST',headers:{'Content-Type':'application/json','apikey':C.workforceKey},body:JSON.stringify({action:'list_guides',portal_code:'nondot_employer'})});
  const d=await r.json().catch(()=>({}));if(!r.ok||d.error)throw new Error(d.error||'Unable to load how-to guides.');return d.guides||[];
}
async function onboardingState(action='get',metadata={}){return invoke('portal-onboarding-state',{action,portal_code:'nondot_employer',metadata})}
const guideGroup=g=>{const raw=String(g.category||'').toLowerCase(),t=String(g.title||'').toLowerCase();if(/company|account|profile|contact/.test(raw+' '+t))return'Company Setup';if(/people|employee|staff|driver/.test(raw+' '+t))return'People';if(/program/.test(raw+' '+t))return'Programs';if(/test|order|collection/.test(raw+' '+t))return'Testing';if(/result/.test(raw+' '+t))return'Results';if(/document|upload|file/.test(raw+' '+t))return'Documents';if(/bill|invoice|payment/.test(raw+' '+t))return'Billing';return'Support'};
function guideCard(g){return `<article class="howto-card" data-guide-card data-search="${esc([g.title,g.intro,g.category].join(' ').toLowerCase())}"><span class="howto-kicker">${esc(guideGroup(g))}</span><h3>${esc(g.title||'How-To Guide')}</h3><p>${esc(g.intro||'Step-by-step instructions for this portal task.')}</p><div class="howto-meta"><span>${esc(g.audience||'Customer')}</span><span>v${Number(g.version||1)}</span></div><a class="btn ghost" target="_blank" rel="noopener" href="https://guides.screenings4u.com/public-guide.html?id=${encodeURIComponent(g.id)}">Open Guide</a></article>`}
async function access(){return invoke(apiName(),{action:'session_context',portal_code:C.portalCode,requested_portal_code:C.portalCode,requested_page:page()})}
async function load(){const p=page();if(C.kind==='employer'&&p==='welcome'){const [guides,onboarding]=await Promise.all([publicGuideCatalog().catch(()=>[]),onboardingState('mark_seen',{source:'welcome_page'}).catch(()=>({state:{status:'in_progress'}}))]);return {ok:true,guides,onboarding:onboarding.state||{status:'in_progress'}}}if(C.kind==='employer'&&p==='how-to-guides'){return {ok:true,guides:await publicGuideCatalog().catch(()=>[])}}if(C.kind==='employer'&&p==='audit-history')return invoke('nondot-employer-audit',{action:'workspace'});if(C.kind==='employer'&&p==='branding')return invoke('nondot-employer-branding',{action:'workspace'});if(C.kind==='employer'&&p==='billing')return invoke('nondot-employer-billing',{action:'workspace'});if(C.kind==='employer'&&p==='invoice'){const id=new URLSearchParams(location.search).get('id');return id?invoke('nondot-employer-billing',{action:'detail',invoice_id:id}):Promise.resolve({ok:true,invoice:null})}if(p==='billing'&&C.kind!=='self')return invoke('workforce-invoice-portal',{action:'list'});if(C.kind==='employer'&&p==='company')return invoke('nondot-employer-company',{action:'workspace'});if(C.kind==='employer'&&p==='people')return invoke('nondot-employer-people',{action:'workspace'});if(C.kind==='employer'&&p==='person'){const id=new URLSearchParams(location.search).get('id');return id?invoke('nondot-employer-people',{action:'detail',id}):Promise.resolve({ok:true,employee:null,profile:null})}if(C.kind==='employer'&&p==='contact'){const id=new URLSearchParams(location.search).get('id');if(!id)return Promise.resolve({ok:true,contact:null,contacts:[]});const companyCache=jsonGet(sessionStorage,cacheKeyFor('/company.html'))||jsonGet(localStorage,cacheKeyFor('/company.html'));const cached=companyCache&&Date.now()-Number(companyCache.t||0)<600000?companyCache.data:null;if(cached){const hit=(cached.contacts||[]).find(x=>String(x.id)===String(id));if(hit)return Promise.resolve({...cached,contact:hit})}const d=await invoke('nondot-employer-company',{action:'workspace'});d.contact=(d.contacts||[]).find(x=>String(x.id)===String(id))||null;return d}if(C.kind==='employer'&&p==='programs')return invoke('nondot-employer-programs',{action:'workspace'});if(C.kind==='employer'&&p==='program'){const id=new URLSearchParams(location.search).get('id');return id?invoke('nondot-employer-programs',{action:'detail',id}):invoke('nondot-employer-programs',{action:'new'})}if(C.kind==='employer'&&p==='pools')return invoke('nondot-employer-pools',{action:'workspace'});if(C.kind==='employer'&&p==='pool'){const id=new URLSearchParams(location.search).get('id');return id?invoke('nondot-employer-pools',{action:'detail',id}):invoke('nondot-employer-pools',{action:'new'})}if(C.kind==='employer'&&p==='selections')return invoke('nondot-employer-selections',{action:'workspace'});if(C.kind==='employer'&&p==='selection'){const id=new URLSearchParams(location.search).get('id');return id?invoke('nondot-employer-selections',{action:'detail',id}):invoke('nondot-employer-selections',{action:'new'})}if(C.kind==='employer'&&p==='testing')return invoke('nondot-employer-testing',{action:'workspace'});if(C.kind==='employer'&&p==='testing-order'){const id=new URLSearchParams(location.search).get('id');return id?invoke('nondot-employer-testing',{action:'detail',id}):invoke('nondot-employer-testing',{action:'new'})}if(C.kind==='employer'&&p==='results')return invoke('nondot-employer-results',{action:'workspace'});if(C.kind==='employer'&&p==='compliance')return invoke('nondot-employer-compliance',{action:'workspace'});if(C.kind==='employer'&&p==='documents')return invoke('nondot-employer-documents',{action:'workspace'});if(C.kind==='employer'&&p==='document-upload')return invoke('nondot-employer-documents',{action:'workspace'});if(C.kind==='employer'&&p==='consents')return invoke('nondot-employer-consents',{action:'workspace'});if(C.kind==='employer'&&p==='consent-editor'){const id=new URLSearchParams(location.search).get('id');const [doc,rec]=await Promise.all([id?invoke('nondot-employer-consents',{action:'detail',id}):Promise.resolve({ok:true,document:null}),invoke('nondot-employer-consents',{action:'recipients'})]);return {...doc,...rec}}if(C.kind==='employer'&&p==='consent-view'){const id=new URLSearchParams(location.search).get('id');return id?invoke('nondot-employer-consents',{action:'detail',id}):Promise.resolve({ok:true,document:null,deliveries:[]})}if(C.kind==='employer'&&p==='reports')return invoke('nondot-employer-enterprise',{action:'reports_workspace'});if(C.kind==='employer'&&['scheduler','schedule-entry','time-off'].includes(p)){const d=await invoke('nondot-employer-enterprise',{action:'scheduler_workspace'});const id=new URLSearchParams(location.search).get('id');if(p==='schedule-entry')d.entry=id?(d.schedule_entries||[]).find(x=>String(x.id)===String(id))||null:null;if(p==='time-off')d.time_off_request=id?(d.time_off||[]).find(x=>String(x.id)===String(id))||null:null;return d}if(C.kind==='employer'&&['task-manager','task'].includes(p)){const d=await invoke('nondot-employer-enterprise',{action:'tasks_workspace'});const id=new URLSearchParams(location.search).get('id');if(p==='task')d.task=id?(d.tasks||[]).find(x=>String(x.id)===String(id))||null:null;return d}if(C.kind==='employer'&&p==='locations')return invoke('nondot-employer-locations',{action:'workspace'});if(C.kind==='employer'&&p==='location'){const id=new URLSearchParams(location.search).get('id');return id?invoke('nondot-employer-locations',{action:'detail',id}):Promise.resolve({ok:true,location:null})}if(C.kind==='employer'&&p==='integrations')return invoke('nondot-employer-integrations',{action:'workspace'});if(C.kind==='employer'&&p==='integration'){const code=new URLSearchParams(location.search).get('code');const id=new URLSearchParams(location.search).get('id');return invoke('nondot-employer-integrations',{action:'detail',code,id})}if(C.kind==='employer'&&p==='notifications')return invoke('nondot-employer-notifications',{action:'workspace'});if(C.kind==='employer'&&p==='notification'){const id=new URLSearchParams(location.search).get('id');return invoke('nondot-employer-notifications',{action:'notification_detail',id})}if(C.kind==='employer'&&p==='internal-message'){const id=new URLSearchParams(location.search).get('id');if(id)return invoke('nondot-employer-notifications',{action:'internal_detail',id});const rec=await invoke('nondot-employer-notifications',{action:'recipients'});return {...rec,message:null,recipients_log:[]}}if(C.kind==='employer'&&p==='support'){const d=await invoke('nondot-employer-notifications',{action:'support_workspace'});const notificationId=new URLSearchParams(location.search).get('notification_id');if(notificationId){const n=await invoke('nondot-employer-notifications',{action:'notification_detail',id:notificationId});d.notification=n.notification||null}return d;}if(C.kind==='employer'&&p==='support-ticket'){const id=new URLSearchParams(location.search).get('id');const notificationId=new URLSearchParams(location.search).get('notification_id');if(id)return invoke('nondot-employer-notifications',{action:'support_detail',id});if(notificationId){const n=await invoke('nondot-employer-notifications',{action:'notification_detail',id:notificationId});return {ok:true,ticket:null,messages:[],notification:n.notification}}return {ok:true,ticket:null,messages:[],notification:null}}return invoke(apiName(),{action:'workspace',page:p})}

function displayName(c){
  return String(c?.organization?.legal_name||c?.employer?.legal_name||c?.membership?.organization_name||c?.organization_name||c?.workspace?.organization_name||c?.plan?.name||c?.subscription?.plan_name||C.label||'screenings4u Workforce');
}
function navRows(c){
  let allowed=Array.isArray(c?.navigation)&&c.navigation.length?[...c.navigation]:[...C.pages];
  const raw=JSON.stringify(c||{}).toLowerCase();
  const enterprise=raw.includes('workforce employer enterprise')||raw.includes('workforce_employer_enterprise');
  if(enterprise){for(const id of ['scheduler','task-manager','integrations','branding']){if(!allowed.some(x=>norm(x.id)===id)){const local=C.pages.find(x=>norm(x.id)===id);if(local)allowed.push(local)}}}
  else allowed=allowed.filter(x=>!['scheduler','task-manager','integrations','branding'].includes(norm(x.id)));
  if(C.kind==='employer'){allowed=allowed.filter(x=>norm(x.id)!=='team');for(const id of ['notifications','support']){if(!allowed.some(x=>norm(x.id)===id)){const local=C.pages.find(x=>norm(x.id)===id);if(local)allowed.push(local)}}}
  return allowed.map(n=>{const id=norm(n.id);const local=cfgPage(id);return {...n,id,label:local.label||n.label||pretty(id),icon:local.icon||n.icon||'•',href:n.href||`/${id}.html`}});
}
function shell(c){
  const current=norm(page());
  document.body.dataset.portalPage=current;
  NAV=navRows(c);
  const bi=brandInfo();const planLabel=(bi.enabled&&bi.name)?bi.name:displayName(c);applyBranding();
  const links=NAV.map(x=>{const active=current===norm(x.id)||(current==='person'&&norm(x.id)==='people')||(current==='program'&&norm(x.id)==='programs')||(current==='pool'&&norm(x.id)==='pools')||(current==='selection'&&norm(x.id)==='selections')||(current==='testing-order'&&norm(x.id)==='testing')||(current==='document-upload'&&norm(x.id)==='documents')||(current==='notification'&&norm(x.id)==='notifications')||(current==='internal-message'&&norm(x.id)==='notifications')||(current==='support-ticket'&&norm(x.id)==='support')||(current==='location'&&norm(x.id)==='locations')||(current==='integration'&&norm(x.id)==='integrations');return `<a href="${esc(x.href)}" class="${active?'active':''}"${active?' aria-current="page"':''}><span class="ico">${esc(x.icon||'•')}</span><span>${esc(x.label||pretty(x.id))}</span></a>`}).join('');
  document.title=`${cfgPage(current).label} | ${planLabel}`;
  document.body.className='loading';
  document.body.innerHTML=`<div class="app">
    <aside class="side" id="side">
      <div class="brand"><img class="brand-logo brand-logo-ready" src="${esc((brandInfo().enabled&&brandInfo().applyPortal)?brandInfo().logo:'/images/workforce-non-dot.png')}" alt="${esc((brandInfo().enabled&&brandInfo().name)?brandInfo().name:'screenings4u')}"></div>
      <nav class="nav"><div class="nav-title">${esc(planLabel)}</div>${links}</nav>
      <div class="side-foot"><div style="font-size:9px;color:#9fb3c7">Portal</div><div style="font-size:11px;font-weight:800;color:#fff;margin-top:3px">${esc(C.domain)}</div></div>
    </aside>
    <main class="main">
      <header class="top">
        <div class="top-left"><button class="menu" id="menu" type="button" aria-label="Open navigation" aria-expanded="false" aria-controls="mobileNav"><span class="menu-bars" aria-hidden="true"><span></span><span></span><span></span></span></button><button class="sidebar-toggle" id="sidebarToggle" type="button" aria-label="Hide navigation" title="Hide navigation"><span class="sidebar-toggle-bars" aria-hidden="true"><span></span><span></span><span></span></span></button><span class="crumb">${esc(planLabel)} / ${esc(cfgPage(current).label)}</span></div>
        <div class="top-right"><div class="font-sizer" role="group" aria-label="Page font size"><button type="button" id="fontDown" aria-label="Decrease font size">A−</button><button type="button" class="font-reset" id="fontSizeValue" aria-label="Reset font size">${portalFontSize===FONT_DEFAULT?'Default':portalFontSize}</button><button type="button" id="fontUp" aria-label="Increase font size">A+</button></div><span class="pill">${esc(C.kind==='self'?'Self Service':'Management')}</span><span class="pill">NON-DOT</span><button class="signout" id="logout" type="button">Sign out</button></div>
      </header>
      <section class="mobile-nav" id="mobileNav" aria-hidden="true" aria-label="Portal navigation"><div class="mobile-nav-inner"><div class="mobile-nav-head"><div><span>Portal navigation</span><strong>${esc(planLabel)}</strong></div><span class="mobile-nav-current">${esc(cfgPage(current).label)}</span></div><nav class="mobile-nav-links">${links}</nav><div class="mobile-nav-foot"><span>${esc(C.domain)}</span><small>Select a page to close this menu.</small></div></div></section>
      <div class="content"><div id="toast"></div><section class="hero"><span class="hero-kicker">${esc(planLabel)}</span><h1>${esc(cfgPage(current).label)}</h1><p id="subtitle">Loading NON-DOT Workforce workspace.</p><div class="hero-actions" id="actions"></div></section><section class="section" id="content"><div class="panel"><div class="loading-msg">Loading…</div></div></section></div>
    </main>
  </div>`;
  const appEl=$('.app'),sideToggle=$('#sidebarToggle');
  const SIDE_KEY='s4u_employer_sidebar_collapsed_v1';
  const setSidebarCollapsed=collapsed=>{
    const next=!!collapsed&&window.innerWidth>820;
    appEl?.classList.toggle('sidebar-collapsed',next);
    if(sideToggle){sideToggle.classList.toggle('is-collapsed',next);sideToggle.setAttribute('aria-label',next?'Show navigation':'Hide navigation');sideToggle.title=next?'Show navigation':'Hide navigation'}
    try{localStorage.setItem(SIDE_KEY,next?'1':'0')}catch{}
  };
  let savedSide=false;try{savedSide=localStorage.getItem(SIDE_KEY)==='1'}catch{}
  setSidebarCollapsed(savedSide);
  if(sideToggle)sideToggle.onclick=()=>setSidebarCollapsed(!appEl?.classList.contains('sidebar-collapsed'));
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
    window.addEventListener('resize',()=>{if(window.innerWidth>820){setMobileNav(false);let saved=false;try{saved=localStorage.getItem(SIDE_KEY)==='1'}catch{}setSidebarCollapsed(saved)}else appEl?.classList.remove('sidebar-collapsed')},{passive:true});
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
function modalShell(title,body,buttons='',wide=false){const bi=brandInfo(),use=bi.enabled&&bi.applyDialogs;const b=document.createElement('div');b.className='modal-backdrop';b.innerHTML=`<div class="modal${wide?' modal-wide':''}"><div class="brand-modal-head"><img src="${esc(use?bi.logo:'/images/workforce-non-dot.png')}" alt="${esc(use?(bi.name||'Company'):'Workforce NON DOT')}"><div><small>${esc(use?(bi.name||'Company'):'Workforce NON DOT')}</small><h2>${esc(title)}</h2></div></div>${body}<div class="modal-actions">${buttons}</div></div>`;document.body.appendChild(b);return b}
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
const formatBytes=v=>{const n=Number(v||0);if(!n)return'—';if(n<1024)return `${n} B`;if(n<1048576)return `${(n/1024).toFixed(1)} KB`;return `${(n/1048576).toFixed(1)} MB`};

const COLS={
  employers:[['Employer',['legal_name','workforce_display_name']],['Status',['status'],v=>badge(v)],['Primary Contact',['primary_contact_email']],['State',['state']]],
  employees:[['Name',['first_name'],(v,r)=>esc(personName(r))],['Type',['workforce_worker_type'],v=>badge(v==='driver'?'NON-DOT Driver':'Employee')],['Employee #',['employee_number']],['Department',['department']],['Job Title',['job_title']],['Contact',['email'],(v,r)=>`<strong>${esc(r.email||'—')}</strong><br><small>${esc(r.mobile||'—')}</small>`],['Safety Sensitive',['safety_sensitive'],v=>badge(v===true?'yes':v===false?'no':'—')],['Status',['employment_status'],v=>badge(v)]],
  programs:[['Program',['name']],['Workforce',['enrolled_count'],v=>`${esc(v||0)} enrolled`],['Panel',['testing_panel']],['Method',['testing_method']],['Schedule',['testing_frequency'],v=>pretty(v)],['Drug Rate',['drug_random_rate'],v=>percent(v)],['Alcohol Rate',['alcohol_random_rate'],v=>percent(v)],['Effective',['effective_date'],v=>fmt(v)],['Status',['status'],v=>badge(v)]],
  pools:[['Pool',['name']],['Type',['pool_type']],['Program',['program_id']],['Schedule',['selection_schedule']],['Drug Rate',['drug_testing_rate'],v=>percent(v)],['Alcohol Rate',['alcohol_testing_rate'],v=>percent(v)],['Effective',['effective_date'],v=>fmt(v)],['Status',['status'],v=>badge(v)]],
  selections:[['Date',['selection_date','selected_at'],v=>fmt(v)],['Type',['selection_type']],['Population',['population_size']],['Selected',['selected_count','drug_selection_count','drug_selected']],['Status',['status'],v=>badge(v)]],
  testing:[['Order',['order_number']],['Person',['employee.first_name'],(_,r)=>esc(personName(r.employee||{}))],['Reason',['reason'],v=>pretty(v)],['Service',['service_name','testing_panel']],['Program',['program.name','program_id']],['Status',['status'],v=>badge(v)],['Created',['created_at'],v=>fmt(v)]],
  results:[['Order',['testing_orders.order_number','order_number']],['Result',['final_status','verified_result','result'],v=>badge(v)],['Date',['result_date','finalized_at','created_at'],v=>fmt(v)],['Status',['notification_status','status'],v=>badge(v)]],
  compliance:[['Case',['case_number','id']],['Event',['event_type','case_type']],['Priority',['priority'],v=>badge(v)],['Opened',['opened_at','created_at'],v=>fmt(v)],['Status',['status'],v=>badge(v)]],
  documents:[['File',['file_name','title']],['Type',['document_type'],v=>pretty(v)],['Uploaded',['uploaded_at','created_at'],v=>fmtDateTime(v)],['Visibility',['metadata.visibility'],v=>badge(v==='send_to_workforce'?'Sent to Workforce':'Private')],['Size',['size_bytes'],v=>formatBytes(v)]],
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
function cardCopy(id){const m={employers:'Manage customer Employer accounts.',company:'Review company and contact information.',people:'Manage Employees and NON-DOT Drivers.',programs:'Create and maintain NON-DOT testing programs.',pools:'Manage NON-DOT random testing pools.',selections:'Review NON-DOT random selection events.',testing:'Create and track NON-DOT testing orders.',results:'Review testing results available to this account.',compliance:'Track company-policy compliance cases and tasks.',documents:'Review Workforce program documents.',consents:'Manage consents and acknowledgments.',reports:'Review available Workforce reporting.',notifications:'Review Workforce NON-DOT notifications and internal company messages.',support:'Contact Workforce NON-DOT support and continue notification responses.',billing:'Review billing and invoices.',locations:'Manage company locations and facility contacts.',branding:'Review portal branding.',integrations:'Review enabled integrations.','audit-history':'Review account activity history.',profile:'Review your Workforce profile.','my-testing':'Review testing assigned to you.','my-results':'Review results available to you.',training:'Review your training records.',credentials:'Review your credentials.'};return m[id]||'Open this portal area.'}
function rowButtons(r,type){if(C.kind==='self')return'';if(type==='employee'&&C.kind==='employer')return `<a class="btn primary" style="padding:6px 9px;text-decoration:none" href="/person.html?id=${encodeURIComponent(r.id)}">View / Manage</a>`;if(type==='contact'&&C.kind==='employer')return `<a class="btn primary" style="padding:6px 9px;text-decoration:none" href="/contact.html?id=${encodeURIComponent(r.id)}">View / Manage</a>`;if(type==='program'&&C.kind==='employer')return `<a class="btn primary" style="padding:6px 9px;text-decoration:none" href="/program.html?id=${encodeURIComponent(r.id)}">View / Manage</a>`;if(type==='pool'&&C.kind==='employer')return `<a class="btn primary" style="padding:6px 9px;text-decoration:none" href="/pool.html?id=${encodeURIComponent(r.id)}">View / Manage</a>`;if(type==='location'&&C.kind==='employer')return `<a class="btn primary" style="padding:6px 9px;text-decoration:none" href="/location.html?id=${encodeURIComponent(r.id)}">View / Manage</a>`;return `<button class="btn ghost" style="padding:6px 9px" data-edit="${type}" data-id="${esc(r.id)}" type="button">Edit</button><button class="btn ghost" style="padding:6px 9px" data-delete="${type}" data-id="${esc(r.id)}" type="button">Delete</button>`}

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
  $$('[data-document-view]').forEach(b=>b.onclick=()=>viewDocument(b.dataset.documentView));
  $$('[data-document-delete]').forEach(b=>b.onclick=()=>deleteDocument(b.dataset.documentDelete));
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

function renderComplianceHealth(){
  const m=data?.metrics||{};
  const score=Number(m.health_score||0);
  const scoreClass=score>=90?'good':score>=75?'good':score>=60?'warn':'bad';
  const resultTotal=Number(m.completed_results||0);
  const negRate=m.negative_rate==null?'—':`${m.negative_rate}%`;
  const posRate=m.positive_rate==null?'—':`${m.positive_rate}%`;
  const attention=[];
  if(Number(m.positive||0)>0)attention.push([`${m.positive} positive result${Number(m.positive)===1?'':'s'}`,'Review completed results and follow company policy.','/results.html']);
  if(Number(m.mro_review||0)>0)attention.push([`${m.mro_review} MRO item${Number(m.mro_review)===1?'':'s'} pending`,'Testing is awaiting MRO confirmation.','/results.html']);
  if(Number(m.overdue_orders||0)>0)attention.push([`${m.overdue_orders} overdue testing order${Number(m.overdue_orders)===1?'':'s'}`,'Collection deadline has passed and the order is not complete.','/testing.html']);
  if(Number(m.refusals||0)>0)attention.push([`${m.refusals} refusal${Number(m.refusals)===1?'':'s'}`,'Refusals may require employer follow-up under company policy.','/results.html']);
  if(Number(m.invalid||0)>0)attention.push([`${m.invalid} invalid / collection issue${Number(m.invalid)===1?'':'s'}`,'Review whether recollection or other action is needed.','/testing.html']);
  if(Number(m.overdue_cases||0)>0)attention.push([`${m.overdue_cases} overdue compliance case${Number(m.overdue_cases)===1?'':'s'}`,'A compliance due date has passed.','#cases']);
  if(Number(m.active_people||0)>0&&Number(m.active_programs||0)===0)attention.push(['No active testing program','Your active workforce is not attached to an active NON-DOT testing program.','/programs.html']);
  if(Number(m.active_programs||0)>0&&Number(m.active_pools||0)===0)attention.push(['No active random pool','Create a pool if your company policy requires random selections.','/pools.html']);
  const attentionHtml=attention.length?attention.map(([t,d,h])=>`<a class="health-alert" href="${h}"><div><strong>${esc(t)}</strong><span>${esc(d)}</span></div><b>View</b></a>`).join(''):'<div class="health-clear"><strong>No immediate compliance alerts</strong><span>No positive results, overdue testing, overdue cases, or pending MRO items currently require attention.</span></div>';
  const programRows=(data.programs||[]).length?(data.programs||[]).map(p=>`<tr><td><strong>${esc(p.name||'Program')}</strong></td><td>${badge(p.status||'—')}</td><td>${esc(p.testing_frequency||'—')}</td><td>${esc(p.drug_random_rate??'—')}%</td><td>${esc(p.alcohol_random_rate??'—')}%</td><td>${fmt(p.effective_date)}</td><td><a class="btn ghost" style="padding:6px 9px;text-decoration:none" href="/program.html?id=${encodeURIComponent(p.id)}">View</a></td></tr>`).join(''):'<tr><td colspan="7"><div class="empty">No NON-DOT testing programs yet.</div></td></tr>';
  const caseRows=(data.cases||[]).length?(data.cases||[]).map(c=>`<tr><td>${esc(c.case_number||'—')}</td><td>${esc(pretty(c.event_type||'—'))}</td><td>${badge(c.priority||'—')}</td><td>${fmt(c.opened_at||c.created_at)}</td><td>${c.compliance_due_at?fmt(c.compliance_due_at):'—'}</td><td>${badge(c.status||'—')}</td></tr>`).join(''):'<tr><td colspan="6"><div class="empty">No compliance cases are open for this employer.</div></td></tr>';
  return `<div class="compliance-health-head"><div class="health-score ${scoreClass}"><small>Company Health Score</small><strong>${esc(score)}</strong><span>${esc(m.health_label||'—')}</span></div><div class="health-summary"><h2>NON-DOT Compliance Health</h2><p>A live view of testing outcomes, unresolved activity, random-program readiness, and company-policy follow-up.</p><div class="health-links"><a href="/results.html">Testing Results</a><a href="/testing.html">Testing Orders</a><a href="/programs.html">Programs</a><a href="/pools.html">Pools</a></div></div></div>
  <div class="metrics compliance-health-metrics">${[['Negative Rate',negRate,`${m.negative||0} of ${resultTotal} completed results`],['Positive Rate',posRate,`${m.positive||0} positive result${Number(m.positive||0)===1?'':'s'}`],['Pending Tests',m.pending||0,'Orders still moving through testing'],['At Lab',m.at_lab||0,'Specimens currently at laboratory'],['MRO Review',m.mro_review||0,'Awaiting MRO confirmation'],['Refusals',m.refusals||0,'Testing refusals'],['Invalid / Issues',m.invalid||0,'Invalid specimens or collection issues'],['Overdue Orders',m.overdue_orders||0,'Open orders past collection deadline']].map(([a,b,c])=>`<div class="metric"><small>${esc(a)}</small><strong>${esc(b)}</strong><span>${esc(c)}</span></div>`).join('')}</div>
  <div class="compliance-grid">
    <section class="panel"><div class="panel-head"><div><h2>Needs Attention</h2><p>Items that may require employer follow-up.</p></div></div><div class="health-alerts">${attentionHtml}</div></section>
    <section class="panel"><div class="panel-head"><div><h2>Program Readiness</h2><p>Current NON-DOT workforce and random-testing setup.</p></div></div><div class="health-readiness">${[['Active People',m.active_people||0,'People currently active'],['NON-DOT Drivers',m.active_drivers||0,'Active driver records'],['Active Programs',m.active_programs||0,'Testing programs in force'],['Active Pools',m.active_pools||0,'Random testing pools'],['Open Cases',m.open_cases||0,'Compliance cases not closed'],['High Priority Cases',m.high_priority_cases||0,'Urgent / critical open cases']].map(([a,b,c])=>`<div><small>${esc(a)}</small><strong>${esc(b)}</strong><span>${esc(c)}</span></div>`).join('')}</div></section>
  </div>
  <div style="height:14px"></div><section class="panel"><div class="panel-head"><div><h2>Testing Program Health</h2><p>Review whether active programs are configured for the workforce.</p></div><a class="btn ghost" href="/programs.html" style="text-decoration:none">View Programs</a></div><div class="table-wrap"><table><thead><tr><th>Program</th><th>Status</th><th>Schedule</th><th>Drug Rate</th><th>Alcohol Rate</th><th>Effective</th><th></th></tr></thead><tbody>${programRows}</tbody></table></div></section>
  <div style="height:14px"></div><section class="panel" id="cases"><div class="panel-head"><div><h2>Compliance Cases</h2><p>Cases created from testing events or other company-policy concerns.</p></div></div><div class="table-wrap"><table><thead><tr><th>Case</th><th>Event</th><th>Priority</th><th>Opened</th><th>Due</th><th>Status</th></tr></thead><tbody>${caseRows}</tbody></table></div></section>`;
}


function integrationStatusLabel(x){
  const st=String(x?.status||x?.enablement?.status||'not_connected');
  if(st==='connected')return badge('Connected');
  if(st==='submitted')return badge('Submitted');
  if(st==='in_review')return badge('In Review');
  if(st==='awaiting_credentials')return badge('Setup Required');
  if(st==='disabled')return badge('Disconnected');
  return badge('Not Connected');
}
function integrationSetupLabel(x){
  if(x.setup_mode==='oauth')return 'Self-service sign in';
  if(x.setup_mode==='admin_provider_setup')return 'screenings4u setup required';
  if(x.setup_mode==='webhook')return 'Webhook configuration + review';
  if(x.setup_mode==='sftp')return 'SFTP configuration + review';
  return 'Credentials / API configuration + review';
}
function renderIntegrationsIndex(){
  const connected=(data?.integrations||[]).filter(x=>x.enablement?.enabled);
  const catalog=data?.catalog||[];
  const connectedRows=connected.length?connected.map(x=>`<tr><td><strong>${esc(x.integration?.name||'Integration')}</strong><small class="table-sub">${esc(x.integration?.provider||'')}</small></td><td>${esc(x.integration?.category||'—')}</td><td>${integrationStatusLabel(x)}</td><td>${esc(integrationSetupLabel(x))}</td><td>${fmtDateTime(x.enablement?.updated_at||x.configuration_submitted_at||x.enablement?.enabled_at)}</td><td><a class="btn ghost" style="padding:6px 9px;text-decoration:none" href="/integration.html?code=${encodeURIComponent(x.integration?.code||'')}">View / Manage</a></td></tr>`).join(''):'<tr><td colspan="6"><div class="empty">No integrations connected yet. Choose one from the catalog below.</div></td></tr>';
  const groups={};for(const x of catalog){const k=x.integration?.category||'Other';(groups[k]||(groups[k]=[])).push(x)}
  const catalogHtml=Object.entries(groups).map(([cat,rows])=>`<section class="integration-category"><div class="integration-category-head"><h3>${esc(cat)}</h3><span>${rows.length} available</span></div><div class="integration-card-grid">${rows.map(x=>{const i=x.integration||{};const status=x.enablement?.enabled?integrationStatusLabel(x):'<span class="badge">Available</span>';const note=x.setup_mode==='admin_provider_setup'?'Provider connection requires screenings4u configuration before sign-in can be enabled.':x.requires_admin_review?'You can submit your configuration here; screenings4u reviews and activates the connection.':'Connect directly from the portal.';return `<article class="integration-card"><div class="integration-card-top"><div><span class="integration-provider">${esc(i.provider||'Business Integration')}</span><h4>${esc(i.name||'Integration')}</h4></div>${status}</div><p>${esc(i.description||'Connect this business system to your Workforce portal.')}</p><div class="integration-meta"><span>${esc(integrationSetupLabel(x))}</span>${i.auth_method?`<span>${esc(pretty(i.auth_method))}</span>`:''}</div><div class="integration-card-foot"><span>${esc(note)}</span><a class="btn ${x.enablement?.enabled?'ghost':'primary'}" href="/integration.html?code=${encodeURIComponent(i.code||'')}" style="text-decoration:none">${x.enablement?.enabled?'Manage':'Set Up'}</a></div></article>`}).join('')}</div></section>`).join('');
  const m=data?.metrics||{};
  return `${metrics([['Available Integrations',m.available||catalog.length,'Enterprise business connectors'],['Enabled',m.enabled||0,'Added to this company'],['Connected',m.connected||0,'Active connections'],['Pending',m.pending||0,'Awaiting setup or review']])}<div style="height:14px"></div><section class="panel"><div class="panel-head"><div><h2>Connected Integrations</h2><p>Integrations added to this Employer account. Connected and pending setups remain visible here.</p></div></div><div class="table-wrap"><table><thead><tr><th>Integration</th><th>Category</th><th>Status</th><th>Setup</th><th>Updated</th><th>Actions</th></tr></thead><tbody>${connectedRows}</tbody></table></div></section><div style="height:18px"></div><section class="panel" id="integrationCatalog"><div class="panel-head"><div><h2>Business Integration Catalog</h2><p>Choose an Enterprise integration. Some connections are self-service; others require credentials, a vendor contract, provider registration, or screenings4u activation.</p></div></div><div class="integration-catalog">${catalogHtml||'<div class="empty">No Employer integrations are available right now.</div>'}</div></section>`;
}
function credentialInput(field,current){
  const key=field.key||field.name||'';const label=field.label||pretty(key);const secret=field.secret===true||/secret|password|token|key/i.test(key);const type=secret?'password':(field.type==='url'?'url':'text');const val=secret?'':(current?.[key]||'');
  return `<div class="person-field ${field.full_width?'full':''}"><label>${esc(label)}${field.required===false?'':' *'}</label><input name="${esc(key)}" type="${esc(type)}" value="${esc(val)}" ${field.required===false?'':'required'} autocomplete="off">${secret&&current?.[key]?'<small class="field-help">A secure value is already saved. Enter a new value only when replacing it.</small>':field.help?`<small class="field-help">${esc(field.help)}</small>`:''}</div>`;
}
function renderIntegration(){
  const i=data?.integration||{},en=data?.enablement||null,masked=data?.masked_configuration||{},schema=Array.isArray(i.credential_schema)?i.credential_schema:[];
  if(!i.id)return '<div class="panel"><div class="empty">Integration not found.</div></div>';
  const status=en?integrationStatusLabel(data):'<span class="badge">Not Connected</span>';
  const providerNotice=data?.setup_mode==='admin_provider_setup'?`<div class="notice warn"><strong>screenings4u setup required</strong><div style="margin-top:5px">This provider uses OAuth, but the provider application has not been configured yet. You can add it to your account now; screenings4u must configure the provider client ID/secret on the backend before the Connect button can work.</div></div>`:data?.requires_admin_review?`<div class="notice"><strong>Admin review after submission</strong><div style="margin-top:5px">Submit your credentials/configuration here. They are stored securely, and screenings4u will review mappings, vendor access, API permissions, or contract requirements before marking the integration Connected.</div></div>`:`<div class="notice"><strong>Self-service connection</strong><div style="margin-top:5px">This provider can be authorized directly once it is added to your Enterprise account.</div></div>`;
  const fields=schema.length?schema.map(f=>credentialInput(f,masked)).join(''):`<div class="person-field full"><label>Configuration notes</label><textarea name="notes" rows="5" placeholder="Add any account IDs, endpoint details, mapping notes, or implementation information screenings4u should know."></textarea></div>`;
  const setupSection=!en?`<section class="person-card"><div class="person-card-head"><span>02</span><div><h3>Add to Employer Account</h3><p>Enable this Enterprise integration for your company.</p></div></div><div class="integration-action-box"><p>${esc(integrationSetupLabel(data))}</p><button class="btn primary" id="enableIntegration" type="button">Add Integration</button></div></section>`:data.setup_mode==='oauth'?`<section class="person-card"><div class="person-card-head"><span>02</span><div><h3>Connect Account</h3><p>Authorize this provider using its secure sign-in flow.</p></div></div><div class="integration-action-box"><button class="btn primary" id="connectOAuth" type="button">${esc(i.connect_label||'Connect')}</button></div></section>`:data.setup_mode==='admin_provider_setup'?`<section class="person-card"><div class="person-card-head"><span>02</span><div><h3>Provider Setup</h3><p>This provider must be configured by screenings4u before customer authorization can begin.</p></div></div><div class="integration-action-box"><span class="badge warn">In Review</span><p>No additional provider secret should be entered here until screenings4u finishes the OAuth application setup.</p></div></section>`:`<form id="integrationConfigForm" class="person-card"><div class="person-card-head"><span>02</span><div><h3>Connection Configuration</h3><p>Enter the credentials or connection settings supplied by your business system/vendor.</p></div></div><div class="person-fields">${fields}</div><div class="integration-action-box"><button class="btn primary" id="submitIntegrationConfig" type="submit">Submit Configuration</button></div></form>`;
  return `<div class="person-page-head"><div><span>Enterprise Integration</span><h2>${esc(i.name||'Integration')}</h2><p>${esc(i.description||'Connect this business system to your Workforce Employer portal.')}</p></div>${status}</div><div id="integrationNotice"></div><div class="person-form-grid"><section class="person-card"><div class="person-card-head"><span>01</span><div><h3>Integration Details</h3><p>Provider, category, connection method, and activation requirements.</p></div></div><div class="person-fields"><div class="person-field"><label>Provider</label><strong>${esc(i.provider||'—')}</strong></div><div class="person-field"><label>Category</label><strong>${esc(i.category||'—')}</strong></div><div class="person-field"><label>Authentication</label><strong>${esc(pretty(i.auth_method||'manual'))}</strong></div><div class="person-field"><label>Setup path</label><strong>${esc(integrationSetupLabel(data))}</strong></div><div class="person-field full">${providerNotice}</div></div></section>${setupSection}<section class="person-card"><div class="person-card-head"><span>03</span><div><h3>Connection Status</h3><p>Track what has been submitted and whether screenings4u has finished activation.</p></div></div><div class="person-fields"><div class="person-field"><label>Status</label><strong>${esc(pretty(data.status||'not_connected'))}</strong></div><div class="person-field"><label>Added</label><strong>${fmtDateTime(en?.enabled_at)}</strong></div><div class="person-field"><label>Configuration submitted</label><strong>${fmtDateTime(data.configuration_submitted_at)}</strong></div><div class="person-field"><label>Provider ready</label><strong>${data.provider_ready?'Yes':'No'}</strong></div>${en?.notes?`<div class="person-field full"><label>Implementation note</label><div class="notice">${esc(en.notes)}</div></div>`:''}</div></section></div><div class="person-savebar"><a class="btn ghost" href="/integrations.html">Back to Integrations</a>${en?.enabled?'<button class="btn ghost danger" id="disconnectIntegration" type="button">Disconnect</button>':''}</div>`;
}
function integrationNotice(msg,kind='good'){const x=$('#integrationNotice');if(x)x.innerHTML=`<div class="notice ${kind==='bad'?'bad':''}">${esc(msg)}</div>`}
function bindIntegration(){
  const enable=$('#enableIntegration');if(enable)enable.onclick=async()=>{enable.disabled=true;try{await invoke('nondot-employer-integrations',{action:'enable',integration_id:data.integration.id});location.reload()}catch(err){integrationNotice(err.message||String(err),'bad');enable.disabled=false}};
  const oauth=$('#connectOAuth');if(oauth)oauth.onclick=async()=>{oauth.disabled=true;try{const d=await invoke('nondot-employer-integrations',{action:'begin_oauth',enablement_id:data.enablement.id,return_url:location.href});if(!d.authorization_url)throw new Error('Authorization URL was not returned.');location.href=d.authorization_url}catch(err){integrationNotice(err.message||String(err),'bad');oauth.disabled=false}};
  const form=$('#integrationConfigForm');if(form)form.onsubmit=async e=>{e.preventDefault();const configuration=Object.fromEntries(new FormData(form).entries());const btn=$('#submitIntegrationConfig');btn.disabled=true;try{await invoke('nondot-employer-integrations',{action:'submit_configuration',enablement_id:data.enablement.id,configuration});integrationNotice('Configuration submitted. screenings4u will review and activate the connection when required.');setTimeout(()=>location.reload(),500)}catch(err){integrationNotice(err.message||String(err),'bad');btn.disabled=false}};
  const disc=$('#disconnectIntegration');if(disc)disc.onclick=async()=>{const ok=await confirmBox('Disconnect Integration','Disconnect this integration from your Employer account? Existing imported records are not automatically deleted.');if(!ok)return;disc.disabled=true;try{await invoke('nondot-employer-integrations',{action:'disconnect',enablement_id:data.enablement.id});location.href='/integrations.html'}catch(err){integrationNotice(err.message||String(err),'bad');disc.disabled=false}};
}

function renderMgmt(p){
  if(p==='dashboard'){
    const top=C.kind==='ctpa'?
      [['Client Employers',(data.employers||[]).length,'Managed Employer accounts'],['People',(data.employees||[]).length,'Employees + NON-DOT Drivers'],['NON-DOT Programs',(data.programs||[]).length,'Company-policy programs'],['Testing Orders',(data.testing_orders||[]).length,'NON-DOT testing activity']]:
      [['People',(data.employees||[]).length,'Employees + NON-DOT Drivers'],['NON-DOT Programs',(data.programs||[]).length,'Company-policy programs'],['Testing Orders',(data.testing_orders||[]).length,'NON-DOT testing activity'],['Plan',ctx?.plan?.name||ctx?.subscription?.plan_name||data?.plan?.name||data?.subscription?.workforce_plans?.name||data?.subscription?.plan_name||'—','Workforce subscription']];
    return `${metrics(top)}${quickCards()}<section class="getting-started-card"><div><span class="eyebrow">HELP & HOW-TO</span><h2>Need help getting started?</h2><p>Use step-by-step portal guides for common tasks before contacting support.</p></div><a class="btn primary" href="/how-to-guides.html">View How-To Guides</a></section>`;
  }

  if(p==='welcome'){
    const org=ctx?.organization?.legal_name||ctx?.employer?.legal_name||'your company',guides=data?.guides||[];
    const steps=[['Complete company information','Confirm business, contact, and billing information.','/company.html'],['Add staff & contacts','Add HR, Safety, Billing, and other portal contacts.','/company.html'],['Add employees','Build the people list used throughout the portal.','/people.html'],['Create a NON-DOT program','Set up your company-policy testing program.','/programs.html'],['Understand testing & orders','Learn how to order and manage NON-DOT testing.','/testing.html'],['View results','See where completed testing results are available.','/results.html'],['Get help when needed','Use guides first, then contact Support for account-specific help.','/how-to-guides.html']];
    return `<section class="welcome-hero"><span class="eyebrow">WELCOME TO WORKFORCE NON-DOT</span><h1>Welcome, ${esc(org)}</h1><p>Your NON-DOT Employer Portal is active. Use this short setup path to get your account ready and learn the common portal workflows.</p><div class="welcome-status"><span class="badge good">Portal Active</span><span>Secure employer access enabled</span></div></section><section class="welcome-grid"><div class="welcome-steps"><div class="panel-head"><div><h2>First-time setup</h2><p>Complete these items at your own pace.</p></div></div>${steps.map((x,i)=>`<a class="welcome-step" href="${x[2]}"><span>${i+1}</span><div><strong>${esc(x[0])}</strong><small>${esc(x[1])}</small></div><b>→</b></a>`).join('')}</div><aside class="welcome-side"><h2>How-To Guides</h2><p>Open visual, step-by-step instructions created from the actual portal.</p>${guides.slice(0,4).map(g=>guideCard(g)).join('')||'<div class="empty">Published guides for this portal will appear here automatically.</div>'}<a class="btn primary full" href="/how-to-guides.html">Browse All Guides</a></aside></section><section class="welcome-actions"><button class="btn primary" id="completeWelcome">Complete Welcome Setup</button><button class="btn ghost" id="dismissWelcome">Skip for now</button><span>You can reopen Welcome and Help & How-To from the sidebar anytime.</span></section>`;
  }
  if(p==='how-to-guides'){
    const guides=data?.guides||[],groups=['Company Setup','People','Programs','Testing','Results','Documents','Billing','Support'];
    return `<section class="howto-hero"><span class="eyebrow">PORTAL HELP CENTER</span><h1>How-To Guides</h1><p>Search step-by-step instructions for common Employer Portal tasks.</p><div class="howto-search"><input id="howtoSearch" type="search" placeholder="Search guides, tasks, or topics..."><select id="howtoGroup"><option value="">All topics</option>${groups.map(x=>`<option>${x}</option>`).join('')}</select></div></section>${groups.map(group=>{const rows=guides.filter(g=>guideGroup(g)===group);return `<section class="howto-section" data-howto-group="${esc(group)}" ${rows.length?'':'hidden'}><div class="panel-head"><div><h2>${esc(group)}</h2><p>${rows.length} published guide${rows.length===1?'':'s'}</p></div></div><div class="howto-grid">${rows.map(guideCard).join('')}</div></section>`}).join('')}<div class="empty howto-empty" id="howtoEmpty" ${guides.length?'hidden':''}>No published guides are available for this portal yet.</div>`;
  }

  if(p==='employers')return table('Client Employers',data.employers||[],COLS.employers,r=>rowButtons(r,'employer'));
  if(p==='contact')return renderContact();
  if(p==='people')return `${metrics([['People',(data.employees||[]).length,'Employees + NON-DOT Drivers'],['Employees',(data.employees||[]).filter(x=>x.workforce_worker_type!=='driver').length,'Employee records'],['NON-DOT Drivers',(data.employees||[]).filter(x=>x.workforce_worker_type==='driver').length,'Driver records'],['Active',(data.employees||[]).filter(x=>x.employment_status==='active').length,'Currently active']])}<div style="height:14px"></div>${table('People',data.employees||[],COLS.employees,r=>rowButtons(r,'employee'))}`;if(p==='person')return renderPerson();
  if(p==='programs')return `${metrics([['Programs',(data.programs||[]).length,'Random testing programs'],['Active',(data.programs||[]).filter(x=>x.status==='active').length,'Currently active'],['Enrolled',(data.programs||[]).reduce((n,x)=>n+Number(x.enrolled_count||0),0),'Program enrollments'],['Surface','NON-DOT','Company policy']])}<div style="height:14px"></div>${table('Random Testing Programs',data.programs||[],COLS.programs,r=>rowButtons(r,'program'))}`;if(p==='program')return renderProgram();
  if(p==='pools')return table('NON-DOT Random Testing Pools',data.pools||[],[['Pool',['name']],['Members',['member_count']],['Program',['program.name','program_id']],['Schedule',['selection_schedule']],['Drug Rate',['drug_testing_rate'],v=>percent(v)],['Alcohol Rate',['alcohol_testing_rate'],v=>percent(v)],['Effective',['effective_date'],v=>fmt(v)],['Status',['status'],v=>badge(v)]],r=>rowButtons(r,'pool'));if(p==='pool')return renderPool();
  if(p==='selections')return renderSelectionsIndex();if(p==='selection')return renderSelection();
  if(p==='testing')return renderTestingWorkflow();if(p==='testing-order')return renderTestingOrder();
  if(p==='results')return renderResultsIndex();
  if(p==='compliance')return C.kind==='employer'?renderComplianceHealth():`${table('NON-DOT Compliance Cases',data.cases||[],COLS.compliance)}${(data.tasks||[]).length?table('Compliance Tasks',data.tasks||[],[['Task',['title','task_type']],['Due',['due_at'],v=>fmt(v)],['Status',['status'],v=>badge(v)]]):''}`;
  if(p==='documents')return renderDocumentsIndex();if(p==='document-upload')return renderDocumentUpload();if(p==='consents')return C.kind==='employer'?renderConsentLibrary():`${table('Consent & Acknowledgment Forms',data.forms||[],COLS.consents)}${(data.assignments||[]).length?`<div style="height:14px"></div>${table('Assignments',data.assignments||[],COLS.consents)}`:''}`;if(p==='consent-editor')return renderConsentEditor();if(p==='consent-view')return renderConsentView();
  if(p==='notifications')return C.kind==='employer'?renderNotificationsCenter():table('Notifications',data.notifications||[],COLS.notifications);if(p==='notification')return renderNotificationDetail();if(p==='internal-message')return renderInternalMessage();if(p==='support')return renderSupportIndex();if(p==='support-ticket')return renderSupportTicket();
  if(p==='locations')return renderLocationsIndex();if(p==='location')return renderLocation();
  if(p==='integrations')return renderIntegrationsIndex();if(p==='integration')return renderIntegration();
  if(p==='audit-history')return renderAuditHistory();
  if(p==='reports')return renderEnterpriseReports();
  if(p==='scheduler')return renderSchedulerIndex();if(p==='schedule-entry')return renderScheduleEntry();if(p==='time-off')return renderTimeOff();
  if(p==='task-manager')return renderTaskManager();if(p==='task')return renderTask();
  if(p==='billing')return C.kind==='employer'?renderBillingIndex():`${metrics([['Invoices',(data.invoices||[]).length,'Sent invoices'],['Outstanding',(data.outstanding||[]).length,'Balances due'],['Paid / Closed',(data.history||[]).length,'Invoice history'],['Surface','NON-DOT','Workforce billing']])}<div style="height:14px"></div>${table('Invoices',data.invoices||[],COLS.invoices,invoiceButtons)}`;if(p==='invoice')return renderInvoiceView();
  if(p==='branding')return window.EmployerBranding?window.EmployerBranding.render(data,ctx):'<div class="panel"><div class="empty">Branding editor unavailable.</div></div>';
  if(p==='company')return `<div class="panel"><div class="panel-head"><div><h2>${esc(data.employer?.legal_name||ctx?.membership?.organization_name||'Company')}</h2><p>NON-DOT Workforce company profile.</p></div></div><div style="padding:16px">${metrics([['Status',pretty(data.employer?.status||'active')],['State',data.employer?.state||'—'],['Phone',data.employer?.phone||'—'],['Plan',ctx?.subscription?.plan_name||'—']])}</div></div><div style="height:14px"></div>${table('Company Contacts',data.contacts||[],COLS.contacts,r=>rowButtons(r,'contact'))}`;
  return '<div class="panel"><div class="empty">No records available.</div></div>';
}


function billingMoney(v,c='USD'){return new Intl.NumberFormat('en-US',{style:'currency',currency:String(c||'USD').toUpperCase()}).format(Number(v||0))}

function auditDetailText(e){
  const d=e?.details||{};
  const pairs=[];
  const walk=(obj,prefix='')=>{
    if(!obj||typeof obj!=='object')return;
    for(const [k,v] of Object.entries(obj)){
      const key=prefix?`${prefix}.${k}`:k;
      if(v&&typeof v==='object'&&!Array.isArray(v)){walk(v,key);continue}
      if(Array.isArray(v)){if(v.length)pairs.push([key,v.join(', ')]);continue}
      if(v!==null&&v!==undefined&&String(v)!=='')pairs.push([key,String(v)]);
      if(pairs.length>=18)return;
    }
  };
  walk(d);
  return pairs;
}
function renderAuditHistory(){
  const rows=data?.events||[];
  const m=data?.metrics||{};
  const cats=data?.categories||[];
  const body=rows.length?rows.map(e=>`<tr data-audit-row data-search="${esc([e.category,e.action,e.object_type,e.object_label,e.actor_label,e.description].join(' ').toLowerCase())}" data-category="${esc(e.category||'')}" data-date="${esc((e.event_at||'').slice(0,10))}"><td>${badge(e.category||'Activity')}</td><td><strong>${esc(e.action||'Activity')}</strong><small>${esc(e.description||'')}</small></td><td><strong>${esc(e.object_label||'—')}</strong><small>${esc(pretty(e.object_type||'record'))}</small></td><td>${esc(e.actor_label||'System')}</td><td>${fmtDateTime(e.event_at)}</td><td><button class="btn ghost" style="padding:6px 9px" type="button" data-audit-view="${esc(e.id)}">View Details</button></td></tr>`).join(''):`<tr><td colspan="6"><div class="empty">No portal activity has been recorded yet.</div></td></tr>`;
  return `${metrics([['Total Activity',m.total||rows.length,'All visible portal activity'],['Last 24 Hours',m.last_24h||0,'Recent changes'],['Last 7 Days',m.last_7d||0,'Weekly activity'],['Actors',m.users||0,'Users / systems']])}<div style="height:14px"></div><section class="panel audit-panel"><div class="panel-head audit-head"><div><h2>Portal Activity</h2><p>Review activity across your Workforce NON-DOT account. This history is read-only.</p></div><div class="audit-tools"><input id="auditSearch" type="search" placeholder="Search activity, person, record..."><select id="auditCategory"><option value="">All modules</option>${cats.map(c=>`<option value="${esc(c)}">${esc(c)}</option>`).join('')}</select><input id="auditFrom" type="date" aria-label="From date"><input id="auditTo" type="date" aria-label="To date"><button class="btn ghost" type="button" id="auditReset">Reset</button></div></div><div class="table-wrap"><table><thead><tr><th>Module</th><th>Activity</th><th>Record</th><th>Actor</th><th>Date / Time</th><th>Details</th></tr></thead><tbody id="auditRows">${body}</tbody></table></div><div class="audit-count" id="auditCount">Showing ${rows.length} of ${rows.length} activities</div></section>`;
}
function bindAuditHistory(){
  const search=$('#auditSearch'),cat=$('#auditCategory'),from=$('#auditFrom'),to=$('#auditTo'),reset=$('#auditReset'),count=$('#auditCount');
  const apply=()=>{let shown=0;const q=(search?.value||'').trim().toLowerCase(),c=cat?.value||'',f=from?.value||'',t=to?.value||'';$$('[data-audit-row]').forEach(r=>{const d=r.dataset.date||'';const ok=(!q||String(r.dataset.search||'').includes(q))&&(!c||r.dataset.category===c)&&(!f||d>=f)&&(!t||d<=t);r.hidden=!ok;if(ok)shown++});if(count)count.textContent=`Showing ${shown} of ${(data?.events||[]).length} activities`};
  [search,cat,from,to].forEach(x=>{if(x)x.oninput=apply});
  if(reset)reset.onclick=()=>{if(search)search.value='';if(cat)cat.value='';if(from)from.value='';if(to)to.value='';apply()};
  $$('[data-audit-view]').forEach(b=>b.onclick=()=>{const e=(data?.events||[]).find(x=>String(x.id)===String(b.dataset.auditView));if(!e)return;const pairs=auditDetailText(e);const detail=pairs.length?`<div class="audit-detail-grid">${pairs.map(([k,v])=>`<div><small>${esc(pretty(k))}</small><strong>${esc(v)}</strong></div>`).join('')}</div>`:'<p>No additional structured details are available for this activity.</p>';brandedMessage(`${e.category||'Activity'} · ${e.action||'Details'}`,`<div class="audit-dialog-summary"><p><strong>${esc(e.object_label||'—')}</strong></p><p>${esc(e.description||'')}</p><p><small>Actor: ${esc(e.actor_label||'System')} · ${esc(fmtDateTime(e.event_at))}</small></p></div>${detail}`,true)});
}

function renderBillingIndex(){
  const list=data?.invoices||[],open=list.filter(i=>['open','past_due'].includes(String(i.status))),paid=list.filter(i=>String(i.status)==='paid'),outstanding=open.reduce((n,i)=>n+Number(i.amount_due||0),0);
  const rows=list.length?list.map(i=>`<tr><td><strong>${esc(i.invoice_number||'Invoice')}</strong><small>${esc(i.invoice_title||i.purchase_order||'')}</small></td><td>${fmt(i.issued_at||i.created_at)}</td><td>${fmt(i.due_at)}</td><td>${billingMoney(i.total,i.currency)}</td><td>${billingMoney(i.amount_due,i.currency)}</td><td>${badge(i.status)}</td><td><div class="billing-row-actions"><a class="btn ghost" style="padding:6px 9px;text-decoration:none" href="/invoice.html?id=${encodeURIComponent(i.id)}">View</a><button class="btn ghost" style="padding:6px 9px" data-billing-pdf="${esc(i.id)}" type="button">Download PDF</button>${i.payment_url?`<a class="btn primary" style="padding:6px 9px;text-decoration:none" href="${esc(i.payment_url)}">Pay Invoice</a>`:''}</div></td></tr>`).join(''):'<tr><td colspan="7"><div class="empty">No Workforce NON-DOT invoices have been issued to this company yet.</div></td></tr>';
  return `${metrics([['Invoices',list.length,'All issued invoices'],['Open',open.length,'Awaiting payment'],['Outstanding',billingMoney(outstanding),'Current balance due'],['Paid',paid.length,'Completed invoices']])}<div style="height:14px"></div><section class="panel"><div class="panel-head"><div><h2>Workforce NON-DOT Invoices</h2><p>View invoices issued by Workforce NON-DOT, download a PDF copy, or pay an open balance securely through Stripe.</p></div><div class="billing-search"><input id="billingInvoiceSearch" type="search" placeholder="Search invoice number"><select id="billingInvoiceStatus"><option value="">All statuses</option><option value="open">Open</option><option value="past_due">Past Due</option><option value="paid">Paid</option><option value="void">Void</option><option value="uncollectible">Uncollectible</option></select></div></div><div class="table-wrap"><table><thead><tr><th>Invoice</th><th>Issued</th><th>Due</th><th>Total</th><th>Balance</th><th>Status</th><th>Actions</th></tr></thead><tbody id="billingInvoiceRows">${rows}</tbody></table></div></section>`;
}
function renderInvoiceView(){
  const i=data?.invoice;if(!i)return '<div class="panel"><div class="empty">Invoice not found.</div></div>';
  const items=i.invoice_items||[],payments=i.payments||[];
  const itemRows=items.length?items.map(x=>`<tr><td>${esc(x.description||'Invoice item')}</td><td>${esc(x.quantity??1)}</td><td>${billingMoney(x.unit_amount,i.currency)}</td><td>${billingMoney(x.amount,i.currency)}</td></tr>`).join(''):'<tr><td colspan="4"><div class="empty">No invoice item detail is available.</div></td></tr>';
  const payRows=payments.length?payments.map(x=>`<tr><td>${fmtDateTime(x.received_at||x.created_at)}</td><td>${billingMoney(x.amount,x.currency)}</td><td>${esc(pretty(x.payment_method||'payment'))}</td><td>${esc(x.external_reference||'—')}</td></tr>`).join(''):'<tr><td colspan="4"><div class="empty">No payments recorded.</div></td></tr>';
  return `<section class="person-card invoice-page"><div class="panel-head"><div><h2>${esc(i.invoice_number||'Invoice')}</h2><p>${esc(i.invoice_title||'Workforce NON-DOT invoice')}</p></div>${badge(i.status)}</div><div class="invoice-detail-grid"><div><small>Issued</small><strong>${fmt(i.issued_at||i.created_at)}</strong></div><div><small>Due</small><strong>${fmt(i.due_at)}</strong></div><div><small>Total</small><strong>${billingMoney(i.total,i.currency)}</strong></div><div><small>Balance Due</small><strong>${billingMoney(i.amount_due,i.currency)}</strong></div><div><small>Recipient</small><strong>${esc(i.recipient_name||data?.organization?.legal_name||data?.employer?.legal_name||'Employer')}</strong></div><div><small>Email</small><strong>${esc(i.recipient_email||'—')}</strong></div></div>${i.notes?`<div class="invoice-notes"><strong>Notes</strong><p>${esc(i.notes)}</p></div>`:''}</section><div style="height:14px"></div><section class="panel"><div class="panel-head"><div><h2>Invoice Items</h2></div></div><div class="table-wrap"><table><thead><tr><th>Description</th><th>Qty</th><th>Rate</th><th>Amount</th></tr></thead><tbody>${itemRows}</tbody></table></div></section><div style="height:14px"></div><section class="panel"><div class="panel-head"><div><h2>Payment History</h2></div></div><div class="table-wrap"><table><thead><tr><th>Date</th><th>Amount</th><th>Method</th><th>Reference</th></tr></thead><tbody>${payRows}</tbody></table></div></section><div class="person-savebar"><a class="btn ghost" href="/billing.html">Back to Billing</a><button class="btn ghost" type="button" data-billing-pdf="${esc(i.id)}">Download PDF</button>${i.payment_url?`<a class="btn primary" href="${esc(i.payment_url)}" style="text-decoration:none">Pay Invoice</a>`:''}</div>`;
}
async function downloadBillingInvoicePdf(id){try{const d=await invoke('nondot-employer-billing',{action:'download_pdf',invoice_id:id});downloadBase64File(d)}catch(err){notice(err.message||String(err))}}
function bindBilling(){
  $$('[data-billing-pdf]').forEach(b=>b.onclick=()=>downloadBillingInvoicePdf(b.dataset.billingPdf));
  const search=$('#billingInvoiceSearch'),status=$('#billingInvoiceStatus');
  if(search||status){const apply=()=>{const q=String(search?.value||'').trim().toLowerCase(),st=status?.value||'';$$('#billingInvoiceRows tr').forEach(tr=>{const inv=(data?.invoices||[]).find(i=>String(i.id)===String(tr.querySelector('[data-billing-pdf]')?.dataset.billingPdf));if(!inv)return;tr.hidden=!!((st&&String(inv.status)!==st)||(q&&!String(inv.invoice_number||'').toLowerCase().includes(q)))});};search?.addEventListener('input',apply);status?.addEventListener('change',apply)}
}


function documentActions(r){
  return `<button class="btn primary" style="padding:6px 9px" data-document-view="${esc(r.id)}" type="button">View</button><button class="btn ghost document-delete-btn" style="padding:6px 9px" data-document-delete="${esc(r.id)}" type="button" title="Permanently deletes this document and file. This cannot be undone.">Delete</button>`;
}
function renderDocumentsIndex(){
  const rows=data?.documents||[];
  return `<div class="document-help"><div><strong>Your document library</strong><span>Keep company policies, forms, records, and other NON-DOT documents organized in one secure library. Choose document access based on how your company intends to use each file.</span></div></div>
  <div class="document-delete-warning" role="note"><strong>Permanent delete</strong><span>The Delete button permanently removes the document record and stored file. It cannot be restored after deletion.</span></div>
  ${table('Workforce Documents',rows,COLS.documents,r=>documentActions(r))}`;
}
function renderDocumentUpload(){
  return `<form id="documentUploadForm" class="person-form document-upload-form">
    <div class="person-page-head"><div><span>Document Management</span><h2>Upload Document</h2><p>Add a document to your company’s secure NON-DOT document library and choose who should be able to access it.</p></div><span class="badge good">Secure Upload</span></div>
    <div id="documentUploadNotice"></div>
    <div class="person-form-grid">
      <section class="person-card"><div class="person-card-head"><span>01</span><div><h3>Document</h3><p>Choose the file and identify what kind of document it is.</p></div></div><div class="person-fields">
        <div class="person-field full"><label>Choose document <span aria-hidden="true">*</span></label><input type="file" name="file" id="documentFile" required><small class="field-help">Maximum file size: 50 MB.</small></div>
        ${personSelect('document_type','Document type','general',[['general','General Document'],['policy','Company Policy'],['hr','Human Resources'],['safety','Safety'],['testing','Drug & Alcohol Testing'],['compliance','Compliance'],['medical','Medical / Fitness'],['invoice','Invoice / Billing'],['other','Other']],true)}
      </div></section>
      <section class="person-card"><div class="person-card-head"><span>02</span><div><h3>Document Access</h3><p>Choose whether this document is for your company only or should also be shared through your Workforce NON-DOT account.</p></div></div><div class="person-fields">
        ${personSelect('visibility','Who can access this document?','private',[['private','Company Only'],['send_to_workforce','Share with Workforce NON-DOT']],true)}
        <div class="person-field full"><div class="document-route-explain" id="documentRouteExplain"><strong>Company Only</strong><span>Keep this document in your company’s secure document library for your authorized Employer portal users.</span></div></div>
      </div></section>
      <section class="person-card document-review-card"><div class="person-card-head"><span>03</span><div><h3>Your Document Library</h3><p>Keep the records your company needs organized and easy to find.</p></div></div><div class="document-upload-rules"><div><strong>Keep records organized</strong><span>Store policies, forms, testing records, compliance documents, invoices, and other company files in one place.</span></div><div><strong>Choose access per document</strong><span>Keep a file company-only or share it through your Workforce NON-DOT account when the document relates to a service or account need.</span></div><div><strong>Access files anytime</strong><span>Return to Documents to view, download, or manage the files your company has uploaded.</span></div></div></section>
    </div>
    <div class="person-savebar"><a class="btn ghost" href="/documents.html">Cancel</a><button class="btn primary" id="documentUploadSubmit" type="submit">Upload Document</button></div>
  </form>`;
}
function documentUploadNotice(message,type='good'){
  const box=$('#documentUploadNotice');if(!box)return;box.innerHTML=`<div class="notice ${type==='bad'?'notice-bad':''}">${esc(message)}</div>`;
}
function bindDocumentUpload(){
  const form=$('#documentUploadForm');if(!form)return;
  const visibility=form.elements.visibility,route=$('#documentRouteExplain');
  const updateRoute=()=>{const sent=visibility.value==='send_to_workforce';route.innerHTML=sent?'<strong>Send to Workforce NON-DOT</strong><span>This file will also appear in the Workforce NON-DOT management Documents page and staff will receive a branded email that your company uploaded a document for review.</span>':'<strong>Company Only</strong><span>Keep this document in your company’s secure document library for your authorized Employer portal users.</span>';route.classList.toggle('sent',sent)};
  visibility.onchange=updateRoute;updateRoute();
  form.onsubmit=async e=>{
    e.preventDefault();const file=$('#documentFile')?.files?.[0];if(!file){documentUploadNotice('Choose a document to upload.','bad');return}
    if(file.size>52428800){documentUploadNotice('Documents must be 50 MB or smaller.','bad');return}
    const submit=$('#documentUploadSubmit');submit.disabled=true;submit.textContent='Uploading…';
    try{
      const prep=await invoke('nondot-employer-documents',{action:'prepare_upload',file_name:file.name,mime_type:file.type||'application/octet-stream',size_bytes:file.size});
      const up=await sb.storage.from(prep.bucket).uploadToSignedUrl(prep.path,prep.token,file,{contentType:file.type||'application/octet-stream'});
      if(up.error)throw up.error;
      const done=await invoke('nondot-employer-documents',{action:'finalize_upload',document_id:prep.document_id,path:prep.path,file_name:file.name,mime_type:file.type||'application/octet-stream',size_bytes:file.size,document_type:form.elements.document_type.value,visibility:form.elements.visibility.value});
      documentUploadNotice(done.visibility==='send_to_workforce'?'Document uploaded and sent to Workforce NON-DOT for review.':'Document uploaded and kept private.','good');
      setTimeout(()=>location.href='/documents.html',500);
    }catch(err){documentUploadNotice(err.message||String(err),'bad');submit.disabled=false;submit.textContent='Upload Document'}
  };
}
async function viewDocument(id){
  try{const d=await invoke('nondot-employer-documents',{action:'detail',id});if(!d.url)throw new Error('The document could not be opened.');window.open(d.url,'_blank','noopener,noreferrer')}catch(err){notice(err.message||String(err))}
}
async function deleteDocument(id){
  const ok=await confirmBox('Permanently Delete Document','This permanently deletes the document record and stored file. This action cannot be undone.');
  if(!ok)return;
  try{await invoke('nondot-employer-documents',{action:'delete',id});notice('Document permanently deleted.','good');await refresh()}catch(err){notice(err.message||String(err))}
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
function brandedMessage(title,message,allowHtml=false){const body=allowHtml?`<div class="modal-message">${message}</div>`:`<p class="modal-message">${esc(message)}</p>`;const b=modalShell(title,body,`<button class="btn primary" data-close type="button">OK</button>`);b.querySelector('[data-close]').onclick=()=>b.remove()}


function locationTypeLabel(v){return pretty(v||'worksite')}
function locationAddress(x){return [x.address_line1,x.address_line2,x.city,x.state,x.postal_code].filter(Boolean).join(', ')||'—'}
function renderLocationsIndex(){
  const rows=data?.locations||[];
  const cols=[['Location',['name']],['Facility Type',['location_type'],v=>locationTypeLabel(v)],['Building / Facility',['building_name','facility_code']],['Address',['address_line1'],(_,r)=>esc(locationAddress(r))],['Primary',['is_primary'],v=>badge(v?'yes':'no')],['Status',['status'],v=>badge(v)]];
  return `${metrics([['Locations',rows.length,'Company worksites and facilities'],['Active',rows.filter(x=>x.status==='active').length,'Active locations'],['Primary',rows.filter(x=>x.is_primary).length,'Primary company location'],['Facility Types',new Set(rows.map(x=>x.location_type).filter(Boolean)).size,'Types represented']])}<div style="height:14px"></div>${table('Company Locations',rows,cols,r=>rowButtons(r,'location'))}`;
}
function managerFields(prefix,label,v){return `<div class="person-field"><label>${esc(label)} name</label><input name="${prefix}_name" value="${esc(v?.[prefix+'_name']||'')}"></div><div class="person-field"><label>${esc(label)} phone</label><input name="${prefix}_phone" type="tel" value="${esc(v?.[prefix+'_phone']||'')}"></div><div class="person-field full"><label>${esc(label)} email</label><input name="${prefix}_email" type="email" value="${esc(v?.[prefix+'_email']||'')}"></div>`}
function renderLocation(){
  const v={country:'US',status:'active',location_type:'worksite',...data?.location};
  const isEdit=!!v.id;
  return `<form id="locationForm" class="person-form"><div class="person-page-head"><div><span>Location Management</span><h2>${isEdit?`Manage ${esc(v.name||'Location')}`:'Add Company Location'}</h2><p>Maintain complete facility, address, operating, and management contact information for each company location.</p></div>${v.is_primary?'<span class="badge good">Primary Location</span>':'<span class="badge warn">Company Location</span>'}</div>
  <div class="person-form-grid">
    <section class="person-card"><div class="person-card-head"><span>01</span><div><h3>Location Identity</h3><p>Name, facility type, building, and internal site identifiers.</p></div></div><div class="person-fields">
      ${personInput('name','Location name',v,true)}${personSelect('location_type','Facility type',v.location_type,[['worksite','Worksite'],['office','Office'],['plant','Plant / Manufacturing'],['warehouse','Warehouse'],['distribution_center','Distribution Center'],['dock','Dock / Terminal'],['branch','Branch'],['yard','Yard'],['other','Other']])}${personInput('building_name','Building / facility name',v)}${personInput('facility_code','Facility / location code',v)}${personInput('phone','Main phone',v,false,'tel')}${personInput('email','Location email',v,false,'email')}${personInput('fax','Fax',v,false,'tel')}${personInput('timezone','Timezone',v)}${personSelect('status','Status',v.status,[['active','Active'],['inactive','Inactive']])}${personSelect('is_primary','Primary company location',String(!!v.is_primary),[['false','No'],['true','Yes']])}
    </div></section>
    <section class="person-card"><div class="person-card-head"><span>02</span><div><h3>Address</h3><p>Physical address for this company location.</p></div></div><div class="person-fields">
      ${personInput('address_line1','Street address',v,true,'text',true)}${personInput('address_line2','Suite / unit / building detail',v,false,'text',true)}${personInput('city','City',v,true)}${personInput('state','State',v,true)}${personInput('postal_code','ZIP / Postal code',v,true)}${personInput('country','Country',v)}
    </div></section>
    <section class="person-card"><div class="person-card-head"><span>03</span><div><h3>Operations</h3><p>Hours, departments, and operational notes for this site.</p></div></div><div class="person-fields">
      <div class="person-field full"><label>Operating hours</label><textarea name="operating_hours" rows="4">${esc(v.operating_hours||'')}</textarea></div><div class="person-field full"><label>Departments / areas at this location</label><textarea name="department_summary" rows="4">${esc(v.department_summary||'')}</textarea></div>
    </div></section>
    <section class="person-card"><div class="person-card-head"><span>04</span><div><h3>Facility Leadership</h3><p>Building, plant, warehouse, dock, and department managers.</p></div></div><div class="person-fields">
      ${managerFields('building_manager','Building / Facility Manager',v)}${managerFields('plant_manager','Plant Manager',v)}${managerFields('warehouse_manager','Warehouse Manager',v)}${managerFields('dock_manager','Dock Manager',v)}${managerFields('department_manager','Department Manager',v)}
    </div></section>
    <section class="person-card"><div class="person-card-head"><span>05</span><div><h3>Shift Leadership</h3><p>Day and night shift management contacts.</p></div></div><div class="person-fields">
      ${managerFields('day_shift_manager','Day Shift Manager',v)}${managerFields('night_shift_manager','Night Shift Manager',v)}
    </div></section>
    <section class="person-card"><div class="person-card-head"><span>06</span><div><h3>Safety & HR</h3><p>Site safety and human-resources contacts.</p></div></div><div class="person-fields">
      ${managerFields('safety_manager','Safety Manager',v)}${managerFields('hr_manager','HR Manager',v)}
    </div></section>
    <section class="person-card"><div class="person-card-head"><span>07</span><div><h3>Location Notes</h3><p>Internal information about entrances, docks, access, parking, special instructions, or site operations.</p></div></div><div class="person-fields"><div class="person-field full"><label>Notes</label><textarea name="notes" rows="6">${esc(v.notes||'')}</textarea></div></div></section>
  </div><div class="person-savebar"><a class="btn ghost" href="/locations.html">Cancel</a>${isEdit?'<button class="btn ghost danger" type="button" id="archiveLocation">Delete Location</button>':''}<button class="btn primary" type="submit">${isEdit?'Save Changes':'Create Location'}</button></div></form>`;
}
function bindLocation(){const f=$('#locationForm');if(!f)return;f.onsubmit=async ev=>{ev.preventDefault();const vals=Object.fromEntries(new FormData(f).entries());vals.id=data?.location?.id||undefined;vals.is_primary=vals.is_primary==='true';try{const out=await invoke('nondot-employer-locations',{action:'save',location:vals});notice(data?.location?.id?'Location updated.':'Location created.','good');setTimeout(()=>location.href=`/location.html?id=${encodeURIComponent(out.location.id)}`,300)}catch(err){brandedMessage('Unable to save location',err.message||String(err))}};const del=$('#archiveLocation');if(del)del.onclick=async()=>{const ok=await confirmBox('Permanently remove location?','This removes the location from the active company location records. Continue?');if(!ok)return;try{await invoke('nondot-employer-locations',{action:'delete',id:data.location.id});location.href='/locations.html'}catch(err){brandedMessage('Unable to remove location',err.message||String(err))}}}

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



function testingWorkflowStep(status){
  const s=String(status||'').toLowerCase();
  if(['final_result','closed','completed'].includes(s))return 5;
  if(['mro_review','mro_confirmation'].includes(s))return 4;
  if(['laboratory','at_lab'].includes(s))return 3;
  if(['collected','at_collection','processing'].includes(s))return 2;
  return 1;
}
function workflowLabelForStep(n){return ['Ordered','Processing','At Lab','MRO Confirmation','Completed'][Math.max(1,Math.min(5,Number(n)||1))-1]}
function workflowStageSummary(rows=[]){
  const counts=[0,0,0,0,0];
  for(const r of rows){counts[testingWorkflowStep(r.status)]++}
  return counts;
}
function workflowBoard(rows=[]){
  const labels=['Ordered','Processing','At Lab','MRO Confirmation','Completed'];
  const groups=labels.map(()=>[]);
  for(const r of rows){groups[testingWorkflowStep(r.status)-1].push(r)}
  return `<div class="workflow-board">${labels.map((label,i)=>`<section class="workflow-column"><header><span>${String(i+1).padStart(2,'0')}</span><div><strong>${esc(label)}</strong><small>${groups[i].length} order${groups[i].length===1?'':'s'}</small></div></header><div class="workflow-column-body">${groups[i].length?groups[i].slice(0,8).map(r=>`<a class="workflow-order-card" href="/testing-order.html?id=${encodeURIComponent(r.id)}"><strong>${esc(r.order_number||'Testing Order')}</strong><span>${esc(personName(r.employee||{}))}</span><small>${esc(r.service_name||r.charge?.service_name||r.testing_panel||pretty(r.test_type||''))}</small><em>${esc(pretty(r.status||label))}</em></a>`).join(''):`<div class="workflow-empty">No orders in this stage.</div>`}</div></section>`).join('')}</div>`;
}
function renderTestingWorkflow(){
  const rows=Array.isArray(data?.testing_orders)?data.testing_orders:[];
  const counts=workflowStageSummary(rows);
  const active=rows.filter(r=>!['cancelled','closed','final_result','completed'].includes(String(r.status||'').toLowerCase())).length;
  const cards=metrics([['Total Orders',rows.length,'All NON-DOT testing orders'],['Active',active,'Orders still moving through testing'],['At Lab',counts[3]||0,'Specimens currently at the laboratory'],['Completed',counts[5]||0,'Finished testing orders']]);
  const board=`<div class="panel workflow-panel"><div class="panel-head"><div><h2>Testing Workflow</h2><p>Follow every order through the live testing process. Select an order at any stage to open its full record.</p></div></div><div class="workflow-board-wrap">${workflowBoard(rows)}</div></div>`;
  const list=table('All NON-DOT Testing Orders',rows,COLS.testing,r=>`<a class="btn primary" style="padding:6px 9px;text-decoration:none" href="/testing-order.html?id=${encodeURIComponent(r.id)}">View Order</a>`);
  return `${cards}<div style="height:14px"></div>${board}<div style="height:14px"></div>${list}`;
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
    ['Workflow',['workflow_label'],(_,r)=>resultWorkflow(r)],
    ['Updated',['result.finalized_at','result.updated_at','updated_at','created_at'],v=>fmt(v)]
  ];
  const stageCounts=[0,0,0,0,0];
  for(const r of rows){const step=Math.max(1,Math.min(5,Number(r.workflow_step||testingWorkflowStep(r.status))));stageCounts[step-1]++}
  const pipeline=`<div class="panel workflow-panel results-workflow-panel"><div class="panel-head"><div><h2>Live Results Workflow</h2><p>Each testing order advances through these stages as collection, laboratory, MRO, and final-result activity is completed.</p></div></div><div class="results-stage-strip">${['Ordered','Processing','At Lab','MRO Confirmation','Completed'].map((label,i)=>`<div class="results-stage"><span>${i+1}</span><div><strong>${esc(label)}</strong><small>${stageCounts[i]} order${stageCounts[i]===1?'':'s'}</small></div></div>`).join('')}</div></div>`;
  return `${pipeline}<div style="height:14px"></div>${table('NON-DOT Testing Results & Status',rows,cols,resultButtons)}`;
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


function authoredDocType(v){const m={general:'General Document',policy:'Policy',acknowledgment:'Acknowledgment',notice:'Notice',hr:'HR Document',safety:'Safety Document',training:'Training Document',procedure:'Procedure',handbook:'Handbook',other:'Other'};return m[String(v||'').toLowerCase()]||pretty(v||'General')}
function consentDocActions(r){return `<a class="btn primary" style="padding:6px 9px;text-decoration:none" href="/consent-view.html?id=${encodeURIComponent(r.id)}">View</a><a class="btn ghost" style="padding:6px 9px;text-decoration:none" href="/consent-editor.html?id=${encodeURIComponent(r.id)}">Edit</a><button class="btn ghost" style="padding:6px 9px" data-authored-download="${esc(r.id)}" type="button">Download</button><button class="btn ghost danger-inline" style="padding:6px 9px" data-authored-delete="${esc(r.id)}" type="button" title="Permanently delete this authored document and its delivery records.">Delete</button>`}
function renderConsentLibrary(){
  const rows=data?.documents||[];
  const body=rows.length?rows.map(r=>`<tr><td><strong>${esc(r.title||'Untitled')}</strong><small>${esc(r.description||'')}</small></td><td>${esc(authoredDocType(r.document_type))}</td><td>v${esc(r.version||1)}</td><td>${badge(r.status||'draft')}</td><td>${fmt(r.updated_at||r.created_at)}</td><td>${esc(r.delivery_counts?.sent||0)} / ${esc(r.delivery_counts?.total||0)}</td><td>${r.require_acknowledgment?`${esc(r.delivery_counts?.ack||0)} acknowledged`:'Not required'}</td><td><div class="table-actions">${consentDocActions(r)}</div></td></tr>`).join(''):'<tr><td colspan="8"><div class="empty">No company documents have been created yet.</div></td></tr>';
  return `<div class="document-help"><div><strong>Company Document Center</strong><span>Create any company document you need, send it to employees, NON-DOT drivers, or staff contacts, and retain the record here.</span></div></div><div id="authoredLibraryNotice"></div><section class="panel"><div class="panel-head"><div><h2>Created Documents</h2><p>View, edit, download, distribute, or permanently delete your company-authored documents.</p></div><span class="badge">${rows.length} records</span></div><div class="table-wrap"><table><thead><tr><th>Document</th><th>Type</th><th>Version</th><th>Status</th><th>Updated</th><th>Sent</th><th>Acknowledgment</th><th>Actions</th></tr></thead><tbody>${body}</tbody></table></div></section>`;
}
function editorToolbar(){return `<div class="rich-toolbar" role="toolbar" aria-label="Document formatting"><select data-editor-block title="Text style"><option value="p">Paragraph</option><option value="h1">Heading 1</option><option value="h2">Heading 2</option><option value="h3">Heading 3</option><option value="blockquote">Quote</option></select><select data-editor-font title="Font"><option value="Arial">Arial</option><option value="Georgia">Georgia</option><option value="Times New Roman">Times New Roman</option><option value="Verdana">Verdana</option></select><select data-editor-size title="Font size"><option value="2">Small</option><option value="3" selected>Normal</option><option value="4">Large</option><option value="5">X-Large</option><option value="6">XX-Large</option></select><button type="button" data-cmd="bold"><b>B</b></button><button type="button" data-cmd="italic"><i>I</i></button><button type="button" data-cmd="underline"><u>U</u></button><button type="button" data-cmd="insertUnorderedList">• List</button><button type="button" data-cmd="insertOrderedList">1. List</button><button type="button" data-cmd="justifyLeft">Left</button><button type="button" data-cmd="justifyCenter">Center</button><button type="button" data-cmd="justifyRight">Right</button><button type="button" data-cmd="outdent">Outdent</button><button type="button" data-cmd="indent">Indent</button><button type="button" data-cmd="undo">Undo</button><button type="button" data-cmd="redo">Redo</button><button type="button" data-cmd="removeFormat">Clear</button></div><div class="rich-insert-row"><label>Link URL <input type="url" id="editorLinkUrl" placeholder="https://..."></label><button class="btn ghost" type="button" id="editorAddLink">Add Link</button><label>Button text <input type="text" id="editorButtonText" placeholder="Learn More"></label><label>Button URL <input type="url" id="editorButtonUrl" placeholder="https://..."></label><button class="btn ghost" type="button" id="editorAddButton">Insert Button</button></div>`}
function recipientList(){const em=data?.employees||[],ct=data?.contacts||[];return `<div class="recipient-groups"><div class="recipient-group"><div class="recipient-group-head"><strong>Employees / NON-DOT Drivers</strong><label><input type="checkbox" data-check-all="employee"> Select all</label></div>${em.length?em.map(x=>`<label class="recipient-row"><input type="checkbox" name="recipient" data-type="employee" value="${esc(x.id)}"><span><strong>${esc([x.first_name,x.last_name].filter(Boolean).join(' ')||'Person')}</strong><small>${esc(pretty(x.workforce_worker_type||'employee'))}${x.email?` · ${esc(x.email)}`:''}</small></span></label>`).join(''):'<div class="empty small">No employee records available.</div>'}</div><div class="recipient-group"><div class="recipient-group-head"><strong>Company Staff / Contacts</strong><label><input type="checkbox" data-check-all="contact"> Select all</label></div>${ct.length?ct.map(x=>`<label class="recipient-row"><input type="checkbox" name="recipient" data-type="contact" value="${esc(x.id)}"><span><strong>${esc(x.full_name||[x.first_name,x.last_name].filter(Boolean).join(' ')||'Contact')}</strong><small>${esc(pretty(x.contact_type||'staff'))}${x.email?` · ${esc(x.email)}`:''}</small></span></label>`).join(''):'<div class="empty small">No active company contacts available.</div>'}</div></div>`}
function renderConsentEditor(){const d=data?.document||{};const editing=!!d.id;return `<form id="authoredDocumentForm" class="person-form authored-editor-form"><div class="person-page-head"><div><span>Company Documents</span><h2>${editing?'Edit Document':'Create Document'}</h2><p>Build a formatted company document and optionally send it to employees, NON-DOT drivers, or staff contacts.</p></div><span class="badge ${d.status==='published'?'good':''}">${esc(editing?`Version ${d.version||1}`:'New Document')}</span></div><div id="authoredEditorNotice"></div><div class="person-form-grid"><section class="person-card"><div class="person-card-head"><span>01</span><div><h3>Document Details</h3><p>Name and categorize this document.</p></div></div><div class="person-fields">${personInput('title','Document title',d.title||'',true)}${personSelect('document_type','Document type',d.document_type||'general',[['general','General Document'],['policy','Policy'],['acknowledgment','Acknowledgment'],['notice','Notice'],['hr','HR Document'],['safety','Safety Document'],['training','Training Document'],['procedure','Procedure'],['handbook','Handbook'],['other','Other']],true)}${personInput('description','Short description',d.description||'')}<div class="person-field full"><label><input type="checkbox" name="require_acknowledgment" ${d.require_acknowledgment?'checked':''}> Require acknowledgment from recipients</label></div></div></section><section class="person-card full-card authored-content-card"><div class="person-card-head"><span>02</span><div><h3>Document Editor</h3><p>Format the document using the toolbar. Links and styled buttons can be inserted directly into the content.</p></div></div>${editorToolbar()}<div id="richEditor" class="rich-editor" contenteditable="true" spellcheck="true">${d.content_html||'<h2>Document Title</h2><p>Start writing your document here...</p>'}</div></section><section class="person-card full-card"><div class="person-card-head"><span>03</span><div><h3>Send to Employees or Staff</h3><p>You can save first without sending, or choose recipients and use Save & Send.</p></div></div>${recipientList()}<div class="person-fields"><div class="person-field"><label>Due date (optional)</label><input type="date" name="due_at"></div></div></section></div><div class="person-savebar"><a class="btn ghost" href="/consents.html">Cancel</a>${editing?`<a class="btn ghost" href="/consent-view.html?id=${encodeURIComponent(d.id)}">View</a>`:''}<button class="btn ghost" id="saveAuthoredDraft" type="button">Save Draft</button><button class="btn primary" id="saveAndSendAuthored" type="button">Save & Send</button></div></form>`}
function renderConsentView(){const d=data?.document;if(!d)return '<div class="panel"><div class="empty">Document not found.</div></div>';const deliveries=data?.deliveries||[];const rows=deliveries.length?deliveries.map(x=>`<tr><td>${esc(x.recipient_name||'—')}</td><td>${esc(pretty(x.recipient_type||'—'))}</td><td>${esc(x.recipient_email||'—')}</td><td>${badge(x.status||'—')}</td><td>${fmt(x.sent_at)}</td><td>${fmt(x.acknowledged_at)}</td></tr>`).join(''):'<tr><td colspan="6"><div class="empty">This document has not been sent yet.</div></td></tr>';return `<div id="authoredViewNotice"></div><section class="panel authored-view-head"><div class="panel-head"><div><h2>${esc(d.title)}</h2><p>${esc(d.description||authoredDocType(d.document_type))} · Version ${esc(d.version||1)} · ${esc(pretty(d.status||'draft'))}</p></div><div class="table-actions"><a class="btn ghost" href="/consent-editor.html?id=${encodeURIComponent(d.id)}">Edit</a><button class="btn ghost" data-view-download="${esc(d.id)}" type="button">Download PDF</button></div></div><article class="authored-document-view">${d.content_html}</article></section><div style="height:14px"></div><section class="panel"><div class="panel-head"><div><h2>Delivery History</h2><p>Recipients receive a PDF snapshot of the version that was sent.</p></div></div><div class="table-wrap"><table><thead><tr><th>Recipient</th><th>Type</th><th>Email</th><th>Status</th><th>Sent</th><th>Acknowledged</th></tr></thead><tbody>${rows}</tbody></table></div></section><div style="height:14px"></div><section class="panel danger-zone"><div class="panel-head"><div><h2>Permanent Delete</h2><p>This permanently deletes the document and its delivery history. This cannot be undone.</p></div><button class="btn ghost danger-inline" data-view-delete="${esc(d.id)}" type="button">Delete Document</button></div></section>`}
function authoredNotice(target,msg,type='good'){const box=$(target);if(box)box.innerHTML=`<div class="notice ${type==='bad'?'notice-bad':''}">${esc(msg)}</div>`}
function base64Download(b64,name,mime='application/pdf'){const bytes=Uint8Array.from(atob(b64),c=>c.charCodeAt(0));const blob=new Blob([bytes],{type:mime}),url=URL.createObjectURL(blob),a=document.createElement('a');a.href=url;a.download=name||'document.pdf';document.body.appendChild(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),1000)}
async function authoredDownload(id){try{const r=await invoke('nondot-employer-consents',{action:'download_pdf',id});base64Download(r.base64,r.file_name,r.mime_type)}catch(err){notice(err.message||String(err))}}
function bindConsentLibrary(){
  $$('[data-authored-download]').forEach(b=>b.onclick=()=>authoredDownload(b.dataset.authoredDownload));
  $$('[data-authored-delete]').forEach(b=>b.onclick=async()=>{if(b.dataset.confirm!=='yes'){b.dataset.confirm='yes';b.textContent='Confirm Delete';b.classList.add('confirming');authoredNotice('#authoredLibraryNotice','Permanent delete cannot be undone. Click Confirm Delete again to remove the document.','bad');return}try{await invoke('nondot-employer-consents',{action:'delete',id:b.dataset.authoredDelete});authoredNotice('#authoredLibraryNotice','Document permanently deleted.','good');await refresh()}catch(err){authoredNotice('#authoredLibraryNotice',err.message||String(err),'bad')}});
}
function editorCmd(cmd,value=null){document.execCommand(cmd,false,value);$('#richEditor')?.focus()}
function bindConsentEditor(){const form=$('#authoredDocumentForm'),editor=$('#richEditor');if(!form||!editor)return;
  $$('[data-cmd]').forEach(b=>b.onclick=()=>editorCmd(b.dataset.cmd));
  $('[data-editor-block]').onchange=e=>editorCmd('formatBlock',e.target.value);
  $('[data-editor-font]').onchange=e=>editorCmd('fontName',e.target.value);
  $('[data-editor-size]').onchange=e=>editorCmd('fontSize',e.target.value);
  $('#editorAddLink').onclick=()=>{const u=$('#editorLinkUrl').value.trim();if(!u){authoredNotice('#authoredEditorNotice','Enter a link URL first.','bad');return}editorCmd('createLink',u);$('#editorLinkUrl').value=''};
  $('#editorAddButton').onclick=()=>{const t=$('#editorButtonText').value.trim(),u=$('#editorButtonUrl').value.trim();if(!t||!u){authoredNotice('#authoredEditorNotice','Enter both button text and a button URL.','bad');return}editor.focus();document.execCommand('insertHTML',false,`<a href="${esc(u)}" target="_blank" rel="noopener" style="display:inline-block;background:#ff6500;color:#fff;text-decoration:none;padding:10px 16px;border-radius:7px;font-weight:700">${esc(t)}</a>`);$('#editorButtonText').value='';$('#editorButtonUrl').value=''};
  $$('[data-check-all]').forEach(c=>c.onchange=()=>$$(`input[name="recipient"][data-type="${c.dataset.checkAll}"]`).forEach(x=>x.checked=c.checked));
  const save=async(send)=>{const title=form.elements.title.value.trim();if(!title){authoredNotice('#authoredEditorNotice','Document title is required.','bad');return null}const html=editor.innerHTML.trim();if(!editor.innerText.trim()){authoredNotice('#authoredEditorNotice','Add document content before saving.','bad');return null}const id=data?.document?.id||null;const saved=await invoke('nondot-employer-consents',{action:'save',document:{id,title,document_type:form.elements.document_type.value,description:form.elements.description.value,content_html:html,status:send?'published':'draft',require_acknowledgment:form.elements.require_acknowledgment.checked}});data.document=saved.document;if(send){const rec=$$('input[name="recipient"]:checked').map(x=>({type:x.dataset.type,id:x.value}));if(!rec.length){authoredNotice('#authoredEditorNotice','Document saved. Select at least one employee or staff contact before sending.','bad');return saved.document}const due=form.elements.due_at.value;const sent=await invoke('nondot-employer-consents',{action:'send',document_id:saved.document.id,recipients:rec,due_at:due?`${due}T23:59:59`:null});authoredNotice('#authoredEditorNotice',`Document saved and sent to ${sent.sent} recipient${sent.sent===1?'':'s'}${sent.failed?`; ${sent.failed} failed`:''}.`,'good');setTimeout(()=>location.href=`/consent-view.html?id=${encodeURIComponent(saved.document.id)}`,600)}else{authoredNotice('#authoredEditorNotice','Draft saved.','good');if(!id)history.replaceState(null,'',`/consent-editor.html?id=${encodeURIComponent(saved.document.id)}`)}return saved.document};
  $('#saveAuthoredDraft').onclick=async()=>{try{await save(false)}catch(err){authoredNotice('#authoredEditorNotice',err.message||String(err),'bad')}};
  $('#saveAndSendAuthored').onclick=async()=>{try{await save(true)}catch(err){authoredNotice('#authoredEditorNotice',err.message||String(err),'bad')}};
}
function bindConsentView(){
  $$('[data-view-download]').forEach(b=>b.onclick=()=>authoredDownload(b.dataset.viewDownload));
  $$('[data-view-delete]').forEach(b=>b.onclick=async()=>{if(b.dataset.confirm!=='yes'){b.dataset.confirm='yes';b.textContent='Confirm Permanent Delete';b.classList.add('confirming');authoredNotice('#authoredViewNotice','This permanently deletes the document and delivery history. Click Confirm Permanent Delete again to continue.','bad');return}try{await invoke('nondot-employer-consents',{action:'delete',id:b.dataset.viewDelete});location.href='/consents.html'}catch(err){authoredNotice('#authoredViewNotice',err.message||String(err),'bad')}})
}


function enterpriseAssigneeOptions(selectedEmployee='',selectedContact=''){
  return `<option value="">Unassigned / Company-wide</option>${(data?.employees||[]).map(x=>`<option value="employee:${esc(x.id)}" ${String(selectedEmployee)===String(x.id)?'selected':''}>${esc([x.first_name,x.last_name].filter(Boolean).join(' ')||x.employee_number||'Employee')} — ${esc(x.workforce_worker_type==='driver'?'NON-DOT Driver':'Employee')}</option>`).join('')}${(data?.contacts||[]).map(x=>`<option value="contact:${esc(x.id)}" ${String(selectedContact)===String(x.id)?'selected':''}>${esc(x.full_name||[x.first_name,x.last_name].filter(Boolean).join(' ')||'Staff Contact')} — ${esc(pretty(x.contact_type||'Staff'))}</option>`).join('')}`;
}
function downloadBase64File(d){const raw=atob(d.base64||'');const bytes=new Uint8Array(raw.length);for(let i=0;i<raw.length;i++)bytes[i]=raw.charCodeAt(i);const blob=new Blob([bytes],{type:d.mime_type||'application/octet-stream'});const a=document.createElement('a');a.href=URL.createObjectURL(blob);a.download=d.file_name||'report';document.body.appendChild(a);a.click();setTimeout(()=>{URL.revokeObjectURL(a.href);a.remove()},500)}
function renderEnterpriseReports(){
  const opts=(data?.reports||[]).map(r=>`<option value="${esc(r.code)}">${esc(r.name)}</option>`).join('');
  return `<section class="panel"><div class="panel-head"><div><h2>Company Reports</h2><p>Select a report, preview live company data, then export it as PDF or CSV.</p></div></div><div style="padding:16px"><div class="form-grid"><div class="field"><label>Report</label><select id="reportType">${opts}</select></div><div class="field"><label>Export</label><div style="display:flex;gap:8px;flex-wrap:wrap"><button class="btn primary" id="reportPreview" type="button">Run Report</button><button class="btn ghost" id="reportPdf" type="button">Download PDF</button><button class="btn ghost" id="reportCsv" type="button">Download CSV</button></div></div></div><div id="reportNotice"></div><div id="reportPreviewArea" style="margin-top:14px"><div class="empty">Choose a report and click Run Report.</div></div></div></section>`;
}
function bindEnterpriseReports(){
  const show=async()=>{try{const d=await invoke('nondot-employer-enterprise',{action:'report_preview',report_type:$('#reportType').value});const rows=d.rows||[],cols=d.columns||[];$('#reportPreviewArea').innerHTML=`<div class="panel"><div class="panel-head"><h3>${esc(d.title||'Report')}</h3><span class="badge good">${rows.length} records</span></div><div class="table-wrap"><table><thead><tr>${cols.map(c=>`<th>${esc(c)}</th>`).join('')}</tr></thead><tbody>${rows.length?rows.map(r=>`<tr>${r.map(v=>`<td>${esc(v??'')}</td>`).join('')}</tr>`).join(''):`<tr><td colspan="${Math.max(cols.length,1)}"><div class="empty">No records for this report.</div></td></tr>`}</tbody></table></div></div>`}catch(err){notice(err.message||String(err))}};
  const exp=async format=>{try{const d=await invoke('nondot-employer-enterprise',{action:'report_export',report_type:$('#reportType').value,format});downloadBase64File(d)}catch(err){notice(err.message||String(err))}};
  $('#reportPreview').onclick=show;$('#reportPdf').onclick=()=>exp('pdf');$('#reportCsv').onclick=()=>exp('csv');show();
}
function renderSchedulerIndex(){
  const entries=data?.schedule_entries||[],time=data?.time_off||[];
  const scheduleRows=entries.length?entries.map(x=>`<tr><td><strong>${esc(x.title||'Schedule')}</strong></td><td>${esc(pretty(x.entry_type||'shift'))}</td><td>${fmtDateTime(x.start_at)}</td><td>${fmtDateTime(x.end_at)}</td><td>${esc(x.location||'—')}</td><td>${badge(x.status||'scheduled')}</td><td><a class="btn ghost" style="padding:6px 9px;text-decoration:none" href="/schedule-entry.html?id=${encodeURIComponent(x.id)}">View / Manage</a></td></tr>`).join(''):'<tr><td colspan="7"><div class="empty">No schedule entries yet.</div></td></tr>';
  const timeRows=time.length?time.map(x=>`<tr><td>${esc(pretty(x.request_type||'pto'))}</td><td>${fmt(x.start_date)}</td><td>${fmt(x.end_date)}</td><td>${x.partial_day?'Yes':'No'}</td><td>${badge(x.status||'pending')}</td><td><a class="btn ghost" style="padding:6px 9px;text-decoration:none" href="/time-off.html?id=${encodeURIComponent(x.id)}">View / Manage</a></td></tr>`).join(''):'<tr><td colspan="6"><div class="empty">No time-off records yet.</div></td></tr>';
  return `${metrics([['Schedule Entries',entries.length,'Current work schedule records'],['Upcoming',entries.filter(x=>new Date(x.start_at)>=new Date()&&x.status==='scheduled').length,'Scheduled from today forward'],['Time Off',time.length,'Time-off records'],['Pending Time Off',time.filter(x=>x.status==='pending').length,'Awaiting decision']])}<div style="height:14px"></div><section class="panel"><div class="panel-head"><div><h2>Work Schedule</h2><p>Shifts, meetings, training, and company schedule events.</p></div></div><div class="table-wrap"><table><thead><tr><th>Title</th><th>Type</th><th>Start</th><th>End</th><th>Location</th><th>Status</th><th>Actions</th></tr></thead><tbody>${scheduleRows}</tbody></table></div></section><div style="height:14px"></div><section class="panel"><div class="panel-head"><div><h2>Time Off</h2><p>Vacation, PTO, sick, personal, and other time-off records.</p></div></div><div class="table-wrap"><table><thead><tr><th>Type</th><th>Start</th><th>End</th><th>Partial Day</th><th>Status</th><th>Actions</th></tr></thead><tbody>${timeRows}</tbody></table></div></section>`;
}
function renderScheduleEntry(){const x=data?.entry||{};const val=x.employee_id?`employee:${x.employee_id}`:x.contact_id?`contact:${x.contact_id}`:'';return `<form id="scheduleEntryForm"><div class="person-form-grid"><section class="person-card"><div class="panel-head"><div><h2>${x.id?'Manage Schedule':'Create Schedule'}</h2><p>Assign a work shift, meeting, training event, or other schedule item.</p></div></div><div class="person-fields"><div class="person-field"><label>Title *</label><input name="title" required value="${esc(x.title||'')}"></div><div class="person-field"><label>Type</label><select name="entry_type">${['shift','meeting','training','other'].map(v=>`<option value="${v}" ${x.entry_type===v?'selected':''}>${esc(pretty(v))}</option>`).join('')}</select></div><div class="person-field full"><label>Employee / Staff</label><select name="assignee">${enterpriseAssigneeOptions(x.employee_id,x.contact_id)}</select></div><div class="person-field"><label>Start *</label><input type="datetime-local" name="start_at" required value="${x.start_at?new Date(x.start_at).toISOString().slice(0,16):''}"></div><div class="person-field"><label>End *</label><input type="datetime-local" name="end_at" required value="${x.end_at?new Date(x.end_at).toISOString().slice(0,16):''}"></div><div class="person-field"><label>Location</label><input name="location" value="${esc(x.location||'')}"></div><div class="person-field"><label>Status</label><select name="status">${['scheduled','completed','cancelled'].map(v=>`<option value="${v}" ${x.status===v?'selected':''}>${esc(pretty(v))}</option>`).join('')}</select></div><div class="person-field full"><label>Description</label><textarea name="description" rows="5">${esc(x.description||'')}</textarea></div></div></section></div><div class="person-savebar"><div id="scheduleNotice"></div>${x.id?`<button class="btn ghost danger" id="deleteSchedule" type="button">Delete Schedule</button>`:''}<button class="btn primary" type="submit">Save Schedule</button></div></form>`}
function bindScheduleEntry(){const f=$('#scheduleEntryForm');if(!f)return;f.onsubmit=async e=>{e.preventDefault();try{const a=f.elements.assignee.value;const [type,id]=a?a.split(':'):['',''];await invoke('nondot-employer-enterprise',{action:'save_schedule',entry:{id:data?.entry?.id||null,title:f.elements.title.value,entry_type:f.elements.entry_type.value,employee_id:type==='employee'?id:null,contact_id:type==='contact'?id:null,start_at:f.elements.start_at.value,end_at:f.elements.end_at.value,location:f.elements.location.value,status:f.elements.status.value,description:f.elements.description.value}});location.href='/scheduler.html'}catch(err){notice(err.message||String(err))}};const d=$('#deleteSchedule');if(d)d.onclick=async()=>{if(d.dataset.confirm!=='yes'){d.dataset.confirm='yes';d.textContent='Confirm Permanent Delete';return}try{await invoke('nondot-employer-enterprise',{action:'delete_schedule',id:data.entry.id});location.href='/scheduler.html'}catch(err){notice(err.message||String(err))}}}
function renderTimeOff(){const x=data?.time_off_request||{};return `<form id="timeOffForm"><section class="person-card"><div class="panel-head"><div><h2>${x.id?'Manage Time Off':'Add Time Off'}</h2><p>Create vacation, PTO, sick, personal, or other time-off records.</p></div></div><div class="person-fields"><div class="person-field full"><label>Employee / Staff *</label><select name="assignee" required>${enterpriseAssigneeOptions(x.employee_id,x.contact_id)}</select></div><div class="person-field"><label>Type</label><select name="request_type">${['pto','vacation','sick','personal','bereavement','unpaid','other'].map(v=>`<option value="${v}" ${x.request_type===v?'selected':''}>${esc(pretty(v))}</option>`).join('')}</select></div><div class="person-field"><label>Status</label><select name="status">${['pending','approved','denied','cancelled'].map(v=>`<option value="${v}" ${x.status===v?'selected':''}>${esc(pretty(v))}</option>`).join('')}</select></div><div class="person-field"><label>Start *</label><input type="date" name="start_date" required value="${esc(x.start_date||'')}"></div><div class="person-field"><label>End *</label><input type="date" name="end_date" required value="${esc(x.end_date||'')}"></div><div class="person-field"><label><input type="checkbox" name="partial_day" ${x.partial_day?'checked':''}> Partial day</label></div><div class="person-field full"><label>Notes</label><textarea name="notes" rows="5">${esc(x.notes||'')}</textarea></div></div></section><div class="person-savebar">${x.id?`<button class="btn ghost danger" id="deleteTimeOff" type="button">Delete Time Off</button>`:''}<button class="btn primary" type="submit">Save Time Off</button></div></form>`}
function bindTimeOff(){const f=$('#timeOffForm');if(!f)return;f.onsubmit=async e=>{e.preventDefault();try{const [type,id]=f.elements.assignee.value.split(':');await invoke('nondot-employer-enterprise',{action:'save_time_off',request:{id:data?.time_off_request?.id||null,employee_id:type==='employee'?id:null,contact_id:type==='contact'?id:null,request_type:f.elements.request_type.value,start_date:f.elements.start_date.value,end_date:f.elements.end_date.value,partial_day:f.elements.partial_day.checked,status:f.elements.status.value,notes:f.elements.notes.value}});location.href='/scheduler.html'}catch(err){notice(err.message||String(err))}};const d=$('#deleteTimeOff');if(d)d.onclick=async()=>{if(d.dataset.confirm!=='yes'){d.dataset.confirm='yes';d.textContent='Confirm Permanent Delete';return}try{await invoke('nondot-employer-enterprise',{action:'delete_time_off',id:data.time_off_request.id});location.href='/scheduler.html'}catch(err){notice(err.message||String(err))}}}
function renderTaskManager(){const tasks=data?.tasks||[];const rows=tasks.length?tasks.map(x=>`<tr><td><strong>${esc(x.title||'Task')}</strong></td><td>${esc((x.assignees||[]).map(a=>a.assignee_name).join(', ')||'Unassigned')}</td><td>${badge(x.priority||'normal')}</td><td>${badge(x.status||'todo')}</td><td>${fmtDateTime(x.due_at)}</td><td>${fmtDateTime(x.completed_at)}</td><td><a class="btn ghost" style="padding:6px 9px;text-decoration:none" href="/task.html?id=${encodeURIComponent(x.id)}">View / Manage</a></td></tr>`).join(''):'<tr><td colspan="7"><div class="empty">No tasks yet.</div></td></tr>';return `${metrics([['Tasks',tasks.length,'All active task records'],['To Do',tasks.filter(x=>x.status==='todo').length,'Not started'],['In Progress',tasks.filter(x=>x.status==='in_progress').length,'Currently underway'],['Completed',tasks.filter(x=>x.status==='completed').length,'Finished tasks']])}<div style="height:14px"></div><section class="panel"><div class="panel-head"><div><h2>Task Manager</h2><p>Create, assign, and track work for employees and staff.</p></div></div><div class="table-wrap"><table><thead><tr><th>Task</th><th>Assigned To</th><th>Priority</th><th>Status</th><th>Due</th><th>Completed</th><th>Actions</th></tr></thead><tbody>${rows}</tbody></table></div></section>`}
function renderTask(){const x=data?.task||{},assigned=new Set((x.assignees||[]).map(a=>`${a.assignee_type}:${a.employee_id||a.contact_id}`));const people=[...(data?.employees||[]).map(e=>({type:'employee',id:e.id,name:[e.first_name,e.last_name].filter(Boolean).join(' ')||e.employee_number||'Employee',meta:e.workforce_worker_type==='driver'?'NON-DOT Driver':'Employee'})),...(data?.contacts||[]).map(c=>({type:'contact',id:c.id,name:c.full_name||[c.first_name,c.last_name].filter(Boolean).join(' ')||'Staff',meta:pretty(c.contact_type||'Staff')}))];return `<form id="taskForm"><section class="person-card"><div class="panel-head"><div><h2>${x.id?'Manage Task':'Create Task'}</h2><p>Assign a task to one or more employees, NON-DOT drivers, or staff contacts.</p></div></div><div class="person-fields"><div class="person-field full"><label>Task title *</label><input name="title" required value="${esc(x.title||'')}"></div><div class="person-field"><label>Priority</label><select name="priority">${['low','normal','high','urgent'].map(v=>`<option value="${v}" ${x.priority===v?'selected':''}>${esc(pretty(v))}</option>`).join('')}</select></div><div class="person-field"><label>Status</label><select name="status">${['todo','in_progress','blocked','completed','cancelled'].map(v=>`<option value="${v}" ${x.status===v?'selected':''}>${esc(pretty(v))}</option>`).join('')}</select></div><div class="person-field"><label>Start</label><input type="datetime-local" name="start_at" value="${x.start_at?new Date(x.start_at).toISOString().slice(0,16):''}"></div><div class="person-field"><label>Due</label><input type="datetime-local" name="due_at" value="${x.due_at?new Date(x.due_at).toISOString().slice(0,16):''}"></div><div class="person-field full"><label>Description</label><textarea name="description" rows="5">${esc(x.description||'')}</textarea></div></div></section><div style="height:14px"></div><section class="person-card"><div class="panel-head"><div><h2>Assign To</h2><p>Select one or more employees, NON-DOT drivers, or staff contacts.</p></div></div><div class="consent-employee-list">${people.length?people.map(r=>`<label><input type="checkbox" name="task_assignee" data-type="${r.type}" value="${esc(r.id)}" ${assigned.has(`${r.type}:${r.id}`)?'checked':''}><span><strong>${esc(r.name)}</strong><small>${esc(r.meta)}</small></span></label>`).join(''):'<div class="empty">No employees or staff contacts are available.</div>'}</div></section><div class="person-savebar">${x.id?`<button class="btn ghost danger" id="deleteTask" type="button">Delete Task</button>`:''}<button class="btn primary" type="submit">Save Task</button></div></form>`}
function bindTask(){const f=$('#taskForm');if(!f)return;f.onsubmit=async e=>{e.preventDefault();try{const assignees=$$('input[name="task_assignee"]:checked').map(x=>({type:x.dataset.type,id:x.value}));await invoke('nondot-employer-enterprise',{action:'save_task',task:{id:data?.task?.id||null,title:f.elements.title.value,description:f.elements.description.value,priority:f.elements.priority.value,status:f.elements.status.value,start_at:f.elements.start_at.value||null,due_at:f.elements.due_at.value||null},assignees});location.href='/task-manager.html'}catch(err){notice(err.message||String(err))}};const d=$('#deleteTask');if(d)d.onclick=async()=>{if(d.dataset.confirm!=='yes'){d.dataset.confirm='yes';d.textContent='Confirm Permanent Delete';return}try{await invoke('nondot-employer-enterprise',{action:'delete_task',id:data.task.id});location.href='/task-manager.html'}catch(err){notice(err.message||String(err))}}}


function renderNotificationsCenter(){
  const w=data?.workforce_notifications||[], internal=data?.internal_messages||[];
  const workforceRows=w.length?w.map(n=>`<tr><td><strong>${esc(n.subject||pretty(n.event_type)||'Workforce NON-DOT Notification')}</strong><small>${esc(n.body||'')}</small></td><td>${esc(pretty(n.event_type||'notification'))}</td><td>${badge(n.status||'sent')}</td><td>${fmtDateTime(n.sent_at||n.queued_at)}</td><td><a class="btn ghost" style="padding:6px 9px;text-decoration:none" href="/notification.html?id=${encodeURIComponent(n.id)}">View</a><a class="btn primary" style="padding:6px 9px;text-decoration:none;margin-left:6px" href="/support.html?notification_id=${encodeURIComponent(n.id)}">Respond in Support</a></td></tr>`).join(''):'<tr><td colspan="5"><div class="empty">No Workforce NON-DOT notifications yet.</div></td></tr>';
  const internalRows=internal.length?internal.map(m=>{const r=m.recipients||[],sent=r.filter(x=>['sent','delivered','read'].includes(String(x.delivery_status))).length;return `<tr><td><strong>${esc(m.subject||'Internal Message')}</strong><small>${esc(m.body||'')}</small></td><td>${esc(pretty(m.audience_type||'selected'))}</td><td>${badge(m.priority||'normal')}</td><td>${esc(sent)} / ${esc(r.length)}</td><td>${fmtDateTime(m.sent_at||m.created_at)}</td><td><a class="btn ghost" style="padding:6px 9px;text-decoration:none" href="/internal-message.html?id=${encodeURIComponent(m.id)}">View</a></td></tr>`}).join(''):'<tr><td colspan="6"><div class="empty">No internal company messages have been sent.</div></td></tr>';
  return `<div class="notification-split"><section class="panel"><div class="panel-head"><div><h2>Workforce NON-DOT Notifications</h2><p>Messages and notices from Workforce NON-DOT. Responses are handled through Support so the conversation stays in one ticket.</p></div></div><div class="table-wrap"><table><thead><tr><th>Subject</th><th>Type</th><th>Status</th><th>Date</th><th>Actions</th></tr></thead><tbody>${workforceRows}</tbody></table></div></section><div style="height:14px"></div><section class="panel"><div class="panel-head"><div><h2>Internal Company Messages</h2><p>Messages sent only to your own employees, NON-DOT drivers, and staff contacts. These are not sent to Workforce NON-DOT.</p></div></div><div class="table-wrap"><table><thead><tr><th>Subject</th><th>Audience</th><th>Priority</th><th>Delivered</th><th>Sent</th><th>Actions</th></tr></thead><tbody>${internalRows}</tbody></table></div></section></div>`;
}
function bindNotificationsCenter(){}
function renderNotificationDetail(){const n=data?.notification||{};return `<section class="person-card"><div class="panel-head"><div><h2>${esc(n.subject||'Workforce NON-DOT Notification')}</h2><p>${esc(pretty(n.event_type||'notification'))} · ${fmtDateTime(n.sent_at||n.queued_at)}</p></div>${badge(n.status||'sent')}</div><div class="notification-body" style="padding:18px;white-space:pre-wrap;line-height:1.7">${esc(n.body||'No message content.')}</div><div class="person-savebar"><a class="btn ghost" href="/notifications.html">Back</a><a class="btn primary" href="/support.html?notification_id=${encodeURIComponent(n.id||'')}" style="text-decoration:none">Respond in Support</a></div></section>`}
function recipientChecks(){const employees=data?.employees||[],contacts=data?.contacts||[];return `<div class="consent-employee-list">${[...employees.map(e=>({type:'employee',id:e.id,name:[e.first_name,e.last_name].filter(Boolean).join(' ')||e.employee_number||'Employee',meta:e.workforce_worker_type==='driver'?'NON-DOT Driver':'Employee',email:e.email})),...contacts.map(c=>({type:'contact',id:c.id,name:c.full_name||[c.first_name,c.last_name].filter(Boolean).join(' ')||'Staff',meta:pretty(c.contact_type||'Staff'),email:c.email}))].map(r=>`<label><input type="checkbox" name="internal_recipient" data-type="${r.type}" value="${esc(r.id)}"><span><strong>${esc(r.name)}</strong><small>${esc(r.meta)}${r.email?' · '+esc(r.email):' · No email'}</small></span></label>`).join('')||'<div class="empty">No recipients available.</div>'}</div>`}
function renderInternalMessage(){const m=data?.message;if(m){const r=data?.recipients||data?.recipients_log||[];return `<section class="person-card"><div class="panel-head"><div><h2>${esc(m.subject||'Internal Message')}</h2><p>Sent ${fmtDateTime(m.sent_at||m.created_at)} · ${esc(pretty(m.audience_type||'selected'))}</p></div>${badge(m.priority||'normal')}</div><div style="padding:18px;white-space:pre-wrap;line-height:1.7">${esc(m.body||'')}</div></section><div style="height:14px"></div><section class="panel"><div class="panel-head"><div><h2>Delivery</h2><p>This message stayed inside your company and was not sent to Workforce NON-DOT.</p></div></div><div class="table-wrap"><table><thead><tr><th>Recipient</th><th>Type</th><th>Email</th><th>Status</th><th>Sent</th></tr></thead><tbody>${r.length?r.map(x=>`<tr><td>${esc(x.recipient_name)}</td><td>${esc(pretty(x.recipient_type))}</td><td>${esc(x.recipient_email||'—')}</td><td>${badge(x.delivery_status)}</td><td>${fmtDateTime(x.sent_at)}</td></tr>`).join(''):'<tr><td colspan="5"><div class="empty">No delivery records.</div></td></tr>'}</tbody></table></div></section>`}
return `<form id="internalMessageForm"><section class="person-card"><div class="panel-head"><div><h2>Send Internal Company Message</h2><p>Send a company-wide, group, or individual message. This message does not go to Workforce NON-DOT.</p></div></div><div class="person-fields"><div class="person-field full"><label>Subject *</label><input name="subject" required></div><div class="person-field"><label>Audience</label><select name="audience_type" id="internalAudience"><option value="company_wide">Company Wide</option><option value="employees">Employees Only</option><option value="drivers">NON-DOT Drivers Only</option><option value="staff">Staff / Contacts Only</option><option value="selected">Selected Recipients</option></select></div><div class="person-field"><label>Priority</label><select name="priority"><option value="normal">Normal</option><option value="high">High</option><option value="urgent">Urgent</option></select></div><div class="person-field full"><label>Message *</label><textarea name="body" rows="10" required></textarea></div></div></section><div style="height:14px"></div><section class="person-card" id="selectedRecipients"><div class="panel-head"><div><h2>Selected Recipients</h2><p>Used only when Audience is Selected Recipients.</p></div></div>${recipientChecks()}</section><div class="person-savebar"><a class="btn ghost" href="/notifications.html">Cancel</a><button class="btn primary" type="submit">Send Message</button></div></form>`}
function bindInternalMessage(){const f=$('#internalMessageForm');if(!f)return;const aud=$('#internalAudience'),box=$('#selectedRecipients');const sync=()=>{if(box)box.style.display=aud?.value==='selected'?'block':'none'};aud?.addEventListener('change',sync);sync();f.onsubmit=async e=>{e.preventDefault();try{const recipients=$$('input[name="internal_recipient"]:checked').map(x=>({type:x.dataset.type,id:x.value}));const d=await invoke('nondot-employer-notifications',{action:'send_internal',subject:f.elements.subject.value,body:f.elements.body.value,audience_type:f.elements.audience_type.value,priority:f.elements.priority.value,recipients});notice(`Message sent to ${d.sent||0} recipient${Number(d.sent||0)===1?'':'s'}.`,'good');setTimeout(()=>location.href='/notifications.html',450)}catch(err){notice(err.message||String(err))}}}
function supportAttachmentList(attachments=[]){
  if(!attachments.length)return '';
  return `<div class="support-attachments">${attachments.map(a=>`<button type="button" class="support-attachment" data-support-attachment="${esc(a.id)}" title="Open attachment"><span class="support-attachment-icon">▱</span><span><strong>${esc(a.file_name||'Attachment')}</strong><small>${a.size_bytes?formatBytes(a.size_bytes):esc(a.mime_type||'File')} · ${fmtDateTime(a.created_at)}</small></span></button>`).join('')}</div>`;
}
function renderSupportIndex(){
  const rows=data?.tickets||[],n=data?.notification||null;
  const counts={open:rows.filter(x=>String(x.status||'open')==='open').length,progress:rows.filter(x=>['in_progress','waiting_customer'].includes(String(x.status||''))).length,closed:rows.filter(x=>['resolved','closed'].includes(String(x.status||''))).length};
  const ctx=n?`<section class="support-notification-context"><div><span class="support-context-kicker">Replying to Workforce NON-DOT</span><h3>${esc(n.subject||pretty(n.event_type)||'Notification')}</h3><p>${esc(n.body||'')}</p><small>${fmtDateTime(n.sent_at||n.queued_at)}</small></div><a class="btn primary" href="/support-ticket.html?notification_id=${encodeURIComponent(n.id)}">Create Response Ticket</a></section>`:'';
  return `${metrics([['Open Tickets',counts.open,'Awaiting review or response'],['In Progress',counts.progress,'Active support conversations'],['Resolved',counts.closed,'Completed requests'],['Attachments',rows.reduce((n,x)=>n+Number(x.attachment_count||0),0),'Files shared with support']])}<div style="height:14px"></div>${ctx}<section class="panel"><div class="panel-head"><div><h2>Support Tickets</h2><p>Create new requests and continue conversations with Workforce NON-DOT.</p></div><a class="btn primary" href="/support-ticket.html">Create Support Ticket</a></div><div class="table-wrap"><table><thead><tr><th>Ticket</th><th>Subject</th><th>Priority</th><th>Status</th><th>Files</th><th>Updated</th><th>Actions</th></tr></thead><tbody>${rows.length?rows.map(t=>`<tr><td><strong>${esc(t.ticket_number||'—')}</strong></td><td>${esc(t.subject||'')}</td><td>${badge(t.priority)}</td><td>${badge(t.status)}</td><td>${Number(t.attachment_count||0)}</td><td>${fmtDateTime(t.updated_at||t.created_at)}</td><td><a class="btn ghost" style="padding:6px 9px;text-decoration:none" href="/support-ticket.html?id=${encodeURIComponent(t.id)}">View / Reply</a></td></tr>`).join(''):'<tr><td colspan="7"><div class="empty">No support tickets yet. Use Create Support Ticket to contact Workforce NON-DOT.</div></td></tr>'}</tbody></table></div></section>`;
}
function renderSupportTicket(){
  const t=data?.ticket,n=data?.notification,messages=data?.messages||[],attachments=data?.attachments||[];
  if(!t){const subj=n?`Re: ${n.subject||pretty(n.event_type)||'Workforce NON-DOT Notification'}`:'';const msg=n?`I am responding to Workforce NON-DOT notification: ${n.subject||n.event_type||'Notification'}\n\n${n.body||''}`:'';return `<form id="supportTicketForm"><section class="person-card"><div class="panel-head"><div><h2>New Support Ticket</h2><p>${n?'This ticket is linked to the Workforce NON-DOT notification you selected.':'Send a support request directly to Workforce NON-DOT.'}</p></div></div><div class="person-fields"><div class="person-field full"><label>Subject *</label><input name="subject" required value="${esc(subj)}"></div><div class="person-field"><label>Category</label><select name="category"><option value="general">General</option><option value="testing">Testing</option><option value="results">Results</option><option value="billing">Billing</option><option value="technical">Technical</option><option value="compliance">Compliance</option><option value="documents">Documents</option></select></div><div class="person-field"><label>Priority</label><select name="priority"><option value="normal">Normal</option><option value="high">High</option><option value="urgent">Urgent</option></select></div><div class="person-field full"><label>Message *</label><textarea name="message" rows="10" required>${esc(msg)}</textarea></div><div class="person-field full"><label>Attachments</label><input type="file" id="supportNewFiles" multiple accept=".pdf,.png,.jpg,.jpeg,.webp,.txt,.csv,.doc,.docx,.xls,.xlsx"><small class="field-help">Optional. Attach screenshots or documents up to 25 MB each. Files are shared securely with Workforce NON-DOT support.</small></div></div></section><div id="supportActionNotice"></div><div class="person-savebar"><a class="btn ghost" href="/support.html">Cancel</a><button class="btn primary" type="submit" id="supportCreateButton">Create Ticket</button></div></form>`}
  const byMessage=new Map(),ticketFiles=[];for(const a of attachments){if(a.message_id){if(!byMessage.has(a.message_id))byMessage.set(a.message_id,[]);byMessage.get(a.message_id).push(a)}else ticketFiles.push(a)}
  return `<section class="person-card"><div class="panel-head"><div><h2>${esc(t.subject)}</h2><p>${esc(t.ticket_number||'Support Ticket')} · ${esc(pretty(t.category||'general'))}</p></div>${badge(t.status)}</div>${ticketFiles.length?`<div class="support-ticket-files"><strong>Ticket Attachments</strong>${supportAttachmentList(ticketFiles)}</div>`:''}<div class="support-thread">${messages.length?messages.map(x=>`<div class="support-message ${x.sender_type==='staff'?'staff':'employer'}"><strong>${x.sender_type==='staff'?'Workforce NON-DOT':'Your Company'}</strong><small>${fmtDateTime(x.created_at)}</small><p>${esc(x.body)}</p>${supportAttachmentList(byMessage.get(x.id)||[])}</div>`).join(''):`<div class="support-message employer"><strong>Your Company</strong><small>${fmtDateTime(t.created_at)}</small><p>${esc(t.message||'')}</p></div>`}</div>${t.status!=='closed'?`<form id="supportReplyForm" class="support-reply"><label>Reply</label><textarea name="message" rows="6" required></textarea><label>Attach files <span class="support-file-hint">PDF, image, Word, Excel, text or CSV · 25 MB each</span></label><input type="file" id="supportReplyFiles" multiple accept=".pdf,.png,.jpg,.jpeg,.webp,.txt,.csv,.doc,.docx,.xls,.xlsx"><div id="supportActionNotice"></div><button class="btn primary" type="submit" id="supportReplyButton">Send Reply</button></form>`:'<div class="document-warning"><strong>Ticket closed</strong><span>This support ticket is closed and cannot accept new replies.</span></div>'}</section>`;
}
async function uploadSupportFiles(ticketId,messageId,files){
  for(const file of [...(files||[])]){
    if(file.size>26214400)throw new Error(`${file.name} is larger than the 25 MB attachment limit.`);
    const prep=await invoke('nondot-employer-notifications',{action:'support_prepare_upload',ticket_id:ticketId,message_id:messageId||null,file_name:file.name,mime_type:file.type||'application/octet-stream',size_bytes:file.size});
    const up=await sb.storage.from(prep.bucket).uploadToSignedUrl(prep.path,prep.token,file,{contentType:file.type||'application/octet-stream'});if(up.error)throw up.error;
    await invoke('nondot-employer-notifications',{action:'support_finalize_upload',ticket_id:ticketId,message_id:messageId||null,attachment_id:prep.attachment_id,path:prep.path,file_name:file.name,mime_type:file.type||'application/octet-stream',size_bytes:file.size});
  }
}
async function openSupportAttachment(id){try{const d=await invoke('nondot-employer-notifications',{action:'support_attachment_url',attachment_id:id});if(!d.url)throw new Error('Attachment could not be opened.');window.open(d.url,'_blank','noopener,noreferrer')}catch(err){notice(err.message||String(err))}}
function bindSupportTicket(){
  $$('[data-support-attachment]').forEach(b=>b.onclick=()=>openSupportAttachment(b.dataset.supportAttachment));
  const f=$('#supportTicketForm');if(f)f.onsubmit=async e=>{e.preventDefault();const btn=$('#supportCreateButton');btn.disabled=true;btn.textContent='Creating…';try{const n=new URLSearchParams(location.search).get('notification_id');const d=await invoke('nondot-employer-notifications',{action:'create_support',subject:f.elements.subject.value,message:f.elements.message.value,category:f.elements.category.value,priority:f.elements.priority.value,notification_id:n});const files=$('#supportNewFiles')?.files||[];if(files.length){btn.textContent='Uploading files…';await uploadSupportFiles(d.ticket.id,d.message?.id||null,files)}location.href='/support-ticket.html?id='+encodeURIComponent(d.ticket.id)}catch(err){notice(err.message||String(err));btn.disabled=false;btn.textContent='Create Ticket'}};
  const r=$('#supportReplyForm');if(r)r.onsubmit=async e=>{e.preventDefault();const btn=$('#supportReplyButton');btn.disabled=true;btn.textContent='Sending…';try{const d=await invoke('nondot-employer-notifications',{action:'reply_support',id:data.ticket.id,message:r.elements.message.value});const files=$('#supportReplyFiles')?.files||[];if(files.length){btn.textContent='Uploading files…';await uploadSupportFiles(data.ticket.id,d.message?.id||null,files)}await refresh()}catch(err){notice(err.message||String(err));btn.disabled=false;btn.textContent='Send Reply'}};
}

function managementActions(p){
  if(C.kind==='self')return;
  if(p==='people')addAction('Add Person',()=>location.href='/person.html');if(p==='person')addAction('Back to People',()=>location.href='/people.html');if(p==='contact')addAction('Back to Company',()=>location.href='/company.html');if(p==='programs')addAction('Add Random Testing Program',()=>location.href='/program.html');if(p==='program')addAction('Back to Programs',()=>location.href='/programs.html');if(p==='pools')addAction('Add NON-DOT Pool',()=>location.href='/pool.html');if(p==='pool')addAction('Back to Pools',()=>location.href='/pools.html');if(p==='selections')addAction('Create Random Selection',()=>location.href='/selection.html');if(p==='selection')addAction('Back to Random Selections',()=>location.href='/selections.html');
  if(p==='testing')addAction('Create Testing Order',()=>location.href='/testing-order.html');if(p==='testing-order')addAction('Back to Testing Orders',()=>location.href='/testing.html');
  if(C.kind==='employer'&&p==='documents')addAction('Upload Document',()=>location.href='/document-upload.html');if(C.kind==='employer'&&p==='document-upload')addAction('Back to Documents',()=>location.href='/documents.html');if(C.kind==='employer'&&p==='consents')addAction('Create Document',()=>location.href='/consent-editor.html');if(C.kind==='employer'&&p==='consent-editor')addAction('Back to Document Library',()=>location.href='/consents.html');if(C.kind==='employer'&&p==='consent-view')addAction('Back to Document Library',()=>location.href='/consents.html');
  if(C.kind==='employer'&&p==='company')addAction('Add Contact',()=>location.href='/contact.html');if(C.kind==='employer'&&p==='invoice')addAction('Back to Billing',()=>location.href='/billing.html');
  if(C.kind==='employer'&&p==='scheduler'){addAction('Create Schedule',()=>location.href='/schedule-entry.html');addAction('Add Time Off',()=>location.href='/time-off.html')}if(C.kind==='employer'&&p==='schedule-entry')addAction('Back to Scheduler',()=>location.href='/scheduler.html');if(C.kind==='employer'&&p==='time-off')addAction('Back to Scheduler',()=>location.href='/scheduler.html');if(C.kind==='employer'&&p==='task-manager')addAction('Create Task',()=>location.href='/task.html');if(C.kind==='employer'&&p==='task')addAction('Back to Task Manager',()=>location.href='/task-manager.html');
  if(C.kind==='employer'&&p==='locations')addAction('Add Location',()=>location.href='/location.html');if(C.kind==='employer'&&p==='location')addAction('Back to Locations',()=>location.href='/locations.html');if(C.kind==='employer'&&p==='integrations')addAction('Add Integration',()=>document.getElementById('integrationCatalog')?.scrollIntoView({behavior:'smooth'}));if(C.kind==='employer'&&p==='integration')addAction('Back to Integrations',()=>location.href='/integrations.html');
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
    compliance:'Monitor company health, testing outcomes, random-program readiness, and compliance follow-up.',
    documents:'Upload, view, and securely manage documents for your NON-DOT Workforce account.','document-upload':'Upload and organize company documents in your secure NON-DOT document library.',
    consents:'Create, send, and manage company documents for employees, NON-DOT drivers, and staff contacts.','consent-editor':'Create or edit a company document, choose recipients, and distribute it.','consent-view':'View a saved company document and its delivery history.',
    reports:'Build company reports and export them as PDF or CSV, including Enterprise scheduling and task activity.',
    scheduler:'Create and manage work schedules, shifts, meetings, training, and time off.',
    'schedule-entry':'Create or manage a work schedule entry.',
    'time-off':'Create or manage an employee or staff time-off request.',
    'task-manager':'Create, assign, and track workforce tasks.',
    task:'Create or manage a workforce task and its assignees.',
    welcome:'Get started with your Workforce NON-DOT Employer Portal and learn the essential setup steps.','how-to-guides':'Search visual, step-by-step instructions for common Employer Portal tasks.',
    notifications:'Review messages from Workforce NON-DOT and internal company messages sent to employees and staff.',notification:'View a Workforce NON-DOT notification and respond through Support.','internal-message':'Send an internal company message to employees, NON-DOT drivers, staff, or selected recipients.',support:'Open and continue support conversations with Workforce NON-DOT.','support-ticket':'Create or continue a Workforce NON-DOT support ticket.',
    billing:'Review Workforce NON-DOT invoices, download PDF copies, and pay open balances securely.',invoice:'View a Workforce NON-DOT invoice, download its PDF, or pay the remaining balance.',
    locations:'Manage company worksites, plants, warehouses, offices, docks, departments, and site leadership contacts.',
    location:'Create or manage a complete company location profile.',
    branding:'Review Workforce portal branding.',
    integrations:'Connect and manage Enterprise business integrations for your Workforce portal.',integration:'Configure an Enterprise integration and review any screenings4u activation requirements.',
    'audit-history':'Review account activity recorded for the Workforce portal.',
    profile:'Review your NON-DOT Workforce profile.',
    'my-testing':'Review NON-DOT testing assigned to you.',
    'my-results':'Review NON-DOT testing results available to you.',
    training:'Review your Workforce training records.',
    credentials:'Review credentials maintained for your NON-DOT Driver profile.'
  };
  return common[p]||'Manage NON-DOT Workforce information for this portal.';
}
function renderCurrent(){
  if(!ctx)return;
  const p=norm(page());
  if($('#actions'))$('#actions').innerHTML='';
  if($('#subtitle'))$('#subtitle').textContent=subtitleFor(p);
  if($('#content'))$('#content').innerHTML=C.kind==='self'?renderSelf(p):renderMgmt(p);
  managementActions(p);bindRows();if(p==='welcome'){const c=$('#completeWelcome'),d=$('#dismissWelcome');if(c)c.onclick=async()=>{c.disabled=true;c.textContent='Saving…';try{await onboardingState('complete',{source:'welcome_page'});location.href='/dashboard.html'}catch(e){notice(e.message||String(e));c.disabled=false;c.textContent='Complete Welcome Setup'}};if(d)d.onclick=async()=>{d.disabled=true;try{await onboardingState('dismiss',{source:'welcome_page'});location.href='/dashboard.html'}catch(e){notice(e.message||String(e));d.disabled=false}}}if(p==='how-to-guides'){const q=$('#howtoSearch'),g=$('#howtoGroup'),apply=()=>{const needle=(q?.value||'').trim().toLowerCase(),group=g?.value||'';let shown=0;$$('[data-guide-card]').forEach(card=>{const sec=card.closest('[data-howto-group]'),ok=(!needle||String(card.dataset.search||'').includes(needle))&&(!group||sec?.dataset.howtoGroup===group);card.hidden=!ok;if(ok)shown++});$$('[data-howto-group]').forEach(sec=>{const visible=[...sec.querySelectorAll('[data-guide-card]')].some(x=>!x.hidden);sec.hidden=!visible});const e=$('#howtoEmpty');if(e)e.hidden=shown>0};if(q)q.oninput=apply;if(g)g.onchange=apply;apply()};if(p==='person')bindPerson();if(p==='contact')bindContact();if(p==='program')bindProgram();if(p==='pool')bindPool();if(p==='selection')bindSelection();if(p==='testing-order')bindTestingOrder();if(p==='document-upload')bindDocumentUpload();if(p==='consents')bindConsentLibrary();if(p==='consent-editor')bindConsentEditor();if(p==='consent-view')bindConsentView();if(p==='reports')bindEnterpriseReports();if(p==='schedule-entry')bindScheduleEntry();if(p==='time-off')bindTimeOff();if(p==='task')bindTask();if(p==='notifications')bindNotificationsCenter();if(p==='internal-message')bindInternalMessage();if(p==='support-ticket')bindSupportTicket();if(p==='location')bindLocation();if(p==='integration')bindIntegration();if(p==='branding'&&window.EmployerBranding)window.EmployerBranding.bind(data,ctx);if(p==='audit-history')bindAuditHistory();if(p==='billing'||p==='invoice')bindBilling();
}
function slowSpinner(){document.body.classList.add('network-slow')}
function stopSpinner(){document.body.classList.remove('loading','network-slow')}
async function prefetchPageData(pathname){
  if(C.kind!=='employer'||hasFreshCache(pathname))return;
  const id=pathname.split('/').pop()?.replace('.html','')||'';
  try{
    let d=null;
    if(id==='dashboard')d=await invoke(apiName(),{action:'workspace',page:'dashboard'});
    else if(id==='company')d=await invoke('nondot-employer-company',{action:'workspace'});
    else if(id==='people')d=await invoke('nondot-employer-people',{action:'workspace'});
    else if(id==='programs')d=await invoke('nondot-employer-programs',{action:'workspace'});
    else if(id==='pools')d=await invoke('nondot-employer-pools',{action:'workspace'});
    else if(id==='selections')d=await invoke('nondot-employer-selections',{action:'workspace'});
    else if(id==='testing')d=await invoke('nondot-employer-testing',{action:'workspace'});
    else if(id==='results')d=await invoke('nondot-employer-results',{action:'workspace'});
    else if(id==='compliance')d=await invoke('nondot-employer-compliance',{action:'workspace'});
    else if(id==='documents')d=await invoke('nondot-employer-documents',{action:'workspace'});
    else if(id==='consents')d=await invoke('nondot-employer-consents',{action:'workspace'});
    else if(id==='reports')d=await invoke('nondot-employer-enterprise',{action:'reports_workspace'});
    else if(id==='scheduler')d=await invoke('nondot-employer-enterprise',{action:'scheduler_workspace'});
    else if(id==='task-manager')d=await invoke('nondot-employer-enterprise',{action:'tasks_workspace'});
    else if(id==='notifications')d=await invoke('nondot-employer-notifications',{action:'workspace'});
    else if(id==='support')d=await invoke('nondot-employer-notifications',{action:'support_workspace'});
    else if(id==='billing')d=await invoke('nondot-employer-billing',{action:'workspace'});
    else if(id==='locations')d=await invoke('nondot-employer-locations',{action:'workspace'});
    else if(id==='integrations')d=await invoke('nondot-employer-integrations',{action:'workspace'});
    else if(id==='branding')d=await invoke('nondot-employer-branding',{action:'workspace'});
    else if(id==='audit-history')d=await invoke('nondot-employer-audit',{action:'workspace'});
    if(d)cachePageFor(pathname,d);
  }catch{}
}
function prefetchPortal(){
  if(C.kind!=='employer')return;
  if(MOBILE_FAST_PATH||REDUCED_NETWORK)return;
  let inflight=false,queued=null;
  const warmPath=async pathname=>{
    if(inflight||hasFreshCache(pathname)){queued=pathname;return}
    inflight=true;
    try{await prefetchPageData(pathname)}finally{
      inflight=false;
      if(queued&&queued!==pathname){const next=queued;queued=null;setTimeout(()=>warmPath(next),160)}else queued=null;
    }
  };
  for(const a of $$('.nav a[href^="/"],.mobile-nav-links a[href^="/"]')){
    const warm=()=>{try{const u=new URL(a.href,location.origin);warmPath(u.pathname)}catch{}};
    a.addEventListener('mouseenter',warm,{passive:true});
    a.addEventListener('focus',warm,{passive:true});
  }
  const common=['/company.html','/people.html','/programs.html','/pools.html','/testing.html','/results.html','/documents.html','/billing.html'];
  let i=0;
  const next=()=>{
    if(i>=common.length)return;
    const h=common[i++];
    if(h===location.pathname||hasFreshCache(h)){setTimeout(next,1000);return}
    warmPath(h).finally(()=>setTimeout(next,1300));
  };
  setTimeout(next,3000);
}
async function refresh(){
  let timer=setTimeout(slowSpinner,400);
  try{
    data=await load();cachePage(data);renderCurrent();
    const p=norm(page());
    $$('[data-cancel-testing]').forEach(b=>b.onclick=async()=>{const ok=await confirmBox('Cancel Testing Order','Cancel this NON-DOT testing order? Completed testing history is not removed.');if(!ok)return;try{await invoke(apiName(),{action:'cancel_testing',id:b.dataset.cancelTesting});notice('Testing order cancelled.','good');await refresh()}catch(err){notice(err.message||String(err))}});
    $$('[data-consent]').forEach(b=>b.onclick=()=>formModal('Complete Consent / Acknowledgment',[{name:'acknowledged_name',label:'Type your full name',required:true},{name:'accepted',label:'I acknowledge and accept',type:'select',options:[{value:'true',label:'Yes'}]}],{},async v=>invoke(apiName(),{action:'complete_consent_assignment',assignment_id:b.dataset.consent,acknowledged_name:v.acknowledged_name,accepted:v.accepted==='true'})));
  }catch(err){notice(err.message||String(err));if($('#content'))$('#content').innerHTML='<div class="panel"><div class="empty">Unable to load this page.</div></div>'}
  finally{clearTimeout(timer);stopSpinner()}
}
window.S4UDialogs={message:brandedMessage,confirm:confirmBox};
async function boot(){
  let timer=setTimeout(slowSpinner,700);
  try{
    const cc=cachedCtx(),cb=cachedBrand(),cp=cachedPage();
    const haveCachedCtx=!!cc;
    if(haveCachedCtx){
      ctx=cc;brandState=cb||null;if(brandState)applyBranding();shell(ctx);window.portalCtx=ctx;
      if(cp){data=cp;renderCurrent();clearTimeout(timer);stopSpinner();document.documentElement.dataset.portalReady='true';window.dispatchEvent(new CustomEvent('s4u:portal-ready',{detail:{page:page()}}))}
    }

    // On repeat navigation, only fetch the current page payload. Context and branding are
    // already cached and do not need to block every page transition.
    if(haveCachedCtx){
      clearTimeout(timer);stopSpinner();prefetchPortal();
      const refreshDelay=(MOBILE_FAST_PATH||REDUCED_NETWORK)?350:0;
      setTimeout(async()=>{
        try{const freshData=await load();data=freshData;cachePage(data);renderCurrent();document.documentElement.dataset.portalReady='true';window.dispatchEvent(new CustomEvent('s4u:portal-ready',{detail:{page:page()}}))}catch(e){if(!cp)notice(e.message||String(e))}
      },refreshDelay);
      const needCtx=canBackgroundValidate(CTX_CHECK_KEY,5*60*1000);
      const needBrand=canBackgroundValidate(BRAND_CHECK_KEY,15*60*1000);
      if(needCtx||needBrand)setTimeout(async()=>{
        try{
          const jobs=[];
          if(needCtx)jobs.push(access().then(v=>({kind:'ctx',v})));
          if(needBrand)jobs.push(loadBranding().then(v=>({kind:'brand',v})));
          const fresh=await Promise.all(jobs);
          for(const x of fresh){
            if(x.kind==='ctx'&&x.v){ctx=x.v;jsonSet(localStorage,CTX_CACHE,ctx);window.portalCtx=ctx;markValidated(CTX_CHECK_KEY)}
            if(x.kind==='brand'&&x.v){brandState=x.v;jsonSet(localStorage,BRAND_CACHE,brandState);applyBranding();markValidated(BRAND_CHECK_KEY)}
          }
        }catch{}
      },(MOBILE_FAST_PATH||REDUCED_NETWORK)?3500:1800);
      return;
    }

    // First authenticated page: access context and page payload are the only blockers.
    // Branding is cosmetic and refreshes after first paint so it never holds the page on Loading.
    const [freshCtx,freshData]=await Promise.all([access(),load()]);
    ctx=freshCtx;data=freshData;
    if(ctx.requires_workspace_selection){location.replace('/workspace.html');return}
    if(ctx.membership?.id)localStorage.setItem(storageKey(),ctx.membership.id);
    if(ctx.subscription?.id)localStorage.setItem(subKey(),ctx.subscription.id);
    jsonSet(localStorage,CTX_CACHE,ctx);markValidated(CTX_CHECK_KEY);cachePage(data);
    shell(ctx);window.portalCtx=ctx;renderCurrent();clearTimeout(timer);stopSpinner();
    document.documentElement.dataset.portalReady='true';
    window.dispatchEvent(new CustomEvent('s4u:portal-ready',{detail:{page:page()}}));
    prefetchPortal();
    setTimeout(async()=>{try{const freshBrand=await loadBranding();if(freshBrand){brandState=freshBrand;jsonSet(localStorage,BRAND_CACHE,brandState);markValidated(BRAND_CHECK_KEY);applyBranding()}}catch{}},0);
  }catch(err){
    const msg=String(err?.message||err||'');
    if(/unauthorized|session|jwt|sign in/i.test(msg)){location.replace('/login.html');return}
    clearTimeout(timer);document.body.className='';
    document.body.innerHTML=`<main class="login-page"><section class="login-card"><img class="login-logo" src="/images/workforce-non-dot.png" alt="screenings4u"><h1>Portal unavailable</h1><p>${esc(msg||'This NON-DOT Workforce portal could not be loaded.')}</p><a class="btn primary" href="/login.html">Return to sign in</a></section></main>`;
  }
}
if('serviceWorker' in navigator){window.addEventListener('load',()=>navigator.serviceWorker.register('/sw.js?v=20261007-welcome1').catch(()=>{}),{once:true})}
boot();
})();

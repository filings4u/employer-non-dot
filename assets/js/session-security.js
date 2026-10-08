(()=>{"use strict";
const LIMIT=10*60*1000;
const WARN=60*1000;
const KEY="s4u-employer-nondot-last-activity-v3";
const MID="s4u-session-warning";
const LOGIN="/login.html";
let last=0,warnTimer=null,logoutTimer=null,countTimer=null,signingOut=false,booted=false;

const C=()=>window.PORTAL_CONFIG||{};
const auth=()=>window.S4UAuth||null;
const read=()=>{try{return Number(localStorage.getItem(KEY)||0)||0}catch{return 0}};
const write=v=>{try{localStorage.setItem(KEY,String(v))}catch{}};
const clearTimers=()=>{clearTimeout(warnTimer);clearTimeout(logoutTimer);clearInterval(countTimer);warnTimer=logoutTimer=countTimer=null};
const warningEl=()=>document.getElementById(MID);
const removeWarning=()=>warningEl()?.remove();

function clearPortalSessionCaches(){
  const cfg=C();
  try{
    localStorage.removeItem(KEY);
    if(cfg.portalCode){
      localStorage.removeItem(`s4u_${cfg.portalCode}_membership`);
      localStorage.removeItem(`s4u_${cfg.portalCode}_subscription`);
    }
    localStorage.removeItem('s4u_employer_ctx_v1');
    localStorage.removeItem('s4u_employer_brand_v1');
    localStorage.removeItem('s4u_employer_ctx_checked_v1');
    localStorage.removeItem('s4u_employer_brand_checked_v1');
    for(let i=localStorage.length-1;i>=0;i--){
      const k=localStorage.key(i)||'';
      if(k.startsWith('s4u_employer_page_cache_v2:')) localStorage.removeItem(k);
    }
    for(let i=sessionStorage.length-1;i>=0;i--){
      const k=sessionStorage.key(i)||'';
      if(k.startsWith('s4u_employer_page_cache_v2:')) sessionStorage.removeItem(k);
    }
  }catch{}
}

async function logout(reason='manual'){
  if(signingOut)return;
  signingOut=true;
  clearTimers();
  removeWarning();
  document.documentElement.dataset.sessionEnding='true';
  try{await auth()?.signOut?.()}catch(e){console.error('[Employer portal security] sign out failed',e)}
  clearPortalSessionCaches();
  const q=reason==='inactive'?'?reason=inactive':'';
  location.replace(LOGIN+q);
}

function button(label,kind,onClick){
  const b=document.createElement('button');
  b.type='button';
  b.textContent=label;
  b.style.cssText=kind==='primary'
    ?'min-height:46px;padding:0 20px;border-radius:8px;border:1px solid #ff6b00;background:#ff6b00;color:#fff;font:800 14px Inter,Arial,sans-serif;cursor:pointer;box-shadow:0 7px 18px rgba(255,107,0,.18)'
    :'min-height:46px;padding:0 20px;border-radius:8px;border:1px solid #cfd9e6;background:#fff;color:#17365f;font:800 14px Inter,Arial,sans-serif;cursor:pointer';
  b.addEventListener('click',e=>{e.preventDefault();e.stopPropagation();onClick()});
  return b;
}

function keepAlive(){
  if(signingOut)return;
  last=Date.now();
  write(last);
  removeWarning();
  schedule();
  window.dispatchEvent(new CustomEvent('s4u:session-continued'));
}

function showWarning(){
  if(signingOut||warningEl())return;
  clearTimeout(warnTimer);
  let seconds=Math.max(1,Math.ceil((LIMIT-(Date.now()-last))/1000));
  if(seconds>60)seconds=60;

  const overlay=document.createElement('div');
  overlay.id=MID;
  overlay.setAttribute('role','presentation');
  overlay.style.cssText='position:fixed;inset:0;z-index:2147483647;display:grid;place-items:center;padding:20px;background:rgba(8,31,57,.78);backdrop-filter:blur(3px);font-family:Inter,Arial,sans-serif';

  const modal=document.createElement('section');
  modal.setAttribute('role','alertdialog');
  modal.setAttribute('aria-modal','true');
  modal.setAttribute('aria-labelledby','s4u-session-title');
  modal.setAttribute('aria-describedby','s4u-session-copy');
  modal.style.cssText='width:min(480px,100%);overflow:hidden;border-radius:16px;background:#fff;border:1px solid #d9e3ef;box-shadow:0 28px 80px rgba(0,0,0,.32)';

  const head=document.createElement('div');
  head.style.cssText='background:#17365f;padding:22px 26px;border-bottom:4px solid #ff6b00';
  head.innerHTML='<img src="/images/workforce-non-dot2.png" alt="Workforce NON DOT | screenings4u" style="display:block;width:230px;max-width:72%;height:auto">';

  const body=document.createElement('div');
  body.style.cssText='padding:28px 28px 26px;text-align:center';
  body.innerHTML='<div style="font-size:11px;line-height:1.3;letter-spacing:.13em;font-weight:900;color:#ff6b00;margin-bottom:8px">SECURE SESSION</div><h2 id="s4u-session-title" style="margin:0 0 10px;color:#102f55;font-size:24px;line-height:1.25">Are you still working?</h2><p id="s4u-session-copy" style="margin:0 auto 12px;max-width:380px;color:#667892;font-size:14px;line-height:1.6">For your security, this Workforce NON-DOT portal signs you out after 10 minutes of inactivity.</p>';

  const countdown=document.createElement('div');
  countdown.style.cssText='margin:18px auto 22px;padding:13px 16px;max-width:300px;border-radius:10px;background:#f4f7fb;border:1px solid #dce5ef;color:#17365f;font-size:14px';
  const number=document.createElement('strong');
  number.style.cssText='font-size:22px;color:#ff6b00';
  number.textContent=String(seconds);
  countdown.append('Automatic sign out in ',number,' seconds');

  const actions=document.createElement('div');
  actions.style.cssText='display:flex;justify-content:center;gap:10px;flex-wrap:wrap';
  const stay=button('Stay Logged In','primary',keepAlive);
  const out=button('Log Out','secondary',()=>logout('manual'));
  actions.append(stay,out);
  body.append(countdown,actions);
  modal.append(head,body);
  overlay.append(modal);
  document.body.append(overlay);

  requestAnimationFrame(()=>stay.focus());
  countTimer=setInterval(()=>{
    const remaining=Math.max(0,Math.ceil((LIMIT-(Date.now()-last))/1000));
    number.textContent=String(remaining);
    if(remaining<=0)logout('inactive');
  },250);
}

function schedule(){
  if(signingOut)return;
  clearTimers();
  removeWarning();
  const elapsed=Date.now()-last;
  const remaining=LIMIT-elapsed;
  if(remaining<=0){logout('inactive');return}
  const warnIn=Math.max(0,remaining-WARN);
  if(warnIn===0)showWarning();
  else warnTimer=setTimeout(showWarning,warnIn);
  logoutTimer=setTimeout(()=>logout('inactive'),remaining);
}

function touch(force=false){
  if(signingOut||warningEl())return;
  const now=Date.now();
  if(!force&&now-last<1000)return;
  last=now;
  write(last);
  schedule();
}

function activity(e){
  if(warningEl())return;
  if(e?.isTrusted===false)return;
  touch(false);
}

async function boot(){
  if(booted)return;booted=true;
  const a=auth();
  if(!a?.getSession){location.replace(LOGIN);return}
  let session=await a.getSession().catch(()=>null);
  if(!session){location.replace(LOGIN);return}

  document.documentElement.classList.remove('s4u-security-pending');
  document.documentElement.classList.add('s4u-session-verified');

  const signedAt=Date.parse(session.user?.last_sign_in_at||'')||0;
  const stored=read();
  last=(!stored||stored<signedAt)?Date.now():stored;
  if(last!==stored)write(last);
  if(Date.now()-last>=LIMIT){await logout('inactive');return}

  ['pointerdown','keydown','touchstart','input','change','wheel','scroll'].forEach(type=>document.addEventListener(type,activity,{passive:true,capture:true}));
  window.addEventListener('storage',e=>{
    if(e.key!==KEY)return;
    const remote=Number(e.newValue||0);
    if(remote>0){last=remote;if(!warningEl())schedule()}
  });
  document.addEventListener('visibilitychange',()=>{
    if(document.visibilityState!=='visible')return;
    last=read()||last;
    if(Date.now()-last>=LIMIT)logout('inactive'); else if(!warningEl())schedule();
  });
  schedule();
}

if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot,{once:true});else boot();
window.S4UPortalSecurity={touch:()=>touch(true),logout,remaining:()=>Math.max(0,LIMIT-(Date.now()-last))};
})();

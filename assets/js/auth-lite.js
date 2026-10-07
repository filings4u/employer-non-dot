(()=>{'use strict';
const C=window.PORTAL_CONFIG||{};
const ref=(C.workforceUrl||'').match(/https:\/\/([^.]+)\.supabase\.co/i)?.[1]||'';
const KEY=`sb-${ref}-auth-token`;
const read=()=>{try{const raw=localStorage.getItem(KEY);if(!raw)return null;const x=JSON.parse(raw);return x?.access_token?x:null}catch{return null}};
const write=s=>{try{s?localStorage.setItem(KEY,JSON.stringify(s)):localStorage.removeItem(KEY)}catch{}};
const normalize=(x,prior=null)=>{if(!x?.access_token)return null;const now=Math.floor(Date.now()/1000);return {...prior,...x,expires_at:x.expires_at||now+Number(x.expires_in||3600),token_type:x.token_type||'bearer'};};
let refreshPromise=null;
async function refresh(session){
 if(refreshPromise)return refreshPromise;
 refreshPromise=(async()=>{
  if(!session?.refresh_token)return null;
  const r=await fetch(`${C.workforceUrl}/auth/v1/token?grant_type=refresh_token`,{method:'POST',headers:{'Content-Type':'application/json','apikey':C.workforceKey},body:JSON.stringify({refresh_token:session.refresh_token})});
  if(!r.ok){write(null);return null}
  const d=await r.json().catch(()=>null);const s=normalize(d,session);write(s);return s;
 })().finally(()=>{refreshPromise=null});
 return refreshPromise;
}
async function getSession(){let s=read();if(!s)return null;const now=Math.floor(Date.now()/1000);if(Number(s.expires_at||0)<=now+90)s=await refresh(s);return s;}
async function refreshSession(){const s=read();if(!s?.refresh_token)return null;return refresh(s);}
async function signOut(){const s=read();try{if(s?.access_token)await fetch(`${C.workforceUrl}/auth/v1/logout`,{method:'POST',headers:{'Authorization':`Bearer ${s.access_token}`,'apikey':C.workforceKey}})}catch{}write(null);}
window.S4UAuth={getSession,refreshSession,signOut,readSession:read,storageKey:KEY};
})();

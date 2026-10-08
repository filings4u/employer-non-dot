const CACHE='s4u-employer-nondot-static-v6-auth401';
const CORE=['/assets/css/portal.css?v=20261007-navpersist1','/assets/js/config.js','/assets/js/auth-lite.js?v=20261008-welcome-nav2','/assets/js/session-security.js?v=20261008-welcome-nav2','/assets/js/app.js?v=20261008-welcome-nav2','/images/workforce-non-dot.png','/images/workforce-non-dot2.png','/images/fav.png'];
self.addEventListener('install',e=>{e.waitUntil(caches.open(CACHE).then(c=>c.addAll(CORE)).catch(()=>{}));self.skipWaiting()});
self.addEventListener('activate',e=>{e.waitUntil(caches.keys().then(keys=>Promise.all(keys.filter(k=>k!==CACHE).map(k=>caches.delete(k)))));self.clients.claim()});
self.addEventListener('fetch',e=>{
 const r=e.request;if(r.method!=='GET')return;const u=new URL(r.url);if(u.origin!==location.origin)return;
 if(r.mode==='navigate'){
   const publicPage=/\/(?:login|forgot-password|reset-password|auth-handoff|checkout|404)\.html$/i.test(u.pathname);
   if(publicPage)return;
   e.respondWith((async()=>{
     const cached=await caches.match(r,{ignoreSearch:false});
     const network=fetch(r).then(resp=>{
       if(resp&&resp.ok){const copy=resp.clone();e.waitUntil(caches.open(CACHE).then(c=>c.put(r,copy)))}
       return resp;
     }).catch(()=>null);
     return cached||await network||new Response('Offline',{status:503,headers:{'Content-Type':'text/plain'}});
   })());return;
 }
 if(/\.(?:css|js|png|webp|jpg|jpeg|svg|woff2?)$/i.test(u.pathname)){
   e.respondWith((async()=>{
     const cached=await caches.match(r,{ignoreSearch:false});
     const refresh=fetch(r).then(resp=>{if(resp&&resp.ok){const copy=resp.clone();e.waitUntil(caches.open(CACHE).then(c=>c.put(r,copy)))}return resp}).catch(()=>null);
     return cached||(await refresh)||new Response('',{status:504});
   })());
 }
});

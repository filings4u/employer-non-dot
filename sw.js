const CACHE='s4u-employer-nondot-static-v3';
const CORE=['/assets/css/portal.css','/assets/js/config.js','/assets/js/auth-lite.js','/assets/js/session-security.js','/assets/js/app.js','/images/workforce-non-dot.png','/images/workforce-non-dot2.png','/images/fav.png'];
self.addEventListener('install',e=>{e.waitUntil(caches.open(CACHE).then(c=>c.addAll(CORE)).catch(()=>{}));self.skipWaiting()});
self.addEventListener('activate',e=>{e.waitUntil(caches.keys().then(keys=>Promise.all(keys.filter(k=>k!==CACHE).map(k=>caches.delete(k)))));self.clients.claim()});
self.addEventListener('fetch',e=>{
 const r=e.request;if(r.method!=='GET')return;const u=new URL(r.url);if(u.origin!==location.origin)return;
 if(r.mode==='navigate'){
   e.respondWith((async()=>{
     const cached=await caches.match(r);
     const refresh=fetch(r).then(async resp=>{
       if(resp&&resp.ok){const copy=resp.clone();await (await caches.open(CACHE)).put(r,copy)}
       return resp;
     }).catch(()=>null);
     if(cached){e.waitUntil(refresh);return cached}
     return (await refresh)||new Response('Offline',{status:503,headers:{'Content-Type':'text/plain'}});
   })());
   return;
 }
 if(/\.(?:css|js|png|webp|jpg|jpeg|svg|woff2?)$/i.test(u.pathname)){
   e.respondWith((async()=>{
     const cached=await caches.match(r,{ignoreSearch:true});
     if(cached)return cached;
     const resp=await fetch(r);
     if(resp&&resp.ok){const copy=resp.clone();e.waitUntil(caches.open(CACHE).then(c=>c.put(r,copy)))}
     return resp;
   })());
 }
});

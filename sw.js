const CACHE='s4u-employer-nondot-static-v1';
const CORE=['/assets/css/portal.css','/assets/js/config.js','/assets/js/auth-lite.js','/assets/js/session-security.js','/assets/js/app.js','/images/workforce-non-dot.png','/images/workforce-non-dot2.png','/images/fav.png'];
self.addEventListener('install',e=>{e.waitUntil(caches.open(CACHE).then(c=>c.addAll(CORE)).catch(()=>{}));self.skipWaiting()});
self.addEventListener('activate',e=>{e.waitUntil(caches.keys().then(keys=>Promise.all(keys.filter(k=>k!==CACHE).map(k=>caches.delete(k)))));self.clients.claim()});
self.addEventListener('fetch',e=>{
 const r=e.request;if(r.method!=='GET')return;const u=new URL(r.url);if(u.origin!==location.origin)return;
 if(r.mode==='navigate'){
  e.respondWith(caches.match(r).then(cached=>{const net=fetch(r).then(resp=>{if(resp.ok)caches.open(CACHE).then(c=>c.put(r,resp.clone()));return resp}).catch(()=>cached);return cached||net}));return;
 }
 if(/\.(?:css|js|png|webp|jpg|jpeg|svg|woff2?)$/i.test(u.pathname)){
  e.respondWith(caches.match(r,{ignoreSearch:true}).then(cached=>cached||fetch(r).then(resp=>{if(resp.ok)caches.open(CACHE).then(c=>c.put(r,resp.clone()));return resp})));
 }
});

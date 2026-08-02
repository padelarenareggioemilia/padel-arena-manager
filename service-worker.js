const CACHE='pam-v8-1-17-recupero-partecipanti';
const CORE=[
 './','./index.html','./manifest.webmanifest','./public-registration.html',
 './player-registration.html','./captain-portal.html','./poster.html',
 './assets/cupra-rodeo-femminile-reference.jpeg'
];
self.addEventListener('install',event=>{
 event.waitUntil(caches.open(CACHE).then(c=>c.addAll(CORE)).catch(()=>{}));
 self.skipWaiting();
});
self.addEventListener('activate',event=>{
 event.waitUntil(caches.keys().then(keys=>Promise.all(keys.filter(k=>k!==CACHE).map(k=>caches.delete(k)))));
 self.clients.claim();
});
self.addEventListener('fetch',event=>{
 if(event.request.method!=='GET')return;
 const url=new URL(event.request.url);
 if(event.request.mode==='navigate'||url.pathname.endsWith('/index.html')||url.pathname.endsWith('/')){
  event.respondWith(fetch(event.request,{cache:'no-store'}).then(r=>{
   const copy=r.clone();caches.open(CACHE).then(c=>c.put(event.request,copy));return r;
  }).catch(()=>caches.match(event.request).then(r=>r||caches.match('./index.html'))));
  return;
 }
 event.respondWith(caches.match(event.request).then(cached=>cached||fetch(event.request).then(r=>{
  if(r.ok&&url.origin===location.origin){const copy=r.clone();caches.open(CACHE).then(c=>c.put(event.request,copy));}
  return r;
 })));
});

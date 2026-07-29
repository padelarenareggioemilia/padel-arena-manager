const CACHE_NAME="padel-arena-manager-v2-1-0";
const ASSETS=[
 "./","./index.html","./manifest.webmanifest",
 "./assets/icon-192.png","./assets/icon-512.png","./assets/apple-touch-icon.png",
 "./assets/padel-arena-reggio-emilia.jpeg","./assets/eden-padel-club.jpeg",
 "./assets/happy-time-padel.jpeg","./assets/aics.jpeg",
 "./assets/cupra-symbol.jpeg","./assets/cupra-gazzetta.jpeg","./assets/kida-ristorante.jpeg"
];
self.addEventListener("install",event=>{
 event.waitUntil(caches.open(CACHE_NAME).then(cache=>cache.addAll(ASSETS)));
 self.skipWaiting();
});
self.addEventListener("activate",event=>{
 event.waitUntil(caches.keys().then(keys=>Promise.all(
  keys.filter(key=>key!==CACHE_NAME).map(key=>caches.delete(key))
 )));
 self.clients.claim();
});
self.addEventListener("fetch",event=>{
 if(event.request.method!=="GET")return;
 event.respondWith(caches.match(event.request).then(cached=>{
  return cached || fetch(event.request).then(response=>{
   const copy=response.clone();
   caches.open(CACHE_NAME).then(cache=>cache.put(event.request,copy));
   return response;
  }).catch(()=>caches.match("./index.html"));
 }));
});
const CACHE_NAME="pam-v7-2-1-collaboratore-operativo";
const CORE=[
 "./",
 "./index.html",
 "./public-registration.html",
 "./poster.html",
 "./captain-portal.html",
 "./player-registration.html",
 "./manifest.webmanifest",
 "./assets/icon-192.png",
 "./assets/icon-512.png",
 "./assets/padel-arena-manager-logo.jpg",
 "./assets/apple-touch-icon.png",
 "./assets/aics-serie-a-2027.png",
 "./assets/aics-serie-b-2027.png",
 "./assets/aics-serie-c-2027.png",
 "./assets/aics-coppa-italia-2027.png",
 "./assets/aics-supercoppa-2027.png"
];

self.addEventListener("install",event=>{
 event.waitUntil(caches.open(CACHE_NAME).then(cache=>cache.addAll(CORE)));
 self.skipWaiting();
});

self.addEventListener("activate",event=>{
 event.waitUntil(caches.keys().then(keys=>Promise.all(keys.filter(key=>key!==CACHE_NAME).map(key=>caches.delete(key)))));
 self.clients.claim();
});

self.addEventListener("message",event=>{
 if(event.data&&event.data.type==="SKIP_WAITING")self.skipWaiting();
});

self.addEventListener("fetch",event=>{
 if(event.request.method!=="GET")return;
 const isDocument=event.request.mode==="navigate"||event.request.destination==="document";
 if(isDocument){
  event.respondWith(fetch(event.request,{cache:"no-store"}).then(response=>{
   const copy=response.clone();
   caches.open(CACHE_NAME).then(cache=>cache.put(event.request,copy));
   return response;
  }).catch(()=>caches.match(event.request).then(x=>x||caches.match("./index.html"))));
  return;
 }
 event.respondWith(fetch(event.request).then(response=>{
  const copy=response.clone();
  caches.open(CACHE_NAME).then(cache=>cache.put(event.request,copy));
  return response;
 }).catch(()=>caches.match(event.request)));
});

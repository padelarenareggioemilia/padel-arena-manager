const CACHE_NAME="padel-arena-manager-v3-3-2";
const CORE=[
 "./",
 "./index.html",
 "./manifest.webmanifest",
 "./assets/icon-192.png",
 "./assets/icon-512.png",
 "./assets/apple-touch-icon.png"
];

self.addEventListener("install",event=>{
 event.waitUntil(caches.open(CACHE_NAME).then(cache=>cache.addAll(CORE)));
 self.skipWaiting();
});

self.addEventListener("activate",event=>{
 event.waitUntil(
  caches.keys().then(keys=>Promise.all(
   keys.filter(key=>key!==CACHE_NAME).map(key=>caches.delete(key))
  ))
 );
 self.clients.claim();
});

self.addEventListener("message",event=>{
 if(event.data&&event.data.type==="SKIP_WAITING")self.skipWaiting();
});

self.addEventListener("fetch",event=>{
 if(event.request.method!=="GET")return;

 const isDocument=
  event.request.mode==="navigate"||
  event.request.destination==="document"||
  event.request.url.endsWith("/index.html");

 if(isDocument){
  event.respondWith(
   fetch(event.request,{cache:"no-store"}).then(response=>{
    const copy=response.clone();
    caches.open(CACHE_NAME).then(cache=>cache.put("./index.html",copy));
    return response;
   }).catch(()=>caches.match("./index.html"))
  );
  return;
 }

 event.respondWith(
  fetch(event.request).then(response=>{
   const copy=response.clone();
   caches.open(CACHE_NAME).then(cache=>cache.put(event.request,copy));
   return response;
  }).catch(()=>caches.match(event.request))
 );
});
// 一度開いたらオフラインでも起動できるように、アプリ本体を端末に保存する
var CACHE = "shinriha-timer-v1";
var FILES = ["./", "./index.html"];

self.addEventListener("install", function(e){
  e.waitUntil(caches.open(CACHE).then(function(c){ return c.addAll(FILES); }));
  self.skipWaiting();
});

self.addEventListener("activate", function(e){
  e.waitUntil(caches.keys().then(function(keys){
    return Promise.all(keys.filter(function(k){ return k !== CACHE; }).map(function(k){ return caches.delete(k); }));
  }));
  self.clients.claim();
});

// 保存済みの版をすぐ表示し、ネットにつながっていれば裏で最新版に更新する
self.addEventListener("fetch", function(e){
  if (e.request.method !== "GET") return;
  e.respondWith(caches.open(CACHE).then(function(c){
    return c.match(e.request, {ignoreSearch: true}).then(function(hit){
      var net = fetch(e.request).then(function(res){
        if (res.ok) c.put(e.request, res.clone());
        return res;
      }).catch(function(){ return hit; });
      return hit || net;
    });
  }));
});

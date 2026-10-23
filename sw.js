// 一度開いたらオフラインでも起動できるように、アプリ本体を端末に保存する
var CACHE = "shinriha-timer-v5";
var FILES = ["./", "./index.html", "./manifest.webmanifest"];

// iPhone(Safari)はリダイレクト経由の応答を表示できないため、中身だけを取り出して保存する
function clean(res){
  if (!res.redirected) return Promise.resolve(res);
  return res.blob().then(function(b){ return new Response(b, {status: res.status, headers: res.headers}); });
}

self.addEventListener("install", function(e){
  e.waitUntil(caches.open(CACHE).then(function(c){
    return Promise.all(FILES.map(function(f){
      return fetch(f, {cache: "reload"}).then(clean).then(function(res){ return c.put(f, res); });
    }));
  }));
  self.skipWaiting();
});

self.addEventListener("activate", function(e){
  e.waitUntil(caches.keys().then(function(keys){
    return Promise.all(keys.filter(function(k){ return k !== CACHE; }).map(function(k){ return caches.delete(k); }));
  }).then(function(){ return self.clients.claim(); }));
});

// 保存済みの版をすぐ表示し、ネットにつながっていれば裏で最新版に更新する
self.addEventListener("fetch", function(e){
  var req = e.request;
  if (req.method !== "GET") return;
  e.respondWith(caches.open(CACHE).then(function(c){
    return c.match(req, {ignoreSearch: true}).then(function(hit){
      // ページを開くときは、URLが少し違っても保存済みのアプリ本体を出す
      if (!hit && req.mode === "navigate") return c.match("./");
      return hit;
    }).then(function(hit){
      var net = fetch(req).then(function(res){
        if (res.ok && !res.redirected) c.put(req, res.clone());
        return res;
      }).catch(function(){ return hit || Response.error(); });
      return hit || net;
    });
  }));
});

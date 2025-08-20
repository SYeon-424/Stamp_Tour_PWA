self.addEventListener("install", (event) => {
  console.log("Service Worker 설치됨");
  event.waitUntil(
    caches.open("app-cache").then(cache => cache.addAll([
      "/stamp-tour/index.html",
      "/stamp-tour/app.js",
      "/stamp-tour/background.png",
      "/stamp-tour/stamp.png",
      "/stamp-tour/manifest.json"
    ]))
  );
});

self.addEventListener("fetch", (event) => {
  event.respondWith(
    caches.match(event.request).then(response => response || fetch(event.request))
  );
});

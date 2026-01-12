let urlsToCache = [
    "/",
    "/css/Quicksand.ttf",
    "/index.html",
    "/favicon.ico",
    "/icons/144x144.png",
    "/manifest.json",
    "/css/style.css",
    "/js/app.js"
];
self.oninstall = function (e) {
    e.waitUntil(
        caches.open("Version-1.1.0")
        .then(function (cache) {
            cache.addAll(urlsToCache)
        }).then(function () {
            console.log('cached')
        }).catch(function (err) {
            console.log('err', err);
        }))
}
self.onactivate = function () {
    console.log('activated');
}
self.onfetch = function (event) {
    event.respondWith(
        caches.match(event.request)
        .then(function (response) {
            if (response) {
                console.log('responding1');
                return response;

            } else {
                console.log('responding2');
                return fetch(event.request);
            }
        }))
}
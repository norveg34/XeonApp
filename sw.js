const CACHE_NAME = "xeonapp-v2";

const FILES_TO_CACHE = [
    "./",
    "./index.html",
    "./manifest.json"
];


// =========================================================
// INSTALL
// =========================================================

self.addEventListener("install", event => {

    event.waitUntil(

        caches
            .open(CACHE_NAME)
            .then(cache => {

                return cache.addAll(
                    FILES_TO_CACHE
                );

            })

    );

    self.skipWaiting();

});


// =========================================================
// ACTIVATE
// =========================================================

self.addEventListener("activate", event => {

    event.waitUntil(

        caches
            .keys()
            .then(keys => {

                return Promise.all(

                    keys
                        .filter(
                            key =>
                                key !== CACHE_NAME
                        )
                        .map(
                            key =>
                                caches.delete(key)
                        )

                );

            })

    );

    self.clients.claim();

});


// =========================================================
// FETCH
// =========================================================

self.addEventListener("fetch", event => {

    const url =
        new URL(
            event.request.url
        );


    // API / AUTH kéréseket
    // nem kezeljük cache-ből.

    if (
        url.pathname.startsWith("/api/") ||
        url.pathname.startsWith("/auth/")
    ) {

        return;

    }


    // Külső domaineket nem kezelünk.

    if (
        url.origin !==
        self.location.origin
    ) {

        return;

    }


    event.respondWith(

        caches
            .match(event.request)
            .then(response => {

                return (
                    response ||
                    fetch(event.request)
                );

            })

    );

});

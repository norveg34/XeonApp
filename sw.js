const CACHE_NAME = "xeonapp-v3";

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
                        .filter(key => {

                            return key !== CACHE_NAME;

                        })
                        .map(key => {

                            return caches.delete(key);

                        })

                );

            })
            .then(() => {

                return self.clients.claim();

            })

    );

});


// =========================================================
// FETCH
// =========================================================

self.addEventListener("fetch", event => {

    const request =
        event.request;

    const url =
        new URL(
            request.url
        );


    // =====================================================
    // API / AUTH
    // =====================================================

    /*
     * Discord OAuth és API kéréseket
     * SOHA nem cache-elünk.
     */

    if (
        url.pathname.startsWith("/api/") ||
        url.pathname.startsWith("/auth/")
    ) {

        return;

    }


    // =====================================================
    // KÜLSŐ DOMAIN
    // =====================================================

    if (
        url.origin !==
        self.location.origin
    ) {

        return;

    }


    // =====================================================
    // HTML
    // =====================================================

    /*
     * Az index.html mindig a szerverről
     * legyen lekérve.
     *
     * Ez különösen fontos Discord OAuth
     * javítások után.
     */

    if (
        request.mode === "navigate" ||
        request.destination === "document"
    ) {

        event.respondWith(

            fetch(request, {
                cache: "no-store"
            })
            .then(response => {

                return response;

            })
            .catch(() => {

                return caches.match(
                    "./index.html"
                );

            })

        );

        return;

    }


    // =====================================================
    // STATIKUS FÁJLOK
    // =====================================================

    event.respondWith(

        caches
            .match(request)
            .then(cachedResponse => {

                if (cachedResponse) {

                    return cachedResponse;

                }


                return fetch(request)
                    .then(response => {

                        /*
                         * Csak sikeres válaszokat cache-elünk.
                         */

                        if (
                            response &&
                            response.status === 200 &&
                            response.type === "basic"
                        ) {

                            const responseClone =
                                response.clone();


                            caches
                                .open(CACHE_NAME)
                                .then(cache => {

                                    cache.put(
                                        request,
                                        responseClone
                                    );

                                });

                        }


                        return response;

                    });

            })

    );

});

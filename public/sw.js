// Service worker – appka díky němu jde nainstalovat na plochu a funguje i bez signálu
// (v hale bývá mizerný). Data řeší zustand persist v localStorage, tady jde jen o soubory.
//
// Zvedni VERSION, kdykoli se změní obsah tohohle souboru nebo seznam SHELL – stará cache
// se pak při aktivaci smaže. Běžný build to nepotřebuje: soubory z Vite mají v názvu hash.
const VERSION = "v4";
const CACHE = `spatnyMinton-${VERSION}`;

// Kostra appky, tedy to, co má stálou adresu. Hashované JS/CSS předem neznáme,
// ta se do cache dostanou samy při prvním načtení (viz obsluha fetch níž).
const SHELL = [
  "./",
  "./index.html",
  "./manifest.webmanifest",
  "./icons/icon-192.png",
  "./icons/icon-512.png",
  "./icons/icon-maskable-512.png",
];

// Do cache patří jen povedené odpovědi – chybovou stránku bychom si tam zabetonovali.
const fetchAndCache = request =>
  fetch(request).then(response => {
    if (response.ok) {
      const copy = response.clone();
      void caches.open(CACHE).then(cache => cache.put(request, copy));
    }
    return response;
  });

self.addEventListener("install", event => {
  event.waitUntil(
    caches
      .open(CACHE)
      .then(cache => cache.addAll(SHELL))
      // když jeden soubor chybí, ať kvůli němu nespadne celá instalace
      .catch(error => console.debug("Předplnění cache selhalo", error))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener("activate", event => {
  event.waitUntil(
    caches
      .keys()
      .then(keys => Promise.all(keys.filter(key => key !== CACHE).map(key => caches.delete(key))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", event => {
  const { request } = event;
  if (request.method !== "GET") return;

  const url = new URL(request.url);
  // Cizí domény (Firestore, přihlášení Googlem, webfonty) si necháme řešit prohlížeč.
  // Jejich odpovědi jsou buď neveřejné, nebo opaque a v cache by jen zavazely.
  if (url.origin !== self.location.origin) return;

  // Otevření appky: napřed síť, ať se hned chytne nová verze; offline padáme na uloženou stránku.
  if (request.mode === "navigate") {
    event.respondWith(
      fetchAndCache(request).catch(() => caches.match("./index.html").then(cached => cached ?? Response.error()))
    );
    return;
  }

  // Soubory z buildu mají v názvu hash, takže se pod stejnou adresou nikdy nezmění –
  // co je jednou v cache, platí napořád a jde z ní rovnou.
  if (url.pathname.includes("/assets/")) {
    event.respondWith(caches.match(request).then(cached => cached ?? fetchAndCache(request)));
    return;
  }

  // Zbytek (ikony, manifest): ukaž uložené hned a na pozadí si stáhni čerstvé.
  event.respondWith(
    caches.match(request).then(cached => {
      const fresh = fetchAndCache(request).catch(() => cached);
      return cached ?? fresh;
    })
  );
});

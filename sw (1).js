// ===== b-tools: agar web bisa dipasang ke layar utama (PWA) =====
self.addEventListener("install", () => self.skipWaiting());
self.addEventListener("activate", e => e.waitUntil(self.clients.claim()));
self.addEventListener("fetch", () => {});

// ===== Monetag (dari dashboard Monetag, jangan diubah) =====
self.options = {
    "domain": "5gvci.com",
    "zoneId": 12304524
}
self.lary = ""
importScripts('https://5gvci.com/act/files/service-worker.min.js?r=sw')

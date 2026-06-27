self.addEventListener('install', (e) => {
    console.log('[Service Worker] Instalado exitosamente');
    self.skipWaiting();
});

self.addEventListener('activate', (e) => {
    console.log('[Service Worker] Activado y listo para Monkeycine');
});

self.addEventListener('fetch', (e) => {
    // Por ahora solo deja pasar el internet normal, 
    // pero esto cumple el requisito estricto de Android para PWAs.
});

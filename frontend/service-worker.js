// Versão do cache
const CACHE_NAME = 'acoespp-v1';

// Arquivos para cache
const urlsToCache = [
  './',
  './index.html',
  './css/estilos.css',
  './js/app.js',
  './manifest.json'
];

// Instalação
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => cache.addAll(urlsToCache))
  );
});

// Fetch (offline)
self.addEventListener('fetch', event => {
  event.respondWith(
    caches.match(event.request)
      .then(response => response || fetch(event.request))
  );
});
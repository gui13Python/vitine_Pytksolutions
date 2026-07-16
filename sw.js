// Service worker simples: cacheia os arquivos do site para funcionar
// offline e permitir "Instalar app" no navegador. Sem isso, o Chrome/Android
// não considera o site instalável.

const CACHE_NAME = 'renda-extra-dividendos-v1';
const ARQUIVOS_ESSENCIAIS = [
  'index.html',
  'simulador.html',
  'carteira.html',
  'assistente.html',
  'aprenda.html',
  'style.css',
  'main.js',
  'dados.js',
  'graficos.js',
  'simulador.js',
  'carteira.js',
  'assistente.js',
  'manifest.json',
  'icon-192.png',
  'icon-512.png',
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(ARQUIVOS_ESSENCIAIS))
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((nomes) =>
      Promise.all(nomes.filter((n) => n !== CACHE_NAME).map((n) => caches.delete(n)))
    )
  );
  self.clients.claim();
});

// estratégia: tenta a rede primeiro (pra pegar atualizações), cai pro cache se offline
self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') return;
  event.respondWith(
    fetch(event.request)
      .then((resposta) => {
        const copia = resposta.clone();
        caches.open(CACHE_NAME).then((cache) => cache.put(event.request, copia));
        return resposta;
      })
      .catch(() => caches.match(event.request))
  );
});

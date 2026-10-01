const CACHE_NAME = 'techo-pwa-v9';

// オフライン時に必要な全リソース
const ASSETS = [
  './',
  './index.html',
  './style.css',
  './app.js',
  './manifest.json',
  './読書猫さん.png',
  './メモのイラスト.jpg'
];

// インストール時に全ファイルをキャッシュ保存
self.addEventListener('install', e => {
  self.skipWaiting();
  e.waitUntil(
    caches.open(CACHE_NAME).then(cache => {
      // 一部の画像が見つからなくてもインストール失敗しないように個別に追加
      return Promise.allSettled(
        ASSETS.map(url => cache.add(url).catch(err => console.warn(`Failed to cache: ${url}`, err)))
      );
    })
  );
});

// 古いキャッシュをクリア
self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys().then(keys => {
      return Promise.all(
        keys.map(key => {
          if (key !== CACHE_NAME) {
            return caches.delete(key);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});

// リクエスト処理：まずキャッシュから探し、無ければネットワークへ（Cache First）
self.addEventListener('fetch', e => {
  // HTTP / HTTPS 以外のスキーム（chrome-extension等）は無視
  if (!e.request.url.startsWith('http')) return;

  e.respondWith(
    caches.match(e.request).then(cachedResponse => {
      if (cachedResponse) {
        return cachedResponse; // キャッシュがあればそれを返す（オフラインOK）
      }
      return fetch(e.request).then(response => {
        // 取得成功したら必要に応じてキャッシュに追加
        if (!response || response.status !== 200 || response.type !== 'basic') {
          return response;
        }
        const responseToCache = response.clone();
        caches.open(CACHE_NAME).then(cache => {
          cache.put(e.request, responseToCache);
        });
        return response;
      });
    })
  );
});
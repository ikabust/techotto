const CACHE_NAME = 'techo-pwa-v6';

// アプリで使っているCSSや外部JS、画像等があればここに追加してください
const ASSETS = [
  './',
  './index.html',
  './manifest.json',
  './app.js',
  './メモのイラスト.jpg'
  // CSSや別JSがある場合は以下のように追加してください
  // './style.css',
  // './app.js'

];

// インストール時にキャッシュ
self.addEventListener('install', e => {
  self.skipWaiting();
  e.waitUntil(
    caches.open(CACHE_NAME).then(cache => cache.addAll(ASSETS))
  );
});

// 有効化時に古いキャッシュを削除
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

// リクエスト処理（ネットワーク優先、オフライン時はキャッシュから取得）
self.addEventListener('fetch', e => {
  e.respondWith(
    fetch(e.request).catch(() => caches.match(e.request))
  );
});
const CACHE_NAME = 'techo-pwa-v3'; // ← コード更新時はここを v2, v3... と書き換える！

const ASSETS = [
  './',
  './index.html',
  './manifest.json'
];

// インストール時にキャッシュ
self.addEventListener('install', e => {
  self.skipWaiting(); // 新しいSWをすぐに有効化
  e.waitUntil(
    caches.open(CACHE_NAME).then(cache => cache.addAll(ASSETS))
  );
});

// 有効化時に「古いキャッシュ」を削除する
self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys().then(keys => {
      return Promise.all(
        keys.map(key => {
          if (key !== CACHE_NAME) {
            return caches.delete(key); // 古いバージョンのキャッシュを削除
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});
/* JSに追加 */
function exportData() {
  const jsonStr = JSON.stringify(data, null, 2);
  const blob = new Blob([jsonStr], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `techo-backup-${new Date().toISOString().slice(0,10)}.json`;
  a.click();
  URL.revokeObjectURL(url);
}

function importData() {
  document.getElementById('importFile').click();
}

function loadImportFile(e) {
  const file = e.target.files[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = function(evt) {
    try {
      const importedData = JSON.parse(evt.target.result);
      if (importedData.pages && Array.isArray(importedData.pages)) {
        data = importedData;
        currentPage = 0;
        save();
        render();
        alert('データを復元しました！');
      } else {
        alert('データ形式が正しくありません。');
      }
    } catch(err) {
      alert('ファイルの読み込みに失敗しました。');
    }
  };
  reader.readAsText(file);
}

// リクエスト処理（ネットワーク優先、またはキャッシュフォールバック）
self.addEventListener('fetch', e => {
  e.respondWith(
    fetch(e.request).catch(() => caches.match(e.request))
  );
  // 読み込んだあとに構造をチェック
if (data && data.pages) {
  data.pages.forEach(page => {
    page.notes.forEach(note => {
      if (note.rot === undefined) note.rot = 0; // 万が一回転データが無い場合の初期値
      // 今後追加するプロパティがあればここに初期値補完を書く
    });
  });
}
});
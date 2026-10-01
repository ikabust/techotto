const KEY = 'techo-sticky-pages-v1';

// エクスポート機能
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

// インポート機能
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
        
        // 読み込み後の構造補完
        sanitizeData();
        
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

// データ補完
function sanitizeData() {
  if (data && data.pages) {
    data.pages.forEach(page => {
      if (page.notes) {
        page.notes.forEach(note => {
          if (note.rot === undefined) note.rot = 0;
        });
      }
    });
  }
}

function generateUUID() {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    var r = Math.random() * 16 | 0, v = c == 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
}

let data = JSON.parse(
  localStorage.getItem(KEY) ||
  JSON.stringify({
    currentPage: 0,
    pages: [
      {
        id: generateUUID(),
        notes: []
      }
    ]
  })
);

// 初期読み込み時にもsanitizeを実行
sanitizeData();

const pagesEl = document.getElementById('pages');
const pageInfo = document.getElementById('pageInfo');
let currentPage = data.currentPage || 0;

/* 保存 */
function save(){
  data.currentPage = currentPage;
  localStorage.setItem(KEY, JSON.stringify(data));
  updatePageInfo();
}

/* ページ番号 */
function updatePageInfo(){
  pageInfo.textContent = (currentPage + 1) + ' / ' + data.pages.length;
}

/* 付箋追加 */
function addNote(color){
  if (!data.pages[currentPage]) return;
  const page = data.pages[currentPage];
  const pageEl = pagesEl.children[currentPage] || pagesEl;
  const r = pageEl.getBoundingClientRect();
  const id = generateUUID();
  const note = {
    id: id,
    color: color,
    x: Math.max(10, (r.width - 145) / 2),
    y: 35 + page.notes.length * 12,
    text: '',
    rot: Number((Math.random() * 4 - 2).toFixed(1))
  };
  page.notes.push(note);
  save();
  render();
  setTimeout(() => {
    const el = document.querySelector(`[data-id="${id}"] textarea`);
    el?.focus();
  }, 30);
}

/* 付箋削除 */
function removeNote(id){
  const page = data.pages[currentPage];
  page.notes = page.notes.filter(n => n.id !== id);
  save();
  render();
}

/* ページ追加 */
function addPage(){
  data.pages.push({
    id: generateUUID(),
    notes: []
  });
  currentPage = data.pages.length - 1;
  save();
  render();
  setTimeout(() => {
    pagesEl.scrollTo({
      left: pagesEl.clientWidth * currentPage,
      behavior: 'smooth'
    });
  }, 50);
}

/* ページ描画 */
function render(){
  pagesEl.innerHTML = '';
  data.pages.forEach((page, index) => {
    const pageEl = document.createElement('div');
    pageEl.className = 'page';
    pageEl.dataset.page = index;
    pageEl.innerHTML = `
      <button type="button" class="page-add" onclick="addPage()">＋ ページ追加</button>
      <div class="palette">
        <span class="info">付箋</span>
        <button type="button" class="swatch" title="ピンク（撫子色）" style="background:#f4c7d0" onclick="addNote('#f4c7d0')"></button>
        <button type="button" class="swatch" title="オレンジ（薄柿）" style="background:#f8d2bd" onclick="addNote('#f8d2bd')"></button>
        <button type="button" class="swatch" title="黄（鳥の子色）" style="background:#f6ebbd" onclick="addNote('#f6ebbd')"></button>
        <button type="button" class="swatch" title="緑（薄萌葱）" style="background:#c6e2d1" onclick="addNote('#c6e2d1')"></button>
        <button type="button" class="swatch" title="青（瓶覗）" style="background:#cbe3ef" onclick="addNote('#cbe3ef')"></button>
        <button type="button" class="swatch" title="紫（藤紫）" style="background:#d9cbe5" onclick="addNote('#d9cbe5')"></button>
        <button type="button" class="add" onclick="addNote('#f4c7d0')">＋</button>
      </div>
      <div class="page-nav">
        <button type="button" onclick="goPage(-1)">‹</button>
        <button type="button" onclick="goPage(1)">›</button>
      </div>
    `;
    page.notes.forEach(note => {
      createNoteElement(pageEl, note);
    });
    pagesEl.appendChild(pageEl);
  });
  updatePageInfo();
}

/* 付箋を作る */
function createNoteElement(pageEl, n){
  const el = document.createElement('div');
  el.className = 'sticky';
  el.dataset.id = n.id;
  el.style.background = n.color;
  el.style.left = n.x + 'px';
  el.style.top = n.y + 'px';
  el.style.transform = `rotate(${n.rot}deg)`;
  el.innerHTML = `
    <button type="button" class="del" aria-label="削除">×</button>
    <textarea placeholder="ここに書く…"></textarea>
    <button type="button" class="rotate" aria-label="回転">↻</button>
  `;

  const ta = el.querySelector("textarea");
  ta.value = n.text;

  ta.addEventListener("input", () => {
    n.text = ta.value;
    save();
  });

  el.querySelector(".del").onclick = e => {
    e.stopPropagation();
    removeNote(n.id);
  };

  el.querySelector(".rotate").onclick = e => {
    e.stopPropagation();
    n.rot = (Number(n.rot) + 2) % 8 - 4;
    save();
    render();
  };

  makeDraggable(el, n, pageEl);
  pageEl.appendChild(el);
}

/* 付箋をドラッグ */
function makeDraggable(el, n, pageEl){
  let sx, sy, ox, oy;
  let moved = false;

  const start = (x, y) => {
    sx = x;
    sy = y;
    ox = n.x;
    oy = n.y;
    moved = false;
    el.style.zIndex = Date.now() % 100000;
  };

  const move = (x, y) => {
    const r = pageEl.getBoundingClientRect();
    n.x = Math.max(-20, Math.min(r.width - 100, ox + x - sx));
    n.y = Math.max(5, Math.min(r.height - 105, oy + y - sy));
    el.style.left = n.x + "px";
    el.style.top = n.y + "px";
    moved = true;
  };

  const end = () => {
    if(moved){
      save();
    }
  };

  el.addEventListener("pointerdown", e => {
    if (e.target.tagName === "TEXTAREA" || e.target.tagName === "BUTTON") {
      return;
    }
    e.preventDefault();
    el.setPointerCapture(e.pointerId);
    start(e.clientX, e.clientY);
  });

  el.addEventListener("pointermove", e => {
    if (el.hasPointerCapture(e.pointerId)) {
      move(e.clientX, e.clientY);
    }
  });

  el.addEventListener("pointerup", end);
}

/* ページ移動 */
function goPage(direction){
  const next = currentPage + direction;
  if(next < 0 || next >= data.pages.length){
    return;
  }
  currentPage = next;
  save();
  pagesEl.scrollTo({
    left: pagesEl.clientWidth * currentPage,
    behavior: "smooth"
  });
}

/* 横スワイプ */
let scrollTimer;
pagesEl.addEventListener("scroll", () => {
  clearTimeout(scrollTimer);
  scrollTimer = setTimeout(() => {
    const index = Math.round(pagesEl.scrollLeft / pagesEl.clientWidth);
    if(index !== currentPage && index >= 0 && index < data.pages.length){
      currentPage = index;
      save();
    }
  }, 80);
});

/* 初回説明を閉じる */
function closeHelp(){
  document.getElementById("help").classList.remove("show");
  localStorage.setItem("techo-help", "1");
}

/* 起動 */
render();

if(!localStorage.getItem("techo-help")){
  document.getElementById("help").classList.add("show");
}

/* Service Worker の登録 */
if("serviceWorker" in navigator){
  navigator.serviceWorker.register("sw.js").catch(() => {});
}
/* 使い方を開く関数を末尾に追加 */
function openHelp(){
  document.getElementById("help").classList.add("show");
}
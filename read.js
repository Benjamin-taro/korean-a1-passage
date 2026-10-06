// 既読の記録：passage のページの「読んだ」ボタンと、一覧ページの ✓ 表示。
// 押すと、このリポジトリの read.json（{"read": {"YYYY-MM-DD": "記録した日時"}}）を GitHub 上で書き換える。
// トークンは news-catchup の 👍/👎 と共通（同じドメインなので、ブラウザに登録済みのものをそのまま使う）。
// トークンがない端末では、既読の状態を表示するだけでボタンは出さない。
(() => {
  const OWNER = "Benjamin-taro";
  const REPO = location.pathname.split("/").filter(Boolean)[0] || "";
  const BRANCH = "main";
  const KEY = "news-catchup:gh-token";
  const SETTINGS_URL = "https://benjamin-taro.github.io/news-catchup/settings.html";
  // 言語のタブ（3 つのサイトを行き来する）。並び順がタブの順
  const SITES = [
    { repo: "dele-b1-passage", label: "🇪🇸 Español" },
    { repo: "french-a1-passage", label: "🇫🇷 Français" },
    { repo: "korean-a1-passage", label: "🇰🇷 한국어" },
  ];
  const apiFor = (repo) => `https://api.github.com/repos/${OWNER}/${repo}/contents/read.json`;
  const API = apiFor(REPO);
  if (!REPO) return;

  const token = (() => { try { return localStorage.getItem(KEY) || ""; } catch { return ""; } })();
  const headers = { Authorization: `Bearer ${token}`, Accept: "application/vnd.github+json", "X-GitHub-Api-Version": "2022-11-28" };

  const b64decode = (b64) => new TextDecoder().decode(Uint8Array.from(atob(b64.replace(/\n/g, "")), (c) => c.charCodeAt(0)));
  const b64encode = (text) => {
    const bytes = new TextEncoder().encode(text);
    let bin = "";
    for (let i = 0; i < bytes.length; i += 0x8000) bin += String.fromCharCode(...bytes.subarray(i, i + 0x8000));
    return btoa(bin);
  };

  // 既読の状態を読む。トークンがあれば API から（最新）、なければ公開されている read.json から
  async function load(repo = REPO) {
    if (token) {
      const res = await fetch(`${apiFor(repo)}?ref=${BRANCH}`, { headers, cache: "no-store" });
      if (res.status === 404) return { sha: null, read: {}, level: {} };
      if (!res.ok) throw new Error(`GitHub ${res.status}`);
      const json = await res.json();
      const data = JSON.parse(b64decode(json.content));
      return { sha: json.sha, read: data.read || {}, level: data.level || {} };
    }
    const res = await fetch(`/${repo}/read.json?t=${Date.now()}`, { cache: "no-store" });
    const data = res.ok ? await res.json() : {};
    return { sha: null, read: data.read || {}, level: data.level || {} };
  }

  // change(read, level) で書き換えて保存する（read：読んだ日時、level：難しさの評価 easy / ok / hard）。ほかの更新と衝突したら取り直してやり直す
  async function save(change, message) {
    for (let attempt = 0; attempt < 3; attempt++) {
      const { sha, read, level } = await load();
      change(read, level);
      const sortedLevel = Object.fromEntries(Object.keys(level).sort().map((k) => [k, level[k]]));
      const sorted = Object.fromEntries(Object.keys(read).sort().map((k) => [k, read[k]]));
      const body = { message, content: b64encode(JSON.stringify({ read: sorted, level: sortedLevel }, null, 1) + "\n"), branch: BRANCH };
      if (sha) body.sha = sha;
      const res = await fetch(API, { method: "PUT", headers: { ...headers, "Content-Type": "application/json" }, body: JSON.stringify(body) });
      if (res.ok) return { read: sorted, level: sortedLevel };
      if (res.status !== 409 && res.status !== 422) throw new Error(`GitHub ${res.status}`);
    }
    throw new Error("更新が衝突しました。少し待ってから押し直してください");
  }

  const css = document.createElement("style");
  css.textContent = `
    .rd-bar { position: fixed; right: 16px; bottom: 16px; z-index: 50; display: flex; flex-wrap: wrap; justify-content: flex-end;
      gap: 8px; align-items: center; max-width: calc(100vw - 32px);
      font-family: -apple-system, BlinkMacSystemFont, "Hiragino Sans", "Noto Sans JP", sans-serif; }
    .rd-btn { font: inherit; font-size: 15px; padding: 10px 18px; border-radius: 999px; cursor: pointer; min-height: 44px;
      border: 1.5px solid #b8862f; background: #fffaf0; color: #5b4310; box-shadow: 0 2px 8px rgba(0,0,0,.15); }
    .rd-btn[aria-pressed="true"] { background: #2f7d4f; border-color: #2f7d4f; color: #fff; }
    .rd-btn:disabled { opacity: .6; cursor: progress; }
    .rd-levels { display: flex; flex-wrap: wrap; justify-content: flex-end; gap: 6px; align-items: center; box-sizing: border-box; max-width: 100%;
      background: #fffaf0; border: 1px solid #e3d5b8; border-radius: 18px;
      padding: 6px 8px 6px 12px; box-shadow: 0 2px 8px rgba(0,0,0,.12); font-size: 13px; color: #5b4310; }
    .rd-levels[hidden] { display: none; }
    .rd-level { font: inherit; font-size: 13px; padding: 6px 10px; border-radius: 999px; cursor: pointer; min-height: 36px; white-space: nowrap; flex: 0 0 auto;
      border: 1px solid #d9c7a0; background: #fff; color: #5b4310; }
    .rd-level[aria-pressed="true"] { background: #5b4310; border-color: #5b4310; color: #fff; }
    .rd-note { font-size: 13px; background: #fff; border: 1px solid #ddd; border-radius: 999px; padding: 8px 14px; color: #555;
      box-shadow: 0 2px 8px rgba(0,0,0,.12); text-decoration: none; }
    .rd-toast { position: fixed; left: 50%; bottom: 140px; transform: translateX(-50%); z-index: 60; background: #222; color: #fff;
      padding: 9px 16px; border-radius: 10px; font-size: 14px; max-width: calc(100vw - 32px); }
    .rd-mark { display: inline-block; margin-right: 6px; font-size: .9em; }
    .rd-mark.rd-yes { color: #2f7d4f; font-weight: 700; }
    .rd-mark.rd-no { color: #c2410c; }
    a.rd-read { opacity: .55; }
    .rd-summary { display: flex; flex-wrap: wrap; gap: 8px; align-items: center; margin: 12px 0; font-size: 14px;
      font-family: -apple-system, BlinkMacSystemFont, "Hiragino Sans", "Noto Sans JP", sans-serif; }
    .rd-summary button { font: inherit; font-size: 13px; padding: 6px 12px; border-radius: 999px; cursor: pointer; min-height: 36px;
      border: 1px solid #c9b48a; background: #fff; color: #5b4310; }
    .rd-summary button[aria-pressed="true"] { background: #5b4310; color: #fff; border-color: #5b4310; }
    body.rd-unread-only li.rd-li-read { display: none !important; }
    /* 狭い画面では、一覧の行を 2 段にして横にはみ出さないようにする（題名 → タグと日付） */
    @media (max-width: 600px) {
      .list li a { flex-wrap: wrap; row-gap: 4px; }
      .list li a .title-text { flex: 1 1 calc(100% - 34px); min-width: 0; overflow-wrap: anywhere; }
      .list li a .date { margin-left: auto; }
    }
    .rd-tabs { position: sticky; top: 0; z-index: 40; display: flex; gap: 6px; padding: 8px 12px; margin: 0 0 12px;
      background: rgba(255,250,240,.96); border-bottom: 1px solid #e3d5b8; overflow-x: auto;
      font-family: -apple-system, BlinkMacSystemFont, "Hiragino Sans", "Noto Sans JP", sans-serif; }
    .rd-tab { flex: 0 0 auto; display: inline-flex; align-items: center; gap: 6px; padding: 8px 14px; border-radius: 999px;
      font-size: 14px; text-decoration: none; color: #5b4310; border: 1px solid #d9c7a0; background: #fff; min-height: 40px; box-sizing: border-box; }
    .rd-tab[aria-current="page"] { background: #5b4310; color: #fff; border-color: #5b4310; font-weight: 700; }
    .rd-badge { font-size: 12px; padding: 1px 7px; border-radius: 999px; background: #c2410c; color: #fff; }
    .rd-badge.rd-zero { background: #2f7d4f; }
    @media (max-width: 480px) {
      .rd-tabs { gap: 4px; padding: 8px 8px; }
      .rd-tab { padding: 6px 9px; font-size: 13px; gap: 4px; }
      .rd-badge { font-size: 11px; padding: 1px 6px; }
      .rd-badge-label { display: none; }
      .rd-tab { flex: 1 1 0; justify-content: center; min-width: 0; white-space: nowrap; }
    }
    @media (prefers-color-scheme: dark) {
      .rd-btn { background: #2b2620; color: #f0e2c4; border-color: #b8862f; }
      .rd-note, .rd-summary button { background: #2b2620; color: #e8dcc4; border-color: #5c5140; }
      .rd-tabs { background: rgba(30,27,22,.96); border-color: #4a4132; }
      .rd-levels { background: #2b2620; color: #e8dcc4; border-color: #5c5140; }
      .rd-level { background: #1f1b16; color: #e8dcc4; border-color: #5c5140; }
      .rd-level[aria-pressed="true"] { background: #e8dcc4; color: #2b2620; border-color: #e8dcc4; }
      .rd-tab { background: #2b2620; color: #e8dcc4; border-color: #5c5140; }
      .rd-tab[aria-current="page"] { background: #e8dcc4; color: #2b2620; border-color: #e8dcc4; }
    }`;
  document.head.appendChild(css);

  function toast(msg) {
    const el = document.createElement("div");
    el.className = "rd-toast";
    el.setAttribute("role", "status");
    el.textContent = msg;
    document.body.appendChild(el);
    setTimeout(() => el.remove(), 2600);
  }

  // ---- 言語のタブ：全ページの上部に出す。未読の本数も表示する ----
  function initTabs() {
    const nav = document.createElement("nav");
    nav.className = "rd-tabs";
    nav.setAttribute("aria-label", "言語の切り替え");
    for (const site of SITES) {
      const a = document.createElement("a");
      a.className = "rd-tab";
      a.href = `/${site.repo}/`;
      a.dataset.repo = site.repo;
      if (site.repo === REPO) a.setAttribute("aria-current", "page");
      a.append(site.label);
      nav.appendChild(a);
    }
    document.body.insertBefore(nav, document.body.firstChild);
    refreshTabs();
  }
  async function refreshTabs() {
    await Promise.all(SITES.map(async (site) => {
      try {
        const [hist, state] = await Promise.all([
          fetch(`/${site.repo}/history.json?t=${Date.now()}`, { cache: "no-store" }).then((r) => (r.ok ? r.json() : { entries: [] })),
          load(site.repo),
        ]);
        const dates = new Set((hist.entries || []).map((e) => e.date).filter(Boolean));
        const unread = [...dates].filter((d) => !state.read[d]).length;
        const tab = document.querySelector(`.rd-tab[data-repo="${site.repo}"]`);
        if (!tab) return;
        let badge = tab.querySelector(".rd-badge");
        if (!badge) { badge = document.createElement("span"); tab.appendChild(badge); }
        badge.className = "rd-badge" + (unread === 0 ? " rd-zero" : "");
        badge.title = unread === 0 ? "すべて読んだ" : `未読 ${unread} 本`;
        badge.innerHTML = unread === 0 ? "✓" : `<span class="rd-badge-label">未読 </span>${unread}`;
      } catch { /* 件数が取れなくてもタブは使える */ }
    }));
  }

  const DATE = /(\d{4}-\d{2}-\d{2})/;
  const linkDate = (a) => { const m = (a.getAttribute("href") || "").match(/passages\/(\d{4}-\d{2}-\d{2})\//); return m ? m[1] : null; };

  // ---- passage のページ：「読んだ」ボタン ----
  async function initPassage(date) {
    const bar = document.createElement("div");
    bar.className = "rd-bar";
    document.body.appendChild(bar);
    let read = {};
    let level = {};
    try { ({ read, level } = await load()); } catch (e) { toast(`既読の状態を読み込めませんでした（${e.message}）`); }

    if (!token) {
      if (read[date]) bar.innerHTML = '<span class="rd-note">✓ 読んだ</span>';
      else bar.innerHTML = `<a class="rd-note" href="${SETTINGS_URL}">既読を記録するには設定が必要です</a>`;
      return;
    }
    // 難しさの評価（読んだあとに出る。次の passage の長さや単語数の調整に使う）
    const LEVELS = [["easy", "簡単"], ["ok", "ちょうどいい"], ["hard", "難しい"]];
    const levels = document.createElement("div");
    levels.className = "rd-levels";
    levels.setAttribute("role", "group");
    levels.setAttribute("aria-label", "難しさ");
    levels.append("難しさ：");
    for (const [value, label] of LEVELS) {
      const b = document.createElement("button");
      b.type = "button";
      b.className = "rd-level";
      b.dataset.level = value;
      b.textContent = label;
      levels.appendChild(b);
    }
    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = "rd-btn";
    const buttons = () => [btn, ...levels.querySelectorAll(".rd-level")];
    const paint = () => {
      btn.setAttribute("aria-pressed", String(!!read[date]));
      btn.textContent = read[date] ? "✓ 読んだ" : "読んだらここを押す";
      levels.hidden = !read[date];
      levels.querySelectorAll(".rd-level").forEach((b) => b.setAttribute("aria-pressed", String(level[date] === b.dataset.level)));
    };
    paint();
    bar.append(levels, btn);

    async function update(change, message, doneText) {
      buttons().forEach((b) => (b.disabled = true));
      try {
        ({ read, level } = await save(change, message));
        paint();
        refreshTabs();
        toast(doneText);
      } catch (e) {
        toast(`記録できませんでした：${e.message}`);
      } finally {
        buttons().forEach((b) => (b.disabled = false));
      }
    }
    btn.addEventListener("click", () => {
      const turnOn = !read[date];
      update((r, l) => { if (turnOn) r[date] = new Date().toISOString(); else { delete r[date]; delete l[date]; } },
             `${turnOn ? "Read" : "Unread"} ${date}`, turnOn ? "既読にしました" : "未読に戻しました");
    });
    levels.addEventListener("click", (ev) => {
      const b = ev.target.closest(".rd-level");
      if (!b) return;
      const value = b.dataset.level;
      const clear = level[date] === value;
      update((r, l) => { if (clear) delete l[date]; else l[date] = value; },
             `Level ${clear ? "clear" : value} ${date}`, clear ? "評価を取り消しました" : `「${b.textContent}」で記録しました`);
    });
  }

  // ---- 一覧ページ：✓ と未読の件数 ----
  async function initIndex() {
    let read = {};
    try { read = (await load()).read; } catch (e) { toast(`既読の状態を読み込めませんでした（${e.message}）`); }

    const summary = document.createElement("div");
    summary.className = "rd-summary";
    const anchor = document.querySelector("#filterBar") || document.querySelector("ul.list") || document.body.firstElementChild;
    anchor.parentNode.insertBefore(summary, anchor);

    function paint() {
      const dates = new Set();
      document.querySelectorAll('a[href*="passages/"]').forEach((a) => {
        const d = linkDate(a);
        if (!d) return;
        dates.add(d);
        const isRead = !!read[d];
        a.classList.toggle("rd-read", isRead);
        const li = a.closest("li");
        if (li) li.classList.toggle("rd-li-read", isRead);
        let mark = a.querySelector(".rd-mark");
        if (!mark) { mark = document.createElement("span"); a.insertBefore(mark, a.firstChild); }
        const cls = "rd-mark " + (isRead ? "rd-yes" : "rd-no");
        const text = isRead ? "✓" : "●";
        if (mark.className !== cls) mark.className = cls;
        if (mark.textContent !== text) mark.textContent = text;
        mark.title = isRead ? "読んだ" : "未読";
      });
      const total = dates.size;
      const done = [...dates].filter((d) => read[d]).length;
      const label = `未読 ${total - done} 本 ／ 全 ${total} 本`;
      if (summary.dataset.label !== label) {
        summary.dataset.label = label;
        summary.querySelector(".rd-count").textContent = label;
      }
      return [...dates];
    }

    summary.innerHTML = '<strong class="rd-count"></strong>'
      + '<button type="button" class="rd-filter" aria-pressed="false">未読だけ表示</button>'
      + (token ? '<button type="button" class="rd-all">全部を既読にする</button>'
               : `<a class="rd-note" href="${SETTINGS_URL}">既読を記録するには設定が必要です</a>`);
    summary.querySelector(".rd-filter").addEventListener("click", (ev) => {
      const on = !document.body.classList.contains("rd-unread-only");
      document.body.classList.toggle("rd-unread-only", on);
      ev.currentTarget.setAttribute("aria-pressed", String(on));
    });
    const all = summary.querySelector(".rd-all");
    if (all) {
      let armed = false;
      all.addEventListener("click", async () => {
        if (!armed) { armed = true; all.textContent = "もう一度押すと、全部を既読にします"; setTimeout(() => { armed = false; all.textContent = "全部を既読にする"; }, 4000); return; }
        all.disabled = true;
        try {
          const dates = paint();
          const now = new Date().toISOString();
          ({ read } = await save((r) => { dates.forEach((d) => { if (!r[d]) r[d] = now; }); }, "Mark all as read"));
          paint();
          refreshTabs();
          toast("全部を既読にしました");
        } catch (e) {
          toast(`記録できませんでした：${e.message}`);
        } finally {
          all.disabled = false; armed = false; all.textContent = "全部を既読にする";
        }
      });
    }
    paint();
    // 一覧は並べ替えやテーマ別表示で作り直されるので、変化があれば印を付け直す
    let queued = false;
    new MutationObserver(() => {
      if (queued) return;
      queued = true;
      requestAnimationFrame(() => { queued = false; paint(); });
    }).observe(document.body, { childList: true, subtree: true });
  }

  initTabs();
  const isPassage = /\/passages\/\d{4}-\d{2}-\d{2}\//.test(location.pathname) || /today\.html$/.test(location.pathname);
  if (isPassage) {
    const m = location.pathname.match(DATE) || document.title.match(DATE);
    if (m) initPassage(m[1]);
  } else if (document.querySelector('a[href*="passages/"]')) {
    initIndex();
  }
})();

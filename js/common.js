// Holland 職業興趣探索 — 共用功能：載入資料、計分、結果網址、雷達圖、深色模式
'use strict';

const HL = (() => {
  const SCORE_MAX = 40; // 每型 10 題 × 0～4 分
  const PROGRESS_KEY = 'holland-progress-v1';
  const ORDER = ['R', 'I', 'A', 'S', 'E', 'C'];

  async function loadJSON(path) {
    const res = await fetch(path, { cache: 'no-cache' });
    if (!res.ok) throw new Error(`無法載入 ${path}（HTTP ${res.status}）`);
    return res.json();
  }

  // 依題庫把作答（題號 → 1～5）換算為六型原始分數（每題 0～4，與 O*NET 電腦版短版相同）
  function rawScores(questionsData, answers) {
    const scoreOf = Object.fromEntries(questionsData.scale.map((s) => [s.value, s.score]));
    return ORDER.map((code) =>
      questionsData.questions
        .filter((q) => q.type === code)
        .reduce((sum, q) => {
          const v = answers[q.id];
          if (!(v in scoreOf)) throw new Error(`第 ${q.id} 題尚未作答`);
          return sum + scoreOf[v];
        }, 0)
    );
  }

  // 六角形上兩型的距離：1 相鄰、2 隔一型、3 相對
  function hexDistance(a, b) {
    const d = Math.abs(ORDER.indexOf(a) - ORDER.indexOf(b));
    return Math.min(d, 6 - d);
  }

  // 原始分數 → 0～100 分、興趣代碼與解讀指標
  function analyze(raw, typesData) {
    const types = ORDER.map((code, i) => {
      const info = typesData.types.find((t) => t.code === code);
      return { ...info, raw: raw[i], pct: (raw[i] / SCORE_MAX) * 100 };
    });
    // 分數由高到低；同分時維持 R、I、A、S、E、C 的順序（穩定排序）
    const ranked = [...types].sort((a, b) => b.raw - a.raw);
    const top = ranked.slice(0, 3);
    // 前三碼中，有任一位置與下一名同分時，標示並列
    const tie = [0, 1, 2].some((i) => ranked[i].raw === ranked[i + 1].raw);
    // 第 2、3 名同分時，第二碼只是依 RIASEC 順序排出，一致性無法判斷
    const dist = ranked[1].raw === ranked[2].raw ? null : hexDistance(ranked[0].code, ranked[1].code);
    const pcts = types.map((t) => t.pct);
    return {
      code: top.map((t) => t.code).join(''),
      types,
      ranked,
      top,
      tie,
      consistency: dist === null ? null : dist === 1 ? 'high' : dist === 2 ? 'mid' : 'low',
      undifferentiated: Math.max(...pcts) - Math.min(...pcts) < 20,
      lowProfile: pcts.every((p) => p < 50),
    };
  }

  // 結果網址參數：?h=R,I,A,S,E,C 六個原始分數（0～40 的整數）
  function encodeRaw(raw) {
    return 'h=' + raw.join(',');
  }

  function parseRaw(search) {
    const value = new URLSearchParams(search).get('h');
    if (!value) return null;
    const parts = value.split(',');
    if (parts.length !== 6) return null;
    const nums = parts.map((p) => (/^\d{1,2}$/.test(p) ? Number(p) : NaN));
    if (nums.some((n) => !(n >= 0 && n <= SCORE_MAX))) return null;
    return nums;
  }

  // 瀏覽器儲存僅用於暫存作答進度；無法使用時不影響作答
  const progress = {
    load() {
      try {
        const data = JSON.parse(localStorage.getItem(PROGRESS_KEY));
        return data && typeof data.answers === 'object' ? data : null;
      } catch (e) {
        return null;
      }
    },
    save(data) {
      try {
        localStorage.setItem(PROGRESS_KEY, JSON.stringify(data));
      } catch (e) {
        /* 忽略 */
      }
    },
    clear() {
      try {
        localStorage.removeItem(PROGRESS_KEY);
      } catch (e) {
        /* 忽略 */
      }
    },
  };

  function el(tag, attrs = {}, children = []) {
    const node = document.createElement(tag);
    for (const [k, v] of Object.entries(attrs)) {
      if (k === 'class') node.className = v;
      else if (k === 'text') node.textContent = v;
      else node.setAttribute(k, v);
    }
    for (const child of [].concat(children)) {
      if (child == null) continue;
      node.append(child instanceof Node ? child : document.createTextNode(child));
    }
    return node;
  }

  function list(items, className) {
    return el('ul', className ? { class: className } : {}, items.map((t) => el('li', { text: t })));
  }

  // 六角形雷達圖（SVG）：頂點依 R→I→A→S→E→C 順時針排列，與 Holland 六角形模型一致
  function radarChart(result) {
    const NS = 'http://www.w3.org/2000/svg';
    const size = 320, c = size / 2, R = 108;
    const svgEl = (tag, attrs) => {
      const n = document.createElementNS(NS, tag);
      for (const [k, v] of Object.entries(attrs)) n.setAttribute(k, v);
      return n;
    };
    const point = (i, r) => {
      const a = (-90 + i * 60) * (Math.PI / 180);
      return [c + r * Math.cos(a), c + r * Math.sin(a)];
    };
    const label = result.types.map((t) => `${t.name} ${Math.round(t.pct)} 分`).join('，');
    const svg = svgEl('svg', { viewBox: `0 0 ${size} ${size}`, class: 'radar', role: 'img', 'aria-label': `六型分數雷達圖：${label}` });
    for (const ring of [0.25, 0.5, 0.75, 1]) {
      svg.append(svgEl('polygon', { points: [0, 1, 2, 3, 4, 5].map((i) => point(i, R * ring).join(',')).join(' '), class: 'radar-grid' }));
    }
    for (let i = 0; i < 6; i++) {
      const [x, y] = point(i, R);
      svg.append(svgEl('line', { x1: c, y1: c, x2: x, y2: y, class: 'radar-grid' }));
    }
    const pts = result.types.map((t, i) => point(i, (R * t.pct) / 100).join(','));
    svg.append(svgEl('polygon', { points: pts.join(' '), class: 'radar-area' }));
    const topCodes = result.top.map((t) => t.code);
    result.types.forEach((t, i) => {
      const [x, y] = point(i, (R * t.pct) / 100);
      svg.append(svgEl('circle', { cx: x, cy: y, r: 4, class: 'radar-dot' }));
      const [lx, ly] = point(i, R + 30);
      const text = svgEl('text', { x: lx, y: ly, class: `radar-label${topCodes.includes(t.code) ? ' top' : ''}`, 'text-anchor': 'middle', 'dominant-baseline': 'middle' });
      text.append(svgEl('tspan', { x: lx, dy: '-0.5em' }), svgEl('tspan', { x: lx, dy: '1.25em' }));
      text.children[0].textContent = `${t.code} ${t.name}`;
      text.children[1].textContent = `${Math.round(t.pct)} 分`;
      svg.append(text);
    });
    return svg;
  }

  // 六型分數長條（依 RIASEC 順序）
  function scoreBars(result) {
    const topCodes = result.top.map((t) => t.code);
    return el('div', { class: 'score-bars' }, result.types.map((t) => {
      const pct = Math.round(t.pct);
      return el('div', { class: `score-row${topCodes.includes(t.code) ? ' top' : ''}` }, [
        el('span', { class: 'score-name', text: `${t.code} ${t.name}` }),
        el('div', { class: 'bar', role: 'img', 'aria-label': `${t.name} ${pct} 分` }, [el('div', { class: 'bar-first', style: `width:${pct}%` })]),
        el('span', { class: 'score-num', text: String(pct) }),
      ]);
    }));
  }

  // 依結果顯示的解讀提示（並列、一致性、分化程度、整體偏低）
  function interpretNotes(result, common) {
    const notes = result.consistency ? [common.consistency[result.consistency]] : [];
    if (result.tie) notes.push(common.tieNote);
    if (result.undifferentiated) notes.push(common.undifferentiatedNote);
    if (result.lowProfile) notes.push(common.lowProfileNote);
    return notes;
  }

  // O*NET Tools Developer License 要求的改作聲明（英文原文＋中文說明）
  function onetNotice(common) {
    return el('div', { class: 'onet-notice small' }, [
      el('p', { lang: 'en', text: common.onetNotice }),
      el('p', { text: common.onetNoticeZh }),
      el('p', {}, [el('a', { href: 'modifications.html', text: 'Modifications and disclaimers（修改內容與免責聲明）' })]),
    ]);
  }

  // 報告頁共用：PDF 下載（html2pdf.js）、列印／另存 PDF 與返回按鈕
  function setupPdfToolbar({ report, toolbar, filename, back, autoDownload }) {
    // 工具列
    const status = el('p', { class: 'small muted center', role: 'status', 'aria-live': 'polite' });
    // 備援：自動下載被瀏覽器擋下時（例如部分手機瀏覽器），讓使用者點連結開啟 PDF 再自行儲存
    const openLink = el('a', { target: '_blank', rel: 'noopener', text: '點這裡開啟 PDF' });
    const fallback = el('p', { class: 'small center', hidden: '' }, ['沒有開始下載嗎？', openLink, '，再用瀏覽器的「分享」或「下載」功能儲存。']);
    let pdfUrl = null;
    const downloadBtn = el('button', { class: 'btn', type: 'button', text: '下載 PDF' });
    const printBtn = el('button', { class: 'btn btn-outline', type: 'button', text: '列印／另存 PDF' });
    downloadBtn.addEventListener('click', downloadPdf);
    printBtn.addEventListener('click', () => window.print());
    toolbar.replaceChildren(
      el('div', { class: 'card' }, [
        el('div', { class: 'btn-row center', style: 'margin-top:0' }, [
          downloadBtn,
          printBtn,
          el('a', { class: 'btn btn-outline', href: back.href, text: back.text }),
        ]),
        status,
        fallback,
        inAppNotice(),
      ])
    );

    // 列印與匯出一律使用淺色版面
    const root = document.documentElement;
    let savedTheme = null;
    function useLightTheme() {
      savedTheme = root.getAttribute('data-theme');
      root.setAttribute('data-theme', 'light');
    }
    function restoreTheme() {
      if (savedTheme === null) root.removeAttribute('data-theme');
      else root.setAttribute('data-theme', savedTheme);
    }
    window.addEventListener('beforeprint', useLightTheme);
    window.addEventListener('afterprint', restoreTheme);

    async function downloadPdf() {
      if (typeof window.html2pdf !== 'function') {
        status.textContent = '無法使用一鍵下載，已改為開啟列印視窗，請選擇「另存為 PDF」。';
        window.print();
        return;
      }
      downloadBtn.disabled = true;
      status.textContent = 'PDF 產生中，請稍候…';
      useLightTheme();
      document.body.classList.add('pdf-export');
      // iOS Safari 的 canvas 面積上限約 1,670 萬像素；依報告高度調降解析度（換頁留白另估 30%）
      const estHeight = report.offsetHeight * 1.3;
      const scale = Math.max(1, Math.min(2, Math.sqrt(14e6 / (720 * estHeight))));
      try {
        const blob = await window.html2pdf()
          .set({
            margin: [12, 12, 12, 12],
            // 使用英數檔名，避免部分瀏覽器無法處理中文檔名
            filename,
            image: { type: 'jpeg', quality: 0.95 },
            html2canvas: { scale, windowWidth: 800, backgroundColor: '#ffffff' },
            jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' },
            pagebreak: { mode: ['css', 'legacy'], avoid: '.avoid-break' },
          })
          .from(report)
          .outputPdf('blob');
        if (pdfUrl) URL.revokeObjectURL(pdfUrl);
        pdfUrl = URL.createObjectURL(blob);
        const a = el('a', { href: pdfUrl, download: filename });
        document.body.append(a);
        a.click();
        a.remove();
        openLink.href = pdfUrl;
        fallback.hidden = false;
        status.textContent = 'PDF 已產生並開始下載，請到瀏覽器的下載項目查看。';
      } catch (e) {
        status.textContent = 'PDF 產生失敗，請改用「列印／另存 PDF」。';
      } finally {
        document.body.classList.remove('pdf-export');
        restoreTheme();
        downloadBtn.disabled = false;
      }
    }

    if (autoDownload) downloadPdf();
  }

  function showError(container, message) {
    container.replaceChildren(
      el('div', { class: 'card error-box' }, [
        el('p', { text: message }),
        el('div', { class: 'btn-row center' }, [el('a', { class: 'btn', href: 'index.html', text: '回到首頁' })]),
      ])
    );
  }

  // App 內建瀏覽器（LINE、Facebook 等）常無法下載檔案，提示改用一般瀏覽器開啟
  function inAppBrowserName() {
    const ua = navigator.userAgent;
    if (/\bLine\//i.test(ua)) return 'LINE';
    if (/FBAN|FBAV/.test(ua)) return 'Facebook';
    if (/Instagram/.test(ua)) return 'Instagram';
    if (/MicroMessenger/i.test(ua)) return '微信';
    return null;
  }

  function inAppNotice() {
    const name = inAppBrowserName();
    if (!name) return null;
    const box = el('p', { class: 'notice small' }, [
      `你目前在 ${name} 的內建瀏覽器中，可能無法下載 PDF。建議改用 Safari 或 Chrome 開啟本頁。`,
    ]);
    if (name === 'LINE') {
      // LINE 支援 openExternalBrowser=1 參數，以手機預設瀏覽器開啟連結
      const url = new URL(location.href);
      url.searchParams.set('openExternalBrowser', '1');
      box.append(' ', el('a', { href: url.toString(), text: '用預設瀏覽器開啟' }));
    }
    return box;
  }

  // 深色／淺色模式切換：選擇記在瀏覽器；沒有選擇時跟隨系統設定
  const THEME_KEY = 'holland-theme';
  const SUN = '<svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true"><circle cx="12" cy="12" r="4.5"/><path d="M12 2v2.5M12 19.5V22M2 12h2.5M19.5 12H22M4.9 4.9l1.8 1.8M17.3 17.3l1.8 1.8M4.9 19.1l1.8-1.8M17.3 6.7l1.8-1.8"/></svg>';
  const MOON = '<svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="2" stroke-linejoin="round" aria-hidden="true"><path d="M20.5 14.5A8.5 8.5 0 0 1 9.5 3.5a8.5 8.5 0 1 0 11 11z"/></svg>';

  function currentTheme() {
    const t = document.documentElement.getAttribute('data-theme');
    if (t === 'light' || t === 'dark') return t;
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  }

  function syncThemeColor() {
    const meta = document.querySelector('meta[name="theme-color"]');
    if (meta) meta.content = getComputedStyle(document.body).getPropertyValue('--accent').trim();
  }

  function initThemeToggle() {
    const header = document.querySelector('.site-header');
    if (!header) return;
    const btn = el('button', { class: 'theme-toggle no-print', type: 'button' });
    const update = () => {
      const dark = currentTheme() === 'dark';
      // 顯示「按下後會切換成」的模式圖示
      btn.innerHTML = dark ? SUN : MOON;
      const label = dark ? '切換為淺色模式' : '切換為深色模式';
      btn.setAttribute('aria-label', label);
      btn.title = label;
      syncThemeColor();
    };
    btn.addEventListener('click', () => {
      const next = currentTheme() === 'dark' ? 'light' : 'dark';
      document.documentElement.setAttribute('data-theme', next);
      try {
        localStorage.setItem(THEME_KEY, next);
      } catch (e) {
        /* 無法儲存時本頁仍可切換 */
      }
      update();
    });
    window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', update);
    header.append(btn);
    update();
  }

  initThemeToggle();

  // 記錄「曾開啟本網站」，讓 16型性格探索網站只對研究參與者顯示切換標籤
  // （O*NET 授權：驗證完成前不在公開網站推廣本研究用版本）
  try {
    localStorage.setItem('holland-visited', '1');
  } catch (e) {
    /* 忽略 */
  }

  return {
    ORDER, loadJSON, rawScores, analyze, encodeRaw, parseRaw, progress, el, list,
    radarChart, scoreBars, interpretNotes, onetNotice, setupPdfToolbar, showError, syncThemeColor, inAppNotice,
  };
})();

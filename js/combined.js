// 整合報告頁：16型性格探索 × Holland 職業興趣探索
// 結果來源：網址參數（?m=…&h=…）優先，其次是兩個網站存在瀏覽器中的最近一次結果
'use strict';

(async () => {
  const report = document.getElementById('report');
  const toolbar = document.getElementById('toolbar');
  const { el, list } = HL;
  const params = new URLSearchParams(location.search);
  const MBTI_BASE = '../mbti/';

  const stored = (key) => {
    try {
      return localStorage.getItem(key);
    } catch (e) {
      return null;
    }
  };

  // 16 型原始分數：四個 15～75 的整數（與 16型性格探索網站的 ?r= 相同）
  function parseMbti(value) {
    if (!value) return null;
    const parts = value.split(',');
    if (parts.length !== 4) return null;
    const nums = parts.map((p) => (/^\d{1,2}$/.test(p) ? Number(p) : NaN));
    return nums.every((n) => n >= 15 && n <= 75) ? nums : null;
  }

  const mRaw = parseMbti(params.get('m')) || parseMbti(stored('mbti-last-result'));
  const hRaw = HL.parseRaw('?h=' + (params.get('h') || '')) || HL.parseRaw('?h=' + (stored('holland-last-result') || ''));

  // 缺少任一測驗結果：說明還需要完成哪一個
  if (!mRaw || !hRaw) {
    toolbar.replaceChildren();
    const item = (done, name, href) => el('li', {}, [
      done ? `✅ ${name}：已完成` : `⬜ ${name}：尚未完成　`,
      done ? null : el('a', { href, text: '前往作答' }),
    ]);
    report.replaceChildren(el('section', { class: 'card' }, [
      el('h1', { text: '整合報告' }),
      el('p', { text: '整合報告需要同一個瀏覽器中，兩個測驗的最近一次結果：' }),
      el('ul', {}, [
        item(!!mRaw, '16型MBTI性格探索', MBTI_BASE + 'quiz.html'),
        item(!!hRaw, 'Holland 職業興趣探索', 'quiz.html'),
      ]),
      el('p', { class: 'small muted', text: '如果你是在另一台裝置或瀏覽器完成測驗，請在同一個瀏覽器重新作答。' }),
    ]));
    return;
  }

  let mQuestions, mTypes, hTypes, combined;
  try {
    [mQuestions, mTypes, hTypes, combined] = await Promise.all([
      HL.loadJSON(MBTI_BASE + 'data/questions.json'),
      HL.loadJSON(MBTI_BASE + 'data/types.json'),
      HL.loadJSON('data/types.json'),
      HL.loadJSON('data/combined.json'),
    ]);
  } catch (e) {
    HL.showError(report, '資料載入失敗，請重新整理頁面再試一次。');
    return;
  }

  // 16 型計分：與 16型性格探索網站相同的規則（傾向值 > 50% 取第一端、< 50% 取第二端、= 50% 取 tieBreaker）
  const [lo, hi] = mQuestions.scoring.unclearRange;
  const dims = mQuestions.dimensions.map((dim, i) => {
    const firstPct = ((mRaw[i] - 15) / 60) * 100;
    const [first, second] = dim.poles;
    const letter = firstPct > 50 ? first.letter : firstPct < 50 ? second.letter : dim.tieBreaker;
    const other = letter === first.letter ? second.letter : first.letter;
    const pct = letter === first.letter ? firstPct : 100 - firstPct;
    return { name: dim.name, letter, other, pct, unclear: firstPct >= lo && firstPct <= hi };
  });
  const mCode = dims.map((d) => d.letter).join('');
  const mType = mTypes.types.find((t) => t.code === mCode);
  const hResult = HL.analyze(hRaw, hTypes);
  const poleName = Object.fromEntries(combined.poles.map((p) => [p.letter, p.name]));
  const c = combined.common;

  // 把結果寫進網址，加入書籤或分享後仍能重現
  const query = `m=${mRaw.join(',')}&h=${hRaw.join(',')}`;
  history.replaceState(null, '', `${location.pathname}?${query}`);
  const today = new Date().toLocaleDateString('zh-TW', { year: 'numeric', month: 'long', day: 'numeric' });
  document.title = `${mCode} × ${hResult.code} 整合報告｜Holland 職業興趣探索`;

  const section = (title, children) =>
    el('section', { class: 'card avoid-break' }, [el('h2', { text: title }), ...[].concat(children)]);

  // 依 Holland 前兩型 × 16 型四個字母列出對照說明；偏好不明顯的向度另附另一端
  const pairing = (t) => el('section', { class: 'card avoid-break' }, [
    el('h2', { text: `${t.code} ${t.name} × ${mCode}` }),
    el('dl', { class: 'kv' }, dims.flatMap((d) => {
      const rows = [
        el('dt', { text: `${poleName[d.letter]}（${d.letter}）` }),
        el('dd', { text: combined.entries[d.letter][t.code] }),
      ];
      if (d.unclear) {
        rows.push(
          el('dt', { class: 'muted', text: `${poleName[d.other]}（${d.other}）— 偏好不明顯，也可參考` }),
          el('dd', { class: 'muted', text: combined.entries[d.other][t.code] }),
        );
      }
      return rows;
    })),
  ]);

  report.replaceChildren(
    el('section', { class: 'card avoid-break' }, [
      el('div', { class: 'report-meta' }, [
        el('span', { text: '整合報告｜16 型性格 × Holland 職業興趣' }),
        el('span', { text: `產生日期：${today}` }),
      ]),
      el('div', { class: 'type-hero', style: 'padding:8px 0 4px' }, [
        el('div', { class: 'type-label', text: '你的組合' }),
        el('div', { class: 'type-code', text: `${mCode} × ${hResult.code}` }),
        el('div', { class: 'type-name', text: `${mType.name} × ${hResult.top.map((t) => t.name).join('－')}` }),
      ]),
      el('p', { text: c.intro }),
      el('p', { class: 'notice small', text: hTypes.common.researchNote }),
    ]),
    el('div', { class: 'combo-grid' }, [
      section('16 型性格：怎麼做事', [
        el('p', { class: 'combo-code', text: `${mCode} ${mType.name}` }),
        el('p', { class: 'small muted', text: mType.tagline }),
        list(dims.map((d) => `${d.name}：${poleName[d.letter]}（${d.letter}）${Math.round(d.pct)}%${d.unclear ? '，偏好不明顯' : ''}`)),
        el('p', { class: 'no-print' }, [el('a', { href: `${MBTI_BASE}report.html?r=${mRaw.join(',')}`, text: '查看 16 型完整報告' })]),
      ]),
      section('Holland 興趣：喜歡做什麼', [
        el('p', { class: 'combo-code', text: `${hResult.code} ${hResult.top.map((t) => t.name).join('－')}` }),
        el('p', { class: 'small muted', text: hResult.top[0].tagline }),
        HL.scoreBars(hResult),
        el('p', { class: 'no-print' }, [el('a', { href: `report.html?${HL.encodeRaw(hRaw)}`, text: '查看 Holland 完整報告' })]),
      ]),
    ]),
    section('工作風格 × 興趣方向', [el('p', { text: c.howToRead }), dims.some((d) => d.unclear) ? el('p', { class: 'small muted', text: c.unclearNote }) : null]),
    ...hResult.top.slice(0, 2).map(pairing),
    section('提醒', el('p', { text: c.reminder })),
    el('footer', { class: 'site-footer avoid-break' }, [
      el('p', { text: mTypes.common.disclaimer }),
      el('p', { text: hTypes.common.disclaimer }),
      HL.onetNotice(hTypes.common),
    ])
  );

  HL.setupPdfToolbar({
    report,
    toolbar,
    filename: `Combined-${mCode}-${hResult.code}-report.pdf`,
    back: { href: `result.html?${HL.encodeRaw(hRaw)}`, text: '返回 Holland 結果' },
    autoDownload: params.get('download') === '1',
  });
})();

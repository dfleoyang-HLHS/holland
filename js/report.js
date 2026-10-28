// 完整報告頁：線上閱讀、下載 PDF（html2pdf.js）、列印／另存 PDF
'use strict';

(async () => {
  const report = document.getElementById('report');
  const toolbar = document.getElementById('toolbar');
  const { el, list } = HL;
  const params = new URLSearchParams(location.search);

  const raw = HL.parseRaw(location.search);
  if (!raw) {
    HL.showError(report, '找不到有效的測驗結果，請先完成測驗。');
    return;
  }

  let typesData;
  try {
    typesData = await HL.loadJSON('data/types.json');
  } catch (e) {
    HL.showError(report, '資料載入失敗，請重新整理頁面再試一次。');
    return;
  }

  const result = HL.analyze(raw, typesData);
  const common = typesData.common;
  const today = new Date().toLocaleDateString('zh-TW', { year: 'numeric', month: 'long', day: 'numeric' });
  document.title = `${result.code} 完整報告｜Holland 職業興趣探索`;

  const section = (title, children) =>
    el('section', { class: 'card avoid-break' }, [el('h2', { text: title }), ...[].concat(children)]);

  // 前三型各一張詳細說明卡
  const typeSection = (t, rank) => section(`第 ${rank} 型：${t.code} ${t.name}（${t.en}）`, [
    el('p', { class: 'type-tagline', style: 'margin-bottom:10px', text: t.tagline }),
    el('p', { text: t.overview }),
    el('h3', { text: '喜歡的活動' }), list(t.likes),
    el('h3', { text: '能力傾向' }), list(t.strengths),
    el('h3', { text: '適合的工作環境' }), list(t.workEnvironments),
    el('h3', { text: '職業領域參考' }),
    el('dl', { class: 'kv' }, t.careerFields.flatMap((f) => [el('dt', { text: f.field }), el('dd', { text: f.examples.join('、') })])),
    el('h3', { text: '探索建議' }), list(t.exploreTips),
  ]);

  report.replaceChildren(
    el('section', { class: 'card avoid-break' }, [
      el('div', { class: 'report-meta' }, [
        el('span', { text: 'Holland 職業興趣探索｜完整報告' }),
        el('span', { text: `產生日期：${today}` }),
      ]),
      el('div', { class: 'type-hero', style: 'padding:8px 0 4px' }, [
        el('div', { class: 'type-label', text: '你的興趣代碼' }),
        el('div', { class: 'type-code', text: result.code }),
        el('div', { class: 'type-name', text: result.top.map((t) => t.name).join('－') }),
      ]),
      el('p', { class: 'notice small', text: common.researchNote }),
    ]),
    section('六型分數', [
      el('div', { class: 'radar-wrap' }, [HL.radarChart(result)]),
      HL.scoreBars(result),
      el('p', { class: 'small muted', style: 'margin-top:12px', text: common.hexagonNote }),
    ]),
    section('解讀提示', list(HL.interpretNotes(result, common), 'interpret-notes')),
    ...result.top.map((t, i) => typeSection(t, i + 1)),
    section('關於職業領域', el('p', { class: 'small muted', text: common.careerNote })),
    section('延伸建議', list(common.nextSteps)),
    el('footer', { class: 'site-footer avoid-break' }, [el('p', { text: common.disclaimer }), HL.onetNotice(common)])
  );

  HL.setupPdfToolbar({
    report,
    toolbar,
    filename: `Holland-${result.code}-report.pdf`,
    back: { href: `result.html?${HL.encodeRaw(raw)}`, text: '返回結果' },
    autoDownload: params.get('download') === '1',
  });
})();

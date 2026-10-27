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
        el('a', { class: 'btn btn-outline', href: `result.html?${HL.encodeRaw(raw)}`, text: '返回結果' }),
      ]),
      status,
      fallback,
      HL.inAppNotice(),
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
    const filename = `Holland-${result.code}-report.pdf`;
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

  if (params.get('download') === '1') downloadPdf();
})();

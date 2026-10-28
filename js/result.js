// 簡易結果頁：興趣代碼、六角形雷達圖、解讀提示與完整報告入口
'use strict';

(async () => {
  const app = document.getElementById('app');
  const { el } = HL;

  const raw = HL.parseRaw(location.search);
  if (!raw) {
    HL.showError(app, '找不到有效的測驗結果，請先完成測驗。');
    return;
  }

  let typesData;
  try {
    typesData = await HL.loadJSON('data/types.json');
  } catch (e) {
    HL.showError(app, '資料載入失敗，請重新整理頁面再試一次。');
    return;
  }

  const result = HL.analyze(raw, typesData);

  // 整合報告入口：已完成 16 型測驗時直接查看，否則引導先去完成
  function combinedCard() {
    let mbti = null;
    try {
      mbti = localStorage.getItem('mbti-last-result');
    } catch (e) {
      /* 忽略 */
    }
    const intro = '興趣說明你「喜歡做什麼」，性格類型說明你「習慣怎麼做事」。兩個測驗都完成後，可以查看整合報告。';
    return el('section', { class: 'card center' }, [
      el('h2', { text: '整合報告：性格 × 興趣' }),
      el('p', { text: intro }),
      el('div', { class: 'btn-row center' }, [
        mbti
          ? el('a', { class: 'btn', href: `combined.html?m=${mbti}&${HL.encodeRaw(raw)}`, text: '查看整合報告' })
          : el('a', { class: 'btn btn-outline', href: '../mbti/', text: '先完成 16型MBTI性格探索' }),
      ]),
    ]);
  }
  const common = typesData.common;
  const query = HL.encodeRaw(raw);
  document.title = `${result.code}｜Holland 職業興趣探索`;

  app.replaceChildren(
    el('p', { class: 'notice small', text: common.researchNote }),
    el('section', { class: 'card type-hero' }, [
      el('div', { class: 'type-label', text: '你的興趣代碼' }),
      el('div', { class: 'type-code', text: result.code }),
      el('div', { class: 'type-name', text: result.top.map((t) => t.name).join('－') }),
      el('p', { class: 'type-tagline', text: result.top[0].tagline }),
    ]),
    el('section', { class: 'card' }, [
      el('h2', { text: '六型分數' }),
      el('div', { class: 'radar-wrap' }, [HL.radarChart(result)]),
      HL.scoreBars(result),
      el('p', { class: 'small muted', style: 'margin-top:12px', text: common.hexagonNote }),
    ]),
    el('section', { class: 'card' }, [
      el('h2', { text: '如何解讀你的結果' }),
      HL.list(common.resultGuide),
      HL.list(HL.interpretNotes(result, common), 'interpret-notes'),
    ]),
    el('section', { class: 'card' }, [
      el('h2', { text: '你的前三型' }),
      ...result.top.map((t, i) => el('div', { class: 'top-type' }, [
        el('h3', { text: `${i + 1}. ${t.code} ${t.name}（${t.en}）` }),
        el('p', { text: t.overview }),
      ])),
    ]),
    el('section', { class: 'card center' }, [
      el('h2', { text: '想更深入了解自己？' }),
      el('p', { text: common.reportInvite }),
      el('div', { class: 'btn-row center' }, [
        el('a', { class: 'btn', href: `report.html?${query}`, text: '查看完整報告' }),
        el('a', { class: 'btn btn-outline', href: `report.html?${query}&download=1`, text: '下載完整報告（PDF）' }),
      ]),
      HL.inAppNotice(),
      el('p', { class: 'small muted', style: 'margin-top:12px' }, '小提醒：把這個頁面加入書籤，日後即可再次查看你的結果。'),
    ]),
    combinedCard(),
    el('div', { class: 'btn-row center' }, [el('a', { class: 'btn-text', href: 'quiz.html?new=1', text: '重新測驗' })]),
    el('footer', { class: 'site-footer' }, [el('p', { text: common.disclaimer }), HL.onetNotice(common)])
  );
})();

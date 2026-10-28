# Holland 職業興趣探索

> **研究用版本**：中文題目正在進行效度驗證研究，完成前僅提供研究參與者使用。

一個免費、免註冊的線上職業興趣探索測驗。依 Holland 職業興趣理論（RIASEC），從 60 項工作活動找出使用者的興趣代碼，提供六型分數、六角形雷達圖、職業領域參考與完整報告。

**網站網址**：<https://dfleoyang-hlhs.github.io/holland/>

## O*NET® 授權聲明

This application includes information from the O*NET Career Exploration Tools by the U.S. Department of Labor, Employment and Training Administration (USDOL/ETA). Used under the O*NET Tools Developer License. O*NET® is a trademark of USDOL/ETA. The Holland Career Interest Exploration project has modified all or some of this information. USDOL/ETA has not approved, endorsed, or tested these modifications.

本網站包含美國勞工部就業與訓練署（USDOL/ETA）O*NET 職涯探索工具的內容，依 O*NET Tools Developer License 使用。O*NET® 為 USDOL/ETA 的商標。本專案已修改其中全部或部分內容；USDOL/ETA 並未核准、背書或測試這些修改。

修改內容與免責聲明（Modifications and disclaimers）：[`modifications.html`](modifications.html)

## 功能

- **60 題**：題目譯自 O*NET® 職業興趣量表短版，分 6 階段、每階段 10 題
- **5 點喜歡程度量表**：1 非常不喜歡～5 非常喜歡（計分 0～4，與原量表電腦版相同）
- **結果**：三字母興趣代碼、六角形雷達圖、六型分數、一致性與分化程度等解讀提示
- **完整報告**：前三型的說明、喜歡的活動、能力傾向、工作環境、職業領域參考與探索建議；可下載 PDF
- **整合報告**：兩個測驗都完成後，並列 16 型與 Holland 結果，並依前兩型 × 四個字母提供 8 則對照說明
- **跨裝置**：手機、平板、電腦皆可使用；右上角可切換深色／淺色模式

## 隱私

所有計分都在使用者的瀏覽器中完成，網站**不蒐集、不傳送任何作答資料或個人資料**。

## 專案結構

| 路徑 | 說明 |
|---|---|
| `index.html` | 首頁（含 O*NET 聲明與修改說明連結） |
| `quiz.html` / `result.html` / `report.html` | 作答、結果、完整報告 |
| `combined.html` | 整合報告（16 型性格 × Holland 興趣），可下載 PDF |
| `modifications.html` | 修改內容與免責聲明（O*NET 授權要求） |
| `research.html` | 效度驗證研究說明 |
| `data/questions.json` | 題庫（英文原題、中文翻譯、翻譯說明） |
| `data/types.json` | 六型描述、職業領域與共用文字 |
| `data/combined.json` | 整合報告 48 則對照說明 |
| `docs/SOURCES.md` | 題目來源與授權查證紀錄 |
| `docs/QUESTIONS.md` | 翻譯審閱文件（譯者一） |
| `docs/TRANSLATOR2.md` | 譯者二的翻譯表（只有英文原題） |
| `docs/TYPES.md` | 六型描述審閱文件 |
| `docs/COMBINED.md` | 整合報告對照說明審閱文件 |

相關網站：[16型MBTI性格探索](https://dfleoyang-hlhs.github.io/mbti/)（[repo](https://github.com/dfleoyang-HLHS/mbti)）；整體企劃見 mbti repo 的 `docs/PLAN-RIASEC.md`。

## 聲明

本測驗僅供自我探索參考，非心理診斷工具，不宜作為招募、任用、升遷或職涯決策的唯一依據。本測驗依據 Holland 職業興趣理論，題目譯自 O*NET® 職業興趣量表短版，並非任何官方或商業量表。

## 第三方元件

- [html2pdf.js](https://github.com/eKoopmans/html2pdf.js) 0.12.1（MIT 授權），授權條款見 `js/vendor/`。

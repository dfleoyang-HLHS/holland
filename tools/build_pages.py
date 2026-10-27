"""產生 Holland 網站的 HTML 頁面；O*NET 聲明文字一律取自 data/types.json，確保與授權原文一致。"""
import html
import json
import os
import sys

root = sys.argv[1]
V = sys.argv[2]  # CSS／JS 版本號，避免瀏覽器快取舊檔
types = json.load(open(os.path.join(root, "data/types.json"), encoding="utf-8"))
qs = json.load(open(os.path.join(root, "data/questions.json"), encoding="utf-8"))
C = types["common"]
e = html.escape

FAVICON = ("data:image/svg+xml,%3Csvg xmlns=%27http://www.w3.org/2000/svg%27 viewBox=%270 0 64 64%27%3E"
           "%3Crect width=%2764%27 height=%2764%27 rx=%2714%27 fill=%27%232c5e9e%27/%3E"
           "%3Ctext x=%2732%27 y=%2744%27 font-size=%2734%27 font-family=%27Arial,sans-serif%27 font-weight=%27700%27 "
           "fill=%27white%27 text-anchor=%27middle%27%3EH%3C/text%3E%3C/svg%3E")


def head(title, desc="", extra_css=""):
    return f"""<!doctype html>
<html lang="zh-Hant-TW">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <!-- 研究用版本：效度驗證完成前不供搜尋引擎收錄 -->
  <meta name="robots" content="noindex, nofollow">
  <title>{e(title)}</title>
{f'  <meta name="description" content="{e(desc)}">' + chr(10) if desc else ''}  <link rel="icon" href="{FAVICON}">
  <meta name="theme-color" content="#2f6f6a">
  <script>
    // 套用使用者選擇的深色／淺色模式（放在樣式表前，避免畫面閃爍）
    try {{ const t = localStorage.getItem('holland-theme'); if (t === 'light' || t === 'dark') document.documentElement.setAttribute('data-theme', t); }} catch (e) {{}}
  </script>
  <link rel="stylesheet" href="css/style.css?v={V}">
{extra_css}</head>
"""


def header(no_print=False):
    cls = "site-header no-print" if no_print else "site-header"
    return f"""    <header class="{cls}">
      <a class="site-title" href="index.html">Holland 職業興趣探索</a>
    </header>
"""


def onet_notice_html():
    return f"""      <div class="onet-notice small">
        <p lang="en">{e(C['onetNotice'])}</p>
        <p>{e(C['onetNoticeZh'])}</p>
        <p><a href="modifications.html">Modifications and disclaimers（修改內容與免責聲明）</a></p>
      </div>
"""


def footer():
    return f"""    <footer class="site-footer">
      <p>{e(C['disclaimer'])}</p>
    </footer>
"""


def scripts(*names, defer=()):
    out = []
    for n in names:
        d = " defer" if n in defer else ""
        out.append(f'  <script src="js/{n}?v={V}"{d}></script>')
    return "\n".join(out) + "\n"


def write(name, content):
    with open(os.path.join(root, name), "w", encoding="utf-8") as f:
        f.write(content)


type_rows = "\n".join(
    f'        <li><span class="letters">{t["code"]}</span><span><strong>{e(t["name"])}</strong>：{e(t["tagline"])}</span></li>'
    for t in types["types"]
)

# ---------- 首頁 ----------
write("index.html", head("Holland 職業興趣探索", "60 項工作活動，找出你的 Holland 職業興趣代碼（RIASEC），並取得六型分數與職業領域參考。") + f"""<body>
  <main class="container">
    <header class="site-header home-header">
      <div>
        <h1 class="home-title">Holland 職業興趣探索</h1>
        <p class="home-subtitle">找出你喜歡的工作活動</p>
      </div>
    </header>

    <div class="notice research-banner">
      <p style="margin:0 0 6px"><strong>研究用版本：</strong>中文題目正在進行效度驗證研究，目前僅提供研究參與者使用，結果僅供參考。<a href="research.html">了解研究</a></p>
      <p style="margin:0">題目譯自美國勞工部 O*NET® 職業興趣量表短版，經本專案修改；美國勞工部並未核准、背書或測試這些修改。<a href="modifications.html">Modifications and disclaimers（修改內容與免責聲明）</a></p>
    </div>

    <section class="card">
      <p>從 60 項工作活動中，表達你喜歡或不喜歡的程度，找出你的 Holland 職業興趣代碼（例如 SAI），並取得六型分數、職業領域參考與完整報告。</p>
      <div class="facts">
        <div class="fact"><strong>60</strong><span>項活動</span></div>
        <div class="fact"><strong>約 10</strong><span>分鐘</span></div>
        <div class="fact"><strong>6</strong><span>種類型</span></div>
      </div>
      <div class="btn-row">
        <a class="btn" id="start-btn" href="quiz.html">開始測驗</a>
        <a class="btn btn-outline" id="resume-btn" href="quiz.html" hidden>繼續上次的作答</a>
      </div>
    </section>

    <section class="card">
      <h2>題目來源與授權</h2>
      <p class="small">本測驗題目譯自美國勞工部 O*NET® 職業興趣量表短版（O*NET Interest Profiler Short Form）。</p>
{onet_notice_html()}    </section>

    <section class="card">
      <h2>六種興趣類型</h2>
      <ul class="dim-list">
{type_rows}
      </ul>
      <p class="small muted" style="margin-top:10px">{e(C['hexagonNote'])}</p>
    </section>

    <section class="card">
      <h2>作答說明</h2>
      <ul>
        <li>{e(qs['instructions'])}</li>
        <li>共分 6 個階段，每階段 10 題。每題從 1（非常不喜歡）到 5（非常喜歡）中點選一個；答案沒有對錯之分。</li>
        <li>可以隨時修改答案或回到上一階段；作答進度只暫存在你的瀏覽器中。</li>
      </ul>
      <p class="notice"><strong>隱私說明：</strong>本網站在你的瀏覽器中計分，不蒐集、不傳送任何作答資料或個人資料。</p>
    </section>

    <section class="card">
      <h2>搭配性格探索</h2>
      <p>興趣說明你「喜歡做什麼」，性格類型說明你「習慣怎麼做事」。兩者搭配，可以更完整地認識自己。</p>
      <div class="btn-row"><a class="btn btn-outline" href="../mbti/">前往 16型MBTI性格探索</a></div>
    </section>

{footer()}  </main>

{scripts('common.js')}  <script>
    (() => {{
      const saved = HL.progress.load();
      const n = saved ? Object.keys(saved.answers).length : 0;
      if (n > 0) {{
        const resume = document.getElementById('resume-btn');
        resume.hidden = false;
        resume.textContent = `繼續上次的作答（已完成 ${{n}} 題）`;
        const start = document.getElementById('start-btn');
        start.textContent = '重新開始';
        start.href = 'quiz.html?new=1';
      }}
    }})();
  </script>
</body>
</html>
""")

# ---------- 作答、結果、報告 ----------
write("quiz.html", head("作答｜Holland 職業興趣探索") + f"""<body>
  <main class="container">
{header()}
    <div id="app">
      <p class="muted center">題目載入中…</p>
    </div>

    <noscript><p class="notice">本測驗需要啟用 JavaScript 才能作答。</p></noscript>
  </main>

{scripts('common.js', 'quiz.js')}</body>
</html>
""")

write("result.html", head("測驗結果｜Holland 職業興趣探索") + f"""<body>
  <main class="container">
{header()}
    <div id="app">
      <p class="muted center">結果計算中…</p>
    </div>
  </main>

{scripts('common.js', 'result.js')}</body>
</html>
""")

write("report.html", head("完整報告｜Holland 職業興趣探索", extra_css=f'  <link rel="stylesheet" href="css/print.css?v={V}">\n') + f"""<body>
  <main class="container">
{header(no_print=True)}
    <div id="toolbar" class="no-print"></div>
    <article id="report">
      <p class="muted center">報告產生中…</p>
    </article>
  </main>

{scripts('common.js', 'vendor/html2pdf.bundle.min.js', 'report.js', defer=('vendor/html2pdf.bundle.min.js', 'report.js'))}</body>
</html>
""")

# ---------- 修改內容與免責聲明 ----------
mods = [
    ("翻譯", "60 題英文工作活動譯為正體中文。翻譯程序：兩位譯者各自翻譯、整合、回譯、專家審閱與認知訪談（進行中）。各題翻譯說明見 GitHub 上的 docs/QUESTIONS.md。"),
    ("文化調適", "目前尚未改變任何活動內容。若經專家審閱後調整，會在此逐題列出原題、修改後的題目與修改理由。"),
    ("作答選項", "選項文字譯為中文（非常不喜歡、不喜歡、不確定、喜歡、非常喜歡）。畫面顯示 1～5，計分換算為 0～4，與原量表電腦版相同。"),
    ("出題方式", "依 R、I、A、S、E、C 的順序輪流出題，分為 6 個階段、每階段 10 題。"),
    ("計分與解讀", "每型分數計算方式與原量表相同（0～40）。本專案另外新增以下解讀規則，並非原量表內容：換算為 0～100 分、取前三型組成興趣代碼（同分依 R、I、A、S、E、C 排列並標示並列）、一致性、分化程度與整體偏低提醒。"),
    ("結果說明與職業領域", "六型描述、職業領域與職業範例由本專案自行撰寫，並非 O*NET 資料，也未使用 O*NET 職業資料庫。"),
    ("整合報告", "規劃與「16型MBTI性格探索」的結果整合呈現（尚未推出）。"),
    ("使用目的", "維持原量表的職涯探索用途。中文版目前為研究用版本，正在進行效度驗證研究。"),
]
mod_rows = "\n".join(f"            <tr><th scope=\"row\">{e(k)}</th><td>{e(v)}</td></tr>" for k, v in mods)
write("modifications.html", head("修改內容與免責聲明｜Holland 職業興趣探索") + f"""<body>
  <main class="container doc-page">
{header()}
    <h1>Modifications and disclaimers<br><small class="muted">修改內容與免責聲明</small></h1>

    <section class="card">
      <h2>原始來源</h2>
      <ul>
        <li>量表：O*NET® Interest Profiler Short Form（60 題）</li>
        <li>發行：U.S. Department of Labor, Employment and Training Administration（USDOL/ETA）；由 National Center for O*NET Development 開發</li>
        <li>來源網址：<a href="{e(qs['source']['url'])}">{e(qs['source']['url'])}</a></li>
        <li>授權：<a href="{e(qs['source']['licenseUrl'])}">O*NET Tools Developer License</a></li>
      </ul>
{onet_notice_html()}    </section>

    <section class="card">
      <h2>修改內容</h2>
      <p>依 O*NET Tools Developer License 的要求，以下說明本網站對原量表所做的所有修改：</p>
      <div class="table-scroll">
        <table>
          <thead><tr><th scope="col">項目</th><th scope="col">說明</th></tr></thead>
          <tbody>
{mod_rows}
          </tbody>
        </table>
      </div>
    </section>

    <section class="card">
      <h2>Disclaimer（免責聲明）</h2>
      <blockquote lang="en">{e(C['onetDisclaimer'])}</blockquote>
      <p class="small">中文說明：本專案修改了 O*NET® 職涯探索工具的全部、部分內容或使用目的。美國勞工部就業與訓練署（USDOL/ETA）並未核准、背書或測試這些修改，因此對於任何第三方或使用者因使用或誤用修改後的工具（或包含這些工具的產品）所產生的損害，USDOL/ETA 不負任何責任。（以英文原文為準）</p>
    </section>

    <section class="card">
      <h2>中文版的驗證狀態</h2>
      <p>中文版正在進行效度驗證研究，完成前為研究用版本。詳見<a href="research.html">研究說明</a>。</p>
    </section>

{footer()}  </main>
{scripts('common.js')}</body>
</html>
""")

# ---------- 研究說明 ----------
write("research.html", head("研究說明｜Holland 職業興趣探索") + f"""<body>
  <main class="container doc-page">
{header()}
    <h1>研究說明</h1>

    <section class="card">
      <h2>為什麼需要研究</h2>
      <p>本測驗的題目譯自英文的 O*NET® 職業興趣量表短版。英文版在美國樣本有良好的信度與效度，但這些證據不能直接套用到中文版。依 O*NET Tools Developer License 的規定，中文版必須先完成效度驗證研究，確認結果對台灣成人有效，才能正式推出。</p>
    </section>

    <section class="card">
      <h2>目前進度</h2>
      <div class="table-scroll">
        <table>
          <thead><tr><th scope="col">步驟</th><th scope="col">狀態</th></tr></thead>
          <tbody>
            <tr><td>題目來源與授權查證</td><td>已完成</td></tr>
            <tr><td>翻譯（譯者一）</td><td>已完成初稿</td></tr>
            <tr><td>翻譯（譯者二）、整合、回譯</td><td>進行中</td></tr>
            <tr><td>文化調適、專家審閱、認知訪談</td><td>尚未開始</td></tr>
            <tr><td>效度驗證研究（信度、重測信度、六角形結構）</td><td>尚未開始</td></tr>
            <tr><td>研究報告公開與正式推出</td><td>尚未開始</td></tr>
          </tbody>
        </table>
      </div>
    </section>

    <section class="card">
      <h2>研究期間的使用方式</h2>
      <ul>
        <li>本網站目前僅提供研究參與者使用，不公開推廣，也不供搜尋引擎收錄。</li>
        <li>測驗結果僅供研究與自我探索參考，請勿用於任何人事或升學決策。</li>
        <li>網站本身不蒐集作答資料。研究資料的蒐集方式、用途與保存期限，將由研究團隊另行說明，並在取得參與者同意後進行。</li>
      </ul>
    </section>

    <section class="card">
      <h2>研究報告</h2>
      <p>研究完成後，報告將公開於本頁。</p>
    </section>

{footer()}  </main>
{scripts('common.js')}</body>
</html>
""")
print("pages ok")

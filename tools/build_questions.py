"""產生 Holland 題庫（O*NET Interest Profiler 短版，第一份中文翻譯）與翻譯審閱文件。"""
import json
import re
import sys

out_json, out_md, pdf_txt = sys.argv[1], sys.argv[2], sys.argv[3]

# 英文原題依 O*NET 紙本題目的順序；中文為譯者一的翻譯；note 為翻譯說明或請專家留意之處
ITEMS = {
    "R": [
        ("Build kitchen cabinets", "製作廚房櫥櫃", ""),
        ("Lay brick or tile", "砌磚或鋪磁磚", ""),
        ("Repair household appliances", "修理家電用品", ""),
        ("Raise fish in a fish hatchery", "在魚苗場養殖魚類", "fish hatchery 指人工孵育魚苗的場所，台灣常稱「魚苗場」或「育苗場」。"),
        ("Assemble electronic parts", "組裝電子零件", ""),
        ("Drive a truck to deliver packages to offices and homes", "開貨車把包裹送到辦公室和住家", ""),
        ("Test the quality of parts before shipment", "在零件出貨前檢驗品質", ""),
        ("Repair and install locks", "修理和安裝鎖具", "locks 涵蓋門鎖等各類鎖，譯為「鎖具」。"),
        ("Set up and operate machines to make products", "架設並操作機器來生產產品", ""),
        ("Put out forest fires", "撲滅森林火災", "台灣森林火災較少見，但概念清楚；請專家評估是否需要文化調適。"),
    ],
    "I": [
        ("Develop a new medicine", "研發新藥", ""),
        ("Study ways to reduce water pollution", "研究減少水污染的方法", ""),
        ("Conduct chemical experiments", "進行化學實驗", ""),
        ("Study the movement of planets", "研究行星的運行", ""),
        ("Examine blood samples using a microscope", "用顯微鏡檢查血液樣本", ""),
        ("Investigate the cause of a fire", "調查火災發生的原因", ""),
        ("Develop a way to better predict the weather", "研發更準確預測天氣的方法", ""),
        ("Work in a biology lab", "在生物實驗室工作", ""),
        ("Invent a replacement for sugar", "發明糖的替代品", ""),
        ("Do laboratory tests to identify diseases", "做實驗室檢驗來找出疾病", ""),
    ],
    "A": [
        ("Write books or plays", "寫書或舞台劇劇本", "plays 指舞台劇，譯為「舞台劇劇本」以免與一般「劇本」混淆。"),
        ("Play a musical instrument", "演奏樂器", ""),
        ("Compose or arrange music", "作曲或編曲", ""),
        ("Draw pictures", "畫畫", ""),
        ("Create special effects for movies", "為電影製作特效", ""),
        ("Paint sets for plays", "為舞台劇繪製布景", ""),
        ("Write scripts for movies or television shows", "撰寫電影或電視節目的劇本", ""),
        ("Perform jazz or tap dance", "表演爵士舞或踢踏舞", "jazz 在此指爵士舞（jazz dance），不是爵士樂。"),
        ("Sing in a band", "在樂團裡唱歌", ""),
        ("Edit movies", "剪輯電影", ""),
    ],
    "S": [
        ("Teach an individual an exercise routine", "一對一教人一套運動訓練", "an individual 強調一對一，譯文保留此意。"),
        ("Help people with personal or emotional problems", "幫助有個人或情緒困擾的人", ""),
        ("Give career guidance to people", "為人提供職涯輔導", ""),
        ("Perform rehabilitation therapy", "進行復健治療", ""),
        ("Do volunteer work at a non-profit organization", "在非營利組織擔任志工", ""),
        ("Teach children how to play sports", "教孩子從事運動", ""),
        ("Teach sign language to people who are deaf or hard of hearing", "教聾人或重聽者手語", "依台灣常用、尊重的用語譯為「聾人或重聽者」；請專家確認。"),
        ("Help conduct a group therapy session", "協助帶領團體治療", ""),
        ("Take care of children at a day-care center", "在托育中心照顧孩子", "day-care center 對應台灣的托嬰中心或幼兒園，譯為涵蓋兩者的「托育中心」；請專家確認。"),
        ("Teach a high-school class", "教一門高中課程", ""),
    ],
    "E": [
        ("Buy and sell stocks and bonds", "買賣股票和債券", ""),
        ("Manage a retail store", "管理一家零售商店", ""),
        ("Operate a beauty salon or barber shop", "經營美容美髮店或理髮店", "beauty salon 在台灣多指美髮兼美容的店家，譯為「美容美髮店」。"),
        ("Manage a department within a large company", "管理大公司裡的一個部門", ""),
        ("Start your own business", "自己創業", ""),
        ("Negotiate business contracts", "洽談商業合約", ""),
        ("Represent a client in a lawsuit", "在訴訟中代表當事人", "指律師的工作；保留原意，不另加「律師」二字以免變成職業名稱題。"),
        ("Market a new line of clothing", "行銷一系列新款服飾", ""),
        ("Sell merchandise at a department store", "在百貨公司銷售商品", ""),
        ("Manage a clothing store", "管理一家服飾店", ""),
    ],
    "C": [
        ("Develop a spreadsheet using computer software", "用電腦軟體製作試算表", ""),
        ("Proofread records or forms", "校對紀錄或表格", ""),
        ("Install software across computers on a large network", "在大型網路中的多台電腦上安裝軟體", ""),
        ("Operate a calculator", "操作計算機", "此題活動非常簡單，原量表即如此；保留原意，請專家留意作答反應。"),
        ("Keep shipping and receiving records", "記錄貨物的出貨與收貨", ""),
        ("Calculate the wages of employees", "計算員工薪資", ""),
        ("Inventory supplies using a hand-held computer", "用手持式電腦盤點物品", "hand-held computer 在台灣常見的是「手持式盤點機」或「PDA」，請專家評估用詞。"),
        ("Record rent payments", "登記租金繳納紀錄", ""),
        ("Keep inventory records", "管理庫存紀錄", ""),
        ("Stamp, sort, and distribute mail for an organization", "為機構的郵件蓋章、分類並分送", "stamp 可指蓋郵戳、蓋收文章或貼郵票，譯為「蓋章」較中性；請專家確認。"),
    ],
}

TYPES = [
    ("R", "實用型", "Realistic"), ("I", "研究型", "Investigative"), ("A", "藝術型", "Artistic"),
    ("S", "社會型", "Social"), ("E", "企業型", "Enterprising"), ("C", "事務型", "Conventional"),
]

# 逐題比對英文原文是否與 O*NET 官方 PDF 相同（換行合併後比對）
# 先移除 PDF 勾選框轉出的私用區字元，再合併空白
pdf = re.sub(r"\s+", " ", re.sub("[\ue000-\uf8ff]", " ", open(pdf_txt, encoding="utf-8").read()))
for code, rows in ITEMS.items():
    assert len(rows) == 10, code
    for en, zh, note in rows:
        assert en in pdf, f"英文原文與 PDF 不符：{en}"
        assert zh.strip(), en

# 出題順序：依 R→I→A→S→E→C 輪流，每型依原題順序
questions = []
for k in range(10):
    for code, _, _ in TYPES:
        en, zh, note = ITEMS[code][k]
        questions.append({"id": len(questions) + 1, "type": code, "sourceIndex": k + 1, "en": en, "zh": zh, "note": note})
assert len(questions) == 60 and len({q["zh"] for q in questions}) == 60

data = {
    "version": "0.1.0",
    "title": "Holland 職業興趣探索 題庫",
    "status": "研究用版本：譯者一的中文翻譯，待第二份翻譯、整合、回譯、文化調適與專家審閱",
    "source": {
        "name": "O*NET Interest Profiler Short Form",
        "publisher": "U.S. Department of Labor, Employment and Training Administration (USDOL/ETA); developed by the National Center for O*NET Development",
        "url": "https://www.onetcenter.org/IP.html",
        "license": "O*NET Tools Developer License",
        "licenseUrl": "https://www.onetcenter.org/license_toolsdev.html",
    },
    "instructions": "下面是各種工作活動。請想一想你有多喜歡做這件事，不必考慮需要多少教育訓練、能賺多少錢，或你是否已經會做。",
    "scale": [
        {"value": 1, "label": "非常不喜歡", "score": 0},
        {"value": 2, "label": "不喜歡", "score": 1},
        {"value": 3, "label": "不確定", "score": 2},
        {"value": 4, "label": "喜歡", "score": 3},
        {"value": 5, "label": "非常喜歡", "score": 4},
    ],
    "scoring": {
        "description": "與 O*NET 電腦版短版相同：每題 0～4 分（畫面 1～5 減 1），每型 10 題加總，範圍 0～40。",
        "min": 0,
        "max": 40,
    },
    "types": [{"code": c, "name": n, "en": e} for c, n, e in TYPES],
    "questions": questions,
}
with open(out_json, "w", encoding="utf-8") as f:
    json.dump(data, f, ensure_ascii=False, indent=2)
    f.write("\n")

L = [
    "# 題庫翻譯審閱文件（O\\*NET Interest Profiler 短版）",
    "",
    "> 版本：0.1.0（研究用版本）  ",
    "> 狀態：**譯者一**的中文翻譯。待第二份翻譯（另一位譯者獨立翻譯）、整合、回譯、文化調適與專家審閱。  ",
    "> 資料檔：[`data/questions.json`](../data/questions.json)。本文件由資料檔產生，修改題目時兩者須同步。",
    "",
    "## 來源與授權",
    "",
    "- 英文原題：O\\*NET Interest Profiler Short Form，美國勞工部就業與訓練署（USDOL/ETA）發行，National Center for O\\*NET Development 開發。<https://www.onetcenter.org/IP.html>",
    "- 授權：O\\*NET Tools Developer License。翻譯屬於改作，須遵守授權的三項義務，見 [`SOURCES.md`](SOURCES.md)。",
    "- 英文原文已由程式逐題比對官方 PDF，確認一字不差。",
    "",
    "## 翻譯原則（譯者一）",
    "",
    "1. 忠於原意，譯成台灣成人日常使用的正體中文。",
    "2. 保持「描述工作活動」的形式，不改寫成職業名稱。",
    "3. 用詞中性，避免性別或身分的刻板印象。",
    "4. 不確定或可能需要文化調適的地方，寫在「說明」欄，交由專家判斷；**譯者一不自行改變活動內容**。",
    "",
    "## 作答量表",
    "",
    "| 畫面 | 1 | 2 | 3 | 4 | 5 |",
    "|---|---|---|---|---|---|",
    "| 文字 | 非常不喜歡 | 不喜歡 | 不確定 | 喜歡 | 非常喜歡 |",
    "| 計分 | 0 | 1 | 2 | 3 | 4 |",
    "",
    "原量表選項：strongly dislike、dislike、unsure、like、strongly like（0～4）。",
    "",
]
for code, name, en_name in TYPES:
    L += [f"## {code}　{name}（{en_name}）", "", "| 原題序 | 英文原題 | 中文翻譯（譯者一） | 說明 | 譯者二 | 回譯 | 專家意見 |", "|---|---|---|---|---|---|---|"]
    for i, (en, zh, note) in enumerate(ITEMS[code], 1):
        L.append(f"| {code}{i} | {en} | {zh} | {note} |  |  |  |")
    L.append("")
L += [
    "## 後續程序",
    "",
    "1. **譯者二**：在不參考本文件中文欄的情況下，獨立翻譯 60 題英文原題。",
    "2. **整合**：比對兩份翻譯，討論差異，整合為一份中文題目。",
    "3. **回譯**：由沒看過英文原題的回譯者，把整合後的中文譯回英文。",
    "4. **比對**：比較回譯與原題的意思，有落差的題目重新討論。",
    "5. **文化調適與專家審閱**：依「說明」欄與專家意見決定是否調整，並記錄原題、修改後題目與理由（O\\*NET 授權要求說明所有修改）。",
    "6. **認知訪談**：請 5～10 位成人試讀，確認理解一致。",
]
with open(out_md, "w", encoding="utf-8") as f:
    f.write("\n".join(L) + "\n")
print("ok", len(questions))

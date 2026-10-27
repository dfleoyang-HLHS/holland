# 產生資料與頁面的腳本

`data/*.json`、`docs/QUESTIONS.md`、`docs/TYPES.md` 與各 HTML 頁面由以下腳本產生，修改內容時請改腳本後重新產生，確保資料、審閱文件與頁面上的 O*NET 聲明一致。

```bash
# 題庫：第三個參數是 O*NET 官方紙本題目 PDF 轉出的文字檔（pdftotext Interest_Profiler.pdf ip.txt），用來逐題比對英文原文
python3 tools/build_questions.py data/questions.json docs/QUESTIONS.md ip.txt
# 六型描述與共用文字（含 O*NET 授權聲明）
python3 tools/build_types.py data/types.json docs/TYPES.md
# 頁面：第二個參數是 CSS／JS 版本號
python3 tools/build_pages.py . 20261027-1
```

官方紙本題目：<https://www.onetcenter.org/dl_tools/ipsf/Interest_Profiler.pdf>

# 官網基線盤點

| 項目 | 基線 `d2d07d5` |
| --- | --- |
| 部署 | GitHub Pages，`main` 根目錄，`CNAME` 為 `quantquer.com` |
| 排版 | 靜態 HTML，共用 `assets/site.css`，明暗主題由 `assets/theme.js` 控制 |
| 內容 | 16 個工程／技術案例含雙語圖解，26 筆 sitemap 路徑，2 個產業專題，3 個互動展示，4 個證據頁 |
| 語言 | 獨立英文首頁，案例使用 `#english`，展示與需求規劃器支援 `?lang=en` |
| 轉換 | 52 秒工程短片、雙語能力簡介 PDF、網頁郵件與剪貼簿流程 |
| 資料 | `data/projects.json` 與 `data/case-diagrams.json` 生成可公開案例，舊 URL 作為相容性測試樣本 |
| 公開證據 | CPU 影像實測、單卡控制測試 GPU 排程紀錄、理想化光子模擬、可重跑的引文檢查 |
| 缺口 | 獨立解決方案和服務入口、各案例獨立英文網址、跨實驗的證據索引、可選擇接上已核准的詢價服務 |

基線本機檢查通過 `node --test scripts/test-*.mjs` 及 `node scripts/build-portfolio.mjs --check`。公開站與盤點結果的對照、擴充後的瀏覽器與效能實測見 QA 報告。

實際以 HTTPS 檢查正式站並取得 HTTP 200。取樣涵蓋繁中與英文首頁、半導體和金融專題、生成影像／光子／GPU 案例、互動 Lab、GPU 證據、Planner、robots 和 sitemap。以 `git archive d2d07d5` 建立可重現的本機視覺基線。既有程式以靜態生成檢查與 Node 測試為主，基線沒有獨立 lint、typecheck 或瀏覽器測試套件。

正式首頁的 HTTP 內容 SHA-256 與 `d2d07d5:index.html` 完全相同。交付前的 `origin/main` 仍指向同一提交。

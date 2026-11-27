# Quantquer 官網交付

## Website Refinement 候選版

基線為正式站及 `origin/main` 的 `9f68ea7`，候選分支為 `feat/quantquer-website-refinement`。此次調整以既有 GitHub Pages 靜態架構交付，正式發布待授權。

- 兩種語系使用原版 Canvas 頻譜與訊號。固定包絡與漸層改為快取，手機首屏和選單可直接換語言。
- 首頁以四個方案連到交付物與證據。初始呈現三個代表案例，另外三案與既有內容使用原生展開區。原連結與錨點保留。頁尾補上服務、研究及工程案例入口。
- 16 組雙語案例各自標示歸屬、成熟度與公開證據。Benchmark 增列測試條件、方法及未披露的欄位。工程證據中心連到可下載資料、架構圖、公開代碼、研究與原影片。
- 短詢價提供姓名、信箱與問題。靜態預設使用郵件草稿或複製，完整 RFP 與直接 Email 仍可用。同源直送、預約與匿名量測均為選配。
- 98 個索引路徑保留 canonical 與雙語對應。修正兩個舊證據頁缺少的社群分享屬性。驗證程式新增 hreflang、分享資訊及 JSON-LD 檢查。

### 檔案與驗收

首頁生成器是 `scripts/build-vnext-home.mjs`，Canvas 與行動導覽在 `assets/studio-waveform.mjs`、`assets/studio-home.mjs`。內頁共用 `scripts/vnext-layout.mjs`。案例、證據及詢價使用各自既有生成器，執行 `node scripts/build-vnext.mjs` 更新靜態 HTML。不要手改其產物。

[調整前稽核](docs/website-audit.md) · [設計系統](docs/design-system.md) · [資訊架構](docs/information-architecture.md) · [驗收、效能與前後截圖](docs/website-validation.md)

### 發布與待確認

正式發布時，先 `git fetch origin main` 同步來源，再核對期間的改動並整合候選提交。執行建置、測試與連結檢查，推送經核准的 `main` 後等待既有 Pages 工作流程。頁面生效以正式 URL 的畫面、metadata 與互動核對。GitHub Pages 無需新增環境變數。

直接送件需另外配置同源 `/api/inquiry` 與 `.env.example` 所列的伺服器環境變數。完成正式收件與資料保留審核後，才設定 `assets/studio-integrations.mjs` 的端點。HTTPS 會議及匿名事件收集可個別開啟。實體 NPU、正式多 GPU 效能和實體光子晶片的測量資料目前仍待補齊。 [發布與回退](docs/DEPLOYMENT.md)

## 歷史紀錄 · Quantquer vNext

## 本次成果

Quantquer vNext — Engineering & Evidence Upgrade 以 `d2d07d5` 為基線。首屏和明暗主題維持波形辨識。首頁文案及 CTA 更新，技術層級圖移到解決方案區。視覺驗證跨四種尺寸，另以正常動態偏好檢查波形與捲動。

| 面向 | 基線 | 候選 |
| --- | --- | --- |
| 索引 | 26 筆 | 98 筆，雙語 canonical、hreflang、麵包屑、社群分享圖 |
| 案例 | 16 個案例，英文共用錨點 | 16 個獨立英文詳頁，既有語系錨點可達，統一證據分類與相關服務 |
| 商務 | 首頁服務、Planner、聯絡 | 七個解決方案、七個工程合作方案、雙語專案詢價、列印版與雙語 PDF |
| 證據 | 分散實測及展示頁 | Labs 搜尋與成熟度、工程證據和 Benchmark 入口、三個新雙語 Demo、GPU 策略比較、Vision 誤差與 NPU 資料驗證工具 |
| 品牌 | 波形、明暗主題、主要案例 | 保留原版波形，明確區分 Engineering、Labs 與 Products、公司及創辦人經歷 |

## 修改位置

- 首頁與保護元件在 `index.html`、`en/index.html`、`assets/site.css`，新增首頁內容由 `scripts/build-vnext-home.mjs` 生成。
- `solutions/`、`services/`、`company/`、`research/`、`insights/`、`capabilities/` 與 `en/` 對應路徑由 offerings 生成器管理，資料在 `data/studio-offerings.mjs`。
- `work/` 和 `en/work/` 使用既有案例資料、圖解與新的證據分類。共用雙語版型在 `scripts/vnext-layout.mjs`。
- `labs/`、`assets/evidence/`、`assets/vnext-demos/` 與 `benchmarks/` 包含實驗索引、資料下載、合成場景、原始結果與重跑方式。
- `contact/`、`assets/studio-contact.mjs` 和 `server/` 提供郵件、複製、表單驗證與選配的同源詢價介面。部署設定位置和資料處理條件見部署手冊。
- `scripts/vnext-browser.mjs`、`scripts/vnext-visual.mjs` 及 `scripts/check-vnext-links.py` 可重跑驗收。站圖、預覽及各模組的 build/check 由 `scripts/build-vnext.mjs` 整合。

## 驗收、預覽與上線

本機建置、44 項測試、98 路徑、75 組瀏覽器版面與六組原版固定波形比較均已驗收。手機 Lighthouse 候選首頁為效能 94、無障礙 100、最佳做法 100、SEO 100。影像實測、光子模擬、受控 GPU 回放和合成排程各自標示。 [QA 報告](docs/QA_REPORT.md) · [固定幀截圖](docs/visual-regression/VISUAL_REGRESSION_REPORT.md) · [Benchmark 方法](docs/BENCHMARK_GUIDE.md)

本機分支為 `feat/quantquer-vnext`。預覽 <http://127.0.0.1:8766/>。正式環境待站主確認，這次交付使用候選提交。帳號、DNS、收件服務與外部追蹤配置須在相應服務審核後啟用。現有靜態版本的詢價可透過公開信箱寄送。 [部署與回退](docs/DEPLOYMENT.md) · [待站主確認](docs/OWNER_ACTION_REQUIRED.md)

分享與後續審查先核對本機候選的公開文案及資源。硬體後續項目包括目標 NPU 計時、影片級延遲、對照 GPU 工作負載與多 GPU 實測、實體光子故障及可披露的其他專案資料。 [證據政策](docs/EVIDENCE_POLICY.md)

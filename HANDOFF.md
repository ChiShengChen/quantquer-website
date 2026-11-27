# Quantquer vNext 交付

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

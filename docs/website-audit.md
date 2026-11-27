# Quantquer 官網稽核

## 基線

正式版 `9f68ea7` 的繁中首頁以 SHA-256 與 Git 輸出核對。以 Chromium 實際載入兩種語系首頁、案例索引、詢價及 Benchmark 頁。視窗為 1920 × 1080、1440 × 900、768 × 1024、390 × 844 及 320 × 568。截圖均在修改網站程式之前取得。

| 視窗 | 首頁截圖 |
| --- | --- |
| 1920 × 1080 | [桌面](website-screenshots/before/home-1920.webp) |
| 1440 × 900 | [筆電](website-screenshots/before/home-1440.webp) |
| 768 × 1024 | [平板](website-screenshots/before/home-768.webp) |
| 390 × 844 | [手機](website-screenshots/before/home-390.webp) |
| 320 × 568 | [小型手機](website-screenshots/before/home-320.webp) |

另存 [英文手機首屏](website-screenshots/before/english-390.webp)、[案例區手機](website-screenshots/before/work-390.webp)、[案例區桌機](website-screenshots/before/work-1440.webp) 與 [手機詢價](website-screenshots/before/contact-390.webp)。

## 架構

- GitHub Pages 由 `main` 的 repo 根目錄發布。Node 產生靜態 HTML，Python 提供本機預覽與連結驗證，瀏覽器使用原生 CSS 與 JavaScript。repo 無 package manifest、獨立 lint 或 TypeScript 設定檔。
- 繁中在根目錄，英文在 `/en/`。現有 98 條索引路徑，保留早期專題、證據、案例錨點與 Planner。生成器管理 canonical、hreflang、Open Graph、JSON-LD 與站圖。
- `assets/site.css` 保存版面、字型、明暗主題及多種響應條件。產生頁共用 `scripts/vnext-layout.mjs`。繁中首頁有專用的原版導覽與內嵌 Canvas 波形。
- 工程圖像來自公開專案、作者圖解、現有實驗與合成 Demo。案例資料已有來源、狀態與揭露欄位。成效數字存於經驗證的 benchmark 資料與現有來源。
- 聯絡頁的同源收件 adapter 與 HTTPS 預約地址均為選配。正式站目前有直接 Email、完整表單、草稿與複製功能。三欄表單目前只有設定收件才顯示。

## 實測問題與順序

| 優先 | 發現 | 影響 |
| --- | --- | --- |
| P0 | 英文首頁 320 px 出現 21 px 水平溢出。繁中 320 px 的次要 CTA 底端為 572 px，超過 568 px 首屏。 | 小型手機的導航、文字與 CTA 需保留完整可操作區域。 |
| P0 | 繁中與英文首屏版型分歧，英文缺少波形。兩者在手機需先開選單才能換語言。 | 入口體驗與品牌識別不一致。 |
| P0 | 首屏三個技術項目與下方四軸並列，後段另有重複索引。390 px 繁中首頁主內容高 5,397 px，六個案例全部預設展開。 | 精選摘要可用較少空間給出交付及證據。 |
| P0 | 首頁小型解決方案卡片只有名稱，短詢價依接收設定而隱藏。 | 企業訪客需要清楚看到可交付成果、證據和下一步。 |
| P1 | 案例首屏把歸屬、階段和證據串成同一行，技術限制合在問題描述後面。 | 需靠閱讀較長段落判斷實績、原型與研究範圍。 |
| P1 | Canvas 每幀重算固定空間值與漸層。現有 viewport、頁籤及減少動態支援可沿用。 | 可降低使用中的逐幀開銷，畫面以既有固定幀回歸保護。 |
| P1 | 既有驗證涵蓋大量網址、資料與 360–1440 px。新增 320 與 1920 px，擴充影片、短表單與 SEO 檢查。 | 保護既有內容、可讀性與路由相容性。 |

網站優化先完成上述可驗證的問題。實機成效、索引狀態及正式轉換數據依資料與服務是否可用另行記錄。

# Quantquer 官網驗收

對照版本是正式站 `9f68ea7`。候選版使用相同的靜態 GitHub Pages 結構。檢查執行於本機 Chromium，聯絡流程用合成資料，直送測試使用 Playwright 攔截的同源端點。

## 建置與回歸

| 檢查 | 結果 |
| --- | --- |
| 生成與一致性 | `node scripts/build-vnext.mjs` 及 `--check` 均通過。共 98 個 sitemap URL，包含 45 組雙語 URL 與 8 個相容頁。 |
| 單元與資料測試 | 45 項通過。涵蓋雙語表單與服務端、排程、光子、影像條件與證據重現。 |
| 語法與封裝 | JS 模組使用 `node --check`，差異使用 `git diff --check`。repo 無獨立 lint 或 TypeScript 設定。 |
| SEO 與連結 | 3,703 個網域內引用通過。檢查檔案及錨點、標題和描述唯一性、canonical、分享縮圖、語系對應與 JSON-LD 語法。77 個外部 URL 維持個別來源，未逐一測試第三方站點。 |
| Playwright | 98 個路徑 HTTP 檢查，15 個頁面 × 7 種寬度共 105 組版面檢查。受測版面無超出、必要圖片無損壞，自有資源無意外錯誤。 |
| 互動 | 鍵盤、桌機及行動導覽、雙語與明暗主題、案例 AND 篩選與分享、Labs 篩選、既有 Demo、實跑回放、DXF／PDF／JSON、影片與雙語字幕、表單驗證、郵件草稿與複製備援、模擬直送的重試與回執、舊錨點、停用 JS 的備援與自訂 404。 |
| 波形 | 繁中在 1440 × 900、1280 × 800、768 × 1024、390 × 844 的亮色固定幀，以及 1440 × 900、390 × 844 的深色固定幀，Canvas 與正式版逐像素相等。另驗證播放、離開視窗暫停、返回恢復，以及英文首頁的 Canvas 和 320 px CTA。 |

`docs/DEPLOYMENT.md` 列有完整重跑命令。波形可設定 `QUANTQUER_BASELINE=https://quantquer.com`，將結果輸出到工作樹以外的 `QUANTQUER_VISUAL_REPORT`。 [部署與驗收命令](DEPLOYMENT.md)

## 無障礙

axe-core 4.14 依 WCAG 2.0／2.1／2.2 A 或 AA 標籤檢查 10 組頁面、主題及視窗。配置涵蓋雙語首頁、案例列表及詳情、明暗詢價、證據、Benchmark 和可靠性 Demo。10 組均未發現自動掃描違規。修正品牌文字和行動語言控制的可及名稱，並讓導覽色彩轉場遵守減少動態效果偏好。

實測鍵盤可進主內容、開關選單、切換語系、操作目錄與主要表單。Canvas 為裝飾性內容，重要數據另有文字或表格。Hero 文字疊在漸層及波形上，axe 對這一區要求人工確認，已檢視亮色、深色及手機截圖。本次沒有完成螢幕閱讀器實機或全面人工 WCAG 稽核。

## Lighthouse 行動版

本機預覽用 Lighthouse 13.6.0 的行動裝置預設執行測試。LCP、CLS 為實驗室值，正式站的真實訪客 INP 需要欄位資料。本次未使用正式訪客量測或真實裝置測試。

| 頁面 | 效能 | 無障礙 | 最佳做法 | SEO | LCP | CLS |
| --- | ---: | ---: | ---: | ---: | ---: | ---: |
| 繁中首頁 | 98 | 100 | 100 | 100 | 2.0 s | 0.001 |
| 英文首頁 | 100 | 100 | 100 | 100 | 1.5 s | 0.030 |
| 繁中聯絡頁 | 100 | 100 | 100 | 100 | 1.5 s | 0.001 |
| 工程證據 | 100 | 100 | 100 | 100 | 1.4 s | 0.002 |
| Benchmark | 99 | 100 | 100 | 100 | 1.5 s | 0.043 |

短詢價佔位改由 HTML 初始排版保留，兩次聯絡頁重測的 CLS 均為 0.001。字型仍由既有 Google Fonts 提供，使用 `display=swap`。首頁保留延遲解碼圖片、WebP 和點擊才載入的影片。Canvas 使用快取的空間包絡與漸層。桌面及手機以相同生成流程發布既有路徑。

## 前後截圖與首頁精簡

使用同一 Chromium 與視窗，等待字型與取景範圍內的案例圖解碼後截圖。以下 WebP 保留原尺寸。文字量以預設未展開的 `main.innerText` 排除空白後計算。390 px 繁中從 1,483 減為 984 字元（34%），英文從 3,760 減為 2,644 字元（30%）。未達初步約 40–50% 的目標。保留四個方案各自的交付物、三案的可追溯證據與兩語相同的主要入口。

390 px 繁中主內容高從 5,397 降至 3,855 px，英文從 5,945 降至 4,721 px。320 px 英文頁面由 341 縮為 320 px。繁中及英文的兩個 Hero CTA 底緣分別為 453、477 px，均在 568 px 首屏內。

| 取景 | 改版前 | 候選版 |
| --- | --- | --- |
| 首頁 1920 × 1080 | [改版前](website-screenshots/before/home-1920.webp) | [候選版](website-screenshots/after/home-1920.webp) |
| 首頁 1440 × 900 | [改版前](website-screenshots/before/home-1440.webp) | [候選版](website-screenshots/after/home-1440.webp) |
| 首頁 768 × 1024 | [改版前](website-screenshots/before/home-768.webp) | [候選版](website-screenshots/after/home-768.webp) |
| 首頁 390 × 844 | [改版前](website-screenshots/before/home-390.webp) | [候選版](website-screenshots/after/home-390.webp) |
| 首頁 320 × 568 | [改版前](website-screenshots/before/home-320.webp) | [候選版](website-screenshots/after/home-320.webp) |
| 英文首頁 390 × 844 | [改版前](website-screenshots/before/english-390.webp) | [候選版](website-screenshots/after/english-390.webp) |
| 代表案例區 1440 × 900 | [改版前](website-screenshots/before/work-1440.webp) | [候選版](website-screenshots/after/work-1440.webp) |
| 代表案例區 390 × 844 | [改版前](website-screenshots/before/work-390.webp) | [候選版](website-screenshots/after/work-390.webp) |
| 聯絡頁 390 × 844 | [改版前](website-screenshots/before/contact-390.webp) | [候選版](website-screenshots/after/contact-390.webp) |

## 部署與證據界線

- 正式靜態版的三欄短表單、完整 RFP 都可使用草稿及複製。自動寄送、HTTPS 預約和匿名事件收集需要已核准的端點或服務。實際收件未測試。
- 影像基準限兩組桌面 CPU 場景。GPU 資料是單一工作站受控紀錄的回放。光子資料採理想 MZI 數值模型。目標 NPU、多 GPU 吞吐量及實體晶片數據等待可公開實測。
- 舊證據頁保留自己的語系切換。原有社群圖檔沿用。主要新頁的語言標記與社群 metadata 已驗證，第三方搜尋索引及分享快取需發布之後再觀察。
- 此報告涵蓋本機候選版。正式發布仍待站主核准。 [交付與部署](../HANDOFF.md)

# Quantquer 保護中的品牌元件

| 元件 | 原始位置 | 應保持的行為 |
| --- | --- | --- |
| 首頁全幅波形 | `index.html` 的 `#spectrum` 與內嵌 spectrum 程式區塊 | Canvas 蓋滿首屏。垂直頻率格線、PSD 包絡、主要訊號、第二諧波與捲動視差沿用原始公式及振幅。 |
| 波形構圖 | `assets/site.css` 的 `.hero`、`.hero::after`、`.hero-eyebrow`、`.fig-cap` | 首屏高度、波形遮罩、標語位置、註解與窄螢幕的波形透明度沿用原規格。 |
| 動畫與主題 | `index.html`、`assets/theme.js`、`assets/site.css` | 正常動態偏好下以動畫幀繪製。減少動態效果時繪製固定時間 0，主題切換與尺寸變更重新繪製。波形為數學生成功能示意。 |
| 首頁導覽 | `scripts/build-vnext-home.mjs` 的 `waveformNavigation`、`index.html` 的選單事件與 `assets/site.css` | 原導覽高度、品牌標記、按鈕與漢堡樣式。捲動切換背景，Escape 關閉並回到開關，行動版維持原響應規則。 |
| 字體、色彩與版面 | `assets/site.css` 的全站變數與既有元件 | Noto Serif TC、Noto Sans TC、IBM Plex Mono、原品牌藍和深色 teal。新模板沿用按鈕、邊線、容器和主題。 |
| 既有內容動畫 | `index.html` 的 IntersectionObserver 與 `assets/site.css` 的 reveal 樣式 | 元件在進入視窗時顯示，使用系統動態效果偏好。 |

vNext 更新標題、副標、CTA 和導覽目的地。新文案沿用原字級和色彩，標題文字欄寬調整讓更新後的中文在受測桌面與手機可自然換行。晶片到系統的工程圖放在首屏以下。

要變更保護元件，先用原版 Git 提交在同一套瀏覽器建立基線，再重新執行波形及響應式測試。調整輪廓、構圖、動態或字體前向站主確認。 [視覺回歸](/docs/visual-regression/VISUAL_REGRESSION_REPORT.md)

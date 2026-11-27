# 原版波形視覺回歸

基線以 `git archive d2d07d5` 匯出同一個部署版本，在 127.0.0.1:8767 啟動。候選在 127.0.0.1:8766。每組使用同一 Chromium、1× 像素比例、同一動態偏好，等待字型就緒，再以既有 resize 事件固定起始幀。另以正常動態偏好確認 Canvas 連續改變，並操作捲動及行動導覽。

| 尺寸 | 基線 | 候選 | 左右對照 |
| --- | --- | --- | --- |
| 1440 × 900 亮色 | [原版](before/1440x900-light.png) | [新版](after/1440x900-light.png) | [比較](comparisons/1440x900-light.png) |
| 1440 × 900 深色 | [原版](before/1440x900-dark.png) | [新版](after/1440x900-dark.png) | [比較](comparisons/1440x900-dark.png) |
| 1280 × 800 亮色 | [原版](before/1280x800-light.png) | [新版](after/1280x800-light.png) | [比較](comparisons/1280x800-light.png) |
| 768 × 1024 亮色 | [原版](before/768x1024-light.png) | [新版](after/768x1024-light.png) | [比較](comparisons/768x1024-light.png) |
| 390 × 844 亮色 | [原版](before/390x844-light.png) | [新版](after/390x844-light.png) | [比較](comparisons/390x844-light.png) |
| 390 × 844 深色 | [原版](before/390x844-dark.png) | [新版](after/390x844-dark.png) | [比較](comparisons/390x844-dark.png) |

Playwright 比對六組 Canvas PNG 位元內容、色彩變數、Hero 高度、主標字級和行高、導覽高度、波形透明度及原註解。每組確認兩個 CTA 在第一屏。新增文字和導覽名稱是預期差異。新文案原有孤字已透過調整欄寬與換行解決。完整頁面截圖包含更新後的文案，畫布固定幀用獨立的 SHA-256 核對。 [驗證輸出](comparisons/waveform-checks.json)

測試範圍是 Chromium 固定畫布及操作。各作業系統字型的抗鋸齒與繪圖驅動可能呈現輕微差異。 [保護元件](../PROTECTED_DESIGN_COMPONENTS.md)

# 量維資科 Quantquer Inc. — 官方網站

量化深科技顧問公司官網。單頁式靜態網站，以研究級的嚴謹方法，解決 AI/ML、訊號處理、時頻分析、臨床醫療資訊與量化策略上的硬問題。

🌐 **線上網址**：<https://quantquer.com>

---

## 技術概覽

- **純靜態**：單一 `index.html`，內嵌 CSS 與原生 JavaScript，**無建置流程、無相依套件**。
- **字型**：Google Fonts（Noto Serif TC / Noto Sans TC / IBM Plex Mono）。
- **Hero 動畫**：`<canvas>` 即時繪製訊號頻譜（PSD 包絡 + live signal trace），支援 `prefers-reduced-motion`。
- **雙主題**：亮色（預設，品牌藍 `#004EA1`）／深色（teal `#2DD4BF`），右上角切換，偏好存於 `localStorage`，於繪製前套用以避免閃爍。
- **SEO**：Open Graph、Twitter Card、JSON-LD `Organization`（含 LinkedIn / Google Scholar `sameAs`）。

## 專案結構

```
.
├── index.html                  # 整個網站（內容 + 樣式 + 腳本）
├── assets/
│   ├── logo-mark.png           # 標誌（藍色 Q，深淺底皆適用）— favicon / nav
│   ├── logo-full-light.png     # 完整 logo（淺色字，深色底用）— 深色版頁尾
│   └── logo-full-onlight.png   # 完整 logo（深色字，淺色底用）— 亮色版頁尾
├── CNAME                       # 自訂網域：quantquer.com
├── .nojekyll                   # 關閉 GitHub Pages 的 Jekyll 處理
└── .gitignore
```

## 本地預覽

直接用瀏覽器開啟 `index.html` 即可；或啟動簡易伺服器：

```bash
python3 -m http.server 8000
# 開啟 http://localhost:8000
```

## 內容區塊（皆在 `index.html`）

| 區段 | id | 說明 |
|------|------|------|
| Hero | `#top` | 主標與 canvas 動畫 |
| §01 能力 | `#capabilities` | 技術領域 |
| §02 服務與合作模式 | `#services` | 顧問諮詢／PoC／MVP／專案外包／長期夥伴（專案制） |
| §03 精選案例 | `#work` | 案例與成果 |
| §04 工作方式 | `#method` | Define → Design → Validate → Deliver |
| §05 關於 | `#about` | 創辦人與資歷 |
| §06 夥伴服務 | `#partners` | 協作夥伴 |
| §07 聯絡 | `#contact` | Email · LINE · LinkedIn |

## 編輯指南

- 所有文字、樣式、腳本都集中在 `index.html`，依上方區塊註解（`<!-- ===== ... ===== -->`）尋找對應段落即可修改。
- 主題顏色定義在 `<style>` 開頭的 `:root`（深色）與 `html[data-theme="light"]`（亮色）兩組 CSS 變數。
- 換 logo 時注意三個版本的用途（深底用淺色字版、淺底用深色字版）。

## 部署

GitHub Pages（來源：`main` 分支根目錄）。推送到 `main` 即自動重新部署。

- 自訂網域由 `CNAME` 指定，DNS 將 apex 指向 GitHub Pages 的 A 紀錄、`www` 以 CNAME 指向 `chishengchen.github.io`。
- 已啟用 **Enforce HTTPS**（Let's Encrypt 憑證，http 自動轉址 https）。

## 授權 License

**版權所有，禁止轉用。** 本儲存庫所有內容（程式碼、設計、文字、圖像、品牌標誌）均為量維資科有限公司之財產，未經書面同意不得重製、修改或散布。詳見 [LICENSE](LICENSE)。

公開此儲存庫僅為網站部署之用，不構成任何授權。

---

© 2026 量維資科有限公司 Quantquer Inc.（統一編號 93573761）— 用量化方法解決硬問題。

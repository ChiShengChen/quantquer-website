# 量維資科 Quantquer Inc. — 官方網站

研究驅動的 AI 與深科技工程公司官網。以靜態首頁和半導體專題呈現晶片端 AI、GPU 運算基礎設施、客製化 AI Agent、研究即服務，以及醫療、訊號、金融與工業 AI。

🌐 **線上網址**：<https://quantquer.com>

---

## 技術概覽

- **純靜態**。首頁和 `/semiconductor-ai/` 共用 CSS 與原生 JavaScript，無建置流程或套件安裝。
- **字型**：Google Fonts（Noto Serif TC / Noto Sans TC / IBM Plex Mono）。
- **Hero 動畫**：`<canvas>` 即時繪製訊號頻譜（PSD 包絡 + live signal trace），支援 `prefers-reduced-motion`。
- **雙主題**：亮色（預設，品牌藍 `#004EA1`）／深色（teal `#2DD4BF`），右上角切換，偏好存於 `localStorage`，於繪製前套用以避免閃爍。
- **SEO**。Open Graph、Twitter Card、JSON-LD、逐頁 canonical、`sitemap.xml` 和 `robots.txt`。

## 專案結構

```
.
├── index.html                  # 官網首頁與公開案例資料
├── semiconductor-ai/index.html # 半導體與邊緣 AI 專題
├── sitemap.xml / robots.txt    # 搜尋引擎索引
├── assets/
│   ├── site.css                # 共用排版、主題及響應式樣式
│   ├── theme.js                # 明暗主題與相應插圖
│   ├── portfolio.js            # 案例與 Labs 的篩選及計數
│   ├── logo-mark.png           # 標誌（藍色 Q，深淺底皆適用）— favicon / nav
│   ├── logo-full-light.png     # 完整 logo（淺色字，深色底用）— 深色版頁尾
│   ├── logo-full-onlight.png   # 完整 logo（深色字，淺色底用）— 亮色版頁尾、JSON-LD
│   ├── partners/*              # §08 夥伴 logo（取自築邦科技夥伴頁 buildpolis.com/partners）
│   ├── og-image.png            # 社群分享圖 1200×630（實心淺底，LINE／FB／X 預覽用）
│   ├── caps/*.webp             # §01 能力示意圖
│   ├── svcs/*.webp             # §02 服務方案示意圖
│   ├── labs/*.webp             # §06 Labs 示意圖
│   ├── method-flow.webp        # §04 工作方式流程圖（1536×512）
│   └── cases/*.webp            # §03 案例配圖
│                               #   插圖提供 768w、1536w、3072w 三種寬度，由瀏覽器依版面與像素密度選擇
│                               #   對應檔為 <name>-768.webp、<name>.webp、<name>-3072.webp，深色版在副檔名前加 -dark
├── CNAME                       # 自訂網域：quantquer.com
├── .nojekyll                   # 關閉 GitHub Pages 的 Jekyll 處理
└── .gitignore
```

## 本地預覽

從 repo 根目錄啟動本機 HTTP 伺服器，可測試目錄路徑、錨點與查詢參數。

```bash
python3 -m http.server 8000 --bind 127.0.0.1
```

- 首頁 <http://127.0.0.1:8000/>
- 半導體專題 <http://127.0.0.1:8000/semiconductor-ai/>

## 首頁區塊

| 區段 | id | 說明 |
|------|------|------|
| Hero | `#top` | 主標、一句服務描述、兩個入口按鈕與 canvas 動畫 |
| 代表案例 | `#featured` | 晶片端生成式 AI 技術專題與三個代表案例 |
| §01 能力 | `#capabilities` | 十項技術能力與專題入口 |
| §02 服務與合作模式 | `#services` | 八個服務方案與五種合作方式 |
| §03 精選案例 | `#work` | 八個案例，七個技術分類，可複選 |
| §04 工作方式 | `#method` | Define → Design → Validate → Deliver |
| §05 研究成果 | `#research` | 代表論文（venue · 論文 · 程式碼連結） |
| §06 Quantquer Labs | `#labs` | 自主研發工具，可依主題及開源／內部使用／開發中篩選 |
| §07 關於 | `#about` | 創辦人與資歷 |
| §08 夥伴服務 | `#partners` | 協作夥伴 |
| §09 聯絡 | `#contact` | Email · LINE · LinkedIn，以及需求表單（開啟郵件草稿或複製需求內容，不經第三方） |

## 編輯指南

- 只把可公開的卡片寫入 HTML。案例與 Labs 各卡的 `id` 是穩定錨點，`data-tags` 對應篩選按鈕值，`data-origin` 和 `data-stage` 記錄卡片上對應的歸屬及階段。篩選與計數直接讀取靜態卡片。
- 主題與共用樣式集中在 `assets/site.css`。主題變數位於 `:root`（深色）與 `html[data-theme="light"]`（亮色）。
- 首頁表單依既有選項 ID 預填需求類型。同頁入口使用 `data-inquiry`，跨頁入口使用 `?inquiry=<選項 ID>#contact`。
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

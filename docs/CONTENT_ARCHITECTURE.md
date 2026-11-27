# 內容與路由

- `data/projects.json` 保存 16 個案例的雙語事實、公開狀態、交付物、引用、量測與限制。`data/case-diagrams.json` 管理圖解步驟及來源。`data/studio-case-evidence.mjs` 維護證據分類、解決方案與展示關聯。
- `data/studio-offerings.mjs` 維護七個解決方案、七個工程合作方案及五個採購入口，並提供公司、研究、工程觀點、網頁與 PDF 能力簡介的共用文案來源。
- `data/studio-labs.mjs` 與 `data/studio-demos.mjs` 整理工作主題、成熟度、展示、案例及相關方案。`benchmarks/results.mjs` 從可公開來源產生索引。
- `scripts/vnext-layout.mjs` 統一新增路由的導覽、canonical、hreflang、社群縮圖、頁面 schema 與麵包屑。`scripts/build-vnext-home.mjs` 只更新首頁標記區。
- 網站根路徑使用繁體中文，新增英文對應頁位於 `/en/`。原有案例 `#english`、專題、Planner 和 Labs 的 query/anchor 仍可使用。
- `scripts/build-vnext-sitemap.mjs` 整合各模組路由。新案例先填完整雙語內容、證據限制與引用，執行建置、連結核對和瀏覽器測試再送審。

靜態輸出可直接交給 GitHub Pages。原生 ES modules 只在有操作需求的頁面啟用功能。

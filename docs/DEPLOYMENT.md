# 靜態預覽、部署與詢價整合

## 預覽

```sh
node scripts/build-vnext.mjs
node scripts/build-vnext.mjs --check
node --test --test-isolation=none scripts/test-*.mjs benchmarks/scripts/test-vision-npu.mjs
python3 scripts/check-vnext-links.py
python3 scripts/preview-vnext.py --port 8766
```

查看 <http://127.0.0.1:8766/>、`/en/`、`/labs/benchmarks/` 和 `/contact/`。基線另從 `git archive d2d07d5` 匯出，使用 `scripts/preview-vnext.py --port 8767 --directory <基線路徑>`。測試環境安裝 Playwright，若 Chromium 由工作機提供，執行時設定 `CHROME_PATH`。

```sh
node scripts/vnext-browser.mjs
node scripts/vnext-visual.mjs
```

可透過 `QUANTQUER_PLAYWRIGHT` 指向安裝在暫存目錄的 Playwright 模組。下列命令將測試依賴和 Chromium 放在站點以外，適用於無既有 Playwright 的工作機。

```sh
npm install --prefix /tmp/quantquer-vnext-qa playwright@1.65.1 lighthouse@13.6.0
/tmp/quantquer-vnext-qa/node_modules/.bin/playwright install chromium
export QUANTQUER_PLAYWRIGHT=/tmp/quantquer-vnext-qa/node_modules/playwright
```

現有 GitHub Pages 主機使用 `main` 根目錄和 `.nojekyll`，部署本身無需建置服務或 Node 套件。

## 正式發布

1. 取得站主發布確認，先同步 `origin/main`，核對期間改動，然後整合到待發布工作樹。
2. 重跑建置、測試、連結掃描與瀏覽器驗收。審核變更、公開證據、社群圖與下載。
3. 將核准的變更合併至 `main` 及推送，等待既有 Pages 部署工作流程。
4. 正式站核對已知網址、404、canonical 與 sitemap，實際操作主題、選單、三個新展示和詢價。分享平台已快取的縮圖依平台更新機制重新抓取。
5. 如需回退，以 `git revert` 反轉已發布提交並保留期間其他變更，完成後重新核對正式 URL。

## 詢價與轉換

GitHub Pages 的一般模式使用公布的 Gmail、產生郵件草稿和複製內容。啟用直送需由自有 HTTPS 主機將 `/api/inquiry` 轉到私人 Node 程序。先審核資料處理，再在服務環境提供 `.env.example` 所示變數及正式 transport。用 `node --env-file=.env server/start-inquiry.mjs` 啟動在 127.0.0.1 上的 handler。反向代理必須用可核對的實際連線 IP 覆寫 `X-Quantquer-Client-IP`，限制請求大小、排隊與逾時，並提供同源路由。單程序內最多每個來源 15 分鐘 8 次請求，本機收件防重狀態 15 分鐘。多實例依正式運維需求加入共用配額與防重機制。

授權 transport 接收 Bearer token 及 `Idempotency-Key`，以 JSON `{ok:true,receipt:"…"}` 回覆受理。密鑰只放伺服器。端點核准後，將 `assets/studio-integrations.mjs` 的 `inquiryPath` 設為同源路徑。檢查 staging 的失敗、重試、表單、節流、資料保留，以及真實收件權限；公開版此前沿用郵件。現有 Project Planner 仍可寄郵件、複製、下載，使用不同的舊 adapter payload。

經核准的 `bookingUrl` 須為 HTTPS。可選的 `analyticsPath` 須為同源 `/api/…`，觸發團隊定義的匿名事件，不包含表單欄位、Cookie、查詢參數或外部 referrer。服務端 IP 與日誌政策須另行確認。

首頁方案導引發出 `solution_finder_used`，只附支援清單上的服務代碼。當直接收件啟用時，快速詢價以 `mode: "quick"` 送出姓名、信箱與問題，完整 RFP 以 `mode: "full"` 送出。舊版完整表單仍相容。短表單及預約分別依設定顯示，預設入口可使用公開信箱。

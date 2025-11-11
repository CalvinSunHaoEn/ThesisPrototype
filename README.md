# Emotion Canvas

Emotion Canvas 是一個針對行動裝置優化的 Web App，使用者可以上傳自拍照，並透過 OpenAI GPT 模型即時分析照片中的情緒狀態。系統會以色彩與圖表呈現情緒光譜，同時提供個人化的舒緩建議。

## 功能特色

- 📸 行動優先的照片上傳體驗（支援相機拍攝與相簿上傳）。
- 🤖 串接 OpenAI 多模態模型，將照片內容轉換為情緒洞察。
- 🎨 以色彩面板呈現情緒主色與建議色彩。
- 📊 使用 Chart.js 呈現情緒光譜百分比。
- 💡 依情緒狀態提供舒緩或維持狀態的建議。
- 🧪 內建「先看示範」按鈕，不需 API 金鑰也能預覽圖表與色彩呈現。

## 專案架構

```
.
├── public/
│   ├── app.js          # 前端互動邏輯與 API 串接
│   ├── index.html      # 行動版頁面結構
│   └── styles.css      # 玻璃質感介面與響應式設計
├── server.js           # Express API + OpenAI 串接
├── package.json        # 相依套件與啟動指令
└── README.md
```

## 環境需求

- Node.js 18 以上版本
- 已設定的 `OPENAI_API_KEY`

## 安裝與執行

```bash
npm install
OPENAI_API_KEY=sk-xxxx npm run start
```

啟動後於瀏覽器開啟 `http://localhost:3000` 即可使用。若要在開發時自動重啟伺服器，可使用：

```bash
OPENAI_API_KEY=sk-xxxx npm run dev
```

## 無金鑰預覽

若尚未取得 OpenAI API Key，可直接在上傳卡片中點擊「先看示範」，系統會載入內建的示範照片與情緒分析結果，方便快速預覽成品呈現方式。

## 注意事項

- 照片僅於瀏覽器端暫存並在分析時送至伺服器，伺服器未實作任何儲存機制。
- 若伺服器未設定 `OPENAI_API_KEY`，會回傳錯誤訊息提醒需要設定 API Key。
- 此原型僅作為展示情緒偵測介面與多模態模型串接流程之用途，實際部署需考量隱私與倫理議題。

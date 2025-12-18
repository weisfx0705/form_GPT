# FormGen AI - Google 表單生成器

這是一個基於 AI 的工具，可以幫助您快速生成 Google 表單。只需輸入表單的目的和需求，AI 就會自動為您設計問題，並生成可以直接在 Google Apps Script 中使用的程式碼。

## ✨ 主要功能

- **AI 智能生成**：使用 Google Gemini 模型 (gemini-3-flash-preview)，根據您的描述自動產生合適的表單問題。
- **即時預覽與編輯**：在生成程式碼前，您可以自由修改、新增或刪除問題，調整選項和題目類型。
- **一鍵生成程式碼**：確認內容後，自動產生對應的 Google Apps Script 程式碼。
- **簡單易用**：直觀的步驟式介面，無需任何程式設計背景也能輕鬆上手。

## 🚀 如何使用

1. **設定 API Key**：首次使用需輸入您的 Google Gemini API Key（可免費獲取）。
2. **輸入需求**：
   - **表單目的**：例如「公司員工滿意度調查」。
   - **詳細條件**：列出您希望包含的問題或特定要求。
3. **生成與編輯**：點擊生成後，AI 會列出建議的問題。您可以：
   - 修改題目文字
   - 更改題型（單選、多選、簡答等）
   - 增刪選項
4. **取得程式碼**：確認無誤後，點擊「確認並生成程式碼」。
5. **建立表單**：
   - 複製生成的程式碼。
   - 前往 [Google Apps Script](https://script.google.com/) 建立新專案。
   - 貼上程式碼並執行，您的 Google 表單就會自動建立！

## 🛠️ 技術架構

- **前端**：HTML5, CSS3, Vanilla JavaScript
- **AI 模型**：Google Gemini API
- **樣式**：自定義 CSS (Glassmorphism 風格)

## 📦 安裝與執行

本專案為純靜態網頁，無需安裝後端伺服器。

1. Clone 或下載本專案。
2. 直接用瀏覽器打開 `index.html` 即可使用。

## 👤 作者

**陳嘉暐 (Chia-Wei Chen)**
- 義守大學 電影與電視學系
- [個人網站](https://weisfx0705.github.io/chiawei/)

---
*應用 Google AI Studio 開發 2025*

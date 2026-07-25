<div align="center">

# ✨ Linky

### A local-first shortcut hub — nothing ever leaves your device

[![React](https://img.shields.io/badge/React-61DAFB?style=for-the-badge&logo=react&logoColor=white)](#)
[![TypeScript](https://img.shields.io/badge/TypeScript-3178C6?style=for-the-badge&logo=typescript&logoColor=white)](#)
[![Vite](https://img.shields.io/badge/Vite-646CFF?style=for-the-badge&logo=vite&logoColor=white)](#)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg?style=for-the-badge)](LICENSE)

</div>

> **Linky** organizes, searches, and launches your daily websites from one beautiful dashboard. No account. No sign-up. No server. Your shortcuts, tags, groups, backgrounds, and usage stats all live entirely on your own device.

---

## Why local-first, on purpose

Linky deliberately has **no backend and no cloud sync**. That's not a limitation — it's a design decision:
- Your browsing habits and saved sites never touch a server you don't control
- Works fully offline, including as a packaged desktop app
- No account to create, no password to manage, no data breach to worry about
- Full control: export/import your data anytime as JSON or CSV, no lock-in

---

## 🌟 Features

| Feature | What it gives you |
|---|---|
| 🎯 Shortcut management | Add, edit, delete, pin, and reorder shortcuts with drag-and-drop |
| 🏷️ Smart organization | Group shortcuts, add tags, and search across all metadata |
| 🎨 Personalization | Dynamic backgrounds, accent colors, tile sizing, and UI controls |
| 👤 Multiple profiles | Switch between different shortcut collections with avatars |
| 💾 Local-first | All shortcuts stored locally with IndexedDB - works offline |
| 📊 Local analytics | See what you use most, stays on your device |
| 📦 Backup & restore | CSV/JSON backup and restore, no lock-in |
| 🌍 i18n support | Multi-language (English, Hindi, Spanish, French, Arabic) |
| 🖥️ Desktop app | Electron runtime with Windows/macOS/Linux installers |

---

## 🛠️ Tech Stack

- **React** + **TypeScript** + **Vite** - Modern reactive UI
- **Zustand** - State management with local persistence
- **Tailwind CSS** - Utility-first styling
- **DnD Kit** - Drag and drop functionality
- **PapaParse** - CSV import/export
- **Electron** - Desktop app runtime
- **Vitest** - Unit testing

---

## 📁 Project Structure

```
Linky/
├── src/
│   ├── components/           # UI components and dialogs
│   ├── store/               # Zustand application store
│   ├── utils/               # Helpers, i18n, CSV logic
│   └── types/               # TypeScript type definitions
├── electron/                 # Electron main and preload
├── public/                   # Static assets
└── .github/workflows/        # CI pipeline
```

---

## 🚀 Getting Started (Web App)

### Prerequisites
- [Node.js](https://nodejs.org/) version 18 or higher installed on your computer
  (check with `node -v` in your terminal — if that command isn't found, install Node.js first)

### Step 1 — Get the code

**Option A — using Git:**
```bash
git clone https://github.com/AshishCherian15/Linky.git
cd Linky
```

**Option B — without Git:**
Click the green "Code" button on this GitHub page → "Download ZIP" → unzip it → open a terminal inside the unzipped folder.

### Step 2 — Install dependencies
```bash
npm install
```

### Step 3 — Run the app
```bash
npm run dev
```

Your terminal will show a local address, usually:
```
Local:   http://localhost:5173
```

Open that address in your web browser. Linky is now running — entirely on your own computer, nothing sent anywhere.

### Step 4 — Using the app
- Click **"+ Add Shortcut"** to save your first website
- Use the search bar to filter your saved shortcuts instantly
- Drag and drop cards to reorder them
- Open **Settings** (gear icon) to change backgrounds, colors, and layout
- Your data is saved automatically in your browser — closing the tab won't lose anything
- Use **Export Backup** in Settings anytime to save a copy of your data as a file

### Step 5 — Stopping the app
Press `Ctrl + C` in your terminal to stop the local server.

### Optional — Production build
```bash
npm run build
npm run preview
```

### Optional — Desktop app (Windows/macOS/Linux)
```bash
npm run desktop:build
```

Creates an installer in the `release/` folder — run it like any other application.

---

## 📦 Scripts

```bash
npm run dev          # Development server
npm run build        # Production build
npm run preview      # Preview production build
npm run test         # Run tests (watch mode)
npm run test:run     # Run tests once (CI)
npm run desktop:dev    # Electron dev mode
npm run desktop:start  # Start Electron against built assets
npm run desktop:build  # Build desktop installer
```

---

## 🧪 CI/CD

CI runs on push and pull request:

- Frontend dependency install
- Frontend tests
- Frontend production build

---

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---

<div align="center">

**Built with ❤️ by [Ashish Cherian](https://github.com/AshishCherian15)**

</div>

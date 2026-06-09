# Linky

Linky is a modern, local-first shortcut hub that helps you organize, search, and launch your daily websites from one beautiful dashboard.

## One-line pitch
Linky is your personal, customizable shortcut hub - a beautiful offline dashboard that organizes and launches your daily websites instantly.

## Features

- Shortcut management
- Add, edit, delete, pin, and reorder shortcuts
- Group shortcuts and add tags for better organization
- Search across name, URL, group, description, icon, and tags

- Smart productivity tools
- Quick add templates for popular sites
- Auto-suggested group, description, and tags from URL/domain
- Favicon/logo fallback support

- Personalization
- Dynamic backgrounds (video/image/YouTube/solid/gradient)
- Default offline video background (`public/space-drive.webm`)
- Accent color, tile sizing, card style, and UI behavior controls
- Multiple profiles with avatar upload

- Data and reliability
- Local-first persistence with Zustand persist
- Import/export full backup (JSON)
- Import/export shortcuts (CSV)
- Analytics export/reset controls

- Analytics
- Total and per-shortcut launch tracking
- Daily launch analytics persisted in app state
- 7-day activity and top-today insights

- Internationalization
- Multi-language support (English, Hindi, Spanish, French, Arabic)
- Runtime language switching from Settings

- Desktop ready
- Electron runtime scaffolding included
- Windows installer generation configured via electron-builder

## Tech stack

- React + TypeScript + Vite
- Zustand (state + persistence)
- Tailwind CSS
- DnD Kit
- PapaParse (CSV import/export)
- Electron + electron-builder
- Vitest (unit tests)

## Project structure

- `src/` - app source code
- `src/components/` - UI components and dialogs
- `src/store/` - Zustand application store
- `src/utils/` - helpers, i18n, CSV/background logic
- `electron/` - Electron main and preload files
- `public/` - static assets (default background video)
- `.github/workflows/ci.yml` - CI test/build pipeline

## Scripts

- `npm run dev` - run web app in development
- `npm run build` - type-check and production build
- `npm run preview` - preview production web build
- `npm run test` - run Vitest in watch mode
- `npm run test:run` - run tests once (CI mode)
- `npm run desktop:dev` - run Vite + Electron desktop dev mode
- `npm run desktop:start` - start Electron against built assets
- `npm run desktop:build` - build web app and package desktop installer

## Getting started

1. Install dependencies

```bash
npm install
```

2. Run web development mode

```bash
npm run dev
```

3. Run tests

```bash
npm run test:run
```

4. Build for production

```bash
npm run build
```

## Desktop packaging

To package desktop builds:

```bash
npm run desktop:build
```

Windows installer output is generated in `release/`.

## CI

CI runs on push and pull request and performs:

- dependency install (`npm ci`)
- unit tests (`npm run test:run`)
- production build (`npm run build`)

## Status

Linky currently includes core CRUD, personalization, import/export, analytics tracking, tests, CI, and desktop packaging scaffolding.

## License

This project is licensed under the MIT License. See [LICENSE](LICENSE).

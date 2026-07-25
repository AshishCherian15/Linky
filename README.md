<div align="center">

# ✨ Linky

### 🧪 Local-first shortcut hub with cloud-backed URL shortening and analytics

[![React](https://img.shields.io/badge/React-61DAFB?style=for-the-badge&logo=react&logoColor=white)](#)
[![TypeScript](https://img.shields.io/badge/TypeScript-3178C6?style=for-the-badge&logo=typescript&logoColor=white)](#)
[![Vite](https://img.shields.io/badge/Vite-646CFF?style=for-the-badge&logo=vite&logoColor=white)](#)
[![Node.js](https://img.shields.io/badge/Node.js-339933?style=for-the-badge&logo=nodedotjs&logoColor=white)](#)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-4169E1?style=for-the-badge&logo=postgresql&logoColor=white)](#)
[![Redis](https://img.shields.io/badge/Redis-DC382D?style=for-the-badge&logo=redis&logoColor=white)](#)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg?style=for-the-badge)](LICENSE)

</div>

> **Linky** is a modern shortcut hub that combines local-first organization with cloud-backed URL shortening. Organize, search, and launch your daily websites from a beautiful dashboard, and create shareable short links with detailed click tracking.

---

## 🌟 Highlights

| Feature | What it gives you |
|---|---|
| 🎯 Shortcut management | Add, edit, delete, pin, and reorder shortcuts with drag-and-drop |
| 🏷️ Smart organization | Group shortcuts, add tags, and search across all metadata |
| 🔗 Public links | Create shareable short links with custom aliases and expiry dates |
| 📊 Analytics | Click tracking, referrer analysis, device breakdown, and time-based charts |
| 📱 QR codes | Generate and download QR codes for any public link |
| 🎨 Personalization | Dynamic backgrounds, accent colors, tile sizing, and UI controls |
| 👤 Multiple profiles | Switch between different shortcut collections with avatars |
| 💾 Local-first | All shortcuts stored locally with IndexedDB - works offline |
| 🌐 Cloud sync | Optional backend for sharing links and cross-device analytics |
| 🖥️ Desktop app | Electron runtime with Windows installer support |
| 🌍 i18n support | Multi-language (English, Hindi, Spanish, French, Arabic) |

---

## 🛠️ Tech Stack

### Frontend
- **React** + **TypeScript** + **Vite** - Modern reactive UI
- **Zustand** - State management with persistence
- **Tailwind CSS** - Utility-first styling
- **DnD Kit** - Drag and drop functionality
- **Recharts** - Analytics visualization
- **PapaParse** - CSV import/export
- **Electron** - Desktop app runtime

### Backend
- **Node.js** + **Express** - API server
- **Prisma ORM** - Database toolkit
- **PostgreSQL** - Relational database
- **Redis** - Caching and rate limiting
- **JWT** - Authentication
- **bcrypt** - Password hashing
- **Zod** - Schema validation
- **QRCode** - QR code generation

---

## 📁 Project Structure

```
Linky/
├── src/                      # Frontend source
│   ├── components/           # UI components and dialogs
│   ├── store/               # Zustand application store
│   ├── utils/               # Helpers, i18n, CSV logic
│   └── api/                 # Backend API client
├── server/                   # Backend server
│   ├── src/
│   │   ├── routes/          # API route handlers
│   │   ├── services/        # Business logic (shortcode, cache)
│   │   ├── controllers/     # Request handlers
│   │   └── middleware/      # Express middleware
│   ├── prisma/              # Prisma schema and migrations
│   └── package.json
├── electron/                 # Electron main and preload
├── public/                   # Static assets
├── docker-compose.yml        # PostgreSQL + Redis containers
└── .github/workflows/        # CI pipeline
```

---

## 🚀 Getting Started

### Prerequisites
- **Node.js** 20+
- **PostgreSQL** (or use Docker)
- **Redis** (or use Docker)

### 1. Install Dependencies

```bash
# Frontend
npm install

# Backend
cd server
npm install
```

### 2. Setup Database and Redis

Using Docker (recommended):

```bash
docker-compose up -d
```

Or run PostgreSQL and Redis manually and update `server/.env`.

### 3. Configure Environment

Copy `server/env.example` to `server/.env`:

```bash
DATABASE_URL="postgresql://linky:linky123@localhost:5432/linky"
REDIS_HOST=localhost
REDIS_PORT=6379
PORT=3001
BASE_URL=http://localhost:3001
JWT_SECRET=your-secret-key-change-in-production
```

### 4. Run Database Migrations

```bash
cd server
npm run prisma:migrate
```

### 5. Start Development

**Terminal 1 - Backend:**
```bash
cd server
npm run dev
```

**Terminal 2 - Frontend:**
```bash
npm run dev
```

Frontend: `http://localhost:5173` | Backend: `http://localhost:3001`

---

## 📦 Scripts

### Frontend
```bash
npm run dev          # Development server
npm run build        # Production build
npm run preview      # Preview production build
npm run test         # Run tests (watch mode)
npm run test:run     # Run tests once (CI)
```

### Desktop
```bash
npm run desktop:dev    # Electron dev mode
npm run desktop:start  # Start Electron against built assets
npm run desktop:build  # Build desktop installer
```

### Backend
```bash
cd server
npm run dev              # Development server
npm run build            # Build TypeScript
npm run start            # Production server
npm run prisma:generate  # Generate Prisma client
npm run prisma:migrate   # Run migrations
npm run prisma:studio    # Open Prisma Studio
```

---

## 🌐 Deployment

### Backend Deployment

1. Set up PostgreSQL and Redis (Railway, Render, AWS)
2. Configure production environment variables
3. Build and deploy:
   ```bash
   cd server
   npm run build
   npm run start
   ```

### Frontend Deployment

1. Build the frontend:
   ```bash
   npm run build
   ```
2. Deploy `dist/` to Vercel, Netlify, or similar
3. Set `VITE_API_URL` to your backend URL

### Desktop Packaging

```bash
npm run desktop:build
```

Windows installer output in `release/`.

---

## 🔌 API Endpoints

### Authentication
- `POST /api/auth/signup` - Create account
- `POST /api/auth/login` - Login and get JWT
- `GET /api/auth/me` - Get current user

### Public Links
- `POST /api/links` - Create public link (rate limited)
- `GET /api/links` - List user's public links
- `GET /api/links/:id` - Get link details
- `PATCH /api/links/:id` - Update link
- `DELETE /api/links/:id` - Delete link
- `GET /api/links/:id/analytics` - Get link analytics
- `GET /api/links/:id/qrcode` - Get QR code (PNG)

### Public Redirect
- `GET /:shortcode` - Redirect to long URL (no auth)

---

## 🧠 Architecture

Linky is a hybrid application:

1. **Frontend** - React SPA with IndexedDB persistence (local-first, works offline)
2. **Backend** - Express API for public links, auth, and analytics
3. **Database** - PostgreSQL stores users, links, and click data
4. **Cache** - Redis provides fast URL lookups and rate limiting

The local-first approach means shortcuts are stored locally and work offline. Public links are optional and require the backend.

---

## 🧪 CI/CD

CI runs on push and pull request:

- Frontend dependency install and tests
- Frontend production build
- Server dependency install
- Prisma client generation
- Server TypeScript build

---

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---

<div align="center">

**Built with ❤️ by [Ashish Cherian](https://github.com/AshishCherian15)**

</div>

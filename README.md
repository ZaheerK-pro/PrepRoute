# PrepRoute - Test Management Application

A 5-page React application for creating, managing, and publishing tests with questions.

## Tech Stack

- **React 19** + **TypeScript**
- **Vite** for build tooling
- **React Router** for navigation
- **Zustand** for state management
- **Axios** for API integration
- **React Hook Form** + **Zod** for form validation

## Getting Started

```bash
npm install
cp .env.example .env   # Windows: copy .env.example .env
npm run dev
```

Open [http://localhost:5173](http://localhost:5173)

Set `VITE_API_BASE_URL` in `.env`. In development the app calls `/api` and Vite proxies to that URL so the browser avoids CORS issues.

## Application Flow

1. **Login** — Authenticate and store JWT in localStorage
2. **Dashboard** — View, search, filter, edit, view, and delete tests
3. **Create/Edit Test** — Configure test metadata with cascading subject/topic/sub-topic selects
4. **Add Questions** — Bulk add MCQ questions with validation
5. **Preview & Publish** — Review full test and publish to live status

## API Base URL

All API configuration lives in environment variables — nothing is hardcoded in source.

| Environment | How it works |
|-------------|--------------|
| **Local dev** | Set `VITE_API_BASE_URL` in `.env`; app calls `/api`, Vite proxies to that URL |
| **Vercel** | Set `VITE_API_BASE_URL` in Vercel → Settings → Environment Variables, then redeploy. `vercel.json` proxies `/api` to that URL at runtime (no CORS) |
| **Local preview** | `npm run build && npm run preview` — uses the same `/api` proxy via Vite preview |

## Scripts

| Command         | Description          |
| --------------- | -------------------- |
| `npm run dev`   | Start dev server     |
| `npm run build` | Production build     |
| `npm run preview` | Preview production build |

## Deploy on Vercel

1. Push the repo to GitHub (must include `vercel.json`).
2. Import the project on [vercel.com](https://vercel.com).
3. Framework: **Vite** — build command `npm run build`, output directory `dist`.
4. Add environment variable `VITE_API_BASE_URL` (your API URL ending with `/api`) for Production, Preview, and Development.
5. Deploy, then **redeploy** after any env var change.

Client-side routes (`/login`, `/dashboard`, etc.) use `routes` in `vercel.json` (not `rewrites` — Vite on Vercel injects `handle: filesystem`, which breaks the `rewrites` schema).

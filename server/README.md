# Ferrylance Server

A small Node.js/Express backend that sits next to Supabase and handles the
things that shouldn't happen directly from the browser: heavy processing,
cross-user writes, and anything that needs to bypass Row Level Security
safely.

**Supabase still does the simple stuff directly from the frontend**: auth
(sign up/log in), reading profiles/posts/projects, and most inserts where
RLS already allows "a user can write their own row" (e.g. saving onboarding
progress, posting an update, liking a post). You don't need this server
running for the app to work in that mode.

Use this server when you want:

| Route | What it does | Why it's not just a Supabase call |
|---|---|---|
| `POST /api/uploads` | Resizes + compresses an image (avatar, cover, post image, portfolio image) with `sharp`, then stores it in Supabase Storage | Image processing is CPU/memory heavy — you don't want to ship large libraries to the browser or block the UI thread |
| `GET /api/feed` | Returns a ranked, blended feed (posts + open project opportunities) | Cross-table ranking logic that's awkward and unsafe to express as a client-side query |
| `GET /api/search` | Searches across `projects` and `profiles` in one call | Same — one query, ranked results, no RLS gymnastics |
| `POST /api/proposals` | Submits a proposal, increments the project's proposal counter, notifies the client | Touches a project row and a notification row the freelancer isn't allowed to write directly under RLS |
| `POST /api/notifications/dispatch` / `mark-read` | Creates/marks notifications | Grows into fan-out logic later (notify many users at once) without touching the frontend |

## Running it

```bash
cp .env.example .env
# fill in SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY (Project Settings -> API)
npm install
npm run dev
```

Runs on `http://localhost:4000` (override with `PORT`). Health check:
`GET /health`.

## Auth

The frontend attaches the logged-in user's Supabase access token as
`Authorization: Bearer <token>` (see `frontend/src/lib/apiClient.js`). The
`requireAuth` middleware (`src/middleware/requireAuth.js`) verifies that
token against Supabase and attaches the user to `req.user` — so every
protected route knows exactly who's calling without re-implementing auth.

## Extending this

Every route file in `src/routes/` is deliberately small and single-purpose.
To add a new heavy task (e.g. generating a PDF invoice, sending a digest
email, running a recommendation model), add a new route file, wire it into
`src/index.js`, and call it from the frontend via `apiGet`/`apiPost`/`apiUpload`
in `frontend/src/lib/apiClient.js`.

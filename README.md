# Ferrylance — Full Package

This is the complete Ferrylance app: landing page, auth, onboarding for both
**freelancers** and **clients**, and the full post-onboarding product (feed,
discover/find work, projects, proposals, messages, notifications, profile,
earnings) styled after the LinkedIn-style "Stitch" design.

```
ferrylance/
├── frontend/     React (Vite + Tailwind) app — everything the user sees
├── server/       Node.js/Express backend — heavy tasks, talks to Supabase
└── supabase/
    └── schema.sql   Run this once in your Supabase project
```

## 1. Set up Supabase (5 minutes)

1. Create a project at https://supabase.com if you don't have one yet.
2. Open **SQL Editor → New query**, paste the contents of `supabase/schema.sql`,
   and click **Run**. This creates every table (profiles, posts, projects,
   proposals, messages, notifications, wallet, etc.), turns on Row Level
   Security with sensible policies, and creates the storage buckets used for
   avatars/covers/post images/portfolio images.
3. Grab three values from **Project Settings → API**:
   - Project URL
   - `anon` public key
   - `service_role` key (⚠️ keep this one secret — backend only)

## 2. Run the frontend

```bash
cd frontend
cp .env.example .env
# edit .env: VITE_SUPABASE_URL, VITE_SUPABASE_ANON_KEY, VITE_API_BASE_URL
npm install
npm run dev
```

That's it — `npm install` pulls in everything, including `react-router-dom`
which now powers navigation between the landing page, onboarding, and the
app itself.

## 3. Run the backend (optional for local dev, needed for uploads/heavy tasks)

```bash
cd server
cp .env.example .env
# edit .env: SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY
npm install
npm run dev
```

Runs on `http://localhost:4000` by default. See `server/README.md` for what
it does and why.

## What's new in this package

- **Client onboarding** (`frontend/src/components/ClientOnboarding.jsx`) —
  a 6-step wizard mirroring the freelancer one, but for a business profile:
  basic info, business details, about the business, hiring needs, links,
  and a preview. Reuses the same shared UI kit as the freelancer flow so
  both feel identical.

- **Dynamic links, everywhere** — the old fixed LinkedIn/GitHub/Behance/...
  fields are gone. There's now one "paste a link" box
  (`frontend/src/components/onboarding/shared.jsx` → `DynamicLinks`) that
  auto-detects YouTube, Instagram, GitHub, LinkedIn, Behance, Dribbble,
  Figma, a personal website, and more, and shows the right icon/label
  automatically. Add as many as you want. This is used in both onboarding
  flows and in the portfolio project modal (for a video/demo link instead
  of a video upload).

- **No video uploads (yet)** — as requested, video upload UI has been
  removed. Anywhere a video would go, there's a link field instead
  ("paste a YouTube or Instagram link").

- **"Finish this later"** — every onboarding flow has a **Skip for now**
  button in the top bar. Skipping takes the person straight into the app;
  their profile is saved as a draft (`profile_completed = false`,
  `onboarding_step` tracks where they left off, synced to Supabase so it
  works across devices). The app shell then shows a persistent
  "Finish your profile" banner with a **Continue setup** button that reopens
  the wizard exactly where they left off. Nothing is ever lost —
  `Save Draft` also writes to `localStorage` as a backup.

- **The full post-onboarding app** (`frontend/src/app/`) — converted from
  the 14 HTML screens in the Stitch design zip into React, wired up with
  `react-router-dom`, mobile-responsive (top nav on desktop, bottom tab bar
  on mobile — same pattern as LinkedIn's app):
  - `Feed` — home feed with posts + project opportunities + recommendations
  - `Discover` — find work with filters, search, sorting
  - `MyProjects` / `ProjectDetails` / `ProjectWorkspace` — project lifecycle
  - `MyProposals` / `SubmitProposal` — proposal flow
  - `Messages` / `Notifications`
  - `CreatePost` — post an update, or (for clients) post a project
  - `Earnings` — wallet & transaction history
  - `Profile` — adapts its layout for freelancer vs. client profiles

- **Node.js backend** (`server/`) for the things that shouldn't run in the
  browser or need to bypass Row Level Security: image resizing/compression
  on upload (via `sharp`), feed ranking/aggregation, cross-table search,
  notification fan-out, and proposal submission (which needs to update a
  different user's project row). See `server/README.md`.

## Notes

- Every screen tries to load real data from Supabase first, and only falls
  back to sample/demo content (clearly isolated in
  `frontend/src/app/data/sampleData.js`) when a table is empty — so the app
  never looks broken on a brand-new project, but nothing fake is ever
  written to your database.
- The pages that write data (`CreatePost`, `SubmitProposal`) already have
  working Supabase inserts; a few interactive-but-not-yet-backed pieces
  (likes, connections, milestones editing) are left as clearly-marked
  extension points once you're ready to wire them up — the schema already
  has the tables for them.

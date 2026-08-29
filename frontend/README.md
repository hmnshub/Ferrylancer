# React + Vite

This template provides a minimal setup to get React working in Vite with HMR and some Oxlint rules.

Currently, two official plugins are available:

- [@vitejs/plugin-react](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react) uses [Oxc](https://oxc.rs)
- [@vitejs/plugin-react-swc](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react-swc) uses [SWC](https://swc.rs/)

## React Compiler

The React Compiler is not enabled on this template because of its impact on dev & build performances. To add it, see [this documentation](https://react.dev/learn/react-compiler/installation).

## Expanding the Oxlint configuration

If you are developing a production application, we recommend using TypeScript with type-aware lint rules enabled. Check out the [TS template](https://github.com/vitejs/vite/tree/main/packages/create-vite/template-react-ts) for information on how to integrate TypeScript and Oxlint's TypeScript related rules in your project.
## Cloudflare Pages deployment

Create a Cloudflare Pages project connected to this repository with these settings:

- Root directory: `frontend`
- Build command: `npm run build`
- Build output directory: `dist`
- Node.js version: `20`

Add these Pages environment variables for both Preview and Production:

```text
VITE_SUPABASE_URL=https://gvpkrhwawtaxuhpqzupl.supabase.co
VITE_SUPABASE_ANON_KEY=<your Supabase anon/publishable key>
VITE_API_BASE_URL=https://<your-deployed-api-domain>
```

`VITE_API_BASE_URL` must be the public URL of the deployed Express server; do not leave it as `http://localhost:4000`.

The `public/_redirects` file keeps React Router routes working after a browser refresh on Cloudflare Pages.

The current Express server is not a static Pages deployment. Deploy `server` separately on a Node.js host, then set its environment variables:

```text
SUPABASE_URL=https://gvpkrhwawtaxuhpqzupl.supabase.co
SUPABASE_SERVICE_ROLE_KEY=<Supabase service-role secret>
CORS_ORIGINS=https://<your-pages-domain>
```

Never put `SUPABASE_SERVICE_ROLE_KEY` in Cloudflare Pages or any `VITE_*` variable.

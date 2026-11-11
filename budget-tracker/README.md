# Budget Tracker

Personal, offline-first budget tracker (React + TypeScript + Vite). Data is stored only in the browser (IndexedDB).
See `PLAN.md` for the full spec and build phases.

```bash
npm install
npm run dev     # http://localhost:5173
npm test        # Vitest unit tests
npm run build   # type-check + production build
```

## Builds

| Build | Command | Used for |
|---|---|---|
| Normal | `npm run build` | Hosting at a domain root with real URLs (`/month/2026-11`) |
| Static hosting | `VITE_BASE=./ VITE_ROUTER=hash npm run build` | GitHub Pages or any folder; addresses look like `#/month/2026-11` |
| Preview | `VITE_PREVIEW=1 npx vite build --base ./` | One self-contained file for a sandboxed preview page (no offline mode, shows testing tools) |

The normal and static builds are installable apps (PWA) that work offline after the first visit.

## Publishing to GitHub Pages

`.github/workflows/budget-tracker-pages.yml` tests, builds and publishes the app whenever `budget-tracker/` changes.
One-time setup in the GitHub repository:

1. **Settings → Pages → Build and deployment → Source:** choose **GitHub Actions**.
2. **Settings → Environments → github-pages → Deployment branches:** add the branch you deploy from
   (or merge into the default branch, which is allowed already).
3. Re-run the workflow from the **Actions** tab. The app is then at `https://<user>.github.io/<repo>/`.

## Backups

Everything lives on the device. **Settings → Backup and export** downloads a JSON backup (restorable on any device)
and CSV exports. The month page reminds you when the last backup is more than 30 days old.

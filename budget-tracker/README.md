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

## Windows desktop app (Tauri)

The same app, wrapped as a Windows program with its own data folder (not tied to a browser).
`src-tauri/` holds the Rust shell; all budget logic stays in `src/`. Desktop-only code lives in `src/desktop/`
and is loaded only when the app runs inside Tauri.

- **Get it:** GitHub → Releases → *Budget Tracker vX for Windows* → download the `.exe` and run it.
  Windows may say "Windows protected your PC" (the app is not code-signed): **More info → Run anyway**.
- **Build:** `.github/workflows/budget-tracker-desktop.yml` builds the installer on `windows-latest` for every push.
  It publishes a new release only when `version` in `package.json` has no `desktop-v<version>` release yet,
  so **bump the version to release an update**. The app shows "A new version is available" on its next start.
- **Daily backup:** a JSON backup in `Documents\Budget Tracker Backups\` once a day (newest 30 kept), switchable in Settings.
- **Local build** (needs Rust; on Linux also WebKitGTK): `npm run tauri build` or `npm run tauri dev`.

## Backups

Everything lives on the device. **Settings → Backup and export** downloads a JSON backup (restorable on any device)
and CSV exports. The month page reminds you when the last backup is more than 30 days old.

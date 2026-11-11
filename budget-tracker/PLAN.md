# Budget Tracker — Build Plan for Claude Code

> How to use this file: create an empty folder, put this file in it as `PLAN.md`, open Claude Code there, and say:
> **"Read PLAN.md. Build Phase 0 only, then stop and show me how to run it."**
> Go phase by phase. After each phase, test it yourself, then say "Phase N looks good, do Phase N+1."

---

## 1. Goal

A personal budget tracker that runs in the browser (desktop and phone), works offline, and stores data locally. It must support:

1. **Month-wise entry** — every expense belongs to a month; the app shows one month at a time with easy prev/next navigation.
2. **Fixed expense slots** — Rent, Health Insurance and Subscriptions are pre-filled in every month automatically, with the option to change the amount for a specific month.
3. **Category tabs** — expenses are grouped by type (Groceries, Transport, etc.), each shown in its own tab with its own subtotal.
4. **Trend tracking** — charts and tables showing how spending changes over months and across categories.

Non-goals for v1: bank syncing, multiple users, login, cloud backend.

---

## 2. Tech stack (decided — don't change without asking)

| Layer | Choice | Why |
|---|---|---|
| Framework | **React 18 + TypeScript + Vite** | Fast dev server, type safety catches money/date bugs |
| Styling | **Tailwind CSS** | Quick, consistent, mobile-friendly layouts |
| Storage | **IndexedDB via Dexie.js** | Real local database in the browser; survives refreshes; no server needed |
| Charts | **Recharts** | Simple React charting (bar, line, pie, stacked) |
| Dates | **date-fns** | Month arithmetic without bugs |
| Offline/phone | **vite-plugin-pwa** | Installable on phone home screen, works offline |
| Testing | **Vitest** | Unit tests for all money calculations |

Rules for the code:
- Store all money as **integer cents** (e.g. €12.50 → `1250`). Never use floats for money.
- Currency default **EUR**, formatted with `Intl.NumberFormat('de-DE', { style: 'currency', currency: 'EUR' })`. Make currency a setting.
- Months are identified by a string key `"YYYY-MM"` (e.g. `"2026-11"`).
- All calculation logic lives in pure functions in `src/lib/` and has unit tests. UI components contain no maths.

---

## 3. Data model

```ts
// src/db/types.ts

type MonthKey = string; // "2026-11"

interface Category {
  id: string;
  name: string;          // "Groceries"
  color: string;         // hex, used in charts and tabs
  icon?: string;         // emoji is fine: "🛒"
  isFixed: boolean;      // true for the "Fixed" group
  monthlyBudget?: number; // cents, optional limit per month
  archived: boolean;     // hide without deleting history
  sortOrder: number;
}

interface FixedExpenseTemplate {
  id: string;
  name: string;          // "Rent", "Health Insurance", "Spotify"
  kind: 'rent' | 'health_insurance' | 'subscription' | 'other_fixed';
  defaultAmount: number; // cents
  dayOfMonth: number;    // 1–28, when it's due
  activeFrom: MonthKey;  // first month it applies
  activeUntil?: MonthKey; // undefined = still active (e.g. cancelled subscription gets an end month)
}

interface Expense {
  id: string;
  month: MonthKey;
  date: string;          // ISO "2026-11-10"
  amount: number;        // cents, always positive
  categoryId: string;
  note?: string;
  templateId?: string;   // set if this row was generated from a fixed template
  isOverridden?: boolean; // true if user changed a generated fixed amount for this month
  createdAt: string;
}

interface Income {       // optional but needed for "money left" and savings rate
  id: string;
  month: MonthKey;
  amount: number;        // cents
  source: string;        // "Part-time job", "Parents", "Scholarship"
}

interface Settings {
  currency: string;      // "EUR"
  locale: string;        // "de-DE"
  startOfMonthDay: number; // 1 by default
}
```

Dexie tables: `categories`, `fixedTemplates`, `expenses`, `incomes`, `settings`.
Add indexes on `expenses.month`, `expenses.categoryId`, `[month+categoryId]`.

### Seed data (first launch only)

Categories:
- **Fixed** (isFixed: true) 📌
- Groceries 🛒, Eating Out 🍕, Transport 🚆, Shopping 🛍️, Education 📚, Health & Pharmacy 💊, Leisure 🎉, Travel ✈️, Other 📦

Fixed templates (amounts are placeholders, user edits on first run):
- Rent — €0, day 1
- Health Insurance — €0, day 1
- Subscriptions — Mobile plan, Spotify, Netflix (each its own template, €0)

---

## 4. Feature specs

### 4.1 Month-wise entry
- Header shows **"November 2026"** with ◀ ▶ arrows and a "Today" button; clicking the month name opens a month/year picker.
- URL reflects the month: `/month/2026-11`, so browser back/forward works.
- **Quick-add form** (always visible on desktop; floating "+" button on mobile): amount, category (defaults to the currently open tab), date (defaults to today if viewing current month, else 1st of that month), note.
- Each expense row: date, note, amount, edit ✏️, delete 🗑️ (with undo toast, not a confirm dialog).
- **Month summary bar**: Income · Spent · Remaining · % of income spent.
- Future months are allowed (for planning); show them with a subtle "planned" badge.

### 4.2 Fixed expense slots
- When a month is opened for the first time, the app **auto-generates** one expense row per active `FixedExpenseTemplate` for that month (idempotent — never duplicate if already generated).
- These rows appear in the **Fixed** tab, visually distinct (pin icon, slightly tinted background).
- Editing a generated row's amount affects **only that month** and marks it `isOverridden`, shown with a small "edited" badge and a "reset to default" button.
- **Manage Fixed Expenses** screen (Settings): add/edit/remove templates, change default amount, set an end month (e.g. cancelled Netflix from 2027-02 onward). Changing a default amount asks: "Apply to: this month onward / future months only".
- Fixed rows can be marked **paid / unpaid** with a checkbox, so the user can see what's still due this month.
- Logic for "which templates apply to a month" lives in `src/lib/fixed.ts` with unit tests (start/end boundaries, overrides, no duplicates).

### 4.3 Category tabs
- Horizontal scrollable tab bar: **All · Fixed · Groceries · Eating Out · …**, each tab shows its monthly subtotal underneath the name.
- If a category has a `monthlyBudget`, the tab shows a thin progress bar (green < 80%, amber 80–100%, red > 100%).
- **All** tab: every expense for the month, sortable by date or amount, filterable by text search.
- Category manager (Settings): add, rename, recolor, reorder (drag or up/down buttons), archive. Archived categories disappear from tabs but keep historical data in charts.
- Deleting a category with expenses is not allowed — offer "archive" or "move expenses to another category" instead.

### 4.4 Trends & insights (separate "Trends" page)
Range selector at top: **Last 3 / 6 / 12 months / This year / Custom**.

Charts:
1. **Monthly total spending** — bar chart, one bar per month, with income as a line overlay.
2. **Category breakdown over time** — stacked bar chart (each colour = a category).
3. **This month by category** — donut chart with legend and percentages.
4. **Single category trend** — pick a category, see a line chart over months plus its average as a dashed line.
5. **Fixed vs variable** — two-line chart showing how much of spending is locked in vs flexible.

Tables & numbers:
- **Month-over-month table**: rows = categories, columns = months, last column = change vs previous month (▲ red / ▼ green, with %).
- **Stat tiles**: average monthly spend, highest month, biggest category, savings rate (income − spend) / income.
- **Budget vs actual** table for the selected month.
- **Top 5 largest expenses** in the range.

Export / backup:
- **Export CSV** (all expenses or the selected range).
- **Export / Import JSON backup** of the entire database (since data is local, this is the backup mechanism — show a reminder if no backup in 30 days).

All aggregation functions in `src/lib/stats.ts` with tests: `totalForMonth`, `totalsByCategory`, `monthlySeries(range)`, `monthOverMonthChange`, `averageMonthly`, `savingsRate`.

---

## 5. Screens & navigation

```
Bottom nav (mobile) / sidebar (desktop):
  📅 Month     → month view with category tabs (default screen)
  📈 Trends    → charts and tables
  ⚙️ Settings  → fixed expenses, categories, currency, backup/import
```

---

## 6. Folder structure

```
src/
  db/          dexie.ts, types.ts, seed.ts
  lib/         money.ts, months.ts, fixed.ts, stats.ts, csv.ts  (+ *.test.ts)
  hooks/       useMonth.ts, useExpenses.ts, useStats.ts
  components/  MonthHeader, SummaryBar, CategoryTabs, ExpenseList,
               ExpenseForm, FixedExpenseRow, StatTile, charts/*
  pages/       MonthPage.tsx, TrendsPage.tsx, SettingsPage.tsx
  App.tsx, main.tsx
```

---

## 7. Build phases (stop after each one)

### Phase 0 — Scaffold
- Vite + React + TS + Tailwind + Dexie + Recharts + date-fns + Vitest + React Router installed.
- Empty three-page layout with navigation working.
- `npm run dev`, `npm test`, `npm run build` all succeed.
- **Done when:** I can open the app and click between three empty pages.

### Phase 1 — Data layer & core logic
- Dexie schema, types, seed data.
- `money.ts` (parse "12,50" or "12.50" → 1250; format cents → "12,50 €").
- `months.ts` (next/prev month, month key ↔ date, list months in range).
- Unit tests for both.
- **Done when:** `npm test` passes and seed data appears in browser DevTools → IndexedDB.

### Phase 2 — Month view + entry (Feature 1)
- Month header navigation, quick-add form, expense list, edit/delete with undo, summary bar, income entry.
- **Done when:** I can add expenses in Oct and Nov, switch months, refresh the page, and everything is still there.

### Phase 3 — Fixed expenses (Feature 2)
- Template manager, auto-generation per month, per-month overrides, paid/unpaid toggle.
- Tests for `fixed.ts`.
- **Done when:** setting rent once makes it appear in every new month; editing December's rent doesn't change November's.

### Phase 4 — Category tabs (Feature 3)
- Tab bar with subtotals, budget progress bars, All tab with search/sort, category manager.
- **Done when:** each tab shows only its expenses and subtotals add up to the month total.

### Phase 5 — Trends (Feature 4)
- `stats.ts` + tests, then all charts, tables, stat tiles, range selector.
- **Done when:** with ~3 months of sample data, every chart renders correctly and numbers match the month views.
- Add a dev-only "Load sample data" button (6 months of realistic fake expenses) to make testing easy.

### Phase 6 — Polish
- CSV export, JSON backup/import, PWA install, dark mode, empty states, mobile layout check at 375px width, keyboard-accessible forms.
- **Day-by-day month trend** (added on request): on Trends, pick any month and see a cumulative line of spending through that month, compared with the previous month (and the monthly budget total, if set), so it's clear whether spending is running faster than usual. Logic in `src/lib/stats.ts` with tests.
- **Done when:** I can install it on my phone and use it offline.

### Phase 7 — Windows desktop app (added on request)
Wrap the existing app with **Tauri 2** so it installs as a normal Windows program, independent of any browser.
- Same React code; the desktop build uses relative paths and `#/` addresses, without the service worker (not needed in a desktop app).
- Data lives in the app's own folder (`%LOCALAPPDATA%`), not in Chrome/Edge, so clearing browser data or uninstalling a browser cannot touch it. IndexedDB/Dexie stays as is; no data-model change.
- **Automatic backups:** once a day when the app opens, write a JSON backup to `Documents\Budget Tracker Backups\`, keeping the newest 30. Setting to turn it off or open the folder. Logic for naming/rotation in `src/lib/` with tests.
- Export CSV / backup through the normal Windows "Save as" dialog.
- Moving data in: restore the website's backup file in the desktop app (existing Restore feature).
- **Updates:** on start, check GitHub Releases for a newer version and show "Version X is available — Download" (no signing keys or secrets needed).
- **Build:** a GitHub Actions workflow on `windows-latest` builds the installer (`.exe`) and attaches it to a GitHub Release, so no local tools are needed.
- New dependencies: `@tauri-apps/cli`, `@tauri-apps/api`, Tauri `fs` and `dialog` plugins (Rust is only needed in CI).
- The website and phone install keep working exactly as now.
- **Done when:** I can download the installer from GitHub Releases, install it on Windows, open it with no browser, my data survives clearing browser data, and a backup file appears in Documents.

---

## 8. Instructions to Claude Code (put these in CLAUDE.md)

```md
# CLAUDE.md
- Follow PLAN.md. Only build the phase I ask for, then stop and summarise what changed and how to test it.
- Money is integer cents everywhere. Never floats.
- Business logic goes in src/lib with Vitest tests; run `npm test` before saying a phase is done.
- Run `npm run build` at the end of every phase; fix all TypeScript errors.
- Don't add new dependencies without telling me why.
- Keep components small (< 150 lines); split if larger.
- Ask me before changing the data model in a way that would break existing saved data; if you must, write a Dexie version migration.
```

---

## 9. Ideas for v2 (don't build yet)
- Recurring variable expenses (e.g. weekly groceries estimate)
- Receipt photo attachment
- Split expenses with flatmates
- Optional cloud sync (Supabase) for using it across devices
- Annual fixed costs spread across months (e.g. Rundfunkbeitrag, semester fee)

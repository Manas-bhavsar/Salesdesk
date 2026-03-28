# SalesDesk

SalesDesk is a local-first sales tracking app built for small personal store operations. It helps manage a simple product catalog, record sales, track profit, monitor unpaid amounts, and export or restore data without needing a backend.

This project was built as a practical side project for personal use, with an intentionally lightweight architecture: one app, one user, one device, fast setup.

## Highlights

- Guided first-run setup for store info and product categories
- Catalog management with optional item variants
- Sale recording with payment status support
- Dashboard with revenue, profit, unpaid amount, and product performance
- Excel export for catalog and sales data
- Full JSON backup and import for the entire app state
- Offline/local-first persistence with `localStorage`

## Demo Scope

SalesDesk is not intended to be a full SaaS or ERP system.

It is designed for:

- personal store tracking
- offline-friendly daily use
- quick data entry and basic reporting
- easy recovery through backup/import

It is not designed for:

- multi-user collaboration
- cloud sync
- authentication and roles
- advanced inventory management

## Screens and Flow

The current app flow is:

1. Setup wizard
2. Catalog creation
3. Dashboard and sales tracking
4. Export, backup, and import from the top bar

Main areas:

- `Setup Wizard`: store name, owner, currency, categories
- `Catalog`: add, edit, delete items and variants
- `Dashboard`: record sales, view charts, item performance, recent sales
- `Backup / Import`: download or restore the complete project data

## Tech Stack

- Next.js 16
- React 19
- TypeScript
- Zustand
- Tailwind CSS 4
- Recharts
- `xlsx`
- Radix UI Dialog

## Local-First Data Model

All app data is stored in the browser using `localStorage`.

Persisted data includes:

- store configuration
- catalog items
- sales records

Because of that:

- data is tied to the current browser/device
- clearing browser storage removes app data
- backup export is the recommended recovery path

## Backup and Import

SalesDesk supports full-project backup and restore.

### Backup

Use the `Backup` action in the top bar to download a JSON file containing:

- store configuration
- all catalog items
- all sales records

### Import

Use the `Import` action in the top bar to restore a previously exported backup file.

Import replaces the current local data with the contents of the selected backup file.

## Getting Started

Install dependencies:

```bash
npm install
```

Run the development server:

```bash
npm run dev
```

Open:

```bash
http://localhost:3000
```

## Available Scripts

```bash
npm run dev
npm run build
npm run start
npm run lint
```

## Project Structure

```text
src/
  app/                 Next.js app entry and global styles
  components/
    catalog/           Catalog forms and item editing
    dashboard/         Dashboard cards, charts, and tables
    layout/            Top bar and app shell
    sales/             Sale creation, editing, export filters
    setup/             First-run setup wizard
    ui/                Reusable UI primitives
  lib/                 Calculations, export, local storage, backup
  store/               Zustand stores
  types/               Shared TypeScript types
```

## Why This Project Works Well as a Showcase

- Clear product focus instead of generic CRUD
- Strong single-user scope with intentional tradeoffs
- Good UI polish for a personal utility app
- Useful data features: charts, export, backup, restore
- Clean frontend architecture without unnecessary backend complexity

If you want to present it publicly, this is best framed as:

> A local-first sales and catalog tracker for personal store operations, focused on fast setup, simple reporting, and reliable offline data ownership.

## Possible Future Improvements

- import preview before restore
- optional dashboard date filters
- lightweight tests for calculations and stores
- better README visuals with screenshots or GIFs
- PWA install support

## License

This project currently has no explicit license. Add one before open public distribution.

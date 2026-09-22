# MartPOS

MartPOS is a **local-first desktop Point of Sale and retail management system** for marts, grocery stores, and small retail businesses. It runs as a cross-platform Electron desktop application, stores data locally in SQLite so the store can keep selling with no internet connection, and can synchronize that local data with a remote MartPOS API when one is available.

MartPOS is **not** a generic admin dashboard template — it is a full retail operations tool covering point-of-sale billing, quotations, inventory and stock reservations, purchasing, customer/supplier accounts, payments, and business analytics.


---

## Table of Contents

- [Overview](#overview)
- [Core Business Modules](#core-business-modules)
- [Technology Stack](#technology-stack)
- [Architecture](#architecture)
  - [Frontend Structure](#frontend-structure)
  - [Application Routes](#application-routes)
  - [Electron IPC](#electron-ipc)
  - [Database](#database)
  - [Inventory Reservations](#inventory-reservations)
  - [Synchronization](#synchronization)
- [Authentication & Offline Behavior](#authentication--offline-behavior)
- [Getting Started](#getting-started)
- [npm Scripts](#npm-scripts)
- [Environment Configuration](#environment-configuration)
- [Production Builds](#production-builds)
- [Troubleshooting](#troubleshooting)
- [Security Guidance](#security-guidance)
- [Contributing](#contributing)
- [Roadmap](#roadmap)
- [Known Limitations](#known-limitations)
- [License](#license)

---

## Overview

MartPOS is built for real retail/wholesale operations: cashiers process sales at a till, managers track stock and purchasing, and owners review business performance — all from one desktop application. It is designed to work standalone on a single machine (data lives in a local SQLite database) and, optionally, to synchronize with a central MartPOS backend so multiple locations or devices can share data.

## Core Business Modules

- **Sales & Point of Sale** — barcode lookup, cart management, retail and wholesale pricing, taxes, discounts, extra charges, and cash/card/ledger payments.
- **Bills** — sales bill history, bill details, bill deletion, and product returns.
- **Quotations** — create customer quotations and convert them to invoices.
- **Products** — product catalog management with Excel import/export.
- **Inventory** — stock levels, stock adjustments, inventory import, and temporary stock reservations during checkout.
- **Purchases** — supplier purchase orders, purchase payments, purchase returns, and stock replenishment.
- **Accounts** — customer accounts, supplier accounts, and credit/debit balance tracking.
- **Transactions** — transaction history, an accounting dashboard, and payment settlement.
- **Categories & Brands** — organize the product catalog.
- **Users** — user accounts and access.
- **Dashboard** — business metrics and analytics (sales, purchases, stock value, returns, product performance).
- **Settings** — account, appearance, display, and notification preferences, plus database export/import.
- **Auth** — login, registration, forgot/reset password, and OTP-related screens.

## Technology Stack

**Frontend**
- React 19, TypeScript, Vite
- Tailwind CSS, Radix UI, shadcn-style components
- TanStack Router, TanStack Query
- Zustand (client state)
- React Hook Form + Zod (forms and validation)
- Recharts (analytics/charts)
- Axios (HTTP client)

**Desktop / Backend**
- Electron 36.9.5, Electron Forge (packaging)
- Node.js 22.12.0+
- better-sqlite3 12.4.1 with SQLite (local database)
- bcrypt / bcryptjs (password hashing)
- `ws` (lightweight WebSocket server for local real-time updates)

## Architecture

MartPOS is an Electron application with a React/TypeScript renderer and a Node.js main process that owns the local SQLite database.

| Concern | Location |
|---|---|
| React frontend | `src/` |
| Electron main process | `main.cjs` |
| Electron preload bridge | `preload.cjs` |
| SQLite initialization & schema | `electron-db.cjs` |
| Remote synchronization (main process) | `sync-service.cjs` |
| Remote synchronization (renderer) | `src/lib/sync-service.cjs` |
| Vite configuration | `vite.config.ts` |
| Electron Forge configuration | `forge.config.js` |
| Production frontend output | `dist/` |
| Local dev database | `app-data.db` (ignored by Git) |
| Production database | Electron's `userData` directory |

The renderer never touches SQLite directly — all database reads/writes go through Electron IPC handlers exposed via `preload.cjs` as `window.electronAPI`, which call into handlers registered in `main.cjs`.

### Frontend Structure

```
src/
├── features/
│   ├── sales/         # Point of Sale and billing workflow
│   ├── bills/         # Sales bill history, details, deletion, returns
│   ├── products/      # Product management, Excel import/export
│   ├── inventory/     # Stock management and inventory import
│   ├── purchases/     # Supplier purchases, payments, returns, replenishment
│   ├── quotations/     # Customer quotations
│   ├── accounts/       # Customer, supplier, and user accounts
│   ├── transactions/  # Transaction history, accounting dashboard, settlement
│   ├── dashboard/      # Business metrics and analytics
│   ├── categories/    # Product category management
│   ├── brands/        # Brand management
│   ├── users/          # User management
│   ├── settings/       # Account, appearance, display, notifications, DB export/import
│   └── auth/            # Login, registration, password reset, OTP
├── components/          # Shared layout and UI components
├── context/             # Theme, currency, tax, keyboard shortcuts, font, search providers
├── stores/              # Zustand authentication store
└── routes/              # TanStack Router route definitions
```

### Application Routes

| Route | Purpose |
|---|---|
| `/sign-in` | Login |
| `/sign-up` | Registration |
| `/dashboard` | Business metrics and analytics |
| `/sales` | Point of Sale / billing |
| `/bills` | Bill history, details, returns |
| `/purchases` | Supplier purchases and returns |
| `/quotations` | Customer quotations |
| `/inventory` | Stock management |
| `/products` | Product catalog |
| `/categories` | Product categories |
| `/brands` | Brands |
| `/transactions` | Transaction history and settlement |
| `/accounts` | Customer/supplier/user accounts |
| `/users` | User management |
| `/settings` | Account settings and database export/import |
| `/settings/appearance` | Appearance preferences |
| `/settings/display` | Display preferences |
| `/settings/notifications` | Notification preferences |
| `/help-center` | Help center |

### Electron IPC

The renderer calls `window.electronAPI` (exposed by `preload.cjs`); the main process handles those calls in `main.cjs` and executes SQLite queries. Representative handlers include:

```
users:getAll        users:add          users:update
products:getAll     products:add
inventory:getAll
bills:getAll         bill_orders:add
purchases:getAll
transactions:getAll
database:export      database:import
sync:all
reservation:create   reservation:cancel
stock:available
```

### Database

- SQLite is initialized automatically on Electron startup (`electron-db.cjs`); foreign keys are enabled and indexes are created for common product, account, transaction, inventory, purchase, bill, and quotation queries.
- **Development:** the database file `app-data.db` lives in the project directory and is ignored by Git — it must never be committed.
- **Production:** the database lives in Electron's `userData` directory.
- Local user accounts are stored in SQLite with passwords hashed using bcrypt before storage; duplicate local email registration is rejected.

Core tables: `categories`, `products`, `accounts`, `users`, `system_settings`, `transactions`, `inventory`, `inventory_reservations`, `purchase_orders`, `bill_orders`, `quotations`, `sync_meta`.

### Inventory Reservations

While a bill is being prepared, MartPOS can place a **temporary stock reservation** so the same stock isn't sold twice at the same time:

- Pending bills reserve stock; reserved quantities are excluded from what's reported as available.
- Reservations can be updated, cancelled, completed, or allowed to expire.
- Inventory changes can be broadcast to other open windows/clients through a lightweight local WebSocket server (`ws`), running on **port 3001** by default.

### Synchronization

MartPOS can synchronize local SQLite data with a remote MartPOS API:

- Sync targets selected tables and uses `updated_at` timestamps for incremental synchronization.
- The sync service authenticates using an access token and includes retry and timeout handling.
- Default sync endpoint: `https://martpos.tfourplus.com/api/get-sql-data`.
- Sync status and manual sync controls are exposed through shared sync UI components.

> Remote synchronization requires a valid MartPOS account, a valid access token, an active network connection, and a compatible backend API. Without these, MartPOS continues to operate fully offline using the local SQLite database.

## Authentication & Offline Behavior

1. On login, the app first attempts **local Electron authentication** when Electron APIs are available.
2. If a matching local user exists, the password is verified with bcrypt.
3. If local authentication isn't available or doesn't match, login **falls back to the remote API**.
4. The API base URL is configurable via `VITE_API_BASE_URL` (default: `https://martpos.tfourplus.com/api`).

**Remote endpoints**

| Endpoint | Method | Purpose |
|---|---|---|
| `/login` | POST | Remote login |
| `/register` | POST | Remote registration |
| `/logout` | POST | Logout |
| `/me` | GET | Current user |

**Offline / local registration**

- Remote registration is attempted first.
- If it fails due to a network error, Electron can create a **local cashier account** so the app remains usable offline.
- Local (offline) registration only works inside the Electron app — it is not available when the frontend is run in a plain browser.
- Both `/sign-in` and `/sign-up` are publicly accessible routes.

## Getting Started

**Prerequisites**
- Node.js 22.12.0 or newer
- npm (the project's authoritative package manager — `package-lock.json` is the lockfile of record; `pnpm-lock.yaml` has been removed from the project)

**Setup**

```bash
git clone https://github.com/MuhammadHamzaSajjad274/POS-software.git
cd POS-software
npm install

# Optional: copy and customize environment configuration
cp .env.example .env
# then set VITE_API_BASE_URL if you're using a different backend

# Rebuild native SQLite bindings for this Electron version
npm run rebuild

# Start Vite + Electron together
npm run dev:electron
```

`npm run dev:electron` starts the Vite dev server (port 5173) and launches the Electron shell against it. The local SQLite file (`app-data.db`) is created automatically in the project directory on first run.

Before each database initialization, the application creates a timestamped backup under the local `backups/` directory. Local database files and backups are ignored by Git.

## npm Scripts

| Script | Description |
|---|---|
| `npm run dev` | Starts the Vite dev server on port 5173 (frontend only, no Electron shell) |
| `npm run dev:electron` | Starts Vite and Electron together for full desktop development |
| `npm run build` | Runs the TypeScript build and Vite production build |
| `npm run lint` | Runs ESLint |
| `npm run format` | Formats the project |
| `npm run format:check` | Checks formatting without writing changes |
| `npm run rebuild` | Rebuilds `better-sqlite3` native bindings for Electron 36.9.5 |
| `npm run package` | Packages the Electron application |
| `npm run make` | Creates platform installers |
| `npm run clean` | Removes generated build output |

## Environment Configuration

Copy `.env.example` to `.env` and adjust as needed:

```bash
VITE_API_BASE_URL=https://martpos.tfourplus.com/api
VITE_CLERK_PUBLISHABLE_KEY=
```

- `VITE_API_BASE_URL` — base URL for the remote MartPOS API (login, registration, sync, etc.). Point this at your own backend if you're not using the hosted default.
- `VITE_CLERK_PUBLISHABLE_KEY` — publishable key, if Clerk-based auth integration is enabled in your deployment.

## Production Builds

```bash
npm run build
npm run package
# or, to produce installers:
npm run make
```

**Cross-platform targets**

- **Windows** — NSIS installer and portable build
- **macOS** — DMG
- **Linux** — AppImage and Debian/RPM-related Electron Forge targets

Electron Forge is configured to rebuild `better-sqlite3` automatically as part of packaging.

## Troubleshooting

**`better-sqlite3` ABI / native module errors**
Usually means the native binding was built against a different Node/Electron ABI. Run:
```bash
npm run rebuild
```
If the problem persists, delete `node_modules` and reinstall (`rm -rf node_modules && npm install && npm run rebuild`).

**Electron fails to install or launch**
Confirm Node.js is 22.12.0+ (`node -v`). Delete `node_modules` and `package-lock.json`-derived cache issues by reinstalling: `npm install`. On Linux, missing system libraries can prevent Electron from launching — check the terminal output for missing shared library errors.

**Port 5173 already in use**
Another Vite dev server (or another app) is bound to 5173. Stop the other process, or run Vite on a different port and update any hardcoded references (e.g. `npx vite --port 5174`).

**Remote API "Network Error"**
This means the app couldn't reach `VITE_API_BASE_URL`. Check your internet connection, verify the URL in `.env`, and confirm the backend is reachable. The app will still allow local/offline login and usage inside Electron when the remote API is unreachable.

**Invalid login credentials**
For local accounts, confirm the account was created via local/offline registration and that the email/password match what's stored in `app-data.db`. For remote accounts, confirm the credentials against the MartPOS backend directly; the frontend simply relays the API's response.

**Missing local database**
If `app-data.db` is missing (e.g. after a fresh clone), it is recreated automatically on the next Electron startup by `electron-db.cjs`. If it doesn't regenerate, check file-system permissions in the project directory (dev) or in Electron's `userData` directory (production).

**Sync failures**
Confirm: (1) `VITE_API_BASE_URL` points to a compatible backend, (2) you have a valid access token/logged-in session, (3) the device has network connectivity, and (4) the backend's `/get-sql-data` endpoint is reachable and returning the expected schema. Sync includes retries and timeouts, so a single transient failure should self-resolve; persistent failures usually indicate an auth or connectivity problem.

## Security Guidance

- Local user passwords are hashed with bcrypt before being stored in SQLite — never store or log plaintext passwords.
- `app-data.db` contains real business and account data; it is git-ignored and **must never be committed**. Treat any copy of it as sensitive.
- Do not commit `.env` files containing real API URLs or keys.
- Review `npm audit` output before production deployment and address high-severity findings.
- The project currently has known ESLint violations (console statements, `any` usage) — avoid introducing new ones, and prefer fixing them opportunistically.
- Validate that your backend's `/login`, `/register`, and `/get-sql-data` responses match the shapes this frontend expects before pointing MartPOS at a custom backend.
- Test with real backend credentials in a staging environment before any production release.

## Contributing

1. Fork the repository and create a feature branch.
2. Install dependencies with `npm install` and run `npm run rebuild` before your first `dev:electron` run.
3. Follow the existing code style; run `npm run lint` and `npm run format` before committing.
4. Keep changes to the local database schema (`electron-db.cjs`) backward-compatible where possible, and document any migration steps.
5. Do not commit `app-data.db`, `.env`, or other local/runtime artifacts.
6. Open a pull request describing the change, the modules affected, and any manual testing performed (there is currently no automated test suite — see [Known Limitations](#known-limitations)).

## Roadmap

> This section reflects planned/exploratory direction, not committed features. Labels indicate status.

- **Planned:** Automated test suite and `npm test` script.
- **Planned:** Resolve remaining ESLint violations (console statements, `any` usage) project-wide.
- **Planned:** Migrate legacy CommonJS test files to the project's ESM package mode.
- **Exploratory:** Multi-location/multi-branch sync improvements beyond current incremental table sync.
- **Exploratory:** Expanded receipt/printer integration beyond the current receipt/printing-related UI.
- **Exploratory:** Dependency audit remediation for issues surfaced by `npm audit`.

## Known Limitations

- The remote API must be reachable for remote login and registration; offline mode covers local usage only.
- Local/offline registration only works inside the Electron app, not in a plain browser.
- The backend API's login response shape must match what the frontend expects.
- There are existing ESLint violations in the codebase (notably `console` statements and explicit `any` usage).
- `npm audit` reports dependency vulnerabilities that should be reviewed before production use.
- There is no fully configured automated test suite or `npm test` script yet.
- Some legacy test files use CommonJS syntax while the project otherwise uses ESM package mode.
- The application should be validated against real backend credentials before any production release.
- The local database (`app-data.db`) must never be committed to GitHub.

## License

See [`LICENSE`](./LICENSE) for license details.

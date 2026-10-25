# SyncSphere — Subscription & Utility Billing Management System

SyncSphere is a full-stack software engineering project for tracking recurring subscriptions and household utility bills. It is adapted from the supplied Online Banking System repository, retaining the React/Vite frontend and Express/Sequelize backend foundations while replacing the customer-facing experience with a billing workspace.

## Features

- Overview dashboard with estimated monthly recurring spend, active subscription count, pending bill totals, upcoming bills, and recent payment records.
- Subscription management: add services, search, pause/reactivate, record a demo payment, and remove subscriptions.
- Utility bill management: add electricity, water, gas, internet, and mobile bills; track due dates and paid/pending status; record demo bill payments.
- Payment history with generated reference IDs.
- SQLite database by default; the existing MySQL configuration remains available.
- Responsive layout for desktop and mobile.

> **Important demo boundary:** Payment actions only create a payment record in the local application database and update the relevant bill/subscription date. They do not transfer money, contact a provider, or integrate with a payment gateway. The new `/api/syncsphere` routes are intentionally open for a classroom demo. Before exposing this publicly or using real customer data, add authentication/authorization and tenant ownership to these routes, use HTTPS, secrets management, database migrations, and a real payment provider with verified webhooks. Do not use this demo as a real financial service.

## Requirements

- Node.js 18 or newer (Node.js 20 LTS recommended)
- npm

## Run locally on Windows

Extract the ZIP, then open two PowerShell terminals.

### 1. Start the backend API

```powershell
cd SyncSphere\backend
Copy-Item .env.example .env
npm install
npm run dev
```

The API starts at `http://localhost:4000`. The first start creates the SQLite database and inserts example subscriptions and utility bills. The database file is `backend/data/obs.sqlite`.

Health check: open `http://localhost:4000/api/health`.

### 2. Start the frontend

In a second terminal:

```powershell
cd SyncSphere\frontend
Copy-Item .env.example .env
npm install
npm run dev
```

Open `http://localhost:5173`.

If your API is hosted at another URL, edit `frontend/.env` and set `VITE_API_URL` to the base API URL, for example `https://your-api.example.com/api`. Restart Vite after changing environment variables.

## API endpoints

| Method | Endpoint | Purpose |
|---|---|---|
| GET | `/api/syncsphere/overview` | Dashboard data and summary |
| GET / POST | `/api/syncsphere/subscriptions` | List or add subscriptions |
| PATCH / DELETE | `/api/syncsphere/subscriptions/:id` | Update status/details or remove |
| POST | `/api/syncsphere/subscriptions/:id/pay` | Record demo subscription payment |
| GET / POST | `/api/syncsphere/bills` | List or add utility bills |
| POST | `/api/syncsphere/bills/:id/pay` | Record demo bill payment |
| GET | `/api/syncsphere/payments` | Payment history |

The original banking routes and pages are no longer part of the primary frontend flow, but underlying source files remain in the repository as the starting codebase.

## Build and test

```powershell
cd frontend
npm install
npm run build
```

Backend tests from the original banking project are still present, but they test the old banking features rather than the new SyncSphere UI. Run them with `cd backend; npm test` if you want to check the preserved backend modules.

## Hosting overview

A straightforward student-project deployment uses a static frontend host (for example, Vercel or Netlify) and a Node.js host (for example, Render) for the backend. Configure `VITE_API_URL` to the deployed API base URL, configure backend environment variables on the backend host, enable HTTPS, and use persistent storage or a managed database. SQLite files on ephemeral hosting can be lost when the service restarts or redeploys; use a managed MySQL database or a persistent disk for hosted data. Never commit `.env` files or production secrets.


## Sign-in, account switching, and payment verification (demo)

SyncSphere now requires username/password followed by an OTP before showing the dashboard. The OTP delivery is simulated for local/student demonstration; the backend returns a `devOtp` value in development mode. To enable demo login accounts, open a backend terminal and run `npm.cmd run seed`. **Warning:** the seed script resets/recreates the local banking demo database.

Demo customer accounts (all use password `Customer@123`):

- `priya`
- `arjun`
- `kavya`
- `meera`

After login, click the **KY** avatar in the top-right or bottom-left and choose **Change account / Sign out** to return to login and sign in as another demo account.

Payments now require selecting a method, entering a non-secret identifier, and verifying an OTP before the backend records the demo payment. **Do not enter real card numbers, CVVs, PINs, banking passwords, or real payment credentials.** No payment provider is connected and no real money moves. OTPs and payment challenges are simulated in development. Before production, integrate a real OTP delivery provider, rate limiting, durable challenge storage, a payment gateway, per-user data authorization, and persistent production database storage.

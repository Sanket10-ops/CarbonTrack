# CarbonTrack frontend

React 19 + Vite application for CarbonTrack milestones 2 and 3.

## Requirements

- Node.js 20.19+ or 22.12+
- npm
- CarbonTrack backend and its PostgreSQL/Redis services running locally

## Run locally

From the repository root:

```powershell
cd frontend
npm install
npm run dev
```

Open http://localhost:5173.

The Vite development server proxies `/api` and `/actuator` to the Spring Boot API at http://localhost:8080.

## Production build

```powershell
npm run build
npm run preview
```

## Milestone 3 screens

- Activity logger and personal overview, using backend-calculated emissions.
- Personal goal widgets and progress.
- Anonymous leaderboard with date filtering and the top 50 opt-in accounts.
- Organisation creation, existing-member linking, consent-filtered dashboard, monthly/category trends and CSR CSV export.
- Separate Preferences controls for community benchmark, public leaderboard and internal organisation reporting.

## Authentication and privacy

The access token is held in browser session storage. All protected API calls send it as a bearer token. A member can opt out of leaderboard and organisation reporting at any time. Adding an account to an organisation does not enable reporting consent on that member's behalf.

All activity and dashboard numbers come from the backend. The UI does not invent CO2e factors or replace missing API results with demo data.

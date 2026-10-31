# CarbonTrack frontend

React 19 + Vite application for the CarbonTrack Milestone 2 experience.

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

The Vite development server proxies `/api` and `/actuator` to the Spring Boot API at http://localhost:8080. No separate CORS configuration is required for local development.

## Production build

```powershell
npm run build
npm run preview
```

## Authentication

The frontend uses the existing `POST /api/auth/login` endpoint and keeps the access token in browser session storage. Signing out removes the token. The login/register forms do not contain demo credentials.

## Screens

- Overview: footprint summary, category totals, timeline and recent activity
- Activity: log and review transport, electricity, food and shopping activities
- Goals: create a reduction goal and inspect progress
- Recommendations: personalised category-based recommendations
- Achievements: awarded badges
- Community: opt-in benchmark comparison
- Preferences: sustainability preferences and benchmark visibility

All figures and records displayed by these screens are requested from the CarbonTrack backend. The UI does not seed fabricated dashboard data.

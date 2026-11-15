# CarbonTrack Frontend Refresh

This package refreshes the existing React 18 + Vite frontend while preserving the current Spring Boot API integration and existing application modules.

## Included changes

- Updated visual system for the public landing page, authenticated shell, sidebar, top bar, dashboard cards, forms, and responsive layouts.
- Activity category tabs now use the requested Transport, Electricity, Food, and Shopping labels.
- Quick-log carousel prioritizes the user's most frequently recorded activities from `GET /api/activities`; first-time users see starter shortcuts only when a matching backend emission factor exists.
- Live CO2e preview uses `GET /api/emission-factors` and calculates `quantity * kgCo2ePerUnit` locally as the quantity changes.
- Activity submission continues to use the authenticated `POST /api/activities` endpoint.
- No backend files or database migrations are changed by this frontend package.

## Run locally

From the `frontend` directory:

```bash
npm install
npm run dev
```

The Vite development server proxies `/api` and `/actuator` to `http://localhost:8080` using the existing `vite.config.js`. Start the Spring Boot backend before testing authenticated features.

## Safe replacement

Back up your existing `frontend` directory first. Extract this archive into the CarbonTrack project root and allow the files under `frontend` to be replaced. Do not replace the `backend` directory.

# CarbonTrack Milestone 3 API

All endpoints below require a valid bearer JWT unless noted otherwise. Existing M1/M2 APIs remain unchanged.

## Activity logging and personal dashboard
The existing `POST /api/activities`, `GET /api/activities`, `GET /api/analytics/footprint`, and goal endpoints power the activity logger and personal overview. The React frontend already consumes these contracts; Milestone 3 keeps the server as the source of calculated CO2e.

## Leaderboard

- `GET /api/leaderboard?from=2026-11-01&to=2026-11-12&limit=50`
- Only users who enable the dedicated `leaderboard_opt_in` preference are included.
- Only users with activity in the requested range are ranked. Ranking is ascending by total CO2e.
- Response exposes rank, opaque stable alias, CO2e total, strongest recorded category, badge names, and a practical tip. It never exposes email, username, or user ID.

## Organisations

- `POST /api/organisations` body: `{"name":"Example Organisation"}`. The creator becomes `ORG_ADMIN`.
- `POST /api/organisations/me/members` body: `{"email":"employee@example.com"}`. Adds an existing account that is not already linked to an organisation.
- `GET /api/organisations/me/dashboard?from=2026-11-01&to=2026-11-12`
- `GET /api/organisations/me/export.csv?from=2026-11-01&to=2026-11-12`

Only an authenticated `ORG_ADMIN` can view their organisation's dashboard or export. The service derives organisation scope from the authenticated user, never from a caller-supplied organisation ID.

## Configuration

Set `LEADERBOARD_SALT` to a long random secret in every deployed environment. Keep it out of source control. It must remain stable if opaque aliases are expected to remain stable.

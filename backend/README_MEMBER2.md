# CarbonTrack Milestone 2 — Member 2 Goal Management & Progress Tracking

This drop-in implementation is designed for the `saivarshinigulla/CarbonTrack` backend as inspected on 2026-10-23. It reuses the existing `Goal` entity/table, `UserRepository`, and `ActivityLogRepository` date-range query. No Flyway migration is required.

## Included files

- `GoalRepository.java` — owner-scoped lookups and user goal listing.
- `GoalRequest.java` — request DTO and bean validation.
- `GoalResponse.java` — goal CRUD response.
- `GoalProgressResponse.java` — footprint progress, projection, and alerts.
- `GoalService.java` — goal CRUD, calculations, ownership checks, and goal completion transitions.
- `GoalController.java` — JWT-authenticated REST API.
- `GoalServiceTest.java` — service unit tests for creation, validation, listing, ownership, update/delete, projections, future goals, baseline absence, and completed goals.
- `scripts/Test-GoalApi.ps1` — optional authenticated API smoke test for a running local backend.

## REST endpoints (JWT required)

| Method | Path | Behavior |
|---|---|---|
| POST | `/api/goals` | Create an active goal |
| GET | `/api/goals` | List goals owned by the authenticated user |
| GET | `/api/goals/{goalId}` | Retrieve one owned goal |
| PUT | `/api/goals/{goalId}` | Update an active owned goal |
| DELETE | `/api/goals/{goalId}` | Delete an owned goal |
| GET | `/api/goals/{goalId}/progress` | Get baseline/current/target footprint, projection, on-track status, and alerts |

Example JSON request:

```json
{
  "targetReductionPct": 15,
  "periodDays": 30,
  "startDate": "2026-10-23"
}
```

Targets must be from `0.01` through `100` percent; durations must be from 7 through 365 days. `startDate` uses ISO format (`yyyy-MM-dd`). The authenticated JWT subject is resolved to a username, consistent with the existing activity API. Goal lookups are scoped to both goal ID and user ID; a goal belonging to another user returns 404.

## Progress calculation rules

- Goal end date is `startDate + periodDays - 1`.
- Baseline is the sum of `activity_logs.co2e_kg` over the `periodDays` immediately before `startDate`.
- Current footprint is summed from `startDate` through today, capped at the goal end date.
- Target footprint is `baseline * (100 - targetReductionPct) / 100`.
- Projection is a linear estimate from observed average daily emissions; it is not a guarantee.
- A goal that has not started returns a `NOT_STARTED` alert and no projection.
- If no baseline emissions exist, the service returns `BASELINE_UNAVAILABLE`, `onTrack = null`, and no projection instead of claiming the user is on or off track.
- After the goal period ends, the first progress request changes `ACTIVE` to `ACHIEVED` when the baseline exists and current emissions are at or below target; otherwise it changes to `MISSED`.
- Only active goals can be updated.

## Apply to the local repository

Extract this ZIP and merge its `backend/` directory into the repository's `backend/` directory. Preserve existing files and do not replace `Goal.java`, `User.java`, `ActivityLog.java`, `ActivityLogRepository.java`, `UserRepository.java`, `pom.xml`, or migration files.

From PowerShell:

```powershell
cd C:\Projects\CarbonTrack-member2\backend
.\mvnw.cmd test
```

Keep PostgreSQL and Redis running if the existing `BackendApplicationTests` uses the live application context and local database. Review the final test summary; a `BUILD SUCCESS` alone should be paired with test counts and no test errors.

## Optional live API smoke test

Start the backend and obtain a valid JWT for a test user. Then run from the project root (use a second valid user's JWT to test cross-user access):

```powershell
.\scripts\Test-GoalApi.ps1 -JwtToken "YOUR_TEST_USER_JWT"
```

Or supply a second user token:

```powershell
.\scripts\Test-GoalApi.ps1 -JwtToken "YOUR_TEST_USER_JWT" -SecondUserJwtToken "ANOTHER_TEST_USER_JWT"
```

The script creates a temporary goal, checks CRUD/progress/validation, attempts cross-user access if the second token is supplied, and deletes the temporary goal at the end. Use test accounts only.

## Known limitations before merge

- Baseline is calculated from historical activity logs each time. If old activity logs can be edited/deleted, consider snapshotting baseline on goal creation with a schema migration.
- Projection is linear and can fluctuate with a small number of logged days.
- The goal status transition happens when progress is requested after the end date; no background scheduler is included.
- The GitHub connection available during preparation is read-only, so the ZIP must be copied to a feature branch and pushed by an account with write permission.

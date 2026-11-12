# CarbonTrack Milestone 3 API

All endpoints require a valid bearer JWT unless noted otherwise. Existing M1/M2 APIs remain available.

## Activity logging and personal dashboard

The existing activity and analytics APIs power the activity logger and personal dashboard:

- `POST /api/activities` and `GET /api/activities`
- `GET /api/analytics/footprint?period=daily&startDate=YYYY-MM-DD&endDate=YYYY-MM-DD`
- `GET /api/goals` and `GET /api/goals/{id}/progress`

The backend remains the source of truth for CO2e calculations. The React app must not calculate or invent emission factors locally. The activity form's preview multiplies the selected quantity by an emission factor fetched from the backend; the backend recalculates the saved activity.

The personal dashboard uses the activity and goal APIs to show:
- Today's recorded emissions and activity count.
- Week-to-date emissions compared with the same weekdays in the previous week.
- A Recharts category pie and a Recharts daily comparison line chart.
- A calendar-month cumulative total compared with the user's explicit monthly target.
- A goal forecast timeline with observed cumulative emissions, current-pace projection and the goal allowance trajectory. The projection extends the average daily emissions observed so far across the remaining goal period and is labelled as an estimate.

### Personal monthly target

`GET /api/users/me` includes nullable `monthlyTargetKg`. `PUT /api/users/me` accepts `monthlyTargetKg` as a positive decimal in kilograms of CO2e, with up to two decimal places. Sending `null` clears the target. Migration `V10__user_monthly_emissions_target.sql` adds the nullable `users.monthly_target_kg` column. The monthly dashboard compares current calendar-month emissions with this value; it does not infer a target from emission factors or another user's activity.

## Independent privacy controls

`GET /api/users/me` returns `goalVisibility`, `leaderboardOptIn`, `organisationReportingOptIn`, `organisationId` and `organisationName`.

`PUT /api/users/me` accepts these independent booleans:

```json
{
  "goalVisibility": false,
  "leaderboardOptIn": false,
  "organisationReportingOptIn": false
}
```

All sharing switches default to false for new accounts. Existing benchmark consent is not reused as leaderboard consent or internal organisation-report consent.

## Anonymous leaderboard

- `GET /api/leaderboard?from=YYYY-MM-DD&to=YYYY-MM-DD&limit=50`
- Users must explicitly enable `leaderboardOptIn`.
- Only users with activities in the requested date range are ranked.
- Ranking is ascending by date-range CO2e total (lowest first).
- Response contains rank, an HMAC-derived stable alias, total CO2e, the category with the highest contribution, badge names and a habit tip.
- The API never returns account IDs, usernames or email addresses.
- The date range may not exceed two years, and the end date may not be in the future.

Set `LEADERBOARD_SALT` to a long random secret in every deployed environment. Do not commit a production value. Keep the value stable across deployments if aliases must remain stable.

## Organisation reporting

- `POST /api/organisations` body: `{"name":"Example Organisation"}`. The creator becomes `ORG_ADMIN`.
- `POST /api/organisations/me/members` body: `{"email":"employee@example.com"}`. Adds an existing CarbonTrack account that is not already linked to an organisation.
- `GET /api/organisations/me/dashboard?from=YYYY-MM-DD&to=YYYY-MM-DD`
- `GET /api/organisations/me/export.csv?from=YYYY-MM-DD&to=YYYY-MM-DD`

Only an authenticated `ORG_ADMIN` can access the organisation dashboard or export. The organisation scope always comes from the authenticated admin's membership, never a caller-supplied organisation ID.

Adding a member does not imply reporting consent. Employee-level and aggregate organisation figures include only members who separately enabled `organisationReportingOptIn`. Opt-out members are excluded from both views and exports. The organisation-reporting consent is separate from the anonymous public leaderboard and community benchmark settings.

The dashboard returns organisation totals, category totals, month buckets (including zero months in the requested period) and a consent-filtered employee comparison table. The export is CSV and protects text cells against spreadsheet formula injection.

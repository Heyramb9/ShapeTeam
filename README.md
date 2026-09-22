# ShapeTeam

ShapeTeam (formerly OptiTeam) is a multi-tenant workforce optimization application. It combines organization-scoped employee and project data with explainable, constraint-aware team recommendations.

## Local development

Prerequisite: Node.js 20+.

```powershell
npm --prefix backend install
npm --prefix frontend install
npm --prefix backend run build
npm --prefix frontend run build
npm --prefix backend start
```

In another terminal:

```powershell
npm --prefix frontend run dev
```

Open http://localhost:3000.

The first local start seeds a demonstration organization. Sign in with:

- Email: `admin@shapeteam.local`
- Password: `Demo12345!`

Additional demo roles use `hr@shapeteam.local`, `pm@shapeteam.local`, `lead@shapeteam.local`, and `employee@shapeteam.local` with the same password.

After an Organization Admin or HR Manager signs in, ShapeTeam requests an employee dataset when the organization has not imported one yet. The importer accepts `.xlsx`, `.xls`, and `.csv` files up to 20 MB. It recognizes the included `ShapeTeam_Dataset.xlsx` format, validates required columns, removes duplicate employee IDs, replaces previous dataset imports, and maps skills, experience, behavior, availability, workload, project history, and model predictions into organization-scoped workforce profiles. Dataset employees receive non-login internal addresses because the sample workbook does not contain work email addresses.

## Architecture

- `frontend/`: Next.js client, authentication/onboarding, protected role-aware workspace, dashboards, project/team flows, reports, notifications, and settings.
- `backend/`: Express API, session authentication, permission middleware, organization isolation, audit logging, notifications, analytics, reports, and deterministic team optimization.
- `backend/prisma/schema.prisma`: production PostgreSQL data model.
- `backend/data/platform.json`: zero-setup local persistence, created at runtime and excluded from source control.
- `ml-service/`: optional Python decision-tree/A* service. The backend provides a documented deterministic confidence fallback when a trained model is unavailable.

Business logic is isolated in backend services; UI components use the centralized client in `frontend/src/services/api.ts`.

## Security

- Passwords use Node.js `scrypt` with a unique random salt.
- Sessions are signed, expiring HMAC tokens.
- Permissions and organization boundaries are enforced by backend middleware and queries.
- Authentication endpoints are rate limited.
- Password reset, verification, and invitation tokens are random, hashed, single-use, and expiring.
- Team ranking excludes protected personal attributes.
- Important mutations create organization-scoped audit records.

Set a strong `JWT_SECRET` outside local development. Relevant variables:

| Variable | Default |
| --- | --- |
| `PORT` | `5000` |
| `JWT_SECRET` | local development value |
| `SESSION_HOURS` | `12` |
| `FRONTEND_URL` | `http://localhost:3000` |
| `NEXT_PUBLIC_API_URL` | `http://localhost:5000/api` |

## Main API areas

- `/api/auth/*`: signup, login, logout, verification, invitation acceptance, and password recovery.
- `/api/users`, `/api/profile`, `/api/departments`, `/api/organization`: workforce and organization management.
- `/api/projects`, `/api/recommendations`, `/api/teams`: project requirements, ranked alternatives, approvals, feedback, and analysis.
- `/api/dashboard`, `/api/reports/*`: live metrics plus PDF/CSV previews and exports.
- `/api/notifications`, `/api/audit-logs`, `/api/ai-configuration`: operational controls and governance.

## Recommendation formula

Role suitability is normalized to 0–100 and uses organization-configurable weights, initially:

```text
RS(e,r) = 0.30 SM + 0.20 ES + 0.15 BS + 0.15 WS + 0.10 AS + 0.10 DT
```

The engine applies role coverage, employee uniqueness, skill, availability, workload, and team-size constraints before ranking feasible teams. Every result includes score factors, strengths, risks, missing skills, and a suggested action.

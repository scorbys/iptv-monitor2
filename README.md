# IPTV Monitoring Frontend

Frontend application for a hospitality IPTV monitoring system. The UI provides operational dashboards for IPTV channels, Chromecast devices, in-room TVs, notifications, QoS summaries, ML training/feedback, auto-fix history, user management, staff management, and the IPTV Support Assistant chat widget.

The Express backend lives in `backend/` as a separate Git working tree. The Python ML service lives in `backend/ml-service/`.

## Architecture

```text
Browser
  -> Next.js frontend
  -> Express backend API
  -> MongoDB Atlas
  -> FastAPI ML service
  -> Telegram / Gemini / optional Supabase mirror
```

MongoDB Atlas is the source of truth for operational data. Supabase integration, when enabled, is only an optional legacy mirror and should not be treated as the production backup database.

## Tech Stack

- Next.js 16 with App Router
- React 19
- TypeScript
- Tailwind CSS
- Mantine/Radix UI components
- JWT authentication through the Express backend
- MongoDB-backed operational data through backend APIs

## Important Paths

```text
src/app/                         App Router pages
src/components/                  Shared layout and UI components
src/components/pages/            Main feature pages
src/components/AuthContext.tsx   Auth state, login, logout, token verification
middleware.js                    Frontend route guard for deployed Next runtime
backend/                         Express backend repository
backend/ml-service/              FastAPI ML service
```

## Requirements

- Node.js 20 or newer
- npm
- Python 3.11 or 3.12 for the ML service
- Access to MongoDB Atlas or a MongoDB-compatible database
- Local environment files for the frontend, backend, and ML service

Python 3.14 is not recommended for the ML service because some ML dependencies such as NumPy and scikit-learn may not provide stable wheels for it.

## Frontend Environment

Create `.env.local` in the project root:

```env
NEXT_PUBLIC_API_URL=http://localhost:3001
NEXT_PUBLIC_API_BASE_URL=http://localhost:3001
NEXT_PUBLIC_ML_API_URL=http://localhost:3001
JWT_SECRET=change-me-for-local-development
```

For production or Vercel previews, configure environment variables in the deployment platform. Do not commit real secrets such as JWT secrets, API keys, bot tokens, OAuth credentials, or database URLs.

## Local Development

Install dependencies from the root project:

```bash
npm install
```

Run only the frontend:

```bash
npm run dev
```

Open:

```text
http://localhost:3000
```

Run frontend, backend, and ML service together:

```bash
npm run dev:all
```

`dev:all` expects:

- `./.env.local` for the frontend
- `./backend/.env.local` for the backend
- `./backend/ml-service/.env.local` for the ML service

If the ML service is not running, the frontend and backend can still run, but ML model info, training, and prediction features will show degraded/error states.

## Common Commands

```bash
npm run dev             # Next.js development server
npm run dev:turbo       # Next.js development server with Turbopack
npm run dev:all         # Frontend + backend + ML service
npm run build           # Production build
npm run start           # Start the built frontend
```

## Application Flow

1. Users log in through email/password or Google OAuth.
2. The frontend stores the JWT for subsequent API calls.
3. JWT sessions are intentionally limited to 1 hour.
4. AuthContext and route guards restrict pages by role.
5. Monitoring pages read data from the Express backend.
6. The backend reads MongoDB and calls the ML service for ML-specific features.
7. Auto-fix and notification records are stored as history and displayed in ML Dashboard, Notifications, QoS, and device detail pages.

## Main Pages

- `/dashboard` - operational system overview.
- `/channels` - IPTV channel monitoring and channel CSV export.
- `/chromecast` - Chromecast inventory, health, metrics, and CSV export.
- `/hospitality` - in-room TV monitoring and CSV export.
- `/ml-dashboard` - model status, training, prediction, feedback review, pending auto-fix review, and auto-fix analytics.
- `/notifications` - notification and incident list with filtered CSV export.
- `/qos` - QoS summary by FAQ/category, exported as a QoS report.
- `/users` - admin user management.
- `/staff` - staff management and performance.
- `/account` - user profile, password, and avatar settings.
- `/help` - troubleshooting documentation by category.

## Export Behavior

CSV export buttons are scoped to the page or section where they appear:

- Channels export channel rows and channel network metrics.
- Chromecast exports Chromecast rows and backend-provided metrics.
- Hospitality exports in-room TV rows and backend-provided metrics.
- Notifications exports the current notification data using the active filters.
- QoS exports the QoS category summary, including all configured categories for reporting.
- ML Dashboard exports auto-fix analytics from the dashboard header and approved feedback JSON from the feedback section.
- Device detail pages export only that device's auto-fix history.

Exported metrics should reflect backend data. The frontend should not generate random CSV-only metric values.

## ML Training and QoS

Uploading an XLSX training file trains the complaint classification model and recommended-fix mapping in the ML service. It does not directly rewrite the QoS dashboard.

QoS is built from notification records and device/network metrics stored by the backend. A newly trained model can affect future classifications, future recommended fixes, and future notification/auto-fix categories after the backend uses the updated model. Historical QoS rows do not automatically change unless historical notifications are explicitly regenerated or reclassified.

## Deployment

The frontend is prepared for Vercel. For development branch previews:

```bash
git switch dev
git push origin dev
```

Make sure the Vercel project is configured to build preview deployments from `dev`, and that preview/production environment variables are set in Vercel.

The production backend is deployed on a VPS through Docker Compose and Cloudflare Tunnel. The public backend URL is expected through the tunnel/reverse proxy.

## Security Notes

- Frontend pages are role-gated for `admin` and `guest`.
- Sensitive backend endpoints such as ML model management, ML feedback, backup/sync, monitoring consistency, and admin auto-fix routes require an admin JWT.
- Some health/metrics endpoints are intentionally open for Docker, Prometheus, and reverse proxy checks.
- Tokens are still available to frontend JavaScript for legacy cross-domain compatibility, so avoid untrusted third-party scripts.
- MongoDB Atlas is the source of truth. Supabase is an optional legacy mirror, not a production backup.

## Troubleshooting

- Login expires after 1 hour: this is expected by the JWT security policy.
- ML Dashboard shows 500/502: ensure the backend can reach the ML service.
- API returns 401/403: check token, cookie, user role, and `NEXT_PUBLIC_API_URL`.
- `npm run dev:all` fails on ML service: use Python 3.11/3.12 and install ML dependencies.
- Cloudflare `Error 1033`: check the VPS `cloudflared` service and the watchdog/refresh timers.

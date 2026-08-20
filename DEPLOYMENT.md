# PMSD Production Deployment

This release adds restricted lecture delivery, private media storage, Telegram ingestion, session controls, progress tracking, and admin security tooling.

## 1. Infrastructure

Recommended production layout:

```text
Browser
  |
 HTTPS / reverse proxy
  |
  +--> Frontend (Vite build served by CDN/Nginx)
  |
  +--> Backend (Node.js)
          |
          +--> PostgreSQL
          +--> Private media volume/object storage
          +--> Telegram Bot API
```

Never mount `PRIVATE_MEDIA_ROOT` inside a public/static web directory.

## 2. Environment

Set these values in the backend deployment environment:

- `NODE_ENV=production`
- `PORT`
- `DATABASE_URL`
- `JWT_SECRET` — long random secret; rotate deliberately
- `JWT_EXPIRES_IN` — use only if your auth controller is configured to honor it
- `MEDIA_TOKEN_TTL`
- `PRIVATE_MEDIA_ROOT`
- `MAX_PRIVATE_MEDIA_BYTES`
- `FRONTEND_ORIGIN` — one or more exact frontend origins, comma-separated
- `JSON_BODY_LIMIT` (optional; defaults to `1mb`)
- `URLENCODED_BODY_LIMIT` (optional; defaults to `1mb`)
- `TELEGRAM_BOT_TOKEN`
- `TELEGRAM_WEBHOOK_SECRET`

The frontend should set `VITE_API_BASE_URL` to the production API base URL.

## 3. Database

Run migrations in order:

```text
backend/migrations/001_restricted_lecture_platform.sql
backend/migrations/002_telegram_ingestion.sql
backend/migrations/003_learning_security.sql
backend/migrations/004_telegram_webhook_sources.sql
```

Do not skip migrations because later APIs depend on their tables/columns.

## 4. Telegram webhook

Create the bot and add it to the authorized Telegram source/channel with permissions required to receive the relevant channel posts.

Register the webhook through the protected PMSD admin endpoint:

```http
POST /api/telegram/webhook/register
Authorization: Bearer <admin-jwt>
Content-Type: application/json

{
  "webhookUrl": "https://api.example.com/api/telegram/webhook"
}
```

Keep `TELEGRAM_WEBHOOK_SECRET` private. The webhook handler rejects requests with a missing/invalid secret and ignores unapproved Telegram sources.

## 5. Private lecture delivery

Students should never receive a raw Telegram file URL or a filesystem path. The normal flow is:

```text
login -> enrolled course -> lecture access -> signed media token -> private stream
```

Signed media tokens are bound to the student, lecture, and learning session and expire according to `MEDIA_TOKEN_TTL`.

## 6. Operational checks

Before promoting a release:

```bash
cd backend
npm ci
npm run check

cd ../frontend
npm ci
npm run lint
npm run build
```

Health check:

```http
GET /health
```

Then verify in staging:

1. Student registration and login.
2. Student cannot create an admin role.
3. Enrolled student can open a published lecture.
4. Unenrolled user gets `403` for lecture access.
5. Lecture playback supports seeking/range requests.
6. Private media is not reachable through a public static path.
7. Progress resumes after refresh.
8. A third concurrent learning session revokes the oldest active session.
9. Admin can revoke a learning session.
10. Telegram webhook imports only authorized source messages.
11. Auto-publish follows the configured source policy.
12. Failed Telegram imports clean up partially downloaded media.
13. `/health` returns HTTP 200.
14. Production frontend origin is accepted while unrelated origins are rejected by CORS.

## 7. Production storage

For a single server, a dedicated private volume is acceptable. For multiple backend instances, use shared object storage/private media infrastructure and keep the authorization layer in front of it.

Back up PostgreSQL and private media according to the retention policy of the organization that owns the course content.

## 8. Security notes

The platform reduces unauthorized sharing but cannot make browser playback impossible to record. Visible watermarks, session controls, audit logs, and private media delivery are deterrence and traceability controls, not absolute DRM.

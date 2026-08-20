# PMSD Backend — Restricted Lecture Architecture

The backend now supports a controlled lecture-delivery model for course content imported from authorized Telegram sources.

## Core security model

1. A student authenticates with JWT.
2. Course lecture listing requires enrollment (or the admin role).
3. A lecture must be published and within its availability window.
4. `/api/lectures/:id/access` creates a learning session record.
5. `/api/lectures/:id/stream?session=<id>` validates that session and streams the file from `PRIVATE_MEDIA_ROOT`.
6. Private lecture media is never exposed through Express static-file middleware.
7. Access and stream activity are written to `audit_logs`.

## Telegram import

Admins can import a Telegram file into private storage using:

```http
POST /api/telegram/imports
Authorization: Bearer <admin-jwt>
Content-Type: application/json
```

Example payload:

```json
{
  "fileId": "<telegram-file-id>",
  "fileName": "lecture-01.mp4",
  "contentType": "video",
  "telegramChatId": "<chat-id>",
  "telegramMessageId": "12345",
  "moduleId": 1,
  "title": "Introduction to the Course",
  "description": "First lecture",
  "position": 1,
  "durationSeconds": 3600,
  "status": "draft"
}
```

The server retrieves the Telegram file using `TELEGRAM_BOT_TOKEN`, stores it under `PRIVATE_MEDIA_ROOT/telegram/`, records the import, and creates the lecture record. Students receive the PMSD stream endpoint rather than a Telegram URL.

## Database migrations

Run these migrations after the existing PMSD tables are available:

```text
backend/migrations/001_restricted_lecture_platform.sql
backend/migrations/002_telegram_ingestion.sql
```

## Environment

Configure at minimum:

- `DATABASE_URL`
- `JWT_SECRET`
- `PRIVATE_MEDIA_ROOT`
- `TELEGRAM_BOT_TOKEN`

`PRIVATE_MEDIA_ROOT` must not be inside any publicly served directory.

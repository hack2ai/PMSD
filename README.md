# PMSD — Professional Master Skill Development

<p align="center">
  <img src="assets/pmsd-logo.png" width="170" alt="PMSD Logo"/>
</p>

<p align="center"><strong>A production-oriented full-stack Learning Management System (LMS)</strong></p>

PMSD is a React + Node.js/Express + PostgreSQL LMS with JWT authentication, role-based authorization, course enrollment, payments, certificate generation, QR verification, dashboards, and a hardened backend deployment path.

## Technology

- **Frontend:** React 19, React Router, Axios, Vite
- **Backend:** Node.js 22, Express 4
- **Database:** PostgreSQL via `pg`
- **Security:** JWT, bcrypt, Helmet, CORS policy, request correlation, rate limiting, signed payment webhooks
- **Documents:** PDFKit
- **Verification:** QRCode
- **Deployment:** Docker, GitHub Actions

## Architecture

```text
React + Vite
     │
     │ Axios / REST
     ▼
Express API
     │
     ├── Authentication / Authorization
     ├── Courses / Modules / Lectures
     ├── Enrollment / Payments
     ├── Certificates / QR Verification
     ├── Request Context + Structured Logging
     └── Health / Readiness
     │
     ▼
PostgreSQL
```

## Core Features

### Authentication & authorization

- Registration and login
- JWT authentication
- Password hashing with bcrypt
- Role-based access control
- Protected API routes

### Learning management

- Course management
- Modules and lectures
- Enrollment management
- Lecture progress tracking
- Source/lecture access controls

### Payments

- Payment creation and history
- Amount validation
- Payment state-transition validation
- Signed webhook verification
- Payment creation rate limiting

### Certificates

- PDF certificate generation
- Unique certificate numbers
- QR-code verification
- Public certificate verification endpoint

### Production hardening

- Helmet security headers
- Explicit CORS allowlist
- Request IDs / correlation IDs
- Structured request completion logs
- PostgreSQL readiness probe
- Liveness probe
- Graceful HTTP + database shutdown
- Transactional database migrations with concurrency protection
- Production environment validation
- Production Docker image running as non-root
- Automated regression tests in GitHub Actions

## Project Structure

```text
PMSD/
├── assets/
├── backend/
│   ├── database/
│   ├── src/
│   ├── test/
│   ├── Dockerfile
│   ├── .dockerignore
│   ├── .env.example
│   └── package.json
├── frontend/
└── README.md
```

## Backend Setup

### 1. Configure environment

```bash
cd backend
cp .env.example .env
```

Edit `.env` with your local PostgreSQL credentials and a strong JWT secret.

For production, `NODE_ENV=production` requires the database credentials and JWT secret, and rejects invalid ports or wildcard CORS configuration.

### 2. Install dependencies

```bash
npm ci
```

### 3. Run migrations

```bash
npm run migrate
```

### 4. Start development server

```bash
npm run dev
```

### 5. Start production server

```bash
npm start
```

Default backend port is `5001` unless `PORT` is configured.

## Health Endpoints

These endpoints are intentionally public for deployment probes:

```text
GET /health/live
GET /health/ready
```

- `/health/live` confirms the process is alive.
- `/health/ready` checks PostgreSQL and returns `503` when the database is unavailable.

## Docker

Build and run the backend image:

```bash
docker build -t pmsd-backend ./backend
docker run --env-file backend/.env -p 5001:5001 pmsd-backend
```

The production image uses Node.js 22, installs production dependencies with `npm ci --omit=dev`, runs as the non-root `node` user, and probes `/health/live`.

## CI

Backend CI runs on pushes and pull requests affecting `backend/**`. It covers:

- Syntax checks
- Access-policy tests
- Authentication/payment security tests
- Request context and logging
- Health/readiness behavior
- Graceful shutdown
- Dockerfile definition
- Production environment validation
- Migration validation

## API Overview

### Authentication

```text
POST /api/auth/register
POST /api/auth/login
```

### Courses

```text
GET    /api/courses
POST   /api/courses
PUT    /api/courses/:id
DELETE /api/courses/:id
```

### Enrollment

```text
POST /api/enrollments
GET  /api/enrollments
```

### Payments

```text
POST /api/payments
GET  /api/payments
```

### Certificates

```text
POST /api/certificates
GET  /api/certificates
GET  /api/certificates/verify/:certificateNumber
```

## Development Status

### Backend

- [x] Authentication and authorization
- [x] Users
- [x] Courses
- [x] Enrollments
- [x] Payments
- [x] Dashboard
- [x] Certificates
- [x] QR verification
- [x] Production hardening
- [x] CI regression coverage
- [x] Docker runtime

### Frontend

The frontend remains an active workstream. UI completeness should be evaluated from the current frontend implementation rather than treated as complete solely because the backend is production-hardened.

## Release Checklist

Before deploying production:

- [ ] Set `NODE_ENV=production`
- [ ] Configure PostgreSQL credentials
- [ ] Set a strong random `JWT_SECRET` of at least 32 characters
- [ ] Configure explicit `CORS_ORIGINS`
- [ ] Configure payment webhook secrets where applicable
- [ ] Run database migrations
- [ ] Verify `/health/live`
- [ ] Verify `/health/ready`
- [ ] Confirm CI is green
- [ ] Confirm database backups and operational monitoring are configured by the hosting environment

## Developer

**Pankaj Kumar** — B.Tech, Computer Science Engineering

Focus areas: Full-stack development, React, Node.js, Express, PostgreSQL, REST APIs, authentication, and application security.

## License

This project is developed for educational, learning, and portfolio purposes.


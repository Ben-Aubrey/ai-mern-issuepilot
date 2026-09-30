# IssuePilot

IssuePilot is an AI-powered issue and project management platform built incrementally as a portfolio-quality full-stack JavaScript application.

## Tech stack

- Frontend: React, Vite, JavaScript, Tailwind CSS v4, React Router
- Backend: Node.js, Express.js (ES modules)
- Database: MongoDB with Mongoose
- Authentication: bcryptjs password hashes, short-lived JWT access tokens, rotating JWT refresh tokens in an HttpOnly cookie

## Current milestone

**Milestone 2: Authentication.** Registration, login, logout, refresh, current-user lookup, protected frontend routes, and protected API access are implemented. Projects, issues, comments, dashboards, activity history, and AI features are not part of this milestone.

## Requirements and setup

Use Node.js 20.19+ (or 22.12+), npm, and MongoDB Community Server or a hosted MongoDB instance.

1. Start MongoDB. On Windows, start the installed MongoDB service from Services or with `Start-Service MongoDB` in an elevated PowerShell. For a manually managed local instance, create a data directory and run `mongod --dbpath <data-directory>`.
2. Install dependencies from the repository root:

   ```sh
   npm install
   ```

3. Copy `server/.env.example` to `server/.env`. Create two independent random secrets, one for each JWT purpose. From the repository root, run this Node command twice and use the two different outputs:

   ```sh
   node -e "console.log(require('node:crypto').randomBytes(48).toString('base64url'))"
   ```

   Put one output in `AUTH_ACCESS_TOKEN_SECRET` and the other in `AUTH_REFRESH_TOKEN_SECRET`. Keep both secret and do not commit `server/.env`.

4. Copy `client/.env.example` to `client/.env.local` if you need to change the API URL. The default development frontend origin is `http://localhost:5173`, matching `CLIENT_ORIGIN` in the server configuration.

5. Start both apps from the repository root:

   ```sh
   npm run dev
   ```

   Or run either separately with `npm run dev:client` and `npm run dev:server`.

The backend requires `MONGODB_URI` and both JWT secrets. It exits with a clear configuration or connection error instead of starting without a database.

## Environment variables

| Variable | Purpose |
| --- | --- |
| `PORT` | Backend port; defaults to `5000` |
| `MONGODB_URI` | Required application MongoDB connection string |
| `CLIENT_ORIGIN` | Exact allowed browser origin; defaults in the example to `http://localhost:5173` |
| `AUTH_ACCESS_TOKEN_SECRET` | Private signing secret for access tokens; at least 32 characters |
| `AUTH_REFRESH_TOKEN_SECRET` | Separate private signing secret for refresh tokens; at least 32 characters |
| `ACCESS_TOKEN_TTL` | Access JWT lifetime; defaults to `15m` |
| `REFRESH_TOKEN_TTL_DAYS` | Refresh/session lifetime; defaults to `7` and is limited to 1–30 days |
| `BCRYPT_SALT_ROUNDS` | bcrypt work factor; defaults to `12` and is limited to 10–14 |
| `MONGODB_TEST_URI` | Optional test database URI; must end with a database name ending `_test`; otherwise tests use `issuepilot_test` on local MongoDB |
| `VITE_API_BASE_URL` | Frontend API base URL; defaults to `http://localhost:5000/api/v1` |

The backend loads `server/.env`; Vite loads `client/.env.local`. Root and server `.env.example` files contain placeholders only.

## Authentication API

All routes use the `/api/v1` prefix.

| Method | Endpoint | Access | Purpose |
| --- | --- | --- | --- |
| `POST` | `/auth/register` | Public, rate limited | Create a user and session |
| `POST` | `/auth/login` | Public, rate limited | Authenticate and create a session |
| `POST` | `/auth/refresh` | Refresh cookie | Rotate the refresh session and issue a new access token |
| `POST` | `/auth/logout` | Public, idempotent | Revoke the refresh session and clear its cookie |
| `GET` | `/auth/me` | Bearer access token | Return the current user |

The access token is held in frontend memory and sent as a bearer token. Refresh tokens are only stored in an HttpOnly, SameSite=Lax cookie; browser JavaScript cannot read them. New users receive the `user` system role; registration ignores client-supplied role values.

## Tests and quality commands

Start MongoDB and ensure `MONGODB_TEST_URI` points to a disposable database ending in `_test` if you override the default. The test runner checks the database name before connecting and clears that test database after the test run.

```sh
npm run test:server
npm run lint
npm run build
```

Backend tests use Node's built-in test runner and Supertest. They cover registration, validation, duplicate email, login, protected user lookup, refresh rotation and reuse rejection, logout, Origin checks, and safe errors.

## Health endpoint

`GET http://localhost:5000/api/v1/health` returns `{"status":"ok"}`.

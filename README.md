# IssuePilot

IssuePilot is an AI-powered issue and project management platform. This repository is being built incrementally as a portfolio-quality full-stack JavaScript application.

## Tech stack

- Frontend: React, Vite, JavaScript, Tailwind CSS v4
- Backend: Node.js, Express.js (ES modules)
- Database: MongoDB with Mongoose

## Current milestone

**Milestone 1: Initial project foundation.** This milestone provides the frontend scaffold, backend API foundation, environment configuration, and health route. Feature milestones have not started.

## Setup

Requirements: Node.js 20.19+ (or 22.12+) and npm. MongoDB is optional for the current health endpoint; set up a local or hosted MongoDB instance before adding database-backed features.

1. Install dependencies from the repository root:

   ```sh
   npm install
   ```

2. Copy `server/.env.example` to `server/.env` and `client/.env.example` to `client/.env.local`, then edit values if needed. No real secrets are required at this milestone.

3. Start both applications:

   ```sh
   npm run dev
   ```

   Or start only one:

   ```sh
   npm run dev:client
   npm run dev:server
   ```

The frontend is served by Vite at <http://localhost:5173>. The backend listens at <http://localhost:5000> by default.

## Environment variables

| Variable | Used by | Description |
| --- | --- | --- |
| `PORT` | Backend | API port; defaults to `5000` |
| `MONGODB_URI` | Backend | MongoDB connection string; optional for the current health-only server |
| `VITE_API_BASE_URL` | Frontend | API base URL; defaults are documented in `.env.example` |

The server loads `server/.env`. Vite loads `client/.env.local`. The root `.env.example` is a combined reference for the variable names. Environment files are ignored by Git; commit only example files with placeholders.

## Health endpoint

`GET http://localhost:5000/api/v1/health` returns:

```json
{"status":"ok"}
```

The health route reports that the HTTP API is responding. It does not currently check MongoDB connectivity.

## Scripts

- `npm run dev` — run frontend and backend together
- `npm run dev:client` — run the Vite frontend
- `npm run dev:server` — run the Express API with nodemon
- `npm run build` — build the frontend for production
- `npm run lint` — run configured frontend linting and backend JavaScript syntax checks

# Engineering Rules

- Use JavaScript only. Do not add TypeScript files, syntax, or tooling.
- Keep frontend code in `client/` and backend code in `server/`.
- Keep server configuration, database connection handling, routing, and error handling in focused modules.
- Validate external input at application boundaries; never trust request data.
- Keep secrets in local environment files. Never commit real credentials or tokens.
- Return safe API errors; do not expose stack traces or secret values to clients.
- Prefer small, clearly named modules and avoid unnecessary dependencies or abstractions.
- Keep UI responsive and accessible as features are added.
- Add tests alongside feature milestones when requested by the project plan.

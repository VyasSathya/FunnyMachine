# Port Configuration

This document lists the network ports used by the different components of the FunnyMachine project.

| Component                | Default Port | Configuration File(s)                                        | Notes                                    |
| ------------------------ | ------------ | ------------------------------------------------------------ | ---------------------------------------- |
| Frontend (React App)     | 5173         | `comedy-construction-engine/.env` (PORT variable)            | Changed from default 3000 to avoid conflict |
| Main API Server          | 3000         | `api/src/server.ts` (or PORT env var)                        |                                          |
| Comedy Engine Server     | 3001         | `comedy-construction-engine/server/server.js`                | Hardcoded                                |
| PostgreSQL Database      | 5432         | `api/src/db/index.ts`, `api/src/db/setup.ts` (or DB_PORT env var) | Standard PostgreSQL port                 |
| Redis                    | 6379         | `api/src/config/redis.ts`, `api/src/middleware/rateLimiter.ts` | Standard Redis port                      | 
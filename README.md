# DoubleVerify Assignment – ATM System API

REST API for ATM-style **balance**, **withdraw**, and **deposit** operations. Built with Node.js, TypeScript, and Express. Storage is **in-memory** (demo / assignment scope).

Agent / contributor implementation notes: [`AGENTS.md`](AGENTS.md). Interview write-up: [`SUBMISSION.md`](SUBMISSION.md).

## Quick start

**Prerequisites:** Node.js 18+, npm 8+.

```bash
git clone https://github.com/danielnachumdev/doubleverify-assignment.git
cd doubleverify-assignment
npm ci
npm run build
npm run dev
```

API: `http://localhost:3000`

Seed demo accounts (required before using the canned numbers below):

```bash
curl -X POST http://localhost:3000/seed
```

### Docker

```bash
docker compose up --build
```

## API

Base URL (local): `http://localhost:3000` (HTTP).

### Seed & info

| Method | Path | Purpose |
| ------ | ---- | ------- |
| `GET` | `/` | API info + seed status |
| `POST` | `/seed` | Initialize demo accounts |
| `GET` | `/seed` | Seed status |
| `GET` | `/health` | Liveness-style health |
| `GET` | `/ready` | Readiness probe |
| `GET` | `/live` | Liveness probe |

### Accounts

#### Create account

```http
POST /accounts
Content-Type: application/json

{ "account_number": "123456789", "initial_balance": 1000.00 }
```

Success `201`:

```json
{
  "account_number": "123456789",
  "balance": 1000.0,
  "transaction": "account_created",
  "timestamp": "2024-01-15T10:30:00.000Z"
}
```

#### Balance

```http
GET /accounts/{account_number}/balance
```

```json
{
  "account_number": "123456789",
  "balance": 1000.0
}
```

#### Withdraw

```http
POST /accounts/{account_number}/withdraw
Content-Type: application/json

{ "amount": 100.00 }
```

```json
{
  "account_number": "123456789",
  "balance": 900.0,
  "transaction": "withdrawal",
  "amount": 100.0
}
```

#### Deposit

```http
POST /accounts/{account_number}/deposit
Content-Type: application/json

{ "amount": 500.00 }
```

```json
{
  "account_number": "123456789",
  "balance": 1400.0,
  "transaction": "deposit",
  "amount": 500.0
}
```

### Demo accounts (after `POST /seed`)

| Account | Starting balance |
| ------- | ---------------- |
| `123456789` | 1000.00 |
| `987654321` | 2500.50 |
| `555666777` | 100.25 |
| `111222333` | 5000.00 |
| `999888777` | 750.75 |

Account numbers must be **6–12 digits**.

### Typical status codes

| Code | Meaning |
| ---- | ------- |
| 200 / 201 | Success |
| 400 | Validation / insufficient funds / duplicate account |
| 404 | Account not found |
| 500 | Unexpected server error |

## Scripts

```bash
npm run dev              # Development server (ts-node)
npm run dev:watch        # Auto-reload
npm run build            # Compile TypeScript → dist/
npm start                # Production process (needs build)
npm test                 # Jest
npm run test:coverage    # Coverage (90% lines/functions/statements; 85% branches)
npm run test:unit
npm run test:integration
```

More testing detail: [`docs/TESTING.md`](docs/TESTING.md).

## Layout

```
src/           # Express app, models, services, routes, middleware
tests/         # Jest unit / route / e2e suites
docs/          # Extra deployment & testing notes
scripts/       # Coverage / report helpers
Dockerfile
docker-compose.yml
```

## Design (short)

- Layers: routes → validation middleware → `AccountService` → in-memory `DataStore`
- TypeScript throughout; centralized error middleware
- Docker image + optional nginx sidecar in Compose for demo deploys

EC2 notes (optional): [`docs/EC2_DEPLOYMENT.md`](docs/EC2_DEPLOYMENT.md).

## Environment

| Variable | Default | Notes |
| -------- | ------- | ----- |
| `PORT` | `3000` | Listen port |
| `NODE_ENV` | `development` | Use `test` under Jest so the server does not bind |
| `API_VERSION` | `1.0.0` | Reported in health / root |
| `CORS_ORIGIN` | `*` | Documented; CORS middleware currently allows all origins |
| `LOG_LEVEL` | `info` | Reserved for logging config |
| `HEALTH_CHECK_PATH` | `/health` | Health route path |

## License

MIT (see `package.json` `license` field).

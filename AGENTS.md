# DoubleVerify Assignment – Agent Context

Implementation guide for coding agents changing this **ATM REST API** assignment. Product pitch and user-facing setup: [`README.md`](README.md). Interview write-up: [`SUBMISSION.md`](SUBMISSION.md).

---

## Orientation

| Question | Answer |
| -------- | ------ |
| What is this? | Node.js + TypeScript + Express REST API simulating ATM ops (balance, withdraw, deposit) |
| App entry | `src/server.ts` (compiled → `dist/server.js`) |
| Toolchain | npm + `package.json` / `package-lock.json`; TypeScript (`tsconfig.json`) |
| Runtime | Node.js **≥18**, npm **≥8** |
| Storage | In-memory singleton `DataStore` — **not** persisted; seed via `POST /seed` |
| Tests | Jest + Supertest under `tests/`; coverage floors in `package.json` (lines/functions/statements **90%**, branches **85%**) |
| Secrets | None required for local run. Do not invent OAuth/DB credentials. Never commit real host IPs, tokens, or live customer data in docs/PRs |

```text
.
├── src/
│   ├── models/          # Account + AccountValidator
│   ├── services/        # AccountService, DataStore (singleton Map)
│   ├── routes/          # /accounts handlers
│   ├── middleware/      # Validation + error handling
│   └── server.ts        # App wiring, /health, /seed, probes
├── tests/               # unit / routes / services / middleware / e2e
├── docs/                # EC2_DEPLOYMENT.md, TESTING.md
├── scripts/             # coverage-analysis, test-report helpers
├── Dockerfile
├── docker-compose.yml
├── nginx.conf
├── package.json
├── README.md            # Marketing / user docs
├── SUBMISSION.md        # Assignment narrative
└── AGENTS.md            # This file
```

Shared CI/CD (when workflows land on `main`): [`danielnachumdev/actions`](https://github.com/danielnachumdev/actions) (`@latest` / `@v1` per HOW-TO). Adopt guide: [`HOW-TO-USE.md`](https://github.com/danielnachumdev/actions/blob/v1/HOW-TO-USE.md).

---

## Develop

```bash
npm ci                   # preferred reproducible install
npm run build            # tsc → dist/
npm run dev              # ts-node src/server.ts
npm run dev:watch        # nodemon + ts-node
npm start                # node dist/server.js (after build)
```

| Task | Command |
| ---- | ------- |
| All tests | `npm test` |
| Coverage | `npm run test:coverage` |
| Unit slice | `npm run test:unit` |
| Route/integration slice | `npm run test:integration` |
| Docker | `docker compose up --build` |
| Health smoke | `npm run health:check` (server must be up) |

`npm run lint` is a **stub** (`echo` only) — do not claim ESLint is configured until it is.

Set `NODE_ENV=test` in Jest runs so `server.ts` does not bind a listening port (app is still `export default app`).

### Dependencies

- **Runtime:** `express`, `cors`
- **Dev:** `typescript`, `ts-node`, `nodemon`, `jest`, `ts-jest`, `supertest`, type packages, `rimraf`
- Prefer editing floors via Dependabot / `npm audit` rather than inventing unused frameworks (DB, auth, OpenAPI) unless the user asks

---

## Domain notes (keep these accurate)

- **Account numbers:** digits only, length **6–12** (`AccountValidator.isValidAccountNumber`).
- **Balances / amounts:** finite numbers; balance ≥ 0; withdraw/deposit amounts must be positive (see validation middleware + service errors).
- **DataStore** is a process-local singleton. Accounts are **not** auto-seeded on boot — call `POST /seed` (or create via `POST /accounts`). Demo seed set includes `123456789` @ `1000.00`, etc.
- **Withdraw/deposit JSON responses** use `{ account_number, balance, transaction, amount }` — not `withdrawn_amount` / `new_balance`.
- **Health** (`GET /health` by default): `{ status: "OK", message, timestamp, uptime, environment, version, memory, system }`. Also `/ready` and `/live`.
- **Create account:** `POST /accounts` with `{ account_number, initial_balance }` → `201` + `transaction: "account_created"`.
- Keep layers: routes → middleware validation → `AccountService` → `DataStore` / `Account` model. Prefer extending existing error classes (`AccountNotFoundError`, `InsufficientFundsError`, …) over ad-hoc strings.

---

## PRs, CI, and releases

1. Branch off `main`; open a PR into `main`.
2. Attach **exactly one** semver label: `noBump` | `bumpPatch` | `bumpMinor` | `bumpMajor`.
3. When CI workflows are present: prefer required checks **`CI / CI`** and **`Semver / Semver`** from thin wrappers over `danielnachumdev/actions`. Change shared behavior there, not by re-vendoring.
4. Dependabot PRs stay on `noBump`.
5. This is an **assignment / demo** repo — no PyPI/npm publish path; do not add a local publish script unless asked.
6. Do not commit or push unless the user asks.

---

## Sensitive / ignored

Do not commit: `.env`, API keys, `node_modules/`, `dist/`, `coverage/`, real deployment IPs/hostnames in docs, or personal banking data. Respect `.gitignore`.

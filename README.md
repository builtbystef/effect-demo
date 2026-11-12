# Relay CRM

A small CRM — companies, contacts, a deal pipeline and an activity timeline —
built end to end with [Effect](https://effect.website): an Effect `HttpApi`
server on Postgres, a React app that derives its typed client from the same
contract, and infrastructure declared with [Alchemy](https://alchemy.run) and
run on Docker. [Vite+](https://viteplus.dev) (`vp`) handles dependencies,
formatting, linting, type checking, tests, and builds.

```sh
vp install
pnpm dev            # Postgres in Docker + API + web, with demo data
```

Open http://localhost:5173. API docs are at http://localhost:3000/api/docs.

## Requirements

- Node ≥ 24 (pinned in `.node-version`, enforced at install)
- Docker (Docker Desktop, OrbStack, Colima or Podman via `DOCKER_BIN`)

## Layout

```text
alchemy.run.ts          # infrastructure: Postgres, dev processes, app container
Dockerfile              # production image: API + built web app
packages/domain         # schemas + the HttpApi contract (CrmApi), shared by both apps
apps/server             # Effect HttpApi on Node + @effect/sql-pg
  src/db/               #   client, migrations, demo seed, row helpers
  src/<entity>/         #   one folder per resource: Repo (SQL) + Http (handlers)
apps/web                # React 19 + Vite
  src/routes/           #   pages (TanStack Router, file-based, code-split)
  src/features/<x>/     #   per-entity atoms, forms, tables, widgets
  src/components/ui/    #   design system primitives (Base UI + cva + Tailwind)
  src/components/form/  #   TanStack Form kit bound to the design system
  src/lib/              #   API client, formatting, theme, form schemas
  src/styles/           #   design tokens (light/dark) and global CSS
```

## Stack

| Concern        | Choice                                                                               |
| -------------- | ------------------------------------------------------------------------------------ |
| API            | `effect/http-api` — one contract, server + typed client, OpenAPI                     |
| Database       | Postgres 18, `@effect/sql-pg`, migrations via `PgMigrator`                           |
| Infrastructure | Alchemy v2 (`alchemy`, `@alchemy.run/docker`)                                        |
| Routing        | TanStack Router (file-based, typed params and search)                                |
| Data fetching  | `@effect/atom-react` + `AtomHttpApi`, reactivity-key invalidation                    |
| Tables         | TanStack Table v9 (sorting, global search)                                           |
| Forms          | TanStack Form, validated by Effect Schema through Standard Schema                    |
| UI primitives  | Base UI, Tailwind CSS v4, `class-variance-authority`, `tailwind-merge`, Lucide icons |

## Infrastructure (Alchemy)

`alchemy.run.ts` is one Effect program describing every stage:

| Command        | What runs                                                                                                                                                                      |
| -------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `pnpm dev`     | `alchemy dev`: Postgres container (host port 54320), plus the API (`:3000`) and Vite (`:5173`) as local processes with hot reload. Seeds demo data into an empty database.     |
| `pnpm deploy`  | `alchemy deploy`: Postgres, plus the app image built from `Dockerfile` and run as a hardened container (non-root, read-only rootfs, all caps dropped, healthcheck) on `:8080`. |
| `pnpm destroy` | `alchemy destroy`: removes the stage's containers, image, network and data volume.                                                                                             |

Each stage (`--stage <name>`, default per user) gets its own containers,
network and volume. The database password is generated once per stage and kept
in Alchemy state under `.alchemy/` (git-ignored). Override ports with
`CRM_DB_PORT` and `CRM_APP_PORT`.

### Server configuration

| Variable            | Default | Purpose                                   |
| ------------------- | ------- | ----------------------------------------- |
| `DATABASE_URL`      | —       | Postgres connection string (required)     |
| `PORT`              | `3000`  | HTTP port                                 |
| `DATABASE_POOL_MAX` | `10`    | Connection pool size                      |
| `STATIC_DIR`        | unset   | Serve the built web app from here (SPA)   |
| `SEED_DEMO_DATA`    | `false` | Seed demo data when the database is empty |

`GET /healthz` checks that the process is up and Postgres answers.

## Commands

```sh
vp install          # install dependencies
vp check            # format + lint + typecheck in one pass
vp check --fix
vp test             # Vitest
vp run -r build     # dependency-aware, cached task runner
vp run ci           # everything CI runs
```

A pre-commit hook (`.vite-hooks/`) runs `vp check --fix` on staged files. Run
`vp config` once after cloning to activate it.

## Supply-chain policy

Defined in `pnpm-workspace.yaml`:

- `minimumReleaseAge: 5760`: new versions must be ≥ 4 days old before resolving
- `strictDepBuilds` + `allowBuilds: {}`: no dependency runs lifecycle scripts
  until explicitly reviewed and listed
- `blockExoticSubdeps`: transitive deps must come from the registry
- `trustPolicy: no-downgrade`: publisher trust levels may not regress
- `verifyDepsBeforeRun`: scripts never run against a stale tree
- `engineStrict`: Node version mismatch fails instead of warning

Alchemy v2 is in beta, so its packages are pinned to an exact version in the
catalog; bump `alchemy` and `@alchemy.run/docker` together.

## License

[MIT](LICENSE) © builtbystef

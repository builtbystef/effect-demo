# Effect Demo

A todo app built on the Carbon Fiber template: an [Effect](https://effect.website)
HTTP API on the backend, React + Effect atoms + Tailwind on the frontend.
[Vite+](https://viteplus.dev) (`vp`) handles dependencies, formatting, linting,
type checking, tests, and builds.

```text
packages/domain   # shared Todo schemas + the HttpApi contract (TodosApi)
apps/server       # Effect HttpApi server on Node, in-memory TodoRepo (:3000)
apps/web          # Vite + React + @effect/atom-react + Tailwind (:5173)
```

The web app derives a typed client from `TodosApi` with `AtomHttpApi`, and the
Vite dev server proxies `/api` to the backend. API docs are served at
`http://localhost:3000/api/docs`.

```sh
vp install
vp run dev          # starts server and web in parallel
```

## Requirements

- Node ≥ 24 (pinned in `.node-version`, enforced at install)

## Commands

```sh
vp install          # install dependencies
vp add / remove     # change dependencies
vp check            # format + lint + typecheck in one pass
vp check --fix
vp test             # Vitest
vp run -r build     # dependency-aware, cached task runner
vp run ci           # everything CI runs
```

A pre-commit hook (`.vite-hooks/`) runs `vp check --fix` on staged files.
Only the hook itself is tracked; the shims and `core.hooksPath` are local to
each clone, so run `vp config` once after cloning to activate it.

## Adding projects

Drop projects into `apps/*`, `packages/*`, or `tools/*`; the workspace globs
already cover them. Each project extends a TypeScript preset from `tsconfig/`:

```text
tsconfig/
├── base.json      # shared strictness (never extended directly)
├── node.json      # Node apps, CLIs, workers
├── browser.json   # browser apps with DOM libs
└── library.json   # published packages with declarations + maps
```

```json
{
  "extends": "../../tsconfig/node.json",
  "compilerOptions": { "outDir": "./dist" },
  "include": ["src"]
}
```

Shared dev dependency versions come from the catalog in `pnpm-workspace.yaml`
(`"typescript": "catalog:"` etc.). Libraries build with `"build": "vp pack"`
(ESM, declarations, and source maps, configured once in the root
`vite.config.ts`). A project only adds its own `vite.config.ts` when it needs
runtime-specific behavior; a `build` script can also be anything else
(`wrangler deploy`, `tsc -p .`) and `vp run -r build` still orchestrates it.

## Supply-chain policy

Defined in `pnpm-workspace.yaml`:

- `minimumReleaseAge: 5760`: new versions must be ≥ 4 days old before resolving
- `strictDepBuilds` + `allowBuilds: {}`: no dependency runs lifecycle scripts
  until explicitly reviewed and listed
- `blockExoticSubdeps`: transitive deps must come from the registry
- `trustPolicy: no-downgrade`: publisher trust levels may not regress
- `verifyDepsBeforeRun`: scripts never run against a stale tree
- `engineStrict`: Node version mismatch fails instead of warning

CI (`.github/workflows/ci.yml`) uses least-privilege permissions, SHA-pinned
actions, and a frozen lockfile. `setup-vp` installs Vite+, Node, and pnpm and
caches the store; the `vp run` task cache is restored and saved around the
build. Dependabot runs weekly with a 4-day cooldown matching
`minimumReleaseAge`.

## License

[MIT](LICENSE) © builtbystef

import { defineConfig } from "drizzle-kit";

// `pnpm db:generate` diffs `src/db/schema.ts` against the last snapshot and
// writes the next migration to `drizzle/`. The server applies pending
// migrations on startup.
export default defineConfig({
  dialect: "postgresql",
  schema: "./src/db/schema.ts",
  out: "./drizzle",
});

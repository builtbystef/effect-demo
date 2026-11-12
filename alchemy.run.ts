import * as Docker from "@alchemy.run/docker";
import * as Alchemy from "alchemy";
import * as Command from "alchemy/Command";
import * as Output from "alchemy/Output";
import * as Config from "effect/Config";
import * as Effect from "effect/Effect";
import * as Layer from "effect/Layer";
import * as Redacted from "effect/Redacted";

/*
 * Infrastructure for the CRM, as one Effect program.
 *
 *   alchemy dev      Postgres in Docker, plus the API and the Vite dev server
 *                    as local processes with hot reload. Demo data is seeded.
 *   alchemy deploy   Postgres in Docker, plus the whole app built into one
 *                    image (API + static web) and run as a container.
 *   alchemy destroy  Removes every container, image, network and volume the
 *                    stage created, including the database volume.
 *
 * Each stage (`--stage <name>`, default per-user) gets its own containers,
 * network and data volume, so dev and prod can run side by side.
 */

const DB_USER = "crm";
const DB_NAME = "crm";

export default Alchemy.Stack(
  "Crm",
  {
    providers: Layer.mergeAll(Docker.providers(), Command.providers(), Alchemy.RandomProvider()),
    state: Alchemy.localState(),
  },
  Effect.gen(function* () {
    const dev = yield* Alchemy.ALCHEMY_DEV;
    const dbPort = yield* Config.Port("CRM_DB_PORT").pipe(Config.withDefault(54320));
    const appPort = yield* Config.Port("CRM_APP_PORT").pipe(Config.withDefault(8080));

    // ─── Postgres ────────────────────────────────────────────────────────────

    const password = yield* Alchemy.makeRandom("DbPassword", { bytes: 24 });
    const network = yield* Docker.Network("Network");
    const data = yield* Docker.Volume("PgData");
    const postgresImage = yield* Docker.RemoteImage("PostgresImage", {
      name: "postgres",
      tag: "18-alpine",
    });

    const postgres = yield* Docker.Container("Postgres", {
      image: postgresImage,
      environment: {
        POSTGRES_USER: DB_USER,
        POSTGRES_DB: DB_NAME,
        POSTGRES_PASSWORD: password,
      },
      // Postgres 18 images keep data under a versioned subdirectory of this.
      volumes: [{ hostPath: data.name, containerPath: "/var/lib/postgresql" }],
      networks: [{ name: network.name, aliases: ["postgres"] }],
      // Only published to the host in dev, where the API runs outside Docker.
      ports: dev ? [{ external: dbPort, internal: 5432 }] : [],
      healthcheck: {
        cmd: ["CMD-SHELL", `pg_isready -U ${DB_USER} -d ${DB_NAME}`],
        interval: "2 seconds",
        timeout: "3 seconds",
        retries: 15,
      },
      restart: "unless-stopped",
      start: true,
    });

    const databaseUrl = (host: string, port: number) =>
      Output.map(password, (secret) =>
        Redacted.make(`postgres://${DB_USER}:${Redacted.value(secret)}@${host}:${port}/${DB_NAME}`),
      );

    // ─── Dev: local processes ────────────────────────────────────────────────

    if (dev) {
      const api = yield* Command.Dev("Api", {
        command: "pnpm run dev",
        cwd: "apps/server",
        port: 3000,
        env: {
          DATABASE_URL: databaseUrl("localhost", dbPort),
          SEED_DEMO_DATA: "true",
          // Make the dependency explicit so the API restarts with the database.
          POSTGRES_CONTAINER: postgres.name,
        },
      });

      const web = yield* Command.Dev("Web", {
        command: "pnpm run dev",
        cwd: "apps/web",
        waitForUrl: true,
        env: { API_URL: api.url },
      });

      return { web: web.url, api: api.url, docs: Output.interpolate`${api.url}/api/docs` };
    }

    // ─── Deploy: one app container ───────────────────────────────────────────

    const image = yield* Docker.Image("AppImage", {
      build: { context: ".", dockerfile: "Dockerfile" },
    });

    const app = yield* Docker.Container("App", {
      image,
      environment: {
        DATABASE_URL: databaseUrl("postgres", 5432),
        STATIC_DIR: "/app/public",
        PORT: "3000",
      },
      ports: [{ external: appPort, internal: 3000 }],
      networks: [{ name: network.name }],
      healthcheck: {
        cmd: ["CMD", "wget", "-q", "-O", "/dev/null", "http://127.0.0.1:3000/healthz"],
        interval: "10 seconds",
        timeout: "3 seconds",
        retries: 3,
        startPeriod: "20 seconds",
      },
      init: true,
      readOnlyRootFilesystem: true,
      noNewPrivileges: true,
      capDrop: ["ALL"],
      memory: "512m",
      restart: "unless-stopped",
      start: true,
    });

    return {
      url: `http://localhost:${appPort}`,
      docs: `http://localhost:${appPort}/api/docs`,
      container: app.name,
    };
  }),
);

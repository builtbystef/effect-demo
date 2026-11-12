import { CrmApi } from "@app/domain";
import { NodeHttpServer, NodeServices } from "@effect/platform-node";
import { createServer } from "node:http";
import { sql } from "drizzle-orm";
import { Config, Effect, Layer, Option } from "effect";
import { HttpRouter, HttpServerResponse, HttpStaticServer } from "effect/http";
import { HttpApiBuilder, HttpApiScalar } from "effect/http-api";
import { ActivitiesHttp } from "./activities/ActivitiesHttp.ts";
import { CompaniesHttp } from "./companies/CompaniesHttp.ts";
import { ContactsHttp } from "./contacts/ContactsHttp.ts";
import { DashboardHttp } from "./dashboard/DashboardHttp.ts";
import { Db } from "./db/Database.ts";
import { DealsHttp } from "./deals/DealsHttp.ts";

const ApiRoutes = HttpApiBuilder.layer(CrmApi, { openapiPath: "/api/openapi.json" }).pipe(
  Layer.provide([CompaniesHttp, ContactsHttp, DealsHttp, ActivitiesHttp, DashboardHttp]),
);

const DocsRoute = HttpApiScalar.layer(CrmApi, { path: "/api/docs" });

/** Liveness + readiness in one: the process is up and Postgres answers. */
const HealthRoute = HttpRouter.add(
  "GET",
  "/healthz",
  Effect.gen(function* () {
    const db = yield* Db;
    yield* db.execute(sql`SELECT 1`);
    return HttpServerResponse.text("ok");
  }).pipe(
    Effect.catch(() => Effect.succeed(HttpServerResponse.text("unavailable", { status: 503 }))),
  ),
);

/**
 * In production the server also serves the built web app (`STATIC_DIR`), with
 * unknown paths falling back to `index.html` for client-side routing. In dev,
 * Vite serves the app and proxies `/api` here instead.
 */
const StaticRoutes = Layer.unwrap(
  Effect.gen(function* () {
    const root = yield* Config.option(Config.String("STATIC_DIR"));
    return Option.match(root, {
      onNone: () => Layer.empty,
      onSome: (root) =>
        HttpStaticServer.layer({ root, spa: true, cacheControl: "public, max-age=300" }),
    });
  }),
);

const Listener = Layer.unwrap(
  Effect.gen(function* () {
    const port = yield* Config.Port("PORT").pipe(Config.withDefault(3000));
    return NodeHttpServer.layer(createServer, { port });
  }),
);

export const HttpLive = HttpRouter.serve(
  Layer.mergeAll(ApiRoutes, DocsRoute, HealthRoute, StaticRoutes),
).pipe(Layer.provide(Listener), Layer.provide(NodeServices.layer));

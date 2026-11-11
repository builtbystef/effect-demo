import { createServer } from "node:http";
import { TodosApi } from "@app/domain";
import { NodeHttpServer, NodeRuntime } from "@effect/platform-node";
import { Config, Effect, Layer } from "effect";
import { HttpRouter } from "effect/http";
import { HttpApiBuilder, HttpApiScalar } from "effect/http-api";
import { DbLive } from "./Db.ts";
import { TodoRepo } from "./TodoRepo.ts";

const TodosHandlers = HttpApiBuilder.group(
  TodosApi,
  "todos",
  Effect.fn(function* (handlers) {
    const repo = yield* TodoRepo;

    return handlers.handleAll({
      list: () => repo.list,
      create: ({ payload }) => repo.create(payload.title),
      update: ({ params, payload }) => repo.update(params.id, payload),
      remove: ({ params }) => repo.remove(params.id),
    });
  }),
).pipe(Layer.provide(TodoRepo.layerSql.pipe(Layer.provide(DbLive))));

const ApiRoutes = HttpApiBuilder.layer(TodosApi, {
  openapiPath: "/api/openapi.json",
}).pipe(Layer.provide(TodosHandlers));

const DocsRoute = HttpApiScalar.layer(TodosApi, { path: "/api/docs" });

const HttpLive = HttpRouter.serve(Layer.mergeAll(ApiRoutes, DocsRoute)).pipe(
  Layer.provide(
    Layer.unwrap(
      Effect.gen(function* () {
        const port = yield* Config.Port("PORT").pipe(Config.withDefault(3000));
        return NodeHttpServer.layer(createServer, { port });
      }),
    ),
  ),
);

Layer.launch(HttpLive).pipe(NodeRuntime.runMain);

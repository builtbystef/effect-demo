import { NodeRuntime } from "@effect/platform-node";
import { Effect, Layer } from "effect";
import { Db } from "./db/Database.ts";
import { seedDemoData } from "./db/seed.ts";
import { HttpLive } from "./Http.ts";

const SeedLive = Layer.effectDiscard(seedDemoData);

const MainLive = HttpLive.pipe(Layer.provide(SeedLive), Layer.provide(Db.layer));

Layer.launch(MainLive).pipe(Effect.orDie, NodeRuntime.runMain);

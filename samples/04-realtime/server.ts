import { ElysiaFactory } from "next-js-backend";
import { AppModule } from "./backend/app.module";
import next from "next";

async function bootstrap() {
  const dev = process.env.NODE_ENV !== "production";
  const nextApp = next({ dev });

  // Prepare next app manually before creating the HTTP server bridge
  await nextApp.prepare();

  // Create the dual-server node bridge, dynamically hiding Elysia on port 0
  const app = ElysiaFactory.createNextJsHandlers(AppModule, nextApp, {
    globalPrefix: "/api",
  });
}

bootstrap();

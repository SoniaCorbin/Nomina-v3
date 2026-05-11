import app from "./app";
import { logger } from "./utils/logger";

const PORT = Number(process.env.PORT) || 3000;

// Note: les en-têtes de sécurité sont posés par `helmet` dans app.ts
// (middleware `securityHeaders`). L'ancien handler maison qui ne faisait
// jamais `next()` a été supprimé.

const server = app.listen(PORT, () => {
  logger.info("Backend started", { url: `http://localhost:${PORT}` });
});

// Shutdown propre — important pour Fly.io / Vercel qui envoient SIGTERM.
const shutdown = (signal: string) => {
  logger.info(`Received ${signal}, shutting down…`);
  server.close((err) => {
    if (err) {
      logger.error("Error during shutdown", { err });
      process.exit(1);
    }
    process.exit(0);
  });
  // Hard timeout après 10s.
  setTimeout(() => process.exit(1), 10_000).unref();
};

process.on("SIGTERM", () => shutdown("SIGTERM"));
process.on("SIGINT", () => shutdown("SIGINT"));

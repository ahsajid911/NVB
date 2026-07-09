import dotenv from "dotenv";
dotenv.config({ path: "../.env.local" });

import app from "./app";

const PORT = process.env.AI_SERVER_PORT || 4000;

const server = app.listen(PORT, () => {
  console.log(`[HealthNav AI Server] Running on http://localhost:${PORT}`);
  console.log(`[HealthNav AI Server] Environment: ${process.env.NODE_ENV || "development"}`);
});

function shutdown(signal: string) {
  console.log(`\n[HealthNav AI Server] ${signal} received. Shutting down gracefully...`);
  server.close(() => {
    console.log("[HealthNav AI Server] Closed.");
    process.exit(0);
  });
  setTimeout(() => {
    console.error("[HealthNav AI Server] Forced shutdown after timeout.");
    process.exit(1);
  }, 5000);
}

process.on("SIGTERM", () => shutdown("SIGTERM"));
process.on("SIGINT", () => shutdown("SIGINT"));

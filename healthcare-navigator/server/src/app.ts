import express from "express";
import cors from "cors";
import helmet from "helmet";
import compression from "compression";
import { generalLimiter } from "./middleware/rateLimit";
import { errorHandler } from "./middleware/errorHandler";
import { requestLogger } from "./middleware/logger";
import aiRoutes from "./routes/ai";
import adminRoutes from "./routes/admin";

const app = express();

app.use(helmet({ contentSecurityPolicy: false }));
app.use(cors({ origin: true, credentials: true }));
app.use(compression());
app.use(express.json({ limit: "1mb" }));
app.use(generalLimiter);
app.use(requestLogger);

app.get("/health", (_req, res) => {
  res.json({ status: "ok", timestamp: new Date().toISOString() });
});

app.use("/api/ai", aiRoutes);
app.use("/api/admin/ai", adminRoutes);

app.use(errorHandler);

export default app;

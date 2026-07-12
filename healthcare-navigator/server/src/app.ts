import express from "express";
import cors from "cors";
import helmet from "helmet";
import compression from "compression";
import { generalLimiter } from "./middleware/rateLimit";
import { errorHandler } from "./middleware/errorHandler";
import { requestLogger } from "./middleware/logger";
import { requireAuth } from "./middleware/auth";
import aiRoutes from "./routes/ai";
import adminRoutes from "./routes/admin";

const app = express();

app.use(helmet({ contentSecurityPolicy: false }));

const allowedOrigins = process.env.ALLOWED_ORIGINS
  ? process.env.ALLOWED_ORIGINS.split(",").map((o) => o.trim())
  : ["http://localhost:3000", "http://localhost:3001"];

app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin || allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        callback(new Error("Not allowed by CORS"));
      }
    },
    credentials: true,
  })
);

app.use(compression());
app.use(express.json({ limit: "1mb" }));
app.use(generalLimiter);
app.use(requestLogger);

app.get("/health", (_req, res) => {
  res.json({ status: "ok", timestamp: new Date().toISOString() });
});

app.use("/api/ai", aiRoutes);
app.use("/api/admin/ai", requireAuth, adminRoutes);

app.use(errorHandler);

export default app;

import "dotenv/config";
import express from "express";
import cors from "cors";
import helmet from "helmet";
import rateLimit from "express-rate-limit";

import uploadsRouter from "./routes/uploads.js";
import feedRouter from "./routes/feed.js";
import searchRouter from "./routes/search.js";
import notificationsRouter from "./routes/notifications.js";
import proposalsRouter from "./routes/proposals.js";
import postsRouter from "./routes/posts.js";

const app = express();
const PORT = process.env.PORT || 4000;
const allowedOrigins = (process.env.CORS_ORIGINS || "http://localhost:5173").split(",").map((o) => o.trim());

app.use(helmet());
app.use(
  cors({
    origin: allowedOrigins,
    credentials: true,
  })
);
app.use(express.json({ limit: "2mb" }));

// Generous global rate limit — heavy per-route limits (e.g. uploads) can be
// layered on individual routers later if needed.
app.use(
  rateLimit({
    windowMs: 60 * 1000,
    limit: 120,
    standardHeaders: true,
    legacyHeaders: false,
  })
);

app.get("/health", (_req, res) => res.json({ ok: true, service: "ferrylance-server" }));

app.use("/api/uploads", uploadsRouter);
app.use("/api/feed", feedRouter);
app.use("/api/search", searchRouter);
app.use("/api/notifications", notificationsRouter);
app.use("/api/proposals", proposalsRouter);
app.use("/api/posts", postsRouter);

app.use((req, res) => {
  res.status(404).json({ error: "Not found" });
});

// eslint-disable-next-line no-unused-vars
app.use((err, req, res, next) => {
  console.error(err);
  res.status(500).json({ error: "Internal server error" });
});

app.listen(PORT, () => {
  console.log(`Ferrylance backend listening on http://localhost:${PORT}`);
});

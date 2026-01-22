import "dotenv/config";
import express from "express";
import cors from "cors";
import helmet from "helmet";
import { pool } from "./db/pool.js";

const app = express();
const PORT = process.env.PORT || 8080;

app.use(helmet());
app.use(express.json({ limit: "256kb" }));

const allowedOrigins = (process.env.CORS_ORIGINS || "")
  .split(",")
  .map(s => s.trim())
  .filter(Boolean);

app.use(
  cors({
    origin: (origin, cb) => {
      // Allow server-to-server and local tools (no origin)
      if (!origin) return cb(null, true);
      if (allowedOrigins.length === 0) return cb(null, true);
      if (allowedOrigins.includes(origin)) return cb(null, true);
      return cb(new Error("CORS blocked: " + origin));
    },
    methods: ["GET", "POST", "PATCH", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"]
  })
);

// Health check (no DB)
app.get("/health", (req, res) => {
  res.json({ ok: true, env: process.env.APP_ENV || "unknown" });
});

// DB health check
app.get("/health/db", async (req, res) => {
  try {
    const r = await pool.query("select now() as now, current_setting('TIMEZONE') as timezone");
    res.json({ ok: true, db_time: r.rows[0].now, db_timezone: r.rows[0].timezone });
  } catch (e) {
    res.status(500).json({ ok: false, error: String(e?.message || e) });
  }
});

app.listen(PORT, () => {
  console.log(`API listening on port ${PORT}`);
});

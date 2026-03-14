import express from "express";
import cors from "cors";

import negociosRouter from "./routes/negocios";
import analisisRouter from "./routes/analisis";
import crmRouter from "./routes/crm";
import exportRouter from "./routes/export";
import osmRouter from "./routes/osm";

const app = express();
const PORT = process.env.PORT ?? 3001;

const allowedOrigins = process.env.FRONTEND_URL
  ? [process.env.FRONTEND_URL, "http://localhost:3000"]
  : ["http://localhost:3000"];

app.use(cors({ origin: allowedOrigins }));
app.use(express.json());

// ─── Routes ──────────────────────────────────────────────

app.use("/api/negocios", negociosRouter);
app.use("/api/analisis", analisisRouter);
app.use("/api/crm", crmRouter);
app.use("/api/export", exportRouter);
app.use("/api/osm", osmRouter);

// ─── Health ──────────────────────────────────────────────

app.get("/api/health", (_req, res) => {
  res.json({ status: "ok", timestamp: new Date().toISOString() });
});

// ─── Start ───────────────────────────────────────────────

app.listen(PORT, () => {
  console.log(`[BotPuroCode] Backend corriendo en http://localhost:${PORT}`);
});

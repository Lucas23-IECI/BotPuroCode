import express from "express";
import cors from "cors";
import helmet from "helmet";

import negociosRouter from "./routes/negocios";
import analisisRouter from "./routes/analisis";
import crmRouter from "./routes/crm";
import exportRouter from "./routes/export";
import osmRouter from "./routes/osm";
import authRouter from "./routes/auth";
import plantillasRouter from "./routes/plantillas";
import propuestasRouter from "./routes/propuestas";
import notificacionesRouter from "./routes/notificaciones";
import automatizacionesRouter from "./routes/automatizaciones";
import activityRouter from "./routes/activity";
import { iniciarCronJobs } from "./cron/jobs";

const app = express();
const PORT = process.env.PORT ?? 3001;

const frontendUrl = process.env.FRONTEND_URL?.replace(/\/+$/, "");
const allowedOrigins = frontendUrl
  ? [frontendUrl, "http://localhost:3000"]
  : ["http://localhost:3000"];

app.use(helmet());
app.use(cors({ origin: allowedOrigins }));
app.use(express.json({ limit: "1mb" }));

// ─── Routes ──────────────────────────────────────────────

app.use("/api/negocios", negociosRouter);
app.use("/api/analisis", analisisRouter);
app.use("/api/crm", crmRouter);
app.use("/api/export", exportRouter);
app.use("/api/osm", osmRouter);
app.use("/api/auth", authRouter);
app.use("/api/plantillas", plantillasRouter);
app.use("/api/propuestas", propuestasRouter);
app.use("/api/notificaciones", notificacionesRouter);
app.use("/api/automatizaciones", automatizacionesRouter);
app.use("/api/activity", activityRouter);

// ─── Health ──────────────────────────────────────────────

app.get("/api/health", (_req, res) => {
  res.json({ status: "ok", timestamp: new Date().toISOString() });
});

// ─── Start ───────────────────────────────────────────────

app.listen(PORT, () => {
  console.log(`[BotPuroCode] Backend corriendo en http://localhost:${PORT}`);
  iniciarCronJobs();
});

export default app;

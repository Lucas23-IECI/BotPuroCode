import PQueue from "p-queue";

// Cola de análisis: máximo 3 concurrentes, 2 seg entre cada uno
export const analisisQueue = new PQueue({
  concurrency: 3,
  interval: 2000,
  intervalCap: 1,
});

analisisQueue.on("active", () => {
  console.log(
    `[Queue] Análisis activo. Pendientes: ${analisisQueue.size} | Ejecutando: ${analisisQueue.pending}`
  );
});

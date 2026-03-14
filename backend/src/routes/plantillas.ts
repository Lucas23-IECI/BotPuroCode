import { Router, Request, Response } from "express";
import { prisma } from "../lib/prisma";
import { requireAuth } from "../middleware/auth";
import { z } from "zod";

const router = Router();

// ─── Listar plantillas ──────────────────────────────────
router.get("/", requireAuth, async (req: Request, res: Response) => {
  const { tipo, categoria } = req.query;
  const where: Record<string, unknown> = { activa: true };
  if (tipo) where.tipo = tipo;
  if (categoria) where.categoria = categoria;

  const plantillas = await prisma.plantilla.findMany({
    where,
    orderBy: { updatedAt: "desc" },
  });
  res.json(plantillas);
});

// ─── Crear plantilla ────────────────────────────────────
const createSchema = z.object({
  nombre: z.string().min(1),
  tipo: z.enum(["WHATSAPP", "EMAIL"]),
  asunto: z.string().optional(),
  cuerpo: z.string().min(1),
  categoria: z.string().optional(),
});

router.post("/", requireAuth, async (req: Request, res: Response) => {
  const parsed = createSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Datos inválidos", details: parsed.error.flatten() });
    return;
  }

  const plantilla = await prisma.plantilla.create({ data: parsed.data });
  res.status(201).json(plantilla);
});

// ─── Actualizar plantilla ───────────────────────────────
router.patch("/:id", requireAuth, async (req: Request, res: Response) => {
  const id = req.params.id as string;
  const { nombre, asunto, cuerpo, categoria, activa } = req.body;

  const plantilla = await prisma.plantilla.update({
    where: { id },
    data: {
      ...(nombre !== undefined && { nombre }),
      ...(asunto !== undefined && { asunto }),
      ...(cuerpo !== undefined && { cuerpo }),
      ...(categoria !== undefined && { categoria }),
      ...(activa !== undefined && { activa }),
    },
  });
  res.json(plantilla);
});

// ─── Eliminar plantilla ─────────────────────────────────
router.delete("/:id", requireAuth, async (req: Request, res: Response) => {
  await prisma.plantilla.delete({ where: { id: req.params.id as string } });
  res.json({ ok: true });
});

// ─── Renderizar plantilla con variables ─────────────────
const renderSchema = z.object({
  plantillaId: z.string(),
  negocioId: z.string(),
});

router.post("/render", requireAuth, async (req: Request, res: Response) => {
  const parsed = renderSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "plantillaId y negocioId requeridos" });
    return;
  }

  const [plantilla, negocio] = await Promise.all([
    prisma.plantilla.findUnique({ where: { id: parsed.data.plantillaId } }),
    prisma.negocio.findUnique({ where: { id: parsed.data.negocioId } }),
  ]);

  if (!plantilla || !negocio) {
    res.status(404).json({ error: "Plantilla o negocio no encontrado" });
    return;
  }

  // Reemplazar variables
  const variables: Record<string, string> = {
    "{nombre}": negocio.nombre,
    "{rubro}": negocio.rubro,
    "{comuna}": negocio.comuna,
    "{ciudad}": negocio.ciudad ?? negocio.comuna,
    "{problema}": negocio.sitioWeb ? "mejorar su presencia web actual" : "crear su primera página web profesional",
    "{seguidores}": negocio.igFollowers ? String(negocio.igFollowers) : "N/A",
    "{rating}": negocio.gmapsRating ? String(negocio.gmapsRating) : "N/A",
    "{url}": negocio.sitioWeb ?? "no tiene web",
    "{instagram}": negocio.instagram ?? "no tiene Instagram",
  };

  let textoRenderizado = plantilla.cuerpo;
  let asuntoRenderizado = plantilla.asunto ?? "";

  for (const [key, value] of Object.entries(variables)) {
    textoRenderizado = textoRenderizado.replaceAll(key, value);
    asuntoRenderizado = asuntoRenderizado.replaceAll(key, value);
  }

  res.json({
    tipo: plantilla.tipo,
    asunto: asuntoRenderizado,
    cuerpo: textoRenderizado,
    whatsappLink: plantilla.tipo === "WHATSAPP" && negocio.whatsapp
      ? `https://wa.me/${negocio.whatsapp.replace(/\D/g, "")}?text=${encodeURIComponent(textoRenderizado)}`
      : null,
  });
});

// ─── Seed plantillas por defecto ────────────────────────
router.post("/seed", requireAuth, async (_req: Request, res: Response) => {
  const count = await prisma.plantilla.count();
  if (count > 0) {
    res.status(400).json({ error: "Ya existen plantillas" });
    return;
  }

  const defaults = [
    {
      nombre: "WhatsApp - Primer contacto (Sin web)",
      tipo: "WHATSAPP" as const,
      cuerpo: `Hola! 👋 Me llamo Lucas de PuroCode. Encontré {nombre} en {comuna} y noté que aún no tienen página web. Hoy en día tener presencia online es clave para que más clientes los encuentren. ¿Les gustaría saber cómo podemos ayudarlos? 🚀`,
      categoria: "primer_contacto",
    },
    {
      nombre: "WhatsApp - Primer contacto (Con IG, sin web)",
      tipo: "WHATSAPP" as const,
      cuerpo: `Hola! 👋 Soy Lucas de PuroCode. Vi su Instagram de {nombre} ({seguidores} seguidores) y se nota que tienen buen contenido. Pero noté que no tienen página web todavía. Con una web profesional podrían convertir esos seguidores en clientes reales. ¿Les interesa saber más?`,
      categoria: "primer_contacto",
    },
    {
      nombre: "WhatsApp - Primer contacto (Web básica)",
      tipo: "WHATSAPP" as const,
      cuerpo: `Hola! 👋 Soy Lucas de PuroCode. Estuve revisando la web de {nombre} ({url}) y noté algunas oportunidades de mejora para atraer más clientes. ¿Les gustaría una evaluación gratuita de su sitio?`,
      categoria: "primer_contacto",
    },
    {
      nombre: "WhatsApp - Seguimiento",
      tipo: "WHATSAPP" as const,
      cuerpo: `Hola! Soy Lucas de PuroCode de nuevo. Hace unos días les comenté sobre {problema} para {nombre}. ¿Tuvieron la oportunidad de pensarlo? Estamos con una promoción este mes 🎉`,
      categoria: "seguimiento",
    },
    {
      nombre: "WhatsApp - Envío propuesta",
      tipo: "WHATSAPP" as const,
      cuerpo: `Hola! Les envío la propuesta para {nombre} como conversamos. Incluye el diagnóstico de su presencia digital actual y la solución que propusimos. Cualquier duda me avisan! 📄`,
      categoria: "propuesta",
    },
    {
      nombre: "Email - Primer contacto",
      tipo: "EMAIL" as const,
      asunto: "Propuesta web para {nombre} - PuroCode",
      cuerpo: `Estimados {nombre},\n\nMi nombre es Lucas Méndez de PuroCode, agencia de desarrollo web en la región del Biobío.\n\nRevisamos la presencia digital de {nombre} en {comuna} y detectamos una oportunidad para {problema}.\n\nEn PuroCode nos especializamos en crear sitios web profesionales que generan resultados reales. Algunos datos:\n- Más del 80% de los clientes busca negocios online antes de visitarlos\n- Una web profesional puede aumentar sus consultas en un 200%\n\n¿Les gustaría agendar una reunión de 15 minutos para mostrarles lo que podemos hacer por {nombre}?\n\nSaludos cordiales,\nLucas Méndez\nPuroCode - purocode.com`,
      categoria: "primer_contacto",
    },
    {
      nombre: "Email - Envío propuesta",
      tipo: "EMAIL" as const,
      asunto: "Propuesta de desarrollo web - {nombre}",
      cuerpo: `Estimados {nombre},\n\nAdjunto encontrarán la propuesta de desarrollo web que conversamos.\n\nIncluye:\n✅ Diagnóstico de su presencia digital actual\n✅ Solución propuesta a medida\n✅ Inversión y plazos\n✅ Garantía y soporte post-lanzamiento\n\nQuedamos atentos a sus comentarios.\n\nSaludos,\nPuroCode`,
      categoria: "propuesta",
    },
  ];

  await prisma.plantilla.createMany({ data: defaults });
  res.status(201).json({ message: `${defaults.length} plantillas creadas` });
});

export default router;

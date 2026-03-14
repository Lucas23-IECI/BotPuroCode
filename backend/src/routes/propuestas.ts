import { Router, Request, Response } from "express";
import { prisma } from "../lib/prisma";
import { requireAuth } from "../middleware/auth";
import { z } from "zod";
import PDFDocument from "pdfkit";

const router = Router();

// Precios PuroCode (CLP)
const PRECIOS: Record<string, { label: string; precio: number }> = {
  landing: { label: "Landing Page", precio: 220000 },
  corporativa: { label: "Web Corporativa", precio: 380000 },
  ecommerce: { label: "E-commerce", precio: 550000 },
};

// ─── Crear propuesta ────────────────────────────────────
const createSchema = z.object({
  negocioId: z.string(),
  tipoServicio: z.enum(["landing", "corporativa", "ecommerce"]),
  descuento: z.number().min(0).max(50).default(0),
  diagnostico: z.string().optional(),
  solucion: z.string().optional(),
});

router.post("/", requireAuth, async (req: Request, res: Response) => {
  const parsed = createSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Datos inválidos", details: parsed.error.flatten() });
    return;
  }

  const { negocioId, tipoServicio, descuento } = parsed.data;
  const negocio = await prisma.negocio.findUnique({
    where: { id: negocioId },
    include: { analisis: { take: 1, orderBy: { createdAt: "desc" } } },
  });

  if (!negocio) {
    res.status(404).json({ error: "Negocio no encontrado" });
    return;
  }

  const precioInfo = PRECIOS[tipoServicio];
  const precioFinal = Math.round(precioInfo.precio * (1 - descuento / 100));
  const lastAnalisis = negocio.analisis[0];

  // Auto-generar diagnóstico si no se provee
  const diagnostico = parsed.data.diagnostico || generarDiagnostico(negocio, lastAnalisis);
  const solucion = parsed.data.solucion || generarSolucion(negocio, tipoServicio);

  const propuesta = await prisma.propuesta.create({
    data: {
      negocioId,
      creadoPorId: req.user?.userId || "system",
      tipoServicio,
      precioBase: precioInfo.precio,
      descuento,
      precioFinal,
      diagnostico,
      solucion,
    },
  });

  res.status(201).json(propuesta);
});

// ─── Listar propuestas de un negocio ────────────────────
router.get("/negocio/:negocioId", requireAuth, async (req: Request, res: Response) => {
  const propuestas = await prisma.propuesta.findMany({
    where: { negocioId: req.params.negocioId as string },
    include: { creadoPor: { select: { nombre: true } } },
    orderBy: { createdAt: "desc" },
  });
  res.json(propuestas);
});

// ─── Actualizar estado ──────────────────────────────────
router.patch("/:id", requireAuth, async (req: Request, res: Response) => {
  const { estado } = req.body;
  const propuesta = await prisma.propuesta.update({
    where: { id: req.params.id as string },
    data: { estado },
  });
  res.json(propuesta);
});

// ─── Generar PDF ────────────────────────────────────────
router.get("/:id/pdf", requireAuth, async (req: Request, res: Response) => {
  const propuesta = await prisma.propuesta.findUnique({
    where: { id: req.params.id as string },
    include: { negocio: true },
  });

  if (!propuesta) {
    res.status(404).json({ error: "Propuesta no encontrada" });
    return;
  }

  const doc = new PDFDocument({ size: "LETTER", margin: 60 });

  res.setHeader("Content-Type", "application/pdf");
  res.setHeader("Content-Disposition", `attachment; filename="propuesta-${propuesta.negocio.nombre.replace(/\s/g, "-")}.pdf"`);
  doc.pipe(res);

  // Header
  doc.fontSize(24).font("Helvetica-Bold").text("PUROCODE", { align: "center" });
  doc.fontSize(10).font("Helvetica").text("Agencia de Desarrollo Web", { align: "center" });
  doc.moveDown(0.5);
  doc.fontSize(10).text("purocode.com | contactopurocode@purocode.com | +56 9 4925 5006", { align: "center" });
  doc.moveDown(1);

  // Línea separadora
  doc.moveTo(60, doc.y).lineTo(550, doc.y).stroke();
  doc.moveDown(1);

  // Título
  doc.fontSize(18).font("Helvetica-Bold").text("Propuesta de Desarrollo Web");
  doc.fontSize(12).font("Helvetica").text(`Preparada para: ${propuesta.negocio.nombre}`);
  doc.text(`Ubicación: ${propuesta.negocio.comuna}${propuesta.negocio.ciudad ? `, ${propuesta.negocio.ciudad}` : ""}`);
  doc.text(`Fecha: ${new Date().toLocaleDateString("es-CL", { year: "numeric", month: "long", day: "numeric" })}`);
  doc.moveDown(1.5);

  // Diagnóstico
  doc.fontSize(14).font("Helvetica-Bold").text("📊 Diagnóstico de Presencia Digital");
  doc.moveDown(0.5);
  doc.fontSize(11).font("Helvetica").text(propuesta.diagnostico, { lineGap: 4 });
  doc.moveDown(1.5);

  // Solución
  doc.fontSize(14).font("Helvetica-Bold").text("🚀 Solución Propuesta");
  doc.moveDown(0.5);
  doc.fontSize(11).font("Helvetica").text(propuesta.solucion, { lineGap: 4 });
  doc.moveDown(1.5);

  // Inversión
  const precioLabel = PRECIOS[propuesta.tipoServicio]?.label ?? propuesta.tipoServicio;
  doc.fontSize(14).font("Helvetica-Bold").text("💰 Inversión");
  doc.moveDown(0.5);

  doc.fontSize(11).font("Helvetica");
  doc.text(`Servicio: ${precioLabel}`);
  doc.text(`Precio base: $${propuesta.precioBase.toLocaleString("es-CL")} CLP`);
  if (propuesta.descuento > 0) {
    doc.text(`Descuento: ${propuesta.descuento}%`);
  }
  doc.moveDown(0.3);
  doc.fontSize(16).font("Helvetica-Bold")
    .text(`Precio final: $${propuesta.precioFinal.toLocaleString("es-CL")} CLP`);
  doc.moveDown(1.5);

  // CTA
  doc.fontSize(14).font("Helvetica-Bold").text("📞 Siguiente Paso");
  doc.moveDown(0.5);
  doc.fontSize(11).font("Helvetica").text(
    "¿Listo para dar el salto digital? Contáctenos para comenzar:\n" +
    "📱 WhatsApp: +56 9 4925 5006\n" +
    "📧 Email: contactopurocode@purocode.com\n" +
    "🌐 Web: purocode.com"
  );

  doc.moveDown(2);
  doc.moveTo(60, doc.y).lineTo(550, doc.y).stroke();
  doc.moveDown(0.5);
  doc.fontSize(9).font("Helvetica").fillColor("gray")
    .text("Este documento fue generado automáticamente por BotPuroCode. Propuesta válida por 30 días.", { align: "center" });

  doc.end();
});

// ─── Helpers ────────────────────────────────────────────

function generarDiagnostico(negocio: any, analisis: any): string {
  const lines: string[] = [];

  lines.push(`Análisis realizado para ${negocio.nombre} (${negocio.rubro}) en ${negocio.comuna}.`);
  lines.push("");

  // Presencia
  const presLabels: Record<string, string> = {
    SIN_WEB: "No se encontró un sitio web para este negocio.",
    SOLO_RRSS: "El negocio solo tiene presencia en redes sociales, sin sitio web propio.",
    LINK_EXTERNO: "El negocio usa una plataforma externa (ej: AgendaPro, Linktree) en lugar de web propia.",
    WEB_BASICA: "El negocio tiene un sitio web básico con oportunidades de mejora significativas.",
    WEB_MEDIA: "El negocio tiene un sitio web funcional pero con áreas de optimización.",
    WEB_BUENA: "El negocio tiene un buen sitio web. Se pueden optimizar detalles específicos.",
  };
  lines.push(`Estado digital: ${presLabels[negocio.estadoPresencia] ?? "Pendiente de evaluación."}`);

  if (negocio.gmapsRating) {
    lines.push(`Rating Google Maps: ${negocio.gmapsRating}/5 (${negocio.gmapsReviews ?? 0} reseñas).`);
  }
  if (negocio.igFollowers) {
    lines.push(`Seguidores Instagram: ${negocio.igFollowers.toLocaleString("es-CL")}.`);
  }

  if (analisis) {
    lines.push("");
    lines.push("Análisis técnico:");
    if (analisis.tieneSSL === false) lines.push("- ⚠️ No tiene certificado SSL (conexión no segura).");
    if (analisis.esResponsive === false) lines.push("- ⚠️ No es responsive (no se adapta a móviles).");
    if (analisis.tieneTitle === false) lines.push("- ⚠️ Sin título SEO en la página.");
    if (analisis.tieneMetaDesc === false) lines.push("- ⚠️ Sin meta descripción para buscadores.");
    if (analisis.performanceScore !== null && analisis.performanceScore < 50) {
      lines.push(`- ⚠️ Rendimiento deficiente (${analisis.performanceScore}/100 en PageSpeed).`);
    }
    if (analisis.tieneFormulario === false) lines.push("- ⚠️ Sin formulario de contacto.");
    if (analisis.tieneCTA === false) lines.push("- ⚠️ Sin llamada a la acción clara.");
  }

  lines.push("");
  lines.push(`Score de oportunidad: ${negocio.score}/100 (${negocio.nivelOportunidad.replace(/_/g, " ")}).`);

  return lines.join("\n");
}

function generarSolucion(negocio: any, tipo: string): string {
  const servicioNombre = PRECIOS[tipo]?.label ?? tipo;
  const lines: string[] = [];

  lines.push(`Propuesta: ${servicioNombre} para ${negocio.nombre}`);
  lines.push("");

  if (tipo === "landing") {
    lines.push("Incluye:");
    lines.push("• Diseño moderno y profesional 100% personalizado");
    lines.push("• Adaptable a todos los dispositivos (responsive)");
    lines.push("• Formulario de contacto integrado");
    lines.push("• Botón de WhatsApp directo");
    lines.push("• Optimización SEO básica");
    lines.push("• Certificado SSL (HTTPS)");
    lines.push("• Hosting y dominio incluidos por 1 año");
    lines.push("• Entrega en 5-7 días hábiles");
  } else if (tipo === "corporativa") {
    lines.push("Incluye:");
    lines.push("• Diseño profesional multi-página (hasta 6 secciones)");
    lines.push("• Adaptable a todos los dispositivos");
    lines.push("• Blog o sección de noticias");
    lines.push("• Galería de fotos/portfolio");
    lines.push("• Formularios de contacto y cotización");
    lines.push("• Integración con redes sociales");
    lines.push("• SEO avanzado + sitemap + robots.txt");
    lines.push("• Google Analytics integrado");
    lines.push("• Hosting y dominio incluidos por 1 año");
    lines.push("• Entrega en 10-15 días hábiles");
  } else {
    lines.push("Incluye:");
    lines.push("• Tienda online completa con catálogo de productos");
    lines.push("• Carrito de compras y checkout integrado");
    lines.push("• Pasarela de pago (Webpay, MercadoPago)");
    lines.push("• Panel de administración de productos");
    lines.push("• Gestión de inventario básico");
    lines.push("• Diseño responsive premium");
    lines.push("• SEO para e-commerce");
    lines.push("• Hosting y dominio incluidos por 1 año");
    lines.push("• Entrega en 15-20 días hábiles");
  }

  lines.push("");
  lines.push("Garantía: Soporte técnico por 3 meses post-lanzamiento incluido.");

  return lines.join("\n");
}

export default router;

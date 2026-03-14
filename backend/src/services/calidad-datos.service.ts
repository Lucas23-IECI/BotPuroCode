import { prisma } from "../lib/prisma";
import type { CalidadDatos } from "@prisma/client";

/**
 * Calcula la calidad de datos de un negocio basándose en los campos llenos.
 * COMPLETO: tiene teléfono/whatsapp + email + sitioWeb/RRSS + dirección
 * PARCIAL: tiene al menos 2 formas de contacto o datos digitales
 * MINIMO: tiene al menos 1 dato de contacto
 * SIN_CONTACTO: sin teléfono, email, whatsapp ni RRSS
 */
export function calcularCalidadDatos(negocio: {
  telefono?: string | null;
  email?: string | null;
  whatsapp?: string | null;
  sitioWeb?: string | null;
  instagram?: string | null;
  facebook?: string | null;
  tiktok?: string | null;
  direccion?: string | null;
  gmapsRating?: number | null;
  googlePlaceId?: string | null;
}): CalidadDatos {
  const contacto = [negocio.telefono, negocio.email, negocio.whatsapp].filter(Boolean).length;
  const digital = [negocio.sitioWeb, negocio.instagram, negocio.facebook, negocio.tiktok].filter(Boolean).length;
  const extra = [negocio.direccion, negocio.gmapsRating, negocio.googlePlaceId].filter(Boolean).length;

  const total = contacto + digital + extra;

  if (contacto === 0 && digital === 0) return "SIN_CONTACTO";
  if (contacto >= 2 && digital >= 1 && extra >= 1) return "COMPLETO";
  if (total >= 3) return "PARCIAL";
  return "MINIMO";
}

/**
 * Recalcula y persiste la calidad de datos de un negocio.
 */
export async function actualizarCalidadDatos(negocioId: string) {
  const negocio = await prisma.negocio.findUnique({ where: { id: negocioId } });
  if (!negocio) return;

  const calidad = calcularCalidadDatos(negocio);
  if (calidad !== negocio.calidadDatos) {
    await prisma.negocio.update({
      where: { id: negocioId },
      data: { calidadDatos: calidad },
    });
  }
  return calidad;
}

/**
 * Recalcula la calidad de datos de todos los negocios (batch).
 */
export async function recalcularCalidadDatosBatch() {
  const negocios = await prisma.negocio.findMany({
    select: {
      id: true, telefono: true, email: true, whatsapp: true,
      sitioWeb: true, instagram: true, facebook: true, tiktok: true,
      direccion: true, gmapsRating: true, googlePlaceId: true,
      calidadDatos: true,
    },
  });

  let updated = 0;
  for (const neg of negocios) {
    const calidad = calcularCalidadDatos(neg);
    if (calidad !== neg.calidadDatos) {
      await prisma.negocio.update({ where: { id: neg.id }, data: { calidadDatos: calidad } });
      updated++;
    }
  }
  return { total: negocios.length, updated };
}

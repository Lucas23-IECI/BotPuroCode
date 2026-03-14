/**
 * Servicio de Google Places API.
 * Requiere GOOGLE_PLACES_API_KEY en .env.
 * Costo: ~$17/1000 requests. Crédito gratis $200/mes = ~11,700 búsquedas.
 */

import { prisma } from "../lib/prisma";
import type { EstadoGoogle } from "@prisma/client";

const API_KEY = process.env.GOOGLE_PLACES_API_KEY || "";
const BASE_URL = "https://places.googleapis.com/v1/places";

interface PlaceResult {
  googlePlaceId: string;
  telefono?: string;
  sitioWeb?: string;
  horarios?: string;
  estadoGoogle: EstadoGoogle;
  fotosUrl: string[];
  gmapsRating?: number;
  gmapsReviews?: number;
  direccion?: string;
  lat?: number;
  lng?: number;
}

/**
 * Busca un negocio en Google Places por nombre + comuna.
 * Usa la nueva Places API (v1) con Text Search.
 */
export async function buscarEnGooglePlaces(
  nombre: string,
  comuna: string,
): Promise<PlaceResult | null> {
  if (!API_KEY) return null;

  const query = `${nombre} ${comuna} Chile`;
  const url = `${BASE_URL}:searchText`;

  const resp = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-Goog-Api-Key": API_KEY,
      "X-Goog-FieldMask": "places.id,places.displayName,places.formattedAddress,places.nationalPhoneNumber,places.websiteUri,places.regularOpeningHours,places.businessStatus,places.photos,places.rating,places.userRatingCount,places.location",
    },
    body: JSON.stringify({ textQuery: query, maxResultCount: 1 }),
  });

  if (!resp.ok) return null;

  const data = (await resp.json()) as { places?: Array<Record<string, any>> };
  const place = data.places?.[0];
  if (!place) return null;

  let estadoGoogle: EstadoGoogle = "ACTIVO";
  if (place.businessStatus === "CLOSED_PERMANENTLY") estadoGoogle = "CERRADO_PERMANENTE";
  else if (place.businessStatus === "CLOSED_TEMPORARILY") estadoGoogle = "CERRADO_TEMPORAL";

  const fotosUrl: string[] = [];
  if (place.photos && API_KEY) {
    for (const photo of place.photos.slice(0, 3)) {
      fotosUrl.push(
        `https://places.googleapis.com/v1/${photo.name}/media?maxWidthPx=400&key=${API_KEY}`
      );
    }
  }

  let horarios: string | undefined;
  if (place.regularOpeningHours?.weekdayDescriptions) {
    horarios = JSON.stringify(place.regularOpeningHours.weekdayDescriptions);
  }

  return {
    googlePlaceId: place.id,
    telefono: place.nationalPhoneNumber,
    sitioWeb: place.websiteUri,
    horarios,
    estadoGoogle,
    fotosUrl,
    gmapsRating: place.rating,
    gmapsReviews: place.userRatingCount,
    direccion: place.formattedAddress,
    lat: place.location?.latitude,
    lng: place.location?.longitude,
  };
}

/**
 * Enriquece un negocio existente con datos de Google Places.
 * Solo actualiza campos que estaban vacíos (no sobreescribe datos manuales).
 */
export async function enriquecerConGooglePlaces(negocioId: string) {
  if (!API_KEY) return { status: "skip", reason: "No API key" };

  const negocio = await prisma.negocio.findUnique({ where: { id: negocioId } });
  if (!negocio) return { status: "error", reason: "Negocio no encontrado" };
  if (negocio.googlePlaceId) return { status: "skip", reason: "Ya enriquecido" };

  const result = await buscarEnGooglePlaces(negocio.nombre, negocio.comuna);
  if (!result) return { status: "not_found", reason: "No encontrado en Google Places" };

  const updateData: Record<string, unknown> = {
    googlePlaceId: result.googlePlaceId,
    estadoGoogle: result.estadoGoogle,
    fotosUrl: result.fotosUrl,
  };

  // Solo rellenar campos vacíos
  if (!negocio.telefono && result.telefono) updateData.telefono = result.telefono;
  if (!negocio.sitioWeb && result.sitioWeb) updateData.sitioWeb = result.sitioWeb;
  if (!negocio.direccion && result.direccion) updateData.direccion = result.direccion;
  if (!negocio.gmapsRating && result.gmapsRating) updateData.gmapsRating = result.gmapsRating;
  if (!negocio.gmapsReviews && result.gmapsReviews) updateData.gmapsReviews = result.gmapsReviews;
  if (!negocio.lat && result.lat) updateData.lat = result.lat;
  if (!negocio.lng && result.lng) updateData.lng = result.lng;
  if (result.horarios) updateData.horarios = result.horarios;

  await prisma.negocio.update({ where: { id: negocioId }, data: updateData });

  return { status: "enriched", googlePlaceId: result.googlePlaceId, estadoGoogle: result.estadoGoogle };
}

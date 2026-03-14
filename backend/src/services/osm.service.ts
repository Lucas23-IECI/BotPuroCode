// OpenStreetMap / Overpass API — búsqueda de negocios por zona/rubro
// 100% gratis, 100% legal

interface OSMNegocio {
  osmId: number;
  nombre: string;
  tipo: string;
  lat: number;
  lng: number;
  direccion?: string;
  telefono?: string;
  sitioWeb?: string;
  email?: string;
  comuna?: string;
}

// Mapeo de rubros de BotPuroCode a tags de OSM
const RUBRO_TO_OSM: Record<string, string[]> = {
  barbería: ['shop=hairdresser', 'amenity=barber'],
  peluquería: ['shop=hairdresser'],
  "salón de belleza": ['shop=beauty'],
  "centro estético": ['shop=beauty'],
  manicure: ['shop=beauty'],
  veterinaria: ['amenity=veterinary'],
  "pet shop": ['shop=pet'],
  "taller mecánico": ['shop=car_repair'],
  vulcanización: ['shop=tyres'],
  "lavado de autos": ['amenity=car_wash'],
  ferretería: ['shop=hardware', 'shop=doityourself'],
  panadería: ['shop=bakery'],
  pastelería: ['shop=pastry', 'shop=confectionery'],
  cafetería: ['amenity=cafe'],
  restaurante: ['amenity=restaurant'],
  florería: ['shop=florist'],
  farmacia: ['amenity=pharmacy'],
  dentista: ['amenity=dentist'],
  lavandería: ['shop=laundry'],
  gimnasio: ['leisure=fitness_centre'],
  supermercado: ['shop=supermarket'],
  almacén: ['shop=convenience'],
  carnicería: ['shop=butcher'],
  zapatería: ['shop=shoes'],
  librería: ['shop=books'],
  óptica: ['shop=optician'],
  joyería: ['shop=jewelry'],
  mueblería: ['shop=furniture'],
  electricista: ['craft=electrician'],
  carpintería: ['craft=carpenter'],
  cerrajería: ['craft=locksmith'],
  imprenta: ['craft=printer'],
  fotografía: ['shop=photo'],
};

// Zonas Gran Concepción — bounding boxes aproximados [sur, oeste, norte, este]
const ZONAS: Record<string, [number, number, number, number]> = {
  concepción: [-36.86, -73.10, -36.77, -73.01],
  talcahuano: [-36.75, -73.15, -36.70, -73.08],
  hualpén: [-36.80, -73.13, -36.75, -73.06],
  "san pedro de la paz": [-36.88, -73.13, -36.82, -73.07],
  chiguayante: [-36.93, -73.04, -36.87, -72.98],
  coronel: [-37.05, -73.18, -36.96, -73.10],
  penco: [-36.75, -72.99, -36.71, -72.93],
  tomé: [-36.65, -72.98, -36.60, -72.93],
  hualqui: [-37.00, -72.97, -36.96, -72.90],
  lota: [-37.10, -73.18, -37.06, -73.13],
};

export async function buscarEnOSM(
  rubro: string,
  comuna: string
): Promise<OSMNegocio[]> {
  const tags = RUBRO_TO_OSM[rubro.toLowerCase()];
  if (!tags || tags.length === 0) {
    return [];
  }

  const bbox = ZONAS[comuna.toLowerCase()];
  if (!bbox) {
    return [];
  }

  const [south, west, north, east] = bbox;

  // Build Overpass QL query
  const tagQueries = tags
    .map((tag) => {
      const [key, value] = tag.split("=");
      return `node["${key}"="${value}"](${south},${west},${north},${east});\nway["${key}"="${value}"](${south},${west},${north},${east});`;
    })
    .join("\n");

  const query = `
[out:json][timeout:25];
(
  ${tagQueries}
);
out center meta;
`.trim();

  try {
    const response = await fetch("https://overpass-api.de/api/interpreter", {
      method: "POST",
      body: `data=${encodeURIComponent(query)}`,
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
    });

    if (!response.ok) return [];

    const data = await response.json() as {
      elements: Array<{
        id: number;
        type: string;
        lat?: number;
        lon?: number;
        center?: { lat: number; lon: number };
        tags?: Record<string, string>;
      }>;
    };

    return data.elements
      .filter((el) => el.tags?.name)
      .map((el) => ({
        osmId: el.id,
        nombre: el.tags!.name!,
        tipo: rubro,
        lat: el.lat ?? el.center?.lat ?? 0,
        lng: el.lon ?? el.center?.lon ?? 0,
        direccion: [el.tags?.["addr:street"], el.tags?.["addr:housenumber"]]
          .filter(Boolean)
          .join(" ") || undefined,
        telefono: el.tags?.phone || el.tags?.["contact:phone"] || undefined,
        sitioWeb: el.tags?.website || el.tags?.["contact:website"] || undefined,
        email: el.tags?.email || el.tags?.["contact:email"] || undefined,
        comuna,
      }));
  } catch {
    return [];
  }
}

export function getZonasDisponibles(): string[] {
  return Object.keys(ZONAS);
}

export function getRubrosOSM(): string[] {
  return Object.keys(RUBRO_TO_OSM);
}

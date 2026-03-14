"use client";

import { useEffect, useState, useMemo } from "react";
import dynamic from "next/dynamic";
import { getNegocios, type Negocio } from "@/lib/api";
import { MapPin, Filter, X } from "lucide-react";
import { cn } from "@/lib/utils";

// Dynamically import map to avoid SSR issues with Leaflet
const MapContainer = dynamic(
  () => import("react-leaflet").then((m) => m.MapContainer),
  { ssr: false }
);
const TileLayer = dynamic(
  () => import("react-leaflet").then((m) => m.TileLayer),
  { ssr: false }
);
const MarkerDynamic = dynamic(
  () => import("react-leaflet").then((m) => m.Marker),
  { ssr: false }
);
const PopupDynamic = dynamic(
  () => import("react-leaflet").then((m) => m.Popup),
  { ssr: false }
);

function scoreColor(score: number): string {
  if (score >= 70) return "#22c55e";
  if (score >= 40) return "#eab308";
  return "#ef4444";
}

function LeadPopup({ n }: { n: Negocio }) {
  return (
    <div className="min-w-[200px] text-sm">
      <h3 className="font-bold text-gray-900">{n.nombre}</h3>
      <p className="text-gray-600">{n.rubro} · {n.comuna}</p>
      <div className="mt-1 flex items-center gap-2">
        <span
          className="inline-flex h-6 w-6 items-center justify-center rounded-full text-xs font-bold text-white"
          style={{ backgroundColor: scoreColor(n.score) }}
        >
          {n.score}
        </span>
        <span className="text-gray-500">{n.estadoPresencia}</span>
      </div>
      {n.telefono && <p className="mt-1 text-gray-600">📞 {n.telefono}</p>}
      <a
        href={`/leads/${n.id}`}
        className="mt-2 inline-block text-blue-600 hover:underline"
      >
        Ver detalle →
      </a>
    </div>
  );
}

export default function MapaPage() {
  const [negocios, setNegocios] = useState<Negocio[]>([]);
  const [loading, setLoading] = useState(true);
  const [scoreMin, setScoreMin] = useState(0);
  const [showFilter, setShowFilter] = useState(false);
  const [leafletReady, setLeafletReady] = useState(false);
  const [defaultIcon, setDefaultIcon] = useState<unknown>(null);

  useEffect(() => {
    getNegocios()
      .then((data) => setNegocios(data.data))
      .finally(() => setLoading(false));
  }, []);

  // Set up Leaflet default icon (avoid missing marker icons)
  useEffect(() => {
    if (typeof window === "undefined") return;
    import("leaflet").then((L) => {
      // Fix default marker icon paths
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      delete (L.Icon.Default.prototype as unknown as Record<string, unknown>)._getIconUrl;
      L.Icon.Default.mergeOptions({
        iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
        iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
        shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
      });
      setDefaultIcon(new L.Icon.Default());
      setLeafletReady(true);
    });
  }, []);

  const withCoords = useMemo(
    () =>
      negocios.filter(
        (n) =>
          n.lat !== null &&
          n.lng !== null &&
          n.lat !== undefined &&
          n.lng !== undefined &&
          n.score >= scoreMin
      ),
    [negocios, scoreMin]
  );

  // Center on Chile by default (-33.45, -70.65) = Santiago
  const center: [number, number] = useMemo(() => {
    if (withCoords.length === 0) return [-33.45, -70.65];
    const avgLat = withCoords.reduce((s, n) => s + (n.lat ?? 0), 0) / withCoords.length;
    const avgLng = withCoords.reduce((s, n) => s + (n.lng ?? 0), 0) / withCoords.length;
    return [avgLat, avgLng];
  }, [withCoords]);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
            <MapPin className="h-6 w-6 text-primary" /> Mapa de Leads
          </h1>
          <p className="text-sm text-muted-foreground">
            {withCoords.length} leads con ubicación
            {negocios.length - withCoords.length > 0 && ` (${negocios.length - withCoords.length} sin coordenadas)`}
          </p>
        </div>
        <button
          onClick={() => setShowFilter(!showFilter)}
          className={cn(
            "flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
            showFilter ? "bg-primary text-primary-foreground" : "bg-muted/50 text-muted-foreground hover:bg-muted"
          )}
        >
          {showFilter ? <X className="h-4 w-4" /> : <Filter className="h-4 w-4" />}
          Filtros
        </button>
      </div>

      {showFilter && (
        <div className="rounded-xl border border-border bg-card p-4">
          <label className="mb-1 block text-xs font-medium text-muted-foreground">
            Score mínimo: {scoreMin}
          </label>
          <input
            type="range"
            min={0}
            max={100}
            value={scoreMin}
            onChange={(e) => setScoreMin(Number(e.target.value))}
            className="w-full accent-primary"
          />
          <div className="mt-1 flex justify-between text-xs text-muted-foreground">
            <span>0</span>
            <span>50</span>
            <span>100</span>
          </div>
        </div>
      )}

      {/* Map */}
      <div className="relative h-[calc(100vh-250px)] min-h-[400px] overflow-hidden rounded-xl border border-border">
        {loading && (
          <div className="flex h-full items-center justify-center bg-card">
            <div className="h-8 w-8 animate-spin rounded-full border-2 border-muted border-t-primary" />
          </div>
        )}
        {!loading && leafletReady && (
          <>
            <link
              rel="stylesheet"
              href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css"
            />
            <MapContainer
              center={center}
              zoom={12}
              className="h-full w-full"
              style={{ height: "100%", width: "100%" }}
            >
              <TileLayer
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              />
              {withCoords.map((n) => (
                <MarkerDynamic
                  key={n.id}
                  position={[n.lat!, n.lng!]}
                  icon={defaultIcon as L.Icon}
                >
                  <PopupDynamic>
                    <LeadPopup n={n} />
                  </PopupDynamic>
                </MarkerDynamic>
              ))}
            </MapContainer>
          </>
        )}
        {!loading && !leafletReady && (
          <div className="flex h-full items-center justify-center bg-card text-muted-foreground">
            Cargando mapa...
          </div>
        )}
      </div>
    </div>
  );
}

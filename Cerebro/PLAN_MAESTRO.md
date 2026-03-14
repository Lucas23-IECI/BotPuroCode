# PLAN MAESTRO — BotPuroCode
## Motor de Detección de Oportunidad Digital para PuroCode.com

---

## 1. VISIÓN GENERAL

### ¿Qué es?
Un sistema interno de prospección digital para **purocode.com** que detecta automáticamente negocios (pymes, emprendimientos, locales) en Chile que **no tienen presencia web** o que la tienen **muy débil**, y los clasifica como potenciales clientes para ofrecer desarrollo web profesional.

### ¿Qué NO es?
- NO es un scraper masivo de Google Maps o Instagram (prohibido por TOS).
- NO es un bot que contacte automáticamente a clientes (spam ilegal).
- NO es un directorio público de empresas.

### Objetivo de negocio
Generar leads calificados de forma continua para PuroCode, clasificados por:
- **Corto plazo**: negocios sin web, solo con Instagram/WhatsApp → venta rápida.
- **Mediano plazo**: negocios con web mala o Linktree/AgendaPro → propuesta de mejora.
- **Largo plazo**: pipeline automatizado de detección permanente, reputación como consultores digitales.

---

## 2. FLUJO COMPLETO DEL SISTEMA

```
┌─────────────────────────────────────────────────────────────────────┐
│                        FLUJO PRINCIPAL                              │
│                                                                     │
│  [1. DESCUBRIMIENTO]                                                │
│       │                                                             │
│       ├── Fuentes permitidas (APIs, registros públicos, SII)        │
│       ├── Ingesta manual/semi-automática desde Google Maps          │
│       └── Importación de datos propios / CSV                        │
│       │                                                             │
│  [2. RESOLUCIÓN DE PRESENCIA]                                       │
│       │                                                             │
│       ├── ¿Tiene dominio propio? → DNS lookup                       │
│       ├── ¿El dominio responde? → HTTP check                       │
│       ├── ¿Tiene solo redes sociales?                               │
│       ├── ¿Usa AgendaPro / Linktree / link externo?                 │
│       └── ¿No tiene nada?                                           │
│       │                                                             │
│  [3. ANÁLISIS TÉCNICO DEL SITIO]                                    │
│       │                                                             │
│       ├── Tecnología (WordPress, Wix, Shopify, custom)              │
│       ├── Performance (Lighthouse / PageSpeed)                      │
│       ├── Mobile responsive                                         │
│       ├── SSL                                                       │
│       ├── SEO básico (title, meta, h1, sitemap)                     │
│       ├── Presencia de formulario / CTA                             │
│       ├── Calidad visual (heurísticas)                              │
│       └── Uptime / errores                                          │
│       │                                                             │
│  [4. SCORING Y CLASIFICACIÓN]                                       │
│       │                                                             │
│       ├── Score numérico (0-100)                                    │
│       ├── Nivel: Alta / Media / Baja oportunidad                    │
│       ├── Razones específicas                                       │
│       └── Prioridad de contacto                                     │
│       │                                                             │
│  [5. DASHBOARD / PANEL]                                             │
│       │                                                             │
│       ├── Lista de leads con filtros                                │
│       ├── Vista por comuna / rubro / score                          │
│       ├── Detalle de cada negocio                                   │
│       ├── Estado de contacto (no contactado, contactado, cerrado)   │
│       └── Exportación a CSV / Google Sheets                         │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘
```

---

## 3. MÓDULOS DEL SISTEMA

### Módulo 1: Ingesta de Negocios
**Objetivo**: Alimentar la base de datos con negocios reales.

**Fuentes viables y permitidas**:
- **Ingesta manual asistida**: El usuario busca en Google Maps, y el sistema facilita el registro rápido (formulario o extensión de Chrome).
- **Registros públicos del SII**: Consulta de inicio de actividades (datos públicos de empresas).
- **Directorios abiertos**: Páginas Amarillas Chile, guías comerciales públicas.
- **CyberMonday / BlackFriday listas**: Directorios de participantes.
- **Cámaras de comercio**: Listados públicos de socios.
- **CSV / Excel manual**: Importación de planillas.
- **API de Google Places** (con licencia pagada y dentro de TOS).

**Lo que NO se hará**:
- Scraping automatizado de Google Maps sin API.
- Scraping de Instagram.
- Acceso no autorizado a ninguna plataforma.

### Módulo 2: Resolución de Presencia Web
**Objetivo**: Determinar qué tiene cada negocio en internet.

**Checks automáticos**:
1. DNS lookup del dominio (si se conoce).
2. HTTP/HTTPS request al dominio.
3. Detección de redirects (→ Facebook, Instagram, Linktree, etc.).
4. Búsqueda de perfiles sociales vinculados.
5. Detección de plataformas externas (AgendaPro, Reservo, Linktree, etc.).

**Clasificación de presencia**:
| Estado | Descripción |
|--------|-------------|
| `SIN_WEB` | No tiene dominio ni presencia web |
| `SOLO_RRSS` | Solo Instagram / Facebook / TikTok |
| `LINK_EXTERNO` | Usa AgendaPro, Linktree, Calendly, etc. |
| `WEB_BASICA` | Tiene web pero muy simple o con plantilla |
| `WEB_MEDIA` | Tiene web funcional pero con problemas |
| `WEB_BUENA` | Tiene web decente (baja prioridad) |

### Módulo 3: Análisis Técnico
**Objetivo**: Evaluar la calidad del sitio (cuando existe).

**Métricas a evaluar**:
- **Performance**: tiempo de carga, LCP, FCP, CLS (via Lighthouse o PageSpeed Insights API).
- **SSL**: ¿tiene certificado? ¿está vigente?
- **Mobile**: ¿es responsive? ¿pasa el test de mobile-friendly?
- **SEO**: ¿tiene title? ¿meta description? ¿h1? ¿sitemap.xml? ¿robots.txt?
- **Tecnología**: ¿WordPress? ¿Wix? ¿Shopify? ¿HTML estático? ¿custom?
- **Contenido**: ¿tiene formulario de contacto? ¿CTA claro? ¿WhatsApp widget?
- **Diseño**: ¿usa plantilla genérica? ¿tiene branding consistente? ¿tiene favicon?
- **Uptime**: ¿responde? ¿errores 404/500?

### Módulo 4: Motor de Scoring
**Objetivo**: Asignar un puntaje de oportunidad a cada negocio.

**Fórmula base** (ajustable):

```
SCORE = peso_presencia × factor_presencia
      + peso_tecnico × factor_tecnico
      + peso_rubro × factor_rubro
      + peso_zona × factor_zona
```

**Desglose**:

| Factor | Peso sugerido | Detalle |
|--------|--------------|---------|
| Sin web | 40 pts | Máxima oportunidad |
| Solo RRSS | 30 pts | Muy buena oportunidad |
| Link externo | 20 pts | Buena oportunidad |
| Web básica/fea | 15 pts | Oportunidad de mejora |
| Sin SSL | 5 pts | Punto adicional |
| No responsive | 5 pts | Punto adicional |
| Sin SEO | 5 pts | Punto adicional |
| Performance mala | 5 pts | Punto adicional |
| Sin formulario/CTA | 5 pts | Punto adicional |
| Rubro alta demanda | 10 pts | Barberías, estéticas, etc. |
| Zona target | 5 pts | Comunas prioritarias |

**Niveles**:
- **90-100**: Lead caliente → contactar inmediatamente.
- **70-89**: Lead muy bueno → contactar pronto.
- **50-69**: Lead medio → evaluar caso a caso.
- **30-49**: Lead frío → dejar en pipeline.
- **0-29**: No prioritario → ignorar o revisar después.

### Módulo 5: Dashboard / Panel
**Objetivo**: Interfaz para que PuroCode gestione los leads.

**Funcionalidades**:
- Lista de negocios con filtros (rubro, comuna, score, estado).
- Detalle de cada negocio (datos + análisis + score + razones).
- Estado de gestión (no contactado → contactado → propuesta enviada → cerrado ganado / perdido).
- Búsqueda y ordenamiento.
- Exportación CSV / Google Sheets.
- Estadísticas: # leads por rubro, por zona, por estado, tasa de conversión.

---

## 4. FASES DE DESARROLLO

### Fase 1: MVP — Ingesta manual + Análisis automático
**Duración estimada para tener algo funcional**: Sprint 1

- [ ] Setup del proyecto (repo, estructura, dependencias).
- [ ] Modelo de datos (negocio, análisis, score).
- [ ] Formulario de ingesta manual (nombre, rubro, comuna, web/RRSS).
- [ ] Motor de resolución de dominio (DNS + HTTP check).
- [ ] Detector de tecnología (WordPress, Wix, etc.).
- [ ] Check de SSL.
- [ ] Check de responsive.
- [ ] Scoring básico.
- [ ] Lista de leads con filtros.
- [ ] Detalle de cada lead.

### Fase 2: Análisis profundo
- [ ] Integración con PageSpeed Insights API (gratis, con API key).
- [ ] SEO checker (title, meta, h1, sitemap, robots.txt).
- [ ] Detector de formularios / CTA / WhatsApp widget.
- [ ] Detector de plantillas genéricas.
- [ ] Favicon check.
- [ ] Scoring avanzado con todos los factores.

### Fase 3: Ingesta semi-automática
- [ ] Extensión de Chrome para capturar datos desde Google Maps rápidamente.
- [ ] Importación masiva de CSV.
- [ ] Integración con Google Places API (pagado, dentro de TOS).
- [ ] Verificación automática de duplicados.

### Fase 4: CRM básico
- [ ] Estados de contacto (pipeline de ventas).
- [ ] Notas por lead.
- [ ] Historial de interacciones.
- [ ] Recordatorios de seguimiento.
- [ ] Estadísticas de conversión.

### Fase 5: Automatización y escala
- [ ] Monitoreo periódico de sitios ya analizados.
- [ ] Alertas de cambios (un negocio que ahora tiene web).
- [ ] Re-scoring automático.
- [ ] Dashboard con métricas de negocio (ROI de prospección).
- [ ] Multi-usuario (si PuroCode crece el equipo).

---

## 5. RESTRICCIONES Y LÍMITES

### Legales
- **NO scraping de Google Maps** (viola TOS de Google Maps Platform).
- **NO scraping de Instagram** (viola TOS de Meta).
- **Ley 21.719 Chile** (protección de datos personales): si se almacenan datos de personas naturales (nombres de dueños, correos, teléfonos personales), se debe cumplir con la normativa.
- **robots.txt**: siempre respetar el robots.txt de cada sitio analizado.
- **Rate limiting**: nunca bombardear un sitio con requests.

### Éticas
- No contacto masivo / spam.
- No publicar datos de negocios sin autorización.
- No afirmar públicamente que un negocio "tiene mala web" (es evaluación interna).
- Uso exclusivamente interno para prospección comercial de PuroCode.

### Técnicas
- El sistema no puede garantizar que encontrará TODOS los negocios de una zona.
- Google Maps no muestra todos los locales existentes.
- Algunos negocios no tienen presencia digital de ningún tipo (no detectables online).
- El análisis técnico es heurístico, no un juicio absoluto.

---

## 6. DATOS QUE SE ALMACENAN POR NEGOCIO

```typescript
interface Negocio {
  // Identificación
  id: string;
  nombre: string;
  rubro: string;
  subrubro?: string;

  // Ubicación
  comuna: string;
  ciudad: string;
  region: string;
  direccion?: string;
  coordenadas?: { lat: number; lng: number };

  // Contacto (solo datos públicos del negocio)
  telefono?: string;
  email?: string; // solo si es público y del negocio
  whatsapp?: string;

  // Presencia digital
  sitioWeb?: string;
  instagram?: string;
  facebook?: string;
  tiktok?: string;
  linkExterno?: string; // AgendaPro, Linktree, etc.
  tipoLinkExterno?: string;

  // Google Maps (solo si se registra manualmente)
  googleMapsRating?: number;
  googleMapsReviews?: number;

  // Análisis
  estadoPresencia: 'SIN_WEB' | 'SOLO_RRSS' | 'LINK_EXTERNO' | 'WEB_BASICA' | 'WEB_MEDIA' | 'WEB_BUENA';
  analisisTecnico?: AnalisisTecnico;
  score: number;
  nivelOportunidad: 'ALTA' | 'MEDIA' | 'BAJA' | 'NO_PRIORITARIO';
  razonesScore: string[];

  // CRM
  estadoContacto: 'NO_CONTACTADO' | 'CONTACTADO' | 'PROPUESTA_ENVIADA' | 'NEGOCIANDO' | 'CERRADO_GANADO' | 'CERRADO_PERDIDO';
  notas?: string;
  fechaUltimoContacto?: Date;
  proximoSeguimiento?: Date;

  // Meta
  fuenteDescubrimiento: string; // "google_maps_manual", "csv_import", "api_places", etc.
  fechaRegistro: Date;
  fechaUltimoAnalisis?: Date;
}

interface AnalisisTecnico {
  dominioPropioExiste: boolean;
  dominioResponde: boolean;
  tieneSSL: boolean;
  esResponsive: boolean;
  tecnologia?: string; // "wordpress", "wix", "shopify", "html_estatico", "custom", etc.
  plantillaGenerica: boolean;
  tieneFormulario: boolean;
  tieneCTA: boolean;
  tieneWhatsAppWidget: boolean;
  tieneFavicon: boolean;

  // SEO
  tieneTitle: boolean;
  tieneMetaDescription: boolean;
  tieneH1: boolean;
  tieneSitemap: boolean;
  tieneRobotsTxt: boolean;

  // Performance (via PageSpeed Insights)
  performanceScore?: number; // 0-100
  lcp?: number; // ms
  fcp?: number; // ms
  cls?: number;

  // General
  erroresDetectados: string[];
  ultimoCheck: Date;
}
```

---

## 7. MÉTRICAS DE ÉXITO

| Métrica | Objetivo |
|---------|----------|
| Leads registrados por semana | 50-100 |
| Leads calificados (score > 70) | 30%+ del total |
| Tasa de contacto | 50%+ de leads calificados |
| Tasa de respuesta | 10-20% de contactados |
| Tasa de cierre | 5-10% de respuestas |
| Tiempo de ingesta por negocio | < 2 min manual, < 5 seg automático |
| Tiempo de análisis por sitio | < 30 seg automático |

---

## 8. COMUNAS / ZONAS INICIALES TARGET

### Zona Gran Concepción (para empezar)
1. Concepción
2. Talcahuano
3. Hualpén
4. San Pedro de la Paz
5. Chiguayante
6. Coronel
7. Penco
8. Tomé
9. Hualqui
10. Lota

### Expansión posterior
- Santiago y comunas del Gran Santiago
- Valparaíso / Viña del Mar
- Temuco
- Valdivia
- Puerto Montt
- La Serena / Coquimbo
- Antofagasta
- Iquique
- Rancagua
- Chillán
- Los Ángeles

---

## 9. PREGUNTAS PENDIENTES PARA DEFINIR

> Estas preguntas se deben resolver antes de avanzar con la implementación.

1. **Stack técnico**: ¿Next.js fullstack? ¿Backend separado con Node/Express? ¿Qué DB (PostgreSQL, SQLite, Turso)?
2. **Hosting**: ¿Vercel? ¿VPS propio? ¿Railway?
3. **Extensión de Chrome**: ¿La quieren desde el MVP o después?
4. **Google Places API**: ¿Están dispuestos a pagar? (tiene costo por request).
5. **Multi-usuario**: ¿Solo ustedes dos lo van a usar o habrá más personas?
6. **Diseño**: ¿Algo simple tipo tabla/dashboard o quieren algo más elaborado?
7. **Integración con PuroCode**: ¿Se conecta con la web principal de purocode.com o es 100% separado?
8. **Notificaciones**: ¿Quieren alertas por email/WhatsApp cuando hay leads calientes?
9. **Presupuesto para APIs**: ¿Cuánto pueden invertir mensualmente en APIs (Google Places, PageSpeed, etc.)?
10. **Prioridad de rubros**: ¿Empiezan con belleza + mascotas + auto o con todos a la vez?

---

## 10. PRÓXIMOS PASOS INMEDIATOS

1. ✅ Crear carpeta Cerebro con plan maestro.
2. ⬜ Resolver las preguntas pendientes (sección 9).
3. ⬜ Definir stack técnico final.
4. ⬜ Crear estructura del proyecto.
5. ⬜ Implementar Fase 1 (MVP).

---

*Documento creado para uso interno de PuroCode.*
*Última actualización: Marzo 2026*

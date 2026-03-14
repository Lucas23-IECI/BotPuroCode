# ARQUITECTURA TÉCNICA — BotPuroCode

---

## 1. DIAGRAMA DE ARQUITECTURA

```
┌──────────────────────────────────────────────────────────────────────────┐
│                          FRONTEND (Dashboard)                           │
│                                                                          │
│  ┌─────────────┐  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐  │
│  │  Lista de    │  │  Detalle de  │  │  Ingesta     │  │  Estadís-    │  │
│  │  Leads       │  │  Negocio     │  │  Manual      │  │  ticas       │  │
│  └──────┬──────┘  └──────┬───────┘  └──────┬───────┘  └──────┬───────┘  │
│         │                │                  │                 │          │
│         └────────────────┴──────────────────┴─────────────────┘          │
│                                    │                                     │
│                              API REST / tRPC                             │
└────────────────────────────────────┬─────────────────────────────────────┘
                                     │
┌────────────────────────────────────┼─────────────────────────────────────┐
│                            BACKEND (API)                                 │
│                                    │                                     │
│  ┌─────────────────────────────────┼───────────────────────────────────┐ │
│  │                          MÓDULOS CORE                               │ │
│  │                                                                     │ │
│  │  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐              │ │
│  │  │  Ingesta     │  │  Resolución  │  │  Análisis    │              │ │
│  │  │  Service     │  │  de Presencia│  │  Técnico     │              │ │
│  │  └──────────────┘  └──────────────┘  └──────────────┘              │ │
│  │                                                                     │ │
│  │  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐              │ │
│  │  │  Scoring     │  │  CRM         │  │  Export      │              │ │
│  │  │  Engine      │  │  Service     │  │  Service     │              │ │
│  │  └──────────────┘  └──────────────┘  └──────────────┘              │ │
│  │                                                                     │ │
│  └─────────────────────────────────────────────────────────────────────┘ │
│                                    │                                     │
│                              ┌─────┴─────┐                               │
│                              │  Database  │                               │
│                              │ PostgreSQL │                               │
│                              │ / SQLite   │                               │
│                              └───────────┘                               │
│                                    │                                     │
│                    ┌───────────────┼───────────────┐                     │
│                    │               │               │                     │
│              ┌─────┴────┐   ┌─────┴────┐   ┌──────┴─────┐              │
│              │DNS/HTTP  │   │PageSpeed │   │Technology  │              │
│              │Checker   │   │Insights  │   │Detector    │              │
│              │(interno) │   │API       │   │(Wappalyzer)│              │
│              └──────────┘   └──────────┘   └────────────┘              │
└──────────────────────────────────────────────────────────────────────────┘
```

---

## 2. ESTRUCTURA DE CARPETAS PROPUESTA

```
BotPuroCode/
├── Cerebro/                      # Documentación y planificación
│   ├── PLAN_MAESTRO.md
│   ├── ARQUITECTURA.md
│   ├── KEYWORDS_RUBROS.md
│   ├── SCORING_ANALISIS.md
│   ├── LEGAL_COMPLIANCE.md
│   └── STACK_TECNICO.md
│
├── src/
│   ├── app/                      # Next.js App Router (si se usa Next.js)
│   │   ├── layout.tsx
│   │   ├── page.tsx              # Dashboard principal
│   │   ├── leads/
│   │   │   ├── page.tsx          # Lista de leads
│   │   │   └── [id]/
│   │   │       └── page.tsx      # Detalle de lead
│   │   ├── ingesta/
│   │   │   └── page.tsx          # Formulario de ingesta manual
│   │   ├── estadisticas/
│   │   │   └── page.tsx          # Panel de estadísticas
│   │   └── api/
│   │       ├── negocios/
│   │       │   └── route.ts      # CRUD negocios
│   │       ├── analisis/
│   │       │   └── route.ts      # Trigger de análisis
│   │       ├── scoring/
│   │       │   └── route.ts      # Recalcular scores
│   │       └── export/
│   │           └── route.ts      # Exportar datos
│   │
│   ├── modules/                  # Lógica de negocio
│   │   ├── ingesta/
│   │   │   ├── ingesta.service.ts
│   │   │   ├── csv-parser.ts
│   │   │   └── validators.ts
│   │   │
│   │   ├── presencia/
│   │   │   ├── presencia.service.ts
│   │   │   ├── dns-checker.ts
│   │   │   ├── http-checker.ts
│   │   │   ├── social-detector.ts
│   │   │   └── platform-detector.ts   # AgendaPro, Linktree, etc.
│   │   │
│   │   ├── analisis/
│   │   │   ├── analisis.service.ts
│   │   │   ├── tech-detector.ts       # WordPress, Wix, Shopify, etc.
│   │   │   ├── ssl-checker.ts
│   │   │   ├── responsive-checker.ts
│   │   │   ├── seo-checker.ts
│   │   │   ├── performance-checker.ts # PageSpeed Insights API
│   │   │   ├── content-checker.ts     # Formularios, CTA, WhatsApp
│   │   │   └── design-checker.ts      # Favicon, branding, plantilla
│   │   │
│   │   ├── scoring/
│   │   │   ├── scoring.service.ts
│   │   │   ├── scoring.config.ts      # Pesos y umbrales configurables
│   │   │   └── scoring.types.ts
│   │   │
│   │   ├── crm/
│   │   │   ├── crm.service.ts
│   │   │   └── crm.types.ts
│   │   │
│   │   └── export/
│   │       ├── export.service.ts
│   │       └── csv-generator.ts
│   │
│   ├── components/               # Componentes UI
│   │   ├── ui/                   # Componentes base (shadcn/ui)
│   │   ├── leads/
│   │   │   ├── LeadTable.tsx
│   │   │   ├── LeadCard.tsx
│   │   │   ├── LeadDetail.tsx
│   │   │   ├── LeadFilters.tsx
│   │   │   └── ScoreBadge.tsx
│   │   ├── ingesta/
│   │   │   ├── IngestaForm.tsx
│   │   │   └── CsvUpload.tsx
│   │   ├── estadisticas/
│   │   │   ├── StatsOverview.tsx
│   │   │   ├── RubroChart.tsx
│   │   │   └── ZonaChart.tsx
│   │   └── layout/
│   │       ├── Sidebar.tsx
│   │       ├── Header.tsx
│   │       └── MainLayout.tsx
│   │
│   ├── lib/                      # Utilidades
│   │   ├── db.ts                 # Conexión a DB
│   │   ├── utils.ts
│   │   └── constants.ts
│   │
│   └── types/                    # Tipos globales
│       ├── negocio.ts
│       ├── analisis.ts
│       └── scoring.ts
│
├── prisma/                       # ORM (si se usa Prisma)
│   └── schema.prisma
│
├── chrome-extension/             # Extensión de Chrome (Fase 3)
│   ├── manifest.json
│   ├── popup.html
│   ├── popup.js
│   ├── content.js
│   └── background.js
│
├── scripts/                      # Scripts auxiliares
│   ├── seed.ts                   # Datos iniciales
│   └── analyze-batch.ts          # Análisis en lote
│
├── .gitignore
├── package.json
├── tsconfig.json
├── next.config.ts                # (si es Next.js)
├── tailwind.config.ts
└── README.md
```

---

## 3. FLUJO DE DATOS DETALLADO

### 3.1 Ingesta Manual
```
Usuario → Formulario Web → POST /api/negocios → Validación → DB
                                                       │
                                                       ▼
                                              Trigger análisis
                                              automático (async)
```

### 3.2 Ingesta CSV
```
Usuario → Upload CSV → Parser → Validación fila por fila → DB (bulk insert)
                                                                 │
                                                                 ▼
                                                        Queue de análisis
                                                        (procesa de a 5)
```

### 3.3 Análisis de un negocio
```
Negocio en DB
     │
     ▼
┌─ Resolución de presencia ─────────────────────────────────┐
│  1. DNS lookup (¿existe el dominio?)                       │
│  2. HTTP GET al sitio (¿responde? ¿redirect?)              │
│  3. Detección de redes sociales en el HTML                 │
│  4. Detección de plataformas (AgendaPro, etc.)             │
└────────────────────────────────────────────────────────────┘
     │
     ▼ (si tiene sitio web)
┌─ Análisis técnico ────────────────────────────────────────┐
│  1. SSL check                                              │
│  2. Responsive check (viewport meta tag)                   │
│  3. Tech detection (meta generator, scripts, etc.)         │
│  4. SEO check (title, meta, h1, sitemap, robots.txt)       │
│  5. Content check (formularios, CTA, WhatsApp)             │
│  6. Design check (favicon, CSS complexity)                 │
│  7. PageSpeed Insights API (si está habilitado)            │
└────────────────────────────────────────────────────────────┘
     │
     ▼
┌─ Scoring ─────────────────────────────────────────────────┐
│  Calcula score basado en todos los factores                │
│  Asigna nivel de oportunidad                               │
│  Genera lista de razones                                   │
└────────────────────────────────────────────────────────────┘
     │
     ▼
  Guarda resultado en DB
```

---

## 4. APIs EXTERNAS A USAR

| API | Uso | Costo | Prioridad |
|-----|-----|-------|-----------|
| **PageSpeed Insights API** | Performance y métricas web | Gratis (con API key, límite generoso) | Fase 2 |
| **Google Places API** | Búsqueda de negocios por zona/rubro | Pagado (~$17/1000 requests) | Fase 3 (opcional) |
| **Wappalyzer API** | Detección de tecnologías | Free tier limitado / npm local gratis | Fase 1 |
| **DNS over HTTPS** | Resolución de dominios | Gratis (Cloudflare/Google) | Fase 1 |
| **SSL Labs API** | Verificación de SSL detallada | Gratis | Fase 2 |

### Alternativas gratuitas para detección de tecnología (sin API externa)
- Análisis del HTML: `meta generator`, scripts cargados, clases CSS.
- Detección por headers HTTP: `X-Powered-By`, `Server`.
- Paquete npm `wappalyzer` (local, sin API).
- `/wp-admin/`, `/wp-login.php` para WordPress.
- `/favicon.ico`, patrones de URL para Wix, Shopify, etc.

---

## 5. BASE DE DATOS — ESQUEMA INICIAL

```sql
-- Tabla principal de negocios
CREATE TABLE negocios (
  id            TEXT PRIMARY KEY,
  nombre        TEXT NOT NULL,
  rubro         TEXT NOT NULL,
  subrubro      TEXT,
  
  -- Ubicación
  comuna        TEXT NOT NULL,
  ciudad        TEXT,
  region        TEXT,
  direccion     TEXT,
  lat           REAL,
  lng           REAL,
  
  -- Contacto público
  telefono      TEXT,
  email         TEXT,
  whatsapp      TEXT,
  
  -- Presencia digital
  sitio_web     TEXT,
  instagram     TEXT,
  facebook      TEXT,
  tiktok        TEXT,
  link_externo  TEXT,
  tipo_link_ext TEXT,
  
  -- Google Maps (ingesta manual)
  gmaps_rating   REAL,
  gmaps_reviews  INTEGER,
  
  -- Clasificación
  estado_presencia  TEXT NOT NULL DEFAULT 'PENDIENTE',
  score             INTEGER DEFAULT 0,
  nivel_oportunidad TEXT DEFAULT 'NO_EVALUADO',
  razones_score     TEXT, -- JSON array
  
  -- CRM
  estado_contacto       TEXT DEFAULT 'NO_CONTACTADO',
  notas                 TEXT,
  fecha_ultimo_contacto TIMESTAMP,
  proximo_seguimiento   TIMESTAMP,
  
  -- Meta
  fuente_descubrimiento TEXT NOT NULL DEFAULT 'manual',
  created_at            TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at            TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tabla de análisis técnicos
CREATE TABLE analisis (
  id                    TEXT PRIMARY KEY,
  negocio_id            TEXT NOT NULL REFERENCES negocios(id),
  
  -- Presencia
  dominio_existe        BOOLEAN,
  dominio_responde      BOOLEAN,
  http_status           INTEGER,
  redirect_url          TEXT,
  
  -- Técnico
  tiene_ssl             BOOLEAN,
  es_responsive         BOOLEAN,
  tecnologia            TEXT,
  plantilla_generica    BOOLEAN,
  
  -- Contenido
  tiene_formulario      BOOLEAN,
  tiene_cta             BOOLEAN,
  tiene_whatsapp_widget BOOLEAN,
  tiene_favicon         BOOLEAN,
  
  -- SEO
  tiene_title           BOOLEAN,
  title_text            TEXT,
  tiene_meta_desc       BOOLEAN,
  meta_desc_text        TEXT,
  tiene_h1              BOOLEAN,
  tiene_sitemap         BOOLEAN,
  tiene_robots_txt      BOOLEAN,
  
  -- Performance
  performance_score     INTEGER,
  lcp_ms                REAL,
  fcp_ms                REAL,
  cls                   REAL,
  
  -- Errores
  errores               TEXT, -- JSON array
  
  -- Meta
  created_at            TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tabla de historial de contactos
CREATE TABLE contactos (
  id          TEXT PRIMARY KEY,
  negocio_id  TEXT NOT NULL REFERENCES negocios(id),
  tipo        TEXT NOT NULL, -- 'llamada', 'email', 'whatsapp', 'visita', 'rrss'
  resultado   TEXT,          -- 'interesado', 'no_interesado', 'no_contesta', 'seguimiento'
  notas       TEXT,
  created_at  TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Índices
CREATE INDEX idx_negocios_rubro ON negocios(rubro);
CREATE INDEX idx_negocios_comuna ON negocios(comuna);
CREATE INDEX idx_negocios_score ON negocios(score DESC);
CREATE INDEX idx_negocios_estado ON negocios(estado_contacto);
CREATE INDEX idx_analisis_negocio ON analisis(negocio_id);
```

---

## 6. CONSIDERACIONES DE RENDIMIENTO

### Rate limiting para análisis
- Máximo **5 análisis concurrentes** para no sobrecargar sitios ajenos.
- **Delay de 2-3 segundos** entre requests al mismo dominio.
- **Timeout de 10 segundos** por request HTTP.
- **Respetar robots.txt** antes de hacer cualquier request.
- **User-Agent honesto**: identificarse como bot de análisis, no simular navegador.

### Caché
- Resultados de análisis se cachean **7 días** antes de re-analizar.
- DNS lookups se cachean **24 horas**.
- Resultados de PageSpeed se cachean **30 días**.

### Queue de procesamiento
- Usar una cola simple (en memoria o Redis) para procesar análisis de forma ordenada.
- Priorizar negocios recién ingresados.
- Permitir re-análisis manual bajo demanda.

---

*Documento de arquitectura técnica — BotPuroCode*
*Última actualización: Marzo 2026*

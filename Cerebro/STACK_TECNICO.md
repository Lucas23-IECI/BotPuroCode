# STACK TÉCNICO — BotPuroCode
## Tecnologías, herramientas y dependencias

---

## 1. STACK RECOMENDADO

### Opción A: Next.js Fullstack (RECOMENDADA)
Ya manejan Next.js (ProyectoPuroCode, FormularioPaginas), así que mantener el stack conocido reduce fricción.

```
Frontend:   Next.js 15 (App Router) + React 19
Estilos:    Tailwind CSS 4 + shadcn/ui
Backend:    Next.js API Routes (Route Handlers)
Base datos: SQLite (Turso) o PostgreSQL (Neon/Supabase)
ORM:        Prisma
Auth:       NextAuth.js / Auth.js v5
Deploy:     Vercel (dashboard) + posible VPS para workers
```

### Opción B: Monorepo separado
Si quieren más control o procesos de análisis pesados:

```
Frontend:   Next.js (dashboard)
Backend:    Node.js + Express/Fastify (API + workers)
Workers:    Bull/BullMQ + Redis (cola de análisis)
Base datos: PostgreSQL
Deploy:     VPS (ya tienen VPSLucas) + Vercel para frontend
```

---

## 2. DEPENDENCIAS CORE

### Framework y base
| Paquete | Uso |
|---------|-----|
| `next` | Framework fullstack |
| `react` / `react-dom` | UI |
| `typescript` | Tipado |
| `prisma` / `@prisma/client` | ORM |

### Estilos y UI
| Paquete | Uso |
|---------|-----|
| `tailwindcss` | Utilidades CSS |
| `shadcn/ui` | Componentes (no es npm, se copia) |
| `lucide-react` | Íconos |
| `recharts` o `chart.js` | Gráficos del dashboard |
| `@tanstack/react-table` | Tabla de leads con filtros/sort/paginación |

### Análisis web (módulos del motor)
| Paquete | Uso |
|---------|-----|
| `dns` (Node.js built-in) | Resolución DNS |
| `node-fetch` o `undici` | HTTP requests para analizar sitios |
| `cheerio` | Parsing de HTML (sin ejecutar JS) |
| `robots-parser` | Leer y respetar robots.txt |
| `ssl-checker` | Verificar certificados SSL |
| `wappalyzer` o heurísticas propias | Detección de tecnología |

### APIs externas
| API | Paquete/endpoint | Uso |
|-----|-------------------|-----|
| PageSpeed Insights | REST API (no necesita npm) | Performance scoring |
| Google Places API | `@googlemaps/google-maps-services-js` | Búsqueda de negocios (Fase 3, pagada) |
| DNS over HTTPS | Cloudflare `1.1.1.1/dns-query` | Resolución DNS |

### Utilidades
| Paquete | Uso |
|---------|-----|
| `zod` | Validación de datos |
| `csv-parse` / `papaparse` | Parseo de CSV para importación |
| `date-fns` | Fechas |
| `nanoid` | IDs únicos |
| `p-queue` / `p-limit` | Control de concurrencia en análisis |

### Auth
| Paquete | Uso |
|---------|-----|
| `next-auth` / `@auth/core` | Autenticación |

---

## 3. BASE DE DATOS — OPCIONES

### Opción 1: SQLite con Turso (recomendada para empezar)
- Ya lo usan en FormularioPaginas y ProyectoPuroCode.
- Gratis hasta cierto nivel.
- Rápido para desarrollo.
- Migrable a PostgreSQL después.

### Opción 2: PostgreSQL con Neon
- Más robusto para queries complejas.
- Free tier generoso.
- Mejor para full-text search y queries geográficas.

### Opción 3: PostgreSQL con Supabase
- Incluye auth, storage, y realtime gratis.
- Pero puede ser overkill para esto.

### Recomendación
Empezar con **SQLite/Turso** (ya lo conocen), y migrar a PostgreSQL si la base crece mucho o necesitan queries geográficas complejas.

---

## 4. HOSTING Y DEPLOY

### Dashboard (Frontend + API)
**Vercel** — ya lo usan, gratis para proyectos personales.
- Deploy automático desde GitHub.
- Serverless functions para la API.
- Edge functions si se necesitan.

### Workers / Análisis en lote
Si el análisis es pesado o se ejecuta en background:
- **Opción 1**: Vercel Cron Jobs (limitado, 1 por día en free).
- **Opción 2**: VPS propio (ya tienen `VPSLucas`) con un worker Node.js.
- **Opción 3**: Railway / Render para un worker dedicado.

### Recomendación para MVP
Todo en **Vercel** con Cron Jobs. Si necesitan más, mover los workers al VPS.

---

## 5. APIS Y COSTOS ESTIMADOS

| Servicio | Free tier | Costo si se excede |
|----------|-----------|-------------------|
| **Vercel** | 100 GB bandwidth, serverless | $20/mes (Pro) |
| **Turso** | 500 DBs, 9 GB storage, 25M rows read | $29/mes (Scaler) |
| **PageSpeed Insights API** | 25,000 queries/día con API key | Gratis |
| **Google Places API** | $200 crédito gratis/mes | ~$17/1000 requests |
| **Cloudflare DNS API** | Ilimitado | Gratis |

### Costo mínimo para MVP: $0/mes
Con Vercel free + Turso free + PageSpeed gratis + DNS gratis.

### Costo si escalan: ~$20-50/mes
Vercel Pro + Turso Scaler + eventual Google Places.

---

## 6. EXTENSIÓN DE CHROME (Fase 3)

### Tecnología
```
Manifest V3
HTML/CSS/JS (popup)
Content Scripts (inyectar en Google Maps)
Chrome Storage API (guardar configuración)
```

### Funcionalidad
- El usuario está en Google Maps.
- Ve un negocio.
- Click en la extensión → formulario pre-llenado con datos visibles.
- Click en "Guardar" → envía a la API de BotPuroCode.
- La extensión NO scrapea automáticamente. Solo facilita la captura manual.

### Esto es legal porque:
- El usuario está viendo los datos manualmente.
- La extensión solo facilita el tipeo (como un "autofill").
- No se automatiza la navegación ni la extracción.

---

## 7. ESTRUCTURA DE PACKAGE.JSON INICIAL

```json
{
  "name": "bot-purocode",
  "version": "0.1.0",
  "private": true,
  "scripts": {
    "dev": "next dev",
    "build": "next build",
    "start": "next start",
    "lint": "next lint",
    "db:push": "prisma db push",
    "db:studio": "prisma studio",
    "db:generate": "prisma generate",
    "db:seed": "tsx scripts/seed.ts",
    "analyze": "tsx scripts/analyze-batch.ts"
  },
  "dependencies": {
    "next": "^15.x",
    "react": "^19.x",
    "react-dom": "^19.x",
    "@prisma/client": "^6.x",
    "cheerio": "^1.x",
    "robots-parser": "^3.x",
    "ssl-checker": "^2.x",
    "csv-parse": "^5.x",
    "zod": "^3.x",
    "nanoid": "^5.x",
    "p-queue": "^8.x",
    "date-fns": "^4.x",
    "lucide-react": "latest",
    "recharts": "^2.x",
    "@tanstack/react-table": "^8.x",
    "next-auth": "^5.x"
  },
  "devDependencies": {
    "typescript": "^5.x",
    "prisma": "^6.x",
    "tsx": "^4.x",
    "@types/node": "^22.x",
    "@types/react": "^19.x",
    "tailwindcss": "^4.x",
    "postcss": "latest",
    "eslint": "^9.x",
    "eslint-config-next": "^15.x"
  }
}
```

---

## 8. VARIABLES DE ENTORNO NECESARIAS

```env
# Database
DATABASE_URL="libsql://xxx.turso.io"
DATABASE_AUTH_TOKEN="xxx"

# Auth
AUTH_SECRET="xxx"
AUTH_URL="http://localhost:3000"

# APIs
PAGESPEED_API_KEY="xxx"
GOOGLE_PLACES_API_KEY="xxx"  # Fase 3, opcional

# App
NEXT_PUBLIC_APP_URL="http://localhost:3000"
```

---

## 9. DECISIONES TÉCNICAS PENDIENTES

| Decisión | Opciones | Estado |
|----------|----------|--------|
| Base de datos | SQLite/Turso vs PostgreSQL/Neon | Por definir |
| Auth | NextAuth vs simple secret | Por definir |
| Workers background | Vercel Cron vs VPS | Por definir |
| Extensión Chrome | MVP o después | Por definir |
| Google Places API | Usar o no | Por definir |
| Monorepo o single | Todo junto vs separado | Por definir |

---

*Stack Técnico — BotPuroCode*
*Última actualización: Marzo 2026*

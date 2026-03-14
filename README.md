# BotPuroCode

Sistema CRM de prospección automatizada para negocios locales sin presencia web. Busca negocios en OpenStreetMap, analiza su presencia digital y los organiza en un pipeline de ventas tipo Kanban.

## Stack

- **Frontend:** Next.js 16, React 19, Tailwind CSS, dnd-kit
- **Backend:** Express 5, TypeScript, Prisma ORM
- **Base de datos:** PostgreSQL (Neon)
- **Hosting:** Vercel (frontend) + Render (backend)

## Estructura del proyecto

```
BotPuroCode/
  backend/          Express API + Prisma
    src/
      routes/       Endpoints REST (negocios, analisis, crm, osm, export)
      services/     Logica de scraping y analisis web
      scripts/      Seeds y utilidades
    prisma/
      schema.prisma Esquema de la BD
  frontend/         Next.js app
    src/
      app/          Paginas (dashboard, leads, pipeline, busqueda, config)
      components/   Componentes reutilizables (toast, score-explainer, sidebar)
      lib/          API client, utilidades
```

## Funcionalidades principales

- Busqueda masiva de negocios por rubro y comuna via OpenStreetMap (Overpass API)
- Analisis automatico de presencia web: SSL, responsive, SEO, performance (PageSpeed)
- Score de oportunidad (0-100) basado en 5 factores ponderados
- Pipeline Kanban con drag & drop para seguimiento comercial
- Historial de contactos CRM (llamadas, emails, WhatsApp, visitas)
- Dashboard con metricas y estadisticas
- Export de datos

## Setup local

### Requisitos

- Node.js 18+
- PostgreSQL (o cuenta gratuita en Neon)

### Backend

```bash
cd backend
npm install
cp .env.example .env    # Configurar DATABASE_URL
npx prisma db push
npx prisma generate
npm run dev              # http://localhost:3001
```

### Frontend

```bash
cd frontend
npm install
npm run dev              # http://localhost:3000
```

### Variables de entorno

**Backend (.env):**

```
DATABASE_URL="postgresql://..."
PORT=3001
FRONTEND_URL="http://localhost:3000"
PAGESPEED_API_KEY=""     # Opcional, Google PageSpeed Insights
```

**Frontend (.env.local):**

```
NEXT_PUBLIC_API_URL="http://localhost:3001/api"
```

## Deploy

| Servicio | Plataforma | Root Directory |
|----------|-----------|----------------|
| Frontend | Vercel | `frontend` |
| Backend | Render | `backend` |
| Base de datos | Neon | -- |

## Licencia

Proyecto privado. Todos los derechos reservados.

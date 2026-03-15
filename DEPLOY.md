# BotPuroCode — Guía de Deploy

## Arquitectura

| Componente | Servicio | URL |
|------------|----------|-----|
| Frontend   | Vercel   | https://bot-puro-code.vercel.app |
| Backend    | Render   | https://botpurocode.onrender.com |
| Base Datos | Neon     | PostgreSQL (sa-east-1) |

## Variables de Entorno

### Backend (Render)

```env
DATABASE_URL=postgresql://...@ep-lucky-silence-acbceqrg-pooler.sa-east-1.aws.neon.tech/neondb?sslmode=require
JWT_SECRET=bpc_s3cr3t_jwt_k3y_2026_purocode
GOOGLE_PLACES_API_KEY=         # Opcional, para enriquecimiento con Google Places
FRONTEND_URL=https://bot-puro-code.vercel.app

# Opcional: Email notifications
SMTP_HOST=
SMTP_PORT=587
SMTP_USER=
SMTP_PASS=
NOTIFICATION_EMAILS=
```

### Frontend (Vercel)

```env
NEXT_PUBLIC_API_URL=https://botpurocode.onrender.com/api
```

## Deploy Backend (Render)

1. Conectar repo `Lucas23-IECI/BotPuroCode` en Render
2. Root directory: `backend`
3. Build command: `npm install && npx prisma generate && npm run build`
4. Start command: `npm start`
5. Configurar variables de entorno listadas arriba

## Deploy Frontend (Vercel)

1. Conectar repo `Lucas23-IECI/BotPuroCode` en Vercel
2. Root directory: `frontend`
3. Framework preset: Next.js
4. Configurar `NEXT_PUBLIC_API_URL`

## Base de Datos (Neon)

La base de datos ya está creada en Neon. Para migrar el schema:

```bash
cd backend
npx prisma db push
```

## Seed de datos iniciales

1. Registrar primer admin: POST `/api/auth/register` con `{ email, nombre, password }`
2. Seed plantillas: POST `/api/plantillas/seed` (requiere auth)

## Comandos útiles

```bash
# Backend - desarrollo local
cd backend && npm run dev

# Frontend - desarrollo local
cd frontend && npm run dev

# Generar Prisma Client
cd backend && npx prisma generate

# Push schema a DB
cd backend && npx prisma db push

# TypeScript check
cd backend && npx tsc --noEmit
cd frontend && npx tsc --noEmit
```

## Credenciales por defecto

- **Email**: contactopurocode@purocode.com
- **Password**: admin123
- Cambiar inmediatamente después del primer login en /config

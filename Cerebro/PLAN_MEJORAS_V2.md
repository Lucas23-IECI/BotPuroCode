# PLAN DE MEJORAS COMPLETO — BotPuroCode v2

Documento de referencia con TODAS las mejoras planificadas.
Resultado de entrevista con el equipo (Marzo 2026).
Se implementa por fases, priorizando lo que mas impacta en la operacion diaria.

---

## DECISIONES CONFIRMADAS

| Tema | Decision |
|------|----------|
| Zona geografica | Todo Chile |
| Deteccion de negocios cerrados | Automatica (cruzar con Google Maps) |
| Scraping de datos de contacto | Google Maps + RRSS |
| Leads sin datos de contacto | Mostrar al final con indicador "sin contacto" |
| Rubros | Los configurados actualmente en la app |
| Fuentes de importacion | OSM, CSV/Excel, Google Maps, Instagram, Facebook — todas |
| Score ponderacion | Mantener actual (Presencia 40, Tecnico 25, Tecnologia 10, Rubro 15, Actividad 10) |
| Analisis automatico | Si, al importar. Con opcion de re-analizar manual |
| Seguidores RRSS | Mostrar cantidad de seguidores |
| Estados pipeline | Los actuales estan bien |
| PDF de propuestas | Si, generar desde la app |
| Recordatorios | Si, con notificaciones |
| Notificaciones | Email (contactopurocode, lucas.mendez, diego.guzman @purocode.com) + WhatsApp Business (+56 9 4925 5006) |
| Usuarios | 2-3 personas (auth + roles basicos) |
| Plantillas WhatsApp | Si, contextuales (adaptar por rubro, presencia, seguidores) |
| Plantillas email | Si |
| Vista mapa | Si, con Leaflet |
| Mobile | Responsive importante (desktop first, mobile funcional) |
| Light mode | Si, ambos modos |
| Metricas dashboard | Todas las posibles que sean utiles |

---

## FASE 1 — CALIDAD DE DATOS

### 1.1 Enriquecimiento con Google Places API
- Cruzar cada negocio con Google Places para: telefono, web, horarios, estado (abierto/cerrado), rating, resenas, fotos, categorias
- Nuevo servicio: `google-places.service.ts`
- Costo: ~$17/1000 req, credit gratis $200/mes = ~11,700 busquedas gratis
- Campos nuevos Prisma: `googlePlaceId`, `horarios`, `estadoGoogle`, `fotosUrl[]`

### 1.2 Scraping de RRSS
- Instagram/Facebook/TikTok: seguidores, ultima publicacion, bio, link en bio, verificado
- Nuevo servicio: `social-scraper.service.ts`
- Campos nuevos: `igFollowers`, `igLastPost`, `fbFollowers`, `fbLastPost`

### 1.3 Deteccion automatica cerrados
- Google Places dice "Permanently closed" -> CERRADO_NO_EXISTE
- Sin coincidencia en Google + sin web/RRSS -> "Verificar manualmente"
- Resenas viejas (2+ anos) + rating < 3 -> flag "Posiblemente cerrado"

### 1.4 Indicador de calidad de datos
- Campo `calidadDatos`: COMPLETO / PARCIAL / MINIMO / SIN_CONTACTO
- SIN_CONTACTO van al final de todas las listas

---

## FASE 2 — AUTH Y MULTI-USUARIO

### 2.1 Auth
- Login email + password (bcrypt + JWT)
- Roles: ADMIN (Lucas) y VENDEDOR (Diego + otros)
- ADMIN: acceso total. VENDEDOR: ver leads, contactar, pipeline, historial

### 2.2 Asignacion de leads
- Campo `asignadoA` (userId)
- Vista "Mis leads" vs "Todos"
- Pipeline filtrable por vendedor

### 2.3 Seguridad
- Middleware auth en todas las rutas
- Rate limiting por usuario
- Audit log de acciones importantes

---

## FASE 3 — PLANTILLAS Y COMUNICACION

### 3.1 Plantillas WhatsApp contextuales
Variables: {nombre}, {rubro}, {comuna}, {problema}, {seguidores}, {rating}
Ejemplos por situacion (sin web, con IG sin web, con web mala)
Boton WhatsApp pre-carga el mensaje en wa.me

### 3.2 Plantillas email
Mismo sistema de variables
Para: primer contacto, seguimiento, envio propuesta, recordatorio

### 3.3 PDF de propuesta
Diagnostico del negocio + solucion propuesta + precio con descuento + CTA
Usando precios reales de PuroCode (Landing $220K, Corporativa $380K, Ecommerce $550K)

---

## FASE 4 — IMPORTACION MULTI-FUENTE

### 4.1 Chrome Extension para Google Maps
### 4.2 CSV/Excel mejorado (preview, mapeo columnas, progreso)
### 4.3 Busqueda directa Google Places (como el buscador OSM pero con Google)
### 4.4 Instagram discovery (buscar por hashtags/ubicacion)

---

## FASE 5 — NOTIFICACIONES Y RECORDATORIOS

### 5.1 Recordatorios (cron job, campo proximoSeguimiento)
### 5.2 Email (Resend/SendGrid/SMTP)
### 5.3 WhatsApp Business API (alertas criticas)
### 5.4 Push notifications navegador

---

## FASE 6 — VISTA DE MAPA

### 6.1 Mapa Leaflet con markers por score, filtros, clusters
### 6.2 Planificador de rutas para visitas presenciales

---

## FASE 7 — UI/UX COMPLETO

### 7.1 Buscar OSM: redesign (dos paneles, cards, preview, filtros post-busqueda)
### 7.2 Ingesta: wizard paso a paso (fuente -> config -> preview -> importar)
### 7.3 Pipeline: cards ricas, slide-over panel, filtros, contadores
### 7.4 Dashboard: KPIs (total, nuevos, conversion, valor pipeline) + graficos (presencia, score, rubros, comunas, funnel, timeline, top 10 calientes, leads vencidos)
### 7.5 Detalle Lead: foto Google, mini mapa, timeline visual, agendar seguimiento
### 7.6 Exportar: preview, selector columnas, PDF
### 7.7 Estadisticas: filtro fecha, vendedor, comparativa periodos
### 7.8 Light mode (next-themes)
### 7.9 Responsive/Mobile (bottom nav, cards en vez de tablas, scroll horizontal pipeline)

---

## ORDEN DE IMPLEMENTACION

1. Fase 7 (UI/UX) — la app se usa diario, debe verse bien
2. Fase 1 (Calidad datos) — sin datos buenos nada sirve
3. Fase 3 (Plantillas) — ahorra mas tiempo en operacion
4. Fase 2 (Auth) — separar acceso para el equipo
5. Fase 4 (Multi-fuente) — mas leads mejor calidad
6. Fase 5 (Notificaciones) — no olvidar seguimientos
7. Fase 6 (Mapa) — util pero no critico
8. Fase 8 (Automatizaciones) — optimizacion final

## ARCHIVOS CLAVE

### Backend nuevos
- services/google-places.service.ts, social-scraper.service.ts, pdf-generator.service.ts, notifications.service.ts, email.service.ts
- routes/auth.ts, plantillas.ts, propuestas.ts, notifications.ts
- middleware/auth.ts
- cron/ (seguimientos, re-analisis)

### Frontend nuevos
- app/mapa/page.tsx, app/login/page.tsx, app/plantillas/page.tsx, app/config/page.tsx

### Frontend a modificar
- Todas las paginas existentes (dashboard, buscar, ingesta, pipeline, leads, detalle, export, estadisticas)
- components/sidebar.tsx (light mode toggle, mobile nav)

### Prisma nuevos
- Campos: googlePlaceId, horarios, estadoGoogle, fotosUrl, calidadDatos, igFollowers, igLastPost, fbFollowers, fbLastPost, asignadoA
- Modelos: User, Plantilla, Propuesta, Notificacion

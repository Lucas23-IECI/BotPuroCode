# PREGUNTAS PARA DEFINIR — BotPuroCode
## Resolver estas preguntas ANTES de empezar a codear

---

## BLOQUE 1: STACK Y ARQUITECTURA

### 1. ¿Base de datos?
- **SQLite/Turso** (ya lo usan, gratis, rápido) → recomendado para MVP
- **PostgreSQL/Neon** (más robusto, mejor para queries complejas)
- ¿Otra?

### 2. ¿Todo en Next.js o backend separado?
- **Next.js fullstack** (API Routes + frontend en un solo proyecto) → más simple
- **Backend separado** (Express/Fastify aparte) → más escalable pero más trabajo

### 3. ¿Dónde se deploya?
- **Vercel** (dashboard + API) → gratis, ya lo conocen
- **VPS propio** (VPSLucas) → más control, pero más trabajo
- **Mixto**: Vercel para dashboard + VPS para workers de análisis

### 4. ¿Auth necesaria desde el MVP?
- ¿Solo ustedes dos lo van a usar?
- ¿Necesitan login o con acceso directo al dominio basta?
- ¿Protección por IP, token, o auth completa?

---

## BLOQUE 2: FUNCIONALIDAD MVP

### 5. ¿Qué es lo MÍNIMO que necesitan funcional para empezar a prospectar?
Opciones:
- a) Solo formulario de ingesta + análisis automático + lista de leads
- b) Formulario + análisis + scoring + filtros
- c) Todo lo anterior + CRM (estados de contacto)
- d) Todo lo anterior + extensión de Chrome

### 6. ¿El análisis debe ser en tiempo real o puede ser async?
- **Real-time**: el usuario ingresa un negocio y espera 30 seg a que termine el análisis.
- **Async**: el usuario ingresa y el análisis corre en background, puede ver el resultado después.
- **Mixto**: análisis rápido inmediato (DNS + SSL) y análisis profundo async (PageSpeed).

### 7. ¿Importación masiva de CSV desde el MVP?
- ¿Van a hacer planillas en Excel/Sheets con los datos de Maps y subirlas?
- ¿O prefieren ingresar uno por uno al inicio?

---

## BLOQUE 3: ZONA Y ESCALA

### 8. ¿Empiezan solo con Gran Concepción?
- ¿O quieren que el sistema soporte cualquier comuna/ciudad de Chile desde el día 1?
- ¿Planean expandir a otros países algún día?

### 9. ¿Cuántos negocios estiman registrar el primer mes?
- 50-100
- 100-500
- 500-1000
- 1000+

### 10. ¿Con qué rubros empiezan?
- ¿Todos los Nivel 1 de una vez?
- ¿Solo 3-5 rubros para empezar (ej: barberías, florería, taller mecánico)?

---

## BLOQUE 4: DISEÑO Y UX

### 11. ¿El dashboard debe ser bonito desde el MVP o funcional y ya?
- **Funcional**: tabla básica con filtros, datos crudos. Se mejora después.
- **Profesional**: dashboard pulido con gráficos, badges, cards. Más trabajo.

### 12. ¿Diseño dark mode, light mode, o ambos?
- Dark → va con la estética de PuroCode
- Light → más legible para trabajo largo
- Ambos → más trabajo

### 13. ¿Necesitan una vista tipo mapa?
- ¿Quieren ver los leads en un mapa? Si sí, hay que integrar mapas (Leaflet/Mapbox).
- ¿O con lista + filtros por comuna basta?

---

## BLOQUE 5: EXTENSIÓN DE CHROME

### 14. ¿La extensión de Chrome es prioridad o puede esperar?
- **Prioridad**: empezar con ella porque el flujo de ingesta manual es lento.
- **Puede esperar**: primero el dashboard, la extensión viene en Fase 3.

### 15. ¿Qué debería hacer la extensión exactamente?
- Solo capturar datos del negocio que estás viendo en Google Maps
- Capturar datos + trigger de análisis inmediato
- Capturar datos + mostrar si ya existe en la base

---

## BLOQUE 6: GOOGLE PLACES API

### 16. ¿Están dispuestos a pagar por Google Places API?
- **Sí**: ~$17/1000 requests. Con el crédito gratis ($200/mes) podrían hacer ~11,700 búsquedas/mes sin costo extra.
- **No**: ingesta 100% manual o con CSV.
- **Después**: cuando validen el modelo y tengan clientes.

### 17. Si sí, ¿cuántas búsquedas por mes estiman?
- Esto define el costo y si el free tier alcanza.

---

## BLOQUE 7: CONTACTO Y VENTAS

### 18. ¿Quieren integrar el pipeline de ventas en este mismo sistema?
- **Sí**: estados de contacto, notas, seguimientos → mini CRM.
- **No**: usan otro sistema para ventas (Notion, Trello, Google Sheets).
- **Después**: primero prospectar, luego CRM.

### 19. ¿Quieren templates de mensajes de prospección?
- Mensajes tipo para WhatsApp, email, Instagram DM, llamada.
- ¿Los generan automáticos basados en el análisis del negocio?

### 20. ¿Quieren generar un "mini reporte" por cada negocio para mostrar al prospecto?
- Un PDF o página web tipo: "Análisis de presencia digital de [Barbería X]"
- Con los problemas detectados y la propuesta de mejora.
- Esto sería una herramienta de venta poderosa.

---

## BLOQUE 8: INTEGRACIONES

### 21. ¿Se conecta con purocode.com o es 100% separado?
- **Separado**: sistema independiente, sin relación con la web principal.
- **Conectado**: comparten DB, auth, o algo.

### 22. ¿Notificaciones?
- ¿Quieren alertas por email cuando se detectan X leads calientes nuevos?
- ¿WhatsApp notifications?
- ¿O solo revisan el dashboard manualmente?

### 23. ¿Exportación a Google Sheets o solo CSV?
- Google Sheets tiene integración directa que puede ser útil.
- CSV es más simple y universal.

---

## BLOQUE 9: NOMBRES Y BRANDING

### 24. ¿BotPuroCode es el nombre definitivo o es nombre de código?
- Si es interno, no importa.
- Si lo van a mostrar a clientes, considerar otro nombre.

### 25. ¿El subdominio sería algo como?
- bot.purocode.com
- leads.purocode.com
- app.purocode.com
- prospector.purocode.com
- otro

---

## PRIORIDAD DE RESPUESTA

Las más urgentes para empezar a codear son:
1. **Pregunta 1** (DB)
2. **Pregunta 2** (arquitectura)
3. **Pregunta 3** (deploy)
4. **Pregunta 5** (MVP scope)
5. **Pregunta 6** (sync vs async)

El resto se puede ir definiendo sobre la marcha.

---

*Preguntas pendientes — BotPuroCode*
*Última actualización: Marzo 2026*

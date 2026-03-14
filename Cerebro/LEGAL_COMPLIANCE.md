# LEGAL Y COMPLIANCE — BotPuroCode
## Marco legal, restricciones y buenas prácticas

---

## 1. RESUMEN EJECUTIVO

Este sistema es una **herramienta interna de prospección comercial**. No es un servicio público, no publica datos de terceros, y no realiza scraping no autorizado. Sin embargo, debe cumplir con:

1. Términos de servicio de las plataformas que se consultan.
2. Legislación chilena de protección de datos personales (Ley 21.719).
3. Buenas prácticas de crawling web (robots.txt, rate limiting).
4. Ética comercial básica (no spam, no engaño).

---

## 2. GOOGLE MAPS — RESTRICCIONES

### ❌ Lo que NO se puede hacer
- **Scraping automatizado** de resultados de Google Maps sin usar la API oficial.
- **Exportar/guardar masivamente** nombres, direcciones, reseñas o fotos obtenidas de Google Maps.
- **Crear un directorio de negocios** basado en datos de Google Maps.
- **Usar datos de Google Maps para un producto publicitario o de venta** de forma directa.

### ✅ Lo que SÍ se puede hacer
- **Usar la API oficial de Google Places** (pagada, dentro de los TOS, con API key).
- **Búsqueda manual** en Google Maps por un humano, registrando datos manualmente.
- **Ingesta manual asistida**: una persona busca en Maps y llena un formulario con los datos que ve (no automatizado).

### Referencia
- [Google Maps Platform Terms of Service](https://cloud.google.com/maps-platform/terms)
- Sección 3.2.3: Restricciones de uso.

---

## 3. INSTAGRAM / META — RESTRICCIONES

### ❌ Lo que NO se puede hacer
- **Scraping automatizado** de perfiles, posts, seguidores o cualquier dato.
- **Crear cuentas automatizadas** para recolectar información.
- **Acceder a datos de Instagram** por medios no autorizados.
- **Usar la API para recolectar datos masivos** sin consentimiento del usuario.

### ✅ Lo que SÍ se puede hacer
- **Consultar la API de Business Discovery** para datos públicos de cuentas profesionales (limitado).
- **Registrar manualmente** la URL del perfil de Instagram que un negocio publica en su Google Maps o sitio web.
- **Verificar si un negocio tiene Instagram** buscando enlaces en su propio sitio web (eso es análisis del sitio, no de Instagram).

### Referencia
- [Términos de uso de Instagram](https://help.instagram.com/581066165581870)
- [Política de la Plataforma Meta](https://developers.facebook.com/terms/)

---

## 4. PROTECCIÓN DE DATOS — CHILE (Ley 21.719)

### Contexto
La Ley 21.719 moderniza la regulación de datos personales en Chile. Fue publicada en 2025 y sus disposiciones principales entran en vigencia en 2027.

### ¿Qué datos son "personales"?
Cualquier dato que identifique o haga identificable a una **persona natural**:
- Nombre del dueño de un negocio
- Email personal
- Teléfono personal
- RUT personal
- Dirección particular

### ¿Qué datos NO son "personales" (generalmente)?
- Nombre comercial del negocio (razón social)
- Dirección comercial del local
- Teléfono del negocio (línea comercial)
- Email comercial (info@, contacto@)
- Sitio web del negocio
- Redes sociales del negocio
- Rating y reseñas públicas (datos ya públicos)

### Recomendaciones para BotPuroCode
1. **Almacenar solo datos del negocio**, no datos personales del dueño.
2. **No guardar RUT** del dueño ni datos personales vinculados a personas naturales.
3. Si se guarda un nombre de contacto, hacerlo como **dato del negocio** (persona de contacto del local), no como dato de persona natural.
4. El teléfono debe ser **el del negocio** (el que está publicado en Google Maps o en su sitio), no el personal del dueño.
5. El email debe ser **comercial** (info@, contacto@), no personal.
6. **No compartir la base de datos** con terceros.
7. **No usar los datos para fines distintos** a la prospección comercial de PuroCode.
8. Tener un mecanismo de **eliminación de datos** si un negocio lo solicita.

### Referencia
- [Ley 21.719 — Biblioteca del Congreso Nacional](https://www.bcn.cl/leychile/navegar?idNorma=1202702)

---

## 5. CRAWLING DE SITIOS WEB — BUENAS PRÁCTICAS

### Reglas que el sistema DEBE seguir

| Regla | Implementación |
|-------|---------------|
| **Respetar robots.txt** | Antes de analizar un sitio, leer su robots.txt y respetar las directivas Disallow |
| **Rate limiting** | Máximo 1 request cada 2-3 segundos al mismo dominio |
| **User-Agent honesto** | Identificarse como `BotPuroCode/1.0 (herramienta de análisis web)` |
| **No seguir enlaces internos masivamente** | Solo analizar la página principal y rutas clave (/, /contacto, /servicios) |
| **Timeout** | 10 segundos máximo por request |
| **No descargar assets pesados** | No descargar imágenes, videos ni archivos grandes |
| **No intentar bypass** | Si el sitio bloquea el bot, respetar y marcar como "no analizable" |
| **No almacenar HTML completo** | Solo almacenar metadatos y resultados del análisis |
| **No ejecutar JavaScript** | Análisis estático del HTML. Si se necesita JS (SPA), usar Lighthouse/PageSpeed API |

### User-Agent recomendado
```
BotPuroCode/1.0 (+https://purocode.com/bot; herramienta interna de análisis web)
```

---

## 6. CONTACTO CON PROSPECTOS — REGLAS

### ✅ Permitido
- Contactar por teléfono comercial publicado.
- Enviar un email comercial a la dirección pública del negocio.
- Enviar un mensaje por WhatsApp al número publicado del negocio.
- Visitar presencialmente el local.
- Contactar por mensaje directo en redes sociales (1 vez, sin insistir).

### ❌ No permitido
- Envío masivo de emails no solicitados (spam).
- Llamadas automatizadas (robocalls).
- Mensajes masivos por WhatsApp (viola TOS de WhatsApp Business).
- Insistir después de un "no" claro.
- Usar información engañosa ("detectamos un problema grave en su sitio" como táctica de miedo).
- Presentar una evaluación interna como un "informe oficial".

### Buena práctica
El contacto debe ser **personalizado, cortés y con valor real**. No masivo.

Ejemplo de enfoque permitido:
> "Hola, somos PuroCode. Vimos que [nombre del negocio] tiene buenas reseñas en Google Maps pero no encontramos un sitio web propio. Nos dedicamos a crear páginas web profesionales para negocios como el suyo. ¿Le interesaría una propuesta sin compromiso?"

---

## 7. ALMACENAMIENTO Y SEGURIDAD DE DATOS

### Base de datos
- La DB debe estar en un entorno **privado y seguro**.
- **No exponer la DB a internet** directamente.
- Usar **conexiones autenticadas** a la DB.
- **Backups regulares** pero sin replicar a servicios no controlados.

### Acceso
- Solo usuarios autorizados de PuroCode pueden acceder al dashboard.
- **Autenticación requerida** (mínimo usuario/contraseña, idealmente OAuth).
- **No compartir credenciales**.

### Eliminación
- Implementar endpoint de eliminación de datos de un negocio.
- Si un negocio solicita ser removido, eliminarlo en un plazo razonable (7 días).
- Mantener un log de eliminaciones (sin los datos eliminados).

---

## 8. CHECKLIST DE COMPLIANCE

Antes de lanzar, verificar:

- [ ] El sistema NO hace scraping automatizado de Google Maps.
- [ ] El sistema NO hace scraping de Instagram.
- [ ] El sistema respeta robots.txt de cada sitio.
- [ ] El sistema usa rate limiting al analizar sitios.
- [ ] El User-Agent es honesto.
- [ ] No se almacenan datos personales de personas naturales (solo datos del negocio).
- [ ] La DB está protegida con autenticación.
- [ ] El dashboard requiere login.
- [ ] Existe mecanismo de eliminación de datos.
- [ ] No se envían comunicaciones masivas automatizadas.
- [ ] Los datos no se comparten con terceros.
- [ ] Se informa claramente al prospecto quién los contacta y por qué.

---

*Marco Legal y Compliance — BotPuroCode*
*Última actualización: Marzo 2026*

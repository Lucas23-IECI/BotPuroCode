# SISTEMA DE SCORING Y ANÁLISIS — BotPuroCode
## Cómo se evalúa y puntúa cada negocio

---

## 1. FILOSOFÍA DEL SCORING

El score NO es un juicio de calidad sobre el negocio. Es una **medida de oportunidad comercial para PuroCode**: qué tan probable es que el negocio necesite y esté dispuesto a contratar un sitio web profesional.

Un score alto = alta oportunidad de venta.
Un score bajo = el negocio ya tiene lo que necesita o no es buen prospecto.

---

## 2. FACTORES DE SCORING

### Factor A: Estado de Presencia Web (máx 40 pts)

| Estado | Puntos | Descripción |
|--------|--------|-------------|
| `SIN_WEB` | 40 | No tiene dominio, no tiene nada online |
| `SOLO_RRSS` | 32 | Solo tiene Instagram/Facebook/TikTok como "web" |
| `LINK_EXTERNO` | 25 | Usa AgendaPro, Linktree, Calendly, etc. como sustituto |
| `WEB_BASICA` | 18 | Tiene web propia pero es muy rudimentaria |
| `WEB_MEDIA` | 8 | Tiene web funcional pero con problemas claros |
| `WEB_BUENA` | 0 | Web decente, poca oportunidad |

### Factor B: Problemas Técnicos (máx 25 pts)

| Problema | Puntos |
|----------|--------|
| Sin SSL (HTTP) | 5 |
| No responsive | 5 |
| Sin formulario de contacto ni CTA | 4 |
| Sin favicon | 1 |
| Performance score < 50 (PageSpeed) | 4 |
| Performance score 50-70 | 2 |
| Sin title tag | 2 |
| Sin meta description | 2 |
| Sin H1 | 1 |
| Sin sitemap.xml | 1 |

### Factor C: Tipo de Tecnología (máx 10 pts)

| Tecnología detectada | Puntos | Razón |
|---------------------|--------|-------|
| WordPress con tema gratis genérico | 10 | Fácil de argumentar mejora |
| Wix gratuito | 8 | Limitaciones evidentes |
| Google Sites | 8 | Muy básico |
| Blogger | 7 | No es web profesional |
| Weebly | 6 | Limitado |
| WordPress con tema premium | 4 | Puede estar bien o mal |
| Shopify básico | 3 | Funcional pero limitado en branding |
| HTML estático sin framework | 6 | Probablemente antiguo |
| Wix premium | 2 | Ya pagaron algo |
| Custom / Framework moderno | 0 | Ya invirtieron en desarrollo |

### Factor D: Rubro (máx 15 pts)

| Nivel de rubro | Puntos | Ejemplos |
|---------------|--------|----------|
| Nivel 1 (Oro puro) | 15 | Barberías, peluquerías, florería, taller mecánico, ferretería |
| Nivel 2 (Muy bueno) | 10 | Veterinaria, dentista, kinesiólogo, boutique, hostal |
| Nivel 3 (Caso a caso) | 5 | Restaurant, gimnasio, servicio técnico |
| Nivel 4 (Menos prioritario) | 0 | Constructora, inmobiliaria, cadena |

### Factor E: Señales de Actividad Comercial (máx 10 pts)

| Señal | Puntos | Cómo se detecta |
|-------|--------|-----------------|
| Tiene Google Maps con reseñas recientes | 3 | Rating y fecha de reseñas |
| Más de 4.0 de rating | 2 | Negocio con buena reputación |
| Más de 50 reseñas | 2 | Negocio activo |
| Tiene teléfono publicado | 1 | Contactable |
| Tiene Instagram activo | 2 | Invierte en presencia pero no en web |

---

## 3. CÁLCULO DEL SCORE TOTAL

```
SCORE = Factor_A + Factor_B + Factor_C + Factor_D + Factor_E
        (máximo teórico = 100)
```

### Niveles de oportunidad

| Score | Nivel | Acción recomendada |
|-------|-------|-------------------|
| 80-100 | 🔴 ALTA | Contactar YA. Lead caliente. |
| 60-79 | 🟡 MEDIA-ALTA | Contactar pronto. Muy buen prospecto. |
| 40-59 | 🟢 MEDIA | Evaluar caso a caso. Puede valer la pena. |
| 20-39 | 🔵 BAJA | Dejar en pipeline. Contactar si no hay mejores. |
| 0-19 | ⚪ NO PRIORITARIO | Ignorar o revisar en 6 meses. |

---

## 4. RAZONES AUTOMÁTICAS

El sistema genera automáticamente una lista de **razones** por las que el negocio es un buen prospecto. Estas se usan internamente y como base para el pitch de venta.

### Ejemplos de razones generadas:

```
✗ No tiene sitio web propio
✗ Solo usa Instagram como presencia digital
✗ Depende de AgendaPro como sustituto de web
✗ Sitio web sin certificado SSL
✗ Sitio web no es responsive (no se ve bien en celular)
✗ No tiene formulario de contacto
✗ No tiene llamada a la acción clara
✗ Usa plantilla WordPress gratuita genérica
✗ Performance muy baja (score: 23/100)
✗ Sin meta description (malo para SEO)
✗ Sin title tag optimizado
✗ Sin favicon (no tiene ícono en el navegador)
✗ Sitio hecho en Wix con limitaciones
✗ Negocio activo (4.7★, 180 reseñas) sin web profesional
```

### Formato de la razón:

```typescript
interface Razon {
  codigo: string;       // 'SIN_WEB', 'SIN_SSL', 'NO_RESPONSIVE', etc.
  descripcion: string;  // Texto legible
  impacto: 'CRITICO' | 'IMPORTANTE' | 'MENOR';
  puntos: number;       // Cuánto sumó al score
}
```

---

## 5. DETECCIÓN DE TECNOLOGÍA — HEURÍSTICAS

### WordPress
```
- URL contiene /wp-admin/ o /wp-login.php
- Meta tag: <meta name="generator" content="WordPress X.X">
- Scripts: /wp-content/, /wp-includes/
- Cookies: wordpress_logged_in, wp-settings
- URL patterns: ?p=123, /category/, /tag/
```

### Wix
```
- Meta tag: <meta name="generator" content="Wix.com Website Builder">
- Scripts: static.parastorage.com, static.wixstatic.com
- URL: *.wixsite.com
- Header: X-Wix-*
```

### Shopify
```
- Meta tag contiene "Shopify"
- Scripts: cdn.shopify.com
- URL: *.myshopify.com
- Cookies: _shopify_*
```

### Squarespace
```
- Scripts: static1.squarespace.com
- Meta: <meta name="generator" content="Squarespace">
- URL: *.squarespace.com
```

### Google Sites
```
- URL: sites.google.com/*
- Estructura HTML específica de Google Sites
```

### Linktree
```
- URL: linktr.ee/*
- Meta: Linktree
```

### AgendaPro
```
- URL: *.agendapro.com
- iFrame de AgendaPro embebido
```

### Blogger
```
- URL: *.blogspot.com
- Meta: <meta name="generator" content="Blogger">
```

---

## 6. DETECCIÓN DE CALIDAD VISUAL — HEURÍSTICAS

No se puede decir objetivamente "este sitio es feo", pero sí se pueden medir señales:

### Indicadores de web de baja calidad
| Señal | Cómo detectar |
|-------|---------------|
| Muy poco CSS | Tamaño total de CSS < 5KB |
| Sin imágenes propias | Solo imágenes de stock o ninguna |
| Solo texto plano | Poca estructura HTML (pocas secciones, sin cards, sin grid) |
| Una sola página | No tiene navegación o solo tiene 1 ruta |
| Sin scripts | 0 archivos JS (puede ser HTML estático puro) |
| Usando plantilla default | Detectar temas WordPress conocidos como "Twenty Twenty-X" |
| Hotlinking imágenes | Imágenes cargadas desde otros dominios |
| Sin media queries | No hay @media en el CSS (no responsive) |
| Layout roto | Elementos que se desbordan (detectable con Lighthouse) |

### Lo que NO se puede detectar automáticamente de forma confiable
- Si los colores "combinan" o se ven "bien".
- Si el diseño es "moderno" o "anticuado" (subjetivo).
- Si las fotos son de buena calidad estéticamente.

---

## 7. PIPELINE DE ANÁLISIS

```
1. Negocio ingresado → estado: PENDIENTE_ANALISIS
   │
2. Resolución de presencia
   │  ├─ Sin web encontrada → SIN_WEB (40 pts) → directo a scoring
   │  ├─ Solo RRSS → SOLO_RRSS (32 pts) → directo a scoring
   │  ├─ Link externo → LINK_EXTERNO (25 pts) → directo a scoring
   │  └─ Tiene web → continuar análisis técnico
   │
3. Análisis técnico del sitio
   │  ├─ SSL check
   │  ├─ Responsive check
   │  ├─ Tech detection
   │  ├─ SEO check
   │  ├─ Content check
   │  ├─ Performance (PageSpeed API)
   │  └─ Design heuristics
   │
4. Scoring: suma de todos los factores
   │
5. Clasificación: asignar nivel + generar razones
   │
6. Guardar en DB → estado: ANALIZADO
```

---

## 8. RE-ANÁLISIS

- **Automático**: cada 30 días para leads en estado NO_CONTACTADO.
- **Manual**: el usuario puede forzar re-análisis en cualquier momento.
- **Post-contacto**: si un lead dice "ya tengo web", se re-analiza y se actualiza.
- **Histórico**: se guarda cada análisis con fecha, para ver evolución.

---

## 9. CONFIGURACIÓN DE PESOS

Los pesos deben ser **configurables** desde el dashboard, para que PuroCode pueda ajustar la fórmula según la experiencia de ventas real.

```typescript
interface ScoringConfig {
  pesos: {
    presencia: {
      SIN_WEB: number;         // default: 40
      SOLO_RRSS: number;       // default: 32
      LINK_EXTERNO: number;    // default: 25
      WEB_BASICA: number;      // default: 18
      WEB_MEDIA: number;       // default: 8
      WEB_BUENA: number;       // default: 0
    };
    tecnico: {
      sinSSL: number;          // default: 5
      noResponsive: number;    // default: 5
      sinFormulario: number;   // default: 4
      sinFavicon: number;      // default: 1
      perfBaja: number;        // default: 4
      perfMedia: number;       // default: 2
      sinTitle: number;        // default: 2
      sinMeta: number;         // default: 2
      sinH1: number;           // default: 1
      sinSitemap: number;      // default: 1
    };
    tecnologia: Record<string, number>;
    rubro: Record<string, number>;
    actividad: {
      tieneResenasRecientes: number;
      ratingAlto: number;
      muchasResenas: number;
      tieneTelefono: number;
      tieneInstagramActivo: number;
    };
  };
  umbrales: {
    ALTA: number;              // default: 80
    MEDIA_ALTA: number;        // default: 60
    MEDIA: number;             // default: 40
    BAJA: number;              // default: 20
  };
}
```

---

*Sistema de Scoring — BotPuroCode*
*Última actualización: Marzo 2026*

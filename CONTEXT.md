# gym-backend — Contexto del Proyecto

## Stack

| Capa | Tecnología |
|------|-----------|
| Runtime | Cloudflare Workers |
| Base de datos | Neon (PostgreSQL serverless) |
| ORM | Drizzle ORM (`drizzle-orm/neon-http`) |
| Migraciones | drizzle-kit (`npx drizzle-kit push`) |
| Despliegue | Wrangler (`npx wrangler deploy`) |
| Tests | Vitest |

---

## Estructura del Proyecto

```
gym-backend/
├── src/
│   ├── index.ts        # Worker principal (fetch handler)
│   └── schema.ts       # Tablas Drizzle (alumnos, asistencias)
├── drizzle/            # Migraciones generadas (auto)
├── drizzle.config.ts   # Config de drizzle-kit
├── wrangler.jsonc      # Config de Cloudflare Workers
├── .dev.vars           # Variables de entorno locales (NO commitear)
└── package.json
```

---

## Variables de Entorno

En `.dev.vars` (local) y en Cloudflare Dashboard (producción):

```
DATABASE_URL=postgresql://<user>:<pass>@<host>.neon.tech/<db>?sslmode=require&channel_binding=require
```

---

## Comandos Clave

```bash
# Desarrollo local
npx wrangler dev          # http://localhost:8787

# Aplicar cambios de schema a Neon
$env:DATABASE_URL="<url>"; npx drizzle-kit push

# Desplegar a Cloudflare
npx wrangler deploy

# Regenerar tipos de bindings
npx wrangler types
```

> **Nota PowerShell**: `drizzle-kit push` necesita que `DATABASE_URL` esté en el entorno de la shell porque drizzle-kit no lee `.dev.vars`. Usa `$env:DATABASE_URL="..."` antes del comando.

---

## Schema Actual

### `alumnos`
| Columna | Tipo | Notas |
|---------|------|-------|
| `id` | UUID | PK, auto |
| `short_id` | TEXT | Único, ej: `#A102` |
| `nombre` | TEXT | — |
| `dni` | TEXT | Único |
| `anio_nacimiento` | INTEGER | Opcional |
| `grupo` | TEXT | Ej: `Adultos mañanas` |
| `med_paper` | BOOLEAN | Default `false` |
| `consent_paper` | BOOLEAN | Default `false` |
| `created_at` | TIMESTAMP | Auto |

### `asistencias`
| Columna | Tipo | Notas |
|---------|------|-------|
| `id` | SERIAL | PK |
| `alumno_id` | UUID | FK → `alumnos.id` |
| `fecha` | DATE | Auto (hoy) |
| `hora` | TIME | Auto (ahora) |
| `metodo` | TEXT | `'qr'` o `'button'` |

---

## CORS

El Worker incluye headers CORS globales para que Angular (`localhost:4200`) pueda conectarse sin bloqueos:

```ts
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
};
```

- Preflight `OPTIONS` respondido con `null` + corsHeaders
- Todos los responses (éxito y error) incluyen `...corsHeaders`

---

## Historial de Sesiones

### Sesión 1 — 2026-03-11
- Creado `src/schema.ts` con tablas `alumnos` y `asistencias`
- Creado `src/index.ts` con conexión Neon + endpoint de prueba `/`
- Instalado `drizzle-kit` y creado `drizzle.config.ts`
- Ejecutado `drizzle-kit push` → tablas creadas en Neon
- Verificado: Worker responde `{ "status": "success", "alumnosEnBaseDeDatos": 0 }`
- Subido a GitHub: https://github.com/HugoCatl/gym-backend
- Añadido CORS global para compatibilidad con Angular (`localhost:4200`)

---

## Pendiente / Próximos Pasos
- [ ] Rutas CRUD para alumnos (crear, listar, editar, eliminar)
- [ ] Endpoint de registro de asistencia (`POST /asistencia`)
- [ ] Generación de `shortId` automática (`#A001`, `#A002`...)
- [ ] Endpoint de historial de asistencias por alumno
- [ ] Despliegue a producción en Cloudflare

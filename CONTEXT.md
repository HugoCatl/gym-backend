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
│   └── schema.ts       # Tablas Drizzle
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

# Aplicar cambios de schema a Neon (PowerShell)
$env:DATABASE_URL="<url>"; npx drizzle-kit push

# Desplegar a Cloudflare
npx wrangler deploy

# Regenerar tipos de bindings
npx wrangler types
```

> **Nota PowerShell**: `drizzle-kit push` necesita `DATABASE_URL` en el entorno de la shell. Usa `$env:DATABASE_URL="..."` antes del comando.

---

## CORS

Headers globales para que Angular (`localhost:4200`) pueda conectarse sin bloqueos:

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

## Schema Actual (v2)

### `usuarios`
| Columna | Tipo | Notas |
|---------|------|-------|
| `id` | UUID | PK, auto |
| `nombre` | TEXT | — |
| `dni` | TEXT | Único |
| `password_hash` | TEXT | Contraseña cifrada |
| `rol` | TEXT | `'alumno'` o `'coach'` |
| `email` | TEXT | Opcional, para el futuro |
| `grupo` | TEXT | Ej: `Adultos mañanas` (null para coach) |
| `med_paper` | BOOLEAN | Default `false` |
| `consent_paper` | BOOLEAN | Default `false` |
| `created_at` | TIMESTAMP | Auto |

### `clases_programadas`
| Columna | Tipo | Notas |
|---------|------|-------|
| `id` | SERIAL | PK |
| `titulo` | TEXT | Ej: `Movilidad Articular` |
| `fecha` | DATE | — |
| `hora_inicio` | TIME | — |
| `hora_fin` | TIME | — |
| `plazas_maximas` | INTEGER | Opcional |

### `reservas`
| Columna | Tipo | Notas |
|---------|------|-------|
| `id` | SERIAL | PK |
| `usuario_id` | UUID | FK → `usuarios.id` |
| `clase_id` | INTEGER | FK → `clases_programadas.id` |
| `fecha_reserva` | TIMESTAMP | Auto |
| `estado` | TEXT | `'apuntado'` \| `'asistio'` \| `'falta'` |

---

## Historial de Sesiones

### Sesión 1 — 2026-03-11
- Creado `src/schema.ts` (v1) con tablas `alumnos` y `asistencias`
- Creado `src/index.ts` con conexión Neon + endpoint de prueba
- Instalado `drizzle-kit` y creado `drizzle.config.ts`
- Ejecutado `drizzle-kit push` → tablas v1 creadas en Neon
- Añadido CORS global para compatibilidad con Angular
- Subido a GitHub: https://github.com/HugoCatl/gym-backend
- **v2 del schema**: migrado a `usuarios`, `clases_programadas`, `reservas` (login + roles + reservas)

---

## Pendiente / Próximos Pasos
- [ ] Endpoint `POST /auth/login` — devuelve JWT
- [ ] Endpoint `POST /usuarios` — registro de alumno/coach
- [ ] Endpoint `GET /clases` — lista de próximas clases
- [ ] Endpoint `POST /reservas` — el alumno se apunta
- [ ] Endpoint `GET /reservas/:claseId` — aforo por clase
- [ ] Despliegue a producción en Cloudflare

import { neon } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-http';
import { eq } from 'drizzle-orm';
import * as schema from './schema';

export interface Env {
  DATABASE_URL: string;
}

// Cabeceras CORS para que Angular y la PWA puedan conectarse sin bloqueos
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
};

// Funciones de ayuda para responder JSON estándar
function jsonResponse(data: any, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

function errorResponse(message: string, status = 400) {
  return jsonResponse({ status: "error", message }, status);
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    if (request.method === "OPTIONS") {
      return new Response(null, { headers: corsHeaders });
    }

    const url = new URL(request.url);
    const path = url.pathname;

    const sql = neon(env.DATABASE_URL);
    const db = drizzle(sql, { schema });

    try {
      // 1. ENDPOINT: LOGIN
      if (path === '/api/login' && request.method === 'POST') {
        const body = await request.json() as any;
        const { dni, password } = body;

        if (!dni || !password) {
          return errorResponse("DNI y contraseña obligatorios");
        }

        const result = await db.select().from(schema.usuarios).where(eq(schema.usuarios.dni, dni));
        const user = result[0];

        // NOTA: Para producción, hashear la contraseña
        if (!user || user.passwordHash !== password) {
          return errorResponse("Credenciales inválidas", 401);
        }

        return jsonResponse({
          status: "success",
          user: {
            id: user.id,
            nombre: user.nombre,
            dni: user.dni,
            rol: user.rol,
            medPaper: user.medPaper,
            consentPaper: user.consentPaper,
          }
        });
      }

      // 2. ENDPOINTS: USUARIOS (Alumnos/Coach)
      if (path.startsWith('/api/usuarios')) {
        // ACTUALIZAR usuario (ej: papeles médicos)
        if (request.method === 'PUT') {
          const id = path.split('/').pop() || '';
          if (!id || id === 'usuarios') return errorResponse("ID requerido", 400);

          const body = await request.json() as any;
          const actualizado = await db.update(schema.usuarios)
            .set(body)
            .where(eq(schema.usuarios.id, id))
            .returning();
          
          return jsonResponse({ status: "success", data: actualizado[0] });
        }

        // CREAR un usuario nuevo (Desde portal del coach)
        if (request.method === 'POST') {
          const body = await request.json() as any;
          const nuevoUsuario = await db.insert(schema.usuarios).values({
            nombre: body.nombre,
            dni: body.dni,
            passwordHash: body.password || "123456", // Contraseña por defecto
            rol: body.rol || "alumno",
            grupo: body.grupo
          }).returning();

          return jsonResponse({ status: "success", data: nuevoUsuario[0] }, 201);
        }

        // OBTENER todos los usuarios (Vista de todos los alumnos en el dashboard del coach)
        if (request.method === 'GET') {
          const listaUsuarios = await db.select({
            id: schema.usuarios.id,
            nombre: schema.usuarios.nombre,
            dni: schema.usuarios.dni,
            rol: schema.usuarios.rol,
            grupo: schema.usuarios.grupo,
            medPaper: schema.usuarios.medPaper,
            consentPaper: schema.usuarios.consentPaper
          }).from(schema.usuarios);
          return jsonResponse({ status: "success", data: listaUsuarios });
        }
      }

      // 3. ENDPOINTS: CLASES (Calendario / Horario)
      if (path === '/api/clases') {
        if (request.method === 'GET') {
          const clases = await db.select().from(schema.clasesProgramadas);
          return jsonResponse({ status: "success", data: clases });
        }
        if (request.method === 'POST') {
          const body = await request.json() as any;
          const nuevaClase = await db.insert(schema.clasesProgramadas).values(body).returning();
          return jsonResponse({ status: "success", data: nuevaClase[0] }, 201);
        }
      }

      // 4. ENDPOINTS: RESERVAS (¡Me apunto!)
      if (path === '/api/reservas') {
        if (request.method === 'GET') {
          const usuarioId = url.searchParams.get('usuarioId');
          if (usuarioId) {
            const misReservas = await db.select().from(schema.reservas).where(eq(schema.reservas.usuarioId, usuarioId));
            return jsonResponse({ status: "success", data: misReservas });
          }
          const todas = await db.select().from(schema.reservas);
          return jsonResponse({ status: "success", data: todas });
        }

        if (request.method === 'POST') {
          const body = await request.json() as any;
          const nuevaReserva = await db.insert(schema.reservas).values({
            usuarioId: body.usuarioId,
            claseId: body.claseId
          }).returning();
          return jsonResponse({ status: "success", data: nuevaReserva[0] }, 201);
        }
      }

      // ROOT Endpoint para comprobar fácilmente desde el navegador
      if (path === '/') {
        return jsonResponse({ 
          status: "success", 
          message: "API de MOVIMENT Backend en funcionamiento",
          endpoints_disponibles: [
            "POST /api/login",
            "GET/POST/PUT /api/usuarios",
            "GET/POST /api/clases",
            "GET/POST /api/reservas"
          ]
        });
      }

      // RUTAS NO ENCONTRADAS
      return errorResponse("Ruta no encontrada", 404);

    } catch (error) {
      console.error(error);
      return errorResponse(String(error), 500);
    }
  },
};

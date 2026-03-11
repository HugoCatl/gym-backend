import { neon } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-http';
import * as schema from './schema';

export interface Env {
  DATABASE_URL: string;
}

// Cabeceras estándar para permitir que Angular se conecte sin bloqueos
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
};

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    // 1. Manejar la petición "pre-flight" (Angular siempre hace esto antes de un POST/GET)
    if (request.method === "OPTIONS") {
      return new Response(null, { headers: corsHeaders });
    }

    const sql = neon(env.DATABASE_URL);
    const db = drizzle(sql, { schema });

    try {
      const listaAlumnos = await db.select().from(schema.alumnos);

      return new Response(JSON.stringify({
        status: "success",
        mensaje: "¡Backend de MOVIMENT conectado y sin CORS!",
        alumnosEnBaseDeDatos: listaAlumnos.length,
        data: listaAlumnos
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" }
      });
    } catch (error) {
      return new Response(JSON.stringify({ status: "error", error: String(error) }), { 
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" }
      });
    }
  },
};

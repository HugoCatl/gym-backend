import { neon } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-http';
import * as schema from './schema';

export interface Env {
  DATABASE_URL: string;
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    // Conectamos a Neon usando la URL que acabas de configurar
    const sql = neon(env.DATABASE_URL);
    const db = drizzle(sql, { schema });

    try {
      // Intentamos obtener los alumnos (estará vacío, pero confirmará la conexión)
      const listaAlumnos = await db.select().from(schema.alumnos);

      return new Response(JSON.stringify({
        status: "success",
        mensaje: "¡Backend de MOVIMENT conectado!",
        alumnosEnBaseDeDatos: listaAlumnos.length
      }), {
        headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" }
      });
    } catch (error) {
      return new Response(JSON.stringify({ status: "error", error: String(error) }), { 
        status: 500,
        headers: { "Content-Type": "application/json" }
      });
    }
  },
};

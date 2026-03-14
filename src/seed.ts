import { neon } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-http';
import * as schema from './schema';
import * as fs from 'fs';
import * as path from 'path';

// Leemos las variables del archivo local para conectar a la BBDD
const varsPath = path.resolve(__dirname, '../.dev.vars');
const vars = fs.readFileSync(varsPath, 'utf8');
const match = vars.match(/DATABASE_URL=(.*)/);
let dbUrl = match ? match[1].trim() : '';

// Limpiar posibles comillas de la URL
if (dbUrl.startsWith('"') && dbUrl.endsWith('"')) {
    dbUrl = dbUrl.substring(1, dbUrl.length - 1);
} else if (dbUrl.startsWith("'") && dbUrl.endsWith("'")) {
    dbUrl = dbUrl.substring(1, dbUrl.length - 1);
}

if (!dbUrl) {
    throw new Error('No se ha encontrado DATABASE_URL en .dev.vars');
}

const sql = neon(dbUrl);
const db = drizzle(sql, { schema });

async function seed() {
    console.log("Limpiando datos antiguos...");
    await db.delete(schema.reservas);
    await db.delete(schema.clasesProgramadas);
    await db.delete(schema.usuarios);

    console.log("Insertando usuarios de prueba...");
    const usuarios = await db.insert(schema.usuarios).values([
        {
            nombre: "Hugo Coach",
            dni: "12345678C",
            passwordHash: "coach123", // simplificado sin encriptar para fase dev
            rol: "coach",
            email: "hugo@moviment.com",
            grupo: null,
            medPaper: true,
            consentPaper: true
        },
        {
            nombre: "Juan Pérez",
            dni: "11111111A",
            passwordHash: "alumno123",
            rol: "alumno",
            email: "juan@example.com",
            grupo: "Adultos L-X",
            medPaper: true,
            consentPaper: false
        },
        {
            nombre: "María López",
            dni: "22222222B",
            passwordHash: "alumno123",
            rol: "alumno",
            email: "maria@example.com",
            grupo: "Adultos M-J",
            medPaper: false,
            consentPaper: true
        }
    ]).returning();

    console.log("Coach insertado con ID:", usuarios[0].id);
    console.log("Alumnos:", usuarios[1].nombre, "y", usuarios[2].nombre);

    console.log("Insertando clases programadas...");
    
    // Fechas en formato YYYY-MM-DD
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(today.getDate() + 1);

    const formatDt = (d: Date) => d.toISOString().split('T')[0];

    const clases = await db.insert(schema.clasesProgramadas).values([
        {
            titulo: "Movilidad y Fuerza",
            fecha: formatDt(today),
            horaInicio: "10:00:00",
            horaFin: "11:00:00",
            plazasMaximas: 10
        },
        {
            titulo: "Entrenamiento Funcional",
            fecha: formatDt(today),
            horaInicio: "18:00:00",
            horaFin: "19:00:00",
            plazasMaximas: 12
        },
        {
            titulo: "Recuperación Activa",
            fecha: formatDt(tomorrow),
            horaInicio: "09:00:00",
            horaFin: "10:00:00",
            plazasMaximas: 8
        }
    ]).returning();

    console.log("Clases creadas (Hoy y Mañana).");

    console.log("Insertando reservas de prueba...");
    await db.insert(schema.reservas).values([
        {
            usuarioId: usuarios[1].id,
            claseId: clases[0].id,
            estado: "apuntado"
        },
        {
            usuarioId: usuarios[2].id,
            claseId: clases[1].id,
            estado: "apuntado"
        }
    ]);

    console.log("Datos iniciales insertados con éxito 🚀!");
}

seed().catch(err => {
    console.error("Error durante el seed:");
    console.error(err);
    process.exit(1);
});

import { pgTable, uuid, text, integer, boolean, timestamp, serial, date, time } from 'drizzle-orm/pg-core';

// Tabla de Alumnos (El corazón de tu app)
export const alumnos = pgTable('alumnos', {
  id: uuid('id').defaultRandom().primaryKey(),
  shortId: text('short_id').unique().notNull(), // Ej: #A102
  nombre: text('nombre').notNull(),
  dni: text('dni').unique().notNull(),
  anioNacimiento: integer('anio_nacimiento'),
  grupo: text('grupo').notNull(), // 'Adultos mañanas', etc.
  medPaper: boolean('med_paper').default(false),
  consentPaper: boolean('consent_paper').default(false),
  createdAt: timestamp('created_at').defaultNow(),
});

// Tabla de Asistencias (Para el histórico y gráficas)
export const asistencias = pgTable('asistencias', {
  id: serial('id').primaryKey(),
  alumnoId: uuid('alumno_id').references(() => alumnos.id),
  fecha: date('fecha').defaultNow(),
  hora: time('hora').defaultNow(),
  metodo: text('metodo').default('button'), // 'qr' o 'button'
});

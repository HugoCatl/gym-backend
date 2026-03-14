import { pgTable, uuid, text, integer, boolean, timestamp, serial, date, time, varchar } from 'drizzle-orm/pg-core';

// 1. Tabla Central de Usuarios (Sirve tanto para Abuelos como para el Coach)
export const usuarios = pgTable('usuarios', {
  id: uuid('id').defaultRandom().primaryKey(),
  nombre: text('nombre').notNull(),
  dni: text('dni').unique().notNull(),
  passwordHash: text('password_hash').notNull(), // Contraseña cifrada
  rol: text('rol').default('alumno').notNull(), // 'alumno' o 'coach'
  email: text('email'), // Placeholder preparado para el futuro
  grupo: text('grupo'), // Ej: 'Adultos mañanas' (puede ser nulo para el coach)
  medPaper: boolean('med_paper').default(false),
  consentPaper: boolean('consent_paper').default(false),
  
  // Nuevos campos de perfil (Onboarding)
  sexo: varchar('sexo', { length: 20 }), // Ej. "masculino", "femenino", "otro"
  edad: integer('edad'),
  telefono: varchar('telefono', { length: 20 }),
  
  // Consentimientos y Legales
  consentimientoDatos: boolean('consentimiento_datos').default(false),
  consentimientoFotos: boolean('consentimiento_fotos').default(false),
  consentimientoRiesgos: boolean('consentimiento_riesgos').default(false),
  
  // Flag útil para el Frontend: indica si ya completó el onboarding
  onboardingCompletado: boolean('onboarding_completado').default(false),

  createdAt: timestamp('created_at').defaultNow(),
});

// 2. Tabla de Clases (El calendario que gestiona el coach)
export const clasesProgramadas = pgTable('clases_programadas', {
  id: serial('id').primaryKey(),
  titulo: text('titulo').notNull(), // Ej: "Movilidad Articular"
  fecha: date('fecha').notNull(),
  horaInicio: time('hora_inicio').notNull(),
  horaFin: time('hora_fin').notNull(),
  plazasMaximas: integer('plazas_maximas'), // Opcional, si hay límite de aforo
});

// 3. Tabla de Reservas (El "¡Me apunto!" del alumno)
export const reservas = pgTable('reservas', {
  id: serial('id').primaryKey(),
  usuarioId: uuid('usuario_id').references(() => usuarios.id).notNull(),
  claseId: integer('clase_id').references(() => clasesProgramadas.id).notNull(),
  fechaReserva: timestamp('fecha_reserva').defaultNow(),
  estado: text('estado').default('apuntado').notNull(), // 'apuntado' | 'asistio' | 'falta'
});

// 4. Tabla de Asistencias Reales (Check-in real del alumno en el gimnasio)
export const asistencias = pgTable('asistencias', {
  id: serial('id').primaryKey(),
  usuarioId: uuid('usuario_id').references(() => usuarios.id).notNull(),
  claseId: integer('clase_id').references(() => clasesProgramadas.id), // Opcional si va por libre
  fecha: date('fecha').notNull(), // Fecha real del entreno: YYYY-MM-DD
  metodo: varchar('metodo', { length: 20 }).default('button'), // ej: "button", "qr"
  createdAt: timestamp('created_at').defaultNow()
});

// app.js (v1 con logs y retry)
const express = require('express');
const cors = require('cors');
const { Pool } = require('pg');
require('dotenv').config();

const app = express();
const port = process.env.PORT || 3002;

// Muestra los valores de entorno clave (útil para verificar que Kubernetes los inyecta correctamente)
console.log('[ENV] POSTGRES_USER:', process.env.POSTGRES_USER);
console.log('[ENV] POSTGRES_HOST:', process.env.POSTGRES_HOST);
console.log('[ENV] POSTGRES_DB:', process.env.POSTGRES_DB);
console.log('[ENV] POSTGRES_PASSWORD:', process.env.POSTGRES_PASSWORD ? '****' : 'No password');
console.log('[ENV] POSTGRES_PORT:', process.env.POSTGRES_PORT);

// Configuración de la conexión a PostgreSQL
const pool = new Pool({
  user: process.env.POSTGRES_USER || 'admin',
  host: process.env.POSTGRES_HOST || 'postgres',
  database: process.env.POSTGRES_DB || 'postgresdb',
  password: process.env.POSTGRES_PASSWORD || 'admin123',
  port: process.env.POSTGRES_PORT || 5432,
});

app.use(cors());

/**
 * Función de reintentos para esperar a que la base de datos esté lista.
 * @param {number} retries - Número de reintentos.
 * @param {number} delay - Tiempo de espera (ms) entre reintentos.
 */
async function waitForDB(retries = 5, delay = 3000) {
  for (let i = 0; i < retries; i++) {
    try {
      console.log(`[DB-INIT] Intentando conexión con la base de datos (intento #${i + 1})...`);
      await pool.query('SELECT 1'); // Prueba sencilla de conexión
      console.log('[DB-INIT] Conexión exitosa a la base de datos.');
      return;
    } catch (error) {
      console.error(`[DB-INIT] Error al conectar a la base de datos en el intento #${i + 1}:`, error);
      if (i < retries - 1) {
        console.log(`[DB-INIT] Reintentando en ${delay / 1000} segundos...`);
        await new Promise((resolve) => setTimeout(resolve, delay));
      } else {
        console.error('[DB-INIT] Se alcanzó el número máximo de reintentos. Abortando.');
        throw error; // Propagamos el error para que sepas que no se pudo conectar
      }
    }
  }
}

/**
 * Función para crear la tabla 'counter' si no existe y dejar una fila inicial.
 */
async function initializeCounter() {
  console.log('[INIT] Iniciando proceso de creación/verificación de la tabla "counter".');
  try {
    // Aseguramos que la DB esté lista antes de seguir
    await waitForDB();

    console.log('[INIT] Creando tabla "counter" si no existe...');
    await pool.query(`
      CREATE TABLE IF NOT EXISTS counter (
        id SERIAL PRIMARY KEY,
        count INTEGER NOT NULL
      )
    `);
    console.log('[INIT] Tabla "counter" creada o ya existente.');

    console.log('[INIT] Verificando si existe la fila con id = 1...');
    const result = await pool.query('SELECT count FROM counter WHERE id = 1');
    if (result.rows.length === 0) {
      console.log('[INIT] No se encontró la fila con id=1. Insertando fila inicial...');
      await pool.query('INSERT INTO counter (id, count) VALUES (1, 0)');
      console.log('[INIT] Fila inicial insertada con count=0.');
    } else {
      console.log('[INIT] Fila con id=1 ya existe. No se inserta nada.');
    }
    console.log('[INIT] Proceso de inicialización completado.');
  } catch (err) {
    console.error('[INIT] Error al inicializar la tabla counter:', err);
  }
}

// Inicializar la tabla al arrancar la aplicación
initializeCounter();

// Ruta que incrementa el contador en la base de datos
app.get('/', async (req, res) => {
  console.log('[ROUTE /] Petición GET recibida. Intentando incrementar el contador...');
  try {
    const updateResult = await pool.query(
      'UPDATE counter SET count = count + 1 WHERE id = 1 RETURNING count'
    );
    if (!updateResult.rows[0]) {
      console.warn('[ROUTE /] La consulta UPDATE no devolvió filas. Es posible que no exista la fila con id=1.');
      return res.status(500).json({ error: 'No se encontró la fila con id=1 en la tabla "counter".' });
    }
    const newCount = updateResult.rows[0].count;
    console.log(`[ROUTE /] Contador actualizado. Nuevo valor: ${newCount}`);
    res.json({ contador: newCount, detalle: '¡Incrementado exitosamente! [v1]' });
  } catch (err) {
    console.error('[ROUTE /] Error al actualizar el contador:', err);
    res.status(500).json({ error: 'Error al actualizar el contador' });
  }
});

app.listen(port, () => {
  console.log(`[SERVER] Servicio de Contador v1 escuchando en http://localhost:${port}`);
});

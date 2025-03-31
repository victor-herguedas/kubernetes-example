// app.js (v2 mejorado con logs y retry)
const express = require('express');
const cors = require('cors');
const { Pool } = require('pg');
require('dotenv').config();

const app = express();
const port = process.env.PORT || 3002;

app.use(cors());

// Mostrar las variables de entorno clave para depuración
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

/**
 * Función de reintentos para esperar a que la base de datos esté lista.
 */
async function waitForDB(retries = 5, delay = 3000) {
  for (let i = 0; i < retries; i++) {
    try {
      console.log(`[DB-INIT] Conexión de prueba a PostgreSQL (intento ${i + 1})...`);
      await pool.query('SELECT 1');
      console.log('[DB-INIT] Conexión exitosa.');
      return;
    } catch (err) {
      console.error(`[DB-INIT] Error al conectar en el intento ${i + 1}:`, err.message);
      if (i < retries - 1) {
        console.log(`[DB-INIT] Esperando ${delay / 1000} segundos antes del próximo intento...`);
        await new Promise((resolve) => setTimeout(resolve, delay));
      } else {
        console.error('[DB-INIT] Todos los intentos fallaron. Abortando inicialización.');
        throw err;
      }
    }
  }
}

// Inicializa la tabla "counter" si no existe y asegura que haya una fila con id = 1
async function initCounter() {
  console.log('[INIT] Iniciando inicialización de la tabla "counter".');
  try {
    await waitForDB();

    console.log('[INIT] Verificando o creando la tabla "counter"...');
    await pool.query(`
      CREATE TABLE IF NOT EXISTS counter (
        id SERIAL PRIMARY KEY,
        count INTEGER NOT NULL
      )
    `);
    console.log('[INIT] Tabla verificada/creada.');

    console.log('[INIT] Buscando fila con id = 1...');
    const result = await pool.query('SELECT count FROM counter WHERE id = 1');
    if (result.rows.length === 0) {
      console.log('[INIT] No existe fila con id = 1. Insertando...');
      await pool.query('INSERT INTO counter (id, count) VALUES (1, 0)');
      console.log('[INIT] Fila insertada correctamente.');
    } else {
      console.log('[INIT] Fila con id = 1 ya existe. No se necesita insertar.');
    }
    console.log('[INIT] Inicialización de tabla completa.');
  } catch (err) {
    console.error('[INIT] Error durante la inicialización de la tabla "counter":', err);
  }
}

// Ejecutar inicialización
initCounter();

// Ruta que incrementa el contador en la base de datos
app.get('/', async (req, res) => {
  console.log('[ROUTE /] Petición recibida. Intentando incrementar contador...');
  try {
    const result = await pool.query(
      'UPDATE counter SET count = count + 100 WHERE id = 1 RETURNING count'
    );
    if (!result.rows[0]) {
      console.warn('[ROUTE /] No se pudo obtener el nuevo valor del contador.');
      return res.status(500).json({ error: 'No se pudo incrementar el contador.' });
    }
    const newCount = result.rows[0].count;
    console.log(`[ROUTE /] Contador actualizado. Nuevo valor: ${newCount}`);
    res.json({ contador: newCount, version: 'v2' });
  } catch (err) {
    console.error('[ROUTE /] Error al actualizar el contador:', err);
    res.status(500).json({ error: 'Error al actualizar el contador' });
  }
});

// Arrancar el servidor
app.listen(port, () => {
  console.log(`[SERVER] Servicio de Contador v2 escuchando en http://localhost:${port}`);
});

const express = require('express');
const cors = require('cors');
const { Pool } = require('pg');
require('dotenv').config();

const app = express();
const port = process.env.PORT || 3002;

app.use(cors());

// Configuración de la conexión a PostgreSQL
const pool = new Pool({
  user: process.env.POSTGRES_USER || 'admin',
  host: process.env.POSTGRES_HOST || 'postgres', // nombre del servicio en Kubernetes
  database: process.env.POSTGRES_DB || 'postgresdb',
  password: process.env.POSTGRES_PASSWORD || 'admin123',
  port: process.env.POSTGRES_PORT || 5432,
});

// Inicializa la tabla "counter" si no existe y asegura que haya una fila con id = 1
async function initCounter() {
  try {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS counter (
        id SERIAL PRIMARY KEY,
        count INTEGER NOT NULL
      )
    `);

    const result = await pool.query('SELECT count FROM counter WHERE id = 1');
    if (result.rows.length === 0) {
      await pool.query('INSERT INTO counter (id, count) VALUES (1, 0)');
    }
    console.log('Tabla "counter" inicializada.');
  } catch (err) {
    console.error('Error al inicializar la tabla counter:', err);
  }
}

initCounter();

// Ruta que incrementa el contador en la base de datos
app.get('/', async (req, res) => {
  const version = req.query.version || '1';
  try {
    const result = await pool.query(
      'UPDATE counter SET count = count + 1 WHERE id = 1 RETURNING count'
    );
    const newCount = result.rows[0].count;
    res.json({ contador: newCount, version });
  } catch (err) {
    console.error('Error al actualizar el contador:', err);
    res.status(500).json({ error: 'Error al actualizar el contador' });
  }
});

app.listen(port, () => {
  console.log(`Servicio de Contador escuchando en http://localhost:${port}`);
});

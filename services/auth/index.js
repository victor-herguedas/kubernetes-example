// index.js (auth-service v1)
const express = require('express');
const cors = require('cors');

const app = express();
app.use(cors());
app.use(express.json()); // Para interpretar JSON en el cuerpo de la petición

// Usuario/contraseña "hardcodeados" para este ejemplo
const VALID_USER = 'admin';
const VALID_PASS = 'admin123';

// Ruta de login: se espera un POST con { username, password }
app.post('/login', (req, res) => {
  const { username, password } = req.body;
  if (username === VALID_USER && password === VALID_PASS) {
    // Generamos un token cualquiera. En la práctica, podrías usar JWT u otro método
    const token = 'abc123';
    return res.json({ ok: true, token });
  }
  // Credenciales inválidas
  return res.status(401).json({ ok: false, error: 'Credenciales inválidas' });
});

// Ruta de prueba (opcional) para verificar token
app.get('/verify', (req, res) => {
  const token = req.header('X-type');
  if (token === 'abc123') {
    return res.json({ ok: true, msg: 'Token válido en auth-service v1' });
  }
  return res.status(403).json({ ok: false, error: 'Token no válido' });
});

const PORT = process.env.PORT || 3005;
app.listen(PORT, () => {
  console.log(`Auth-service v1 escuchando en http://0.0.0.0:${PORT}`);
});

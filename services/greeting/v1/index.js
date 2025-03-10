const express = require('express');
const app = express();
const port = 3001;

// Endpoint de saludo: admite dos versiones según el parámetro "version"
app.get('/saludo', (req, res) => {
  const version = req.query.version || '1';
    res.json({ mensaje: "¡Hola, bienvenido a la App!" });
});

app.listen(port, () => {
  console.log(`Servicio de Saludo escuchando en http://localhost:${port}`);
});

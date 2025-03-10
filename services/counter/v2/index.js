const express = require('express');
const app = express();
const port = 3002;

let contador = 0;

app.get('/contador', (req, res) => {
  const version = req.query.version || '1';
  contador++;  // Incrementa el contador en cada petición
    res.json({ contador });
});

app.listen(port, () => {
  console.log(`Servicio de Contador escuchando en http://localhost:${port}`);
});

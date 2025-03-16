const express = require('express');
const app = express();
var cors = require('cors');
const port = 3002;

app.use(cors())

let contador = 0;

app.get('/', (req, res) => {
  const version = req.query.version || '1';
  contador++;  // Incrementa el contador en cada petición
    res.json({ contador, detalle: "¡Incrementado exitosamente! [v2]" });
});

app.listen(port, () => {
  console.log(`Servicio de Contador escuchando en http://localhost:${port}`);
});

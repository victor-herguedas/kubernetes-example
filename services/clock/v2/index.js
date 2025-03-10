const express = require('express');
const app = express();
const port = 3003;

app.get('/hora', (req, res) => {
  const version = req.query.version || '1';
  const now = new Date();
  
    // Formato HH:mm:ss (24 horas)
    const horaCompleta = now.toLocaleTimeString('es-ES', { hour12: false });
    res.json({ hora: horaCompleta });
});

app.listen(port, () => {
  console.log(`Servicio de Hora escuchando en http://localhost:${port}`);
});

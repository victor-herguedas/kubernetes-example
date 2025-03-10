const express = require('express');
const app = express();
const port = 3003;

app.get('/hora', (req, res) => {
  const version = req.query.version || '1';
  const now = new Date();
  
    // Formato HH:mm (sin segundos)
    const hours = now.getHours().toString().padStart(2, '0');
    const minutes = now.getMinutes().toString().padStart(2, '0');
    res.json({ hora: `${hours}:${minutes}` });
});

app.listen(port, () => {
  console.log(`Servicio de Hora escuchando en http://localhost:${port}`);
});

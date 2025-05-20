// server.js
const express = require('express');
const app = express();

app.use(express.static('.')); // Sirve todos los archivos de la carpeta

const PORT = 3000;
app.listen(PORT, () => {
  console.log(`🚀 Servidor corriendo en: http://localhost:${PORT}`);
});

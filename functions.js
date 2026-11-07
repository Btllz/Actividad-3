const express = require('express');



const app = express();



const PORT = 3000;


app.get('/servidor', (req, res) => {
    res.send('Hola mundo con node y express');
});

app.listen(PORT, () => {
    console.log(`Servidor ejecutandose en el puerto ${PORT}`);
});


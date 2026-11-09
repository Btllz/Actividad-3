require('dotenv').config();

const express = require('express');
const app = express();
const bcryptjs = require('bcryptjs');
const jwt = require('jsonwebtoken');
const fs = require('fs');
const bp = require('body-parser');
const path = require('path');

const PORT = process.env.PORT || 3000;
const llaveSecreta = process.env.JWT_SECRET;
const carpetaData = path.join(__dirname, 'data');
const ruta_tareas = path.join(carpetaData, 'tareas.json');
const ruta_usuarios = path.join(carpetaData, 'users.json');
 
app.use(express.json());


fs.mkdirSync(carpetaData, {recursive: true});

//validar que exista el archivo 'usuarios' en la ruta
if (!fs.existsSync(ruta_usuarios)) {
    fs.writeFileSync(ruta_usuarios, '[]');
} 

//validar que exista el archivo 'tareas' en la ruta
if (!fs.existsSync(ruta_tareas)) {
    fs.writeFileSync(ruta_tareas, '[]');
}

app.get('/prueba', (req, res) =>{
    res.send('Bienvenidos a mi actividad');
});

app.post('/prueba', (req, res) => {
    res.send(req.body);
});


//servidor
app.listen(PORT, () => {
    console.log(`Servidor ejecutandose en el puerto ${PORT}`);
});


const express = require('express');
const https= require('https');
const fs = require('fs').promises;
const path = require('path');
const app = express();
const PORT = 3000;
const jwt = require('jsonwebtoken');

app.get('/', (req, res) => {
    res.send('Sevidor HTTPS funcionando')
});

app.use(express.json());

async function obtenerTareas() {
    const data = await fs.readFile('tareas.json', 'utf-8');
    return JSON.parse(data);
}

application.post('/tareas', (req, res) = > {
    const NuevaTarea = req.body;
    //Lógica de agregar tarea
    res.status(201).send('Tarea creada');
})

app.listen(PORT, () => {
    console.log(`Servidor corriendo en el puerto ${PORT}`);
});


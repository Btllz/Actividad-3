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
app.use(express.static(path.join(__dirname, 'public')));//si piden un archivo que exista en public, entregalo


fs.mkdirSync(carpetaData, {recursive: true});

//validar que exista el archivo 'usuarios' en la ruta
if (!fs.existsSync(ruta_usuarios)) {
    fs.writeFileSync(ruta_usuarios, '[]');
} 

//validar que exista el archivo 'tareas' en la ruta
if (!fs.existsSync(ruta_tareas)) {
    fs.writeFileSync(ruta_tareas, '[]');
}

function obtenerUsuarios() {
    const data = fs.readFileSync(ruta_usuarios, 'utf-8');
    return JSON.parse(data);
}

function obtenerTareas(){
    const data = fs.readFileSync(ruta_tareas, 'utf-8');
    return JSON.parse(data);
}

 function guardarTareas(tareas) {
     fs.writeFileSync(ruta_tareas, JSON.stringify(tareas, null, 2));
}

function guardarUsuarios(users) {
    fs.writeFileSync(ruta_usuarios, JSON.stringify(users, null, 2));
    console.log('Guardado en: ', ruta_usuarios);
}
const todos = [...obtenerUsuarios(), ...obtenerTareas()]; // [...a, ...b] junta dos arreglos en uno
let idCounter = todos.length ? Math.max(...todos.map(x => x.id)) : 0; //todos.map(x => x.id) saca solo los id, math.max encuentra el mayor, si no hay datos empieza en 0
function id(){
    return ++idCounter;
}

function verificarToken(req, res, next){
    const cabecera = req.headers['authorization'];

    if(!cabecera){
        return res.status(401).json({error: 'Falta la token'});
    }

    const token = cabecera.split(' ')[1];
    
    try {
        const datos = jwt.verify(token, llaveSecreta);
        req.usuario = datos;
        next();
    } catch (error){
        console.log(error.message);
        return res.status(401).json({error: 'Token invalido o expirado'});
    }
}


//-------------------------------------------------------------------------------------------------------------
//RUTAS

//-----------------------------------------------------------REGISTER--------------------------------------------------
app.post('/auth/register', async (req, res) => {
    const {correo, password} = req.body;

    if (!correo || !password){
        return res.status(400).json({error: 'Registro de usuario erroneo'});
    }

    const usuarios = obtenerUsuarios();
    const existe = usuarios.find(u => u.correo === correo);
    if (existe) {
        return res.status(409).json({error: 'El usuario ya existe'});
    }

    const passwordHash = await bcryptjs.hash(password, 10);
    const nuevo = {id: id(), correo, password: passwordHash};
    usuarios.push(nuevo);
    guardarUsuarios(usuarios);
    res.status(201).json({id: nuevo.id, correo: nuevo.correo});
});


//------------------------------------------------LOGIN------------------------------------------
app.post('/auth/login', async (req, res) => {
    const {correo, password} = req.body;

    if (!correo || !password){
        return res.status(400).json({error: 'Inicio de sesión erroneo'});
    }

    const usuarios = obtenerUsuarios();
    const usuario = usuarios.find(u => u.correo === correo);
    if (!usuario) {
        return res.status(401).json({error: 'Credenciales invalidas'});
    }

    const coincide = await bcryptjs.compare(password, usuario.password);
    if(!coincide){
        return res.status(401).json({error: 'Credenciales invalidas'});
    }

    const token = jwt.sign(
        {id: usuario.id, correo: usuario.correo},
        llaveSecreta,
        {expiresIn: '1h'}
    );

    res.json({token});
});


//-----------------------------------------------AGREGAR TAREA--------------------------------------------
app.post('/tareas', verificarToken, (req, res) => {
    
    const {nombre , descripcion, fechaInicio, fechaFin, completa} = req.body;

    if(!nombre || !descripcion || !fechaInicio || !fechaFin) {
        return res.status(400).json({error: 'Faltan campos por llenar'});
    }

    const tareas = obtenerTareas();
    const nuevo = {id: id(), usuarioId: req.usuario.id, nombre , descripcion , fechaInicio , fechaFin , completa: completa === true};
    tareas.push(nuevo);
    guardarTareas(tareas);
    res.status(201).json(nuevo);
});

//-------------------------------CADA USUARIO VE SUS PROPIAS TAREAS-----------------------------------------
app.get('/tareas', verificarToken, (req, res) => {
    const tareas = obtenerTareas();
    const misTareas = tareas.filter(t => t.usuarioId === req.usuario.id);
    return res.json(misTareas);
});

if(!llaveSecreta){
    console.error('falta jwt');
    process.exit(1);
}

//-----------------------------------UPDATE--------------------------------------------
app.put('/tareas/:id', verificarToken, (req, res)=>{
    const idTareas = Number(req.params.id);
    // const {nombre, descripcion, fechaInicio, fechaFin, completa} = req.body;
    const tareas = obtenerTareas();

    const tarea = tareas.find(t => t.id === idTareas && t.usuarioId === req.usuario.id);

    if (!tarea){
        return res.status(404).json({error: 'Tarea no encontrada'});
    }

    tarea.nombre = req.body.nombre ?? tarea.nombre;
    tarea.descripcion = req.body.descripcion ?? tarea.descripcion;
    tarea.fechaInicio = req.body.fechaInicio ?? tarea.fechaInicio;
    tarea.fechaFin = req.body.fechaFin ?? tarea.fechaFin;
    tarea.completa = req.body.completa ?? tarea.completa;


    guardarTareas(tareas);

    res.json({mensaje: 'Tarea actualizada', tarea});

});


app.delete('/tareas/:id', verificarToken, (req, res) => {
    
    const tareas = obtenerTareas();
    const idTarea = Number(req.params.id); 
    
    //la tarea cuyo id es el de la URL y cuyo dueño es el usuario del token
    const indice = tareas.findIndex(t => t.id === idTarea && t.usuarioId === req.usuario.id);

    if (indice === -1) {
        return res.status(404).json({error: 'Tarea inexistente'});
    }

    tareas.splice(indice, 1);
    guardarTareas(tareas);
    res.status(204).send();

});

//servidor
app.listen(PORT, () => {
    console.log(`Servidor ejecutandose en el puerto ${PORT}`);
});
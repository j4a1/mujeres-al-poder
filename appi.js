const express = require('express');
const bodyparser = require('body-parser');
const mysql2 = require('mysql2/promise');
const moment = require(('moment'));
const path = require ('path');
const { error } = require('console');
const { send } = require('process');
const session = require(('express-session'));
const cors = require('cors')


const app = express();
app.use(cors())

// Middleware
app.use(bodyparser.urlencoded({ extended: true }));
app.use(bodyparser.json());
app.use(express.static(__dirname)); //

//configurar la sesion
app.use(session({
    secret: 'Miapp',
    resave: false,
    saveUninitialized: true
}));


// Conexión a la base de datos
const db = {
    host: 'localhost',
    user: 'root',
    password: '',
    database: 'mujeres'
};

/* 
db.on("erro",(err) => {

    console.error("error: " + err);
});
 */

// Registrar usuario
app.post('/crear', async (req, res) => {
    const { nombre_usu, tipo_documento, documento, contrasena, fk_Codigo_manzanas } = req.body;

    // Convertir tipo_documento a minúsculas para garantizar compatibilidad con la base de datos
    const tipoDocumentoValido = tipo_documento.toLowerCase();

    let conect;
    try {
        conect = await mysql2.createConnection(db);

        // Verificar si el usuario ya existe
        const [verificar] = await conect.execute(
            'SELECT * FROM usuario WHERE documento = ? AND tipo_documento = ?',
            [documento, tipoDocumentoValido]
        );

        if (verificar.length > 0) {
            return res.status(409).send(`
                <script>
                window.onload = function() {
                    alert("Usuario ya existe");
                    window.location.href = './login.html';
                }
                </script>
            `);
        }

        // Insertar nuevo usuario (sin especificar Rol, se usará el valor predeterminado)
        await conect.execute(
            `INSERT INTO usuario (nombre_usu, tipo_documento, documento, contrasena, fk_Codigo_manzanas) 
             VALUES (?, ?, ?, ?, ?)`,
            [nombre_usu, tipoDocumentoValido, documento, contrasena, fk_Codigo_manzanas]
        );

        return res.status(201).send(`
            <script>
            window.onload = function() {
                alert("Usuario registrado exitosamente");
                window.location.href = './login.html';
            }
            </script>
        `);
    } catch (err) {
        console.error('Error en el servidor:', err);
        return res.status(500).send('Error en el servidor');
    } finally {
        if (conect) {
            await conect.end(); // Cerrar conexión
        }
    }
});


// Ruta para ingresar usuario
app.post('/ingreso', async (req, res) => {
    const { documento, tipo_documento, contrasena } = req.body; // Obtener los datos del formulario
    console.log('Datos recibidos:', req.body); // Verificar los datos que se están recibiendo

    // Eliminar espacios en blanco de los valores que vienen en el formulario
    const documentoTrimmed = documento.trim();
    const tipo_documentoTrimmed = tipo_documento.trim();
    const contrasenaTrimmed = contrasena.trim();

    console.log(`Consultando con: documento = ${documentoTrimmed}, tipo_documento = ${tipo_documentoTrimmed}, contrasena = ${contrasenaTrimmed}`);

    let conect;

    try {
        conect = await mysql2.createConnection(db);
        
        // Realizar la consulta a la base de datos
        const [datos] = await conect.execute(
            'SELECT * FROM usuario WHERE documento = ? AND tipo_documento = ? AND contrasena = ?',
            [documentoTrimmed, tipo_documentoTrimmed, contrasenaTrimmed]
        );

        console.log('Resultado de la consulta:', datos); // Verificar lo que devuelve la consulta

        if (datos.length > 0) {
            const usuario = datos[0];
            console.log('Ingreso exitoso');
            console.log(`Nombre de usuario: ${usuario.nombre_usu}`);
            console.log(`Contraseña: ${usuario.contrasena}`);
            console.log(`Rol: ${usuario.Rol}`);

            // Guardar la sesión del usuario
            req.session.usuario = usuario.nombre_usu;
            req.session.documento = usuario.documento;

            // Redirigir dependiendo del rol
            if (usuario.Rol === 'Administrador') {
                return res.sendFile(path.join(__dirname, 'admin.html'));  // Redirigir a admin
            } else {
                return res.sendFile(path.join(__dirname, 'servicio.html'));  // Redirigir a servicio
            }
        } else {
            return res.status(401).send('Usuario o contraseña incorrectos');
        }
    } catch (err) {
        console.error('Error en el servidor:', err);
        return res.status(500).send('Error en el servidor');
    } finally {
        if (conect) {
            await conect.end(); // Cerrar conexión
        }
    }
});





// Ruta para obtener usuario desde la sesión
app.get('/obtener-usuario', (req, res) => {
    const usuario = req.session.usuario;
    if (usuario) {
        res.json({ nombre: usuario });
    } else {
        res.status(401).send('Usuario no autenticado');
    }
});

// Ruta para obtener servicios de un usuario
app.post('/obtener_Servicios_Usu', async (req, res) => {
    const usuario = req.session.usuario;

    if (!usuario) {
        return res.status(401).send("Sesión no válida");
    }

    try {
        const conect = await mysql2.createConnection(db);
        const [datos] = await conect.execute(`
            SELECT servicios.Nombre_servicio
            FROM servicios
            INNER JOIN manzanas_servicios on manzanas_servicios.fk_codigo_servicios1 = servicios.Codigo_servicios
            INNER JOIN manzanas ON manzanas.Codigo_manzanas = manzanas_servicios.fk_codigo_manzanas1
            INNER JOIN usuario on manzanas.Codigo_manzanas = usuario.fk_Codigo_manzanas
            WHERE usuario.nombre_usu = ?`, [usuario]);

        res.json({ servicios: datos.map(hijo => hijo.Nombre_servicio) });
        await conect.end();
    } catch (error) {
        console.error("Error en el servidor:", error);
        res.status(500).send("Error en el servidor");
    }
});

// Ruta para guardar servicios del usuario
app.post('/guardar-Servicios_Usu', async (req, res) => {
    const { servicios, fechaHora } = req.body;

    try {
        if (!servicios || servicios.length === 0 || !fechaHora) {
            return res.status(400).send("Datos faltantes: servicios o fecha y hora");
        }

        if (!req.session.documento) {
            return res.status(401).send("Sesión no válida");
        }

        const conect = await mysql2.createConnection(db);

        // Obtener Código_mujer
        const [usuarioData] = await conect.execute(
            'SELECT Codigo_mujer FROM usuario WHERE documento = ?',
            [req.session.documento]
        );
        if (usuarioData.length === 0) {
            return res.status(404).send("Usuario no encontrado");
        }
        const Codigo_mujer = usuarioData[0].Codigo_mujer;

      
        const formattedFechaHora = new Date(fechaHora).toISOString().slice(0, 19).replace("T", " ");

        for (let servicio of servicios) {
            // Obtener Código_servicios
            const [servicioData] = await conect.execute(
                'SELECT Codigo_servicios FROM servicios WHERE Nombre_servicio = ?',
                [servicio]
            );
            if (servicioData.length === 0) {
                return res.status(404).send(`Servicio ${servicio} no encontrado`);
            }
            const Codigo_servicios = servicioData[0].Codigo_servicios;

            // Validar que no haya valores undefined
            if (!formattedFechaHora || !Codigo_mujer || !Codigo_servicios) {
                console.error('Datos inválidos:', { formattedFechaHora, Codigo_mujer, Codigo_servicios });
                return res.status(400).send("Datos inválidos para la consulta");
            }

            // Insertar en solicitudes
            await conect.execute(
                'INSERT INTO solicitudes (Hora_asistencia, fk_Codigo_mujer2, fk_Codigo_servicios) VALUES (?, ?, ?)',
                [formattedFechaHora, Codigo_mujer, Codigo_servicios]
            );
        }

        res.status(200).send('Servicios guardados correctamente');
    } catch (error) {
        console.error('Error al guardar los servicios:', error.message);
        res.status(500).send('Error interno del servidor');
    }
});


// Ruta para listar servicios de un usuario
app.post('/Listar-servicios-usuario', async (req, res) => {
    const Documento = req.session.documento; 

    try {
        const conect = await mysql2.createConnection(db);  // Crear la conexión a la base de datos

       
        const [resultados] = await conect.execute(
            `SELECT s.Nombre_servicio, 
                    DATE_FORMAT(so.Hora_asistencia, '%Y-%m-%d %H:%i:%s') AS Dia_Hora
             FROM servicios s
             INNER JOIN solicitudes so ON s.Codigo_servicios = so.fk_Codigo_servicios
             INNER JOIN usuario u ON u.Codigo_mujer = so.fk_Codigo_mujer2
             WHERE u.documento = ?`, 
            [Documento]
        );

        console.log("Servicios obtenidos:", resultados);

        if (resultados.length > 0) {
            // Si hay servicios asociados al usuario
            res.json({ servicios_lista: resultados });
        } else {
            // Si no hay servicios, enviar mensaje adecuado
            res.status(404).send('No tienes servicios guardados');
        }

        await conect.end(); // Cerrar la conexión

    } catch (error) {
        console.error("Error en el servidor:", error);
        res.status(500).send("Error en el servidor");
    }
});
app.get('/obtenerUsuarios',async(req, res)=>{
    //obtener usuarios
    try {
        const query ='SELECT * FROM usuario';

        const conect = await mysql2.createConnection(db);  
        const [usuarios] = await conect.execute(query);
        res.status(200).json(usuarios)
    } catch (error) {
        console.error("Error en el servidor:", error);
        res.status(500).send("Error en el servidor");
    }

        
})
//eliminar usuario
app.delete('/eliminarUsuario',async(req,res)=>{
    try{
        const {Codigo_usuario}=req.body;
        const query ='DELETE FROM usuario WHERE Codigo_usuario=?';
        const conect = await mysql2.createConnection(db);  
        const [borrarUsuarios] = await conect.execute(query,[Codigo_usuario]);
        res.status(200).json(borrarUsuarios)
    }catch (error) {
        console.error("Error en el servidor:", error);
        res.status(500).send("Error en el servidor");
    }
})


app.put('/putUsuario', sync(req, res)=>{
    try{
        const query=''
    }
})

// ruta para cerrar sesion
app.get('/cerrar-sesion', (req, res) => {
    // Eliminar la sesión del usuario
    req.session.destroy((err) => {
        if (err) {
            console.error('Error al destruir la sesión:', err);
            return res.status(500).send('Error al cerrar sesión');
        }
        
        // Redirigir al usuario a la página de login o inicio
        res.redirect('/login.html');  
    });
});
// Ruta para actualizar un servicio
app.put('/api/servicios/:id', async (req, res) => {
    try {
        const servicioId = parseInt(req.params.id);
        const { nombre, descripcion } = req.body;

        // Verificación de los datos de entrada
        if (!nombre || !descripcion) {
            return res.status(400).json({ error: 'Faltan datos: nombre y descripción son obligatorios.' });
        }

        // Conectar a la base de datos
        const conect = await mysql2.createConnection(db);

        // Verificar si el servicio existe
        const [servicioExistente] = await conect.execute('SELECT * FROM servicios WHERE Codigo_servicios = ?', [servicioId]);

        if (servicioExistente.length === 0) {
            return res.status(404).json({ error: 'Servicio no encontrado.' });
        }

        // Actualizar el servicio
        await conect.execute(
            'UPDATE servicios SET Nombre_servicio = ?, Descripcion = ? WHERE Codigo_servicios = ?',
            [nombre, descripcion, servicioId]
        );

        // Responder con el servicio actualizado
        res.status(200).json({ message: 'Servicio actualizado exitosamente', servicio: { id: servicioId, nombre, descripcion } });

        await conect.end();  // Cerrar la conexión
    } catch (error) {
        console.error('Error al procesar la solicitud:', error);
        res.status(500).json({ error: 'Error en el servidor, por favor intenta más tarde.' });
    }
});
// Apertura del servidor
app.listen(3000, () => {
    console.log('Servidor Node.js escuchando en el puerto 3000');
});
















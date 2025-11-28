require('dotenv').config(); 
const express = require('express');
const cors = require('cors');

// Importamos tus funciones de la carpeta functions
const obtenerFotos = require('./functions/obtenerFotos');
const proxyImagen = require('./functions/proxyImagen');

const app = express();
app.use(cors());

// Servir el index.html
app.use(express.static('.'));

// --- ADAPTADOR NETLIFY -> EXPRESS ---
// Esto convierte el formato de Netlify para que funcione en tu PC
const netlifyAdapter = (netlifyFunction) => async (req, res) => {
    try {
        // Simulamos el evento que Netlify enviaría
        const event = { queryStringParameters: req.query };
        
        // Ejecutamos tu función
        const result = await netlifyFunction.handler(event, {});

        // Devolvemos la respuesta
        res.status(result.statusCode);
        res.set(result.headers);

        if (result.isBase64Encoded) {
            res.send(Buffer.from(result.body, 'base64'));
        } else {
            res.send(result.body);
        }
    } catch (error) {
        console.error("Error local:", error);
        res.status(500).json({ error: error.message });
    }
};

// Rutas locales
app.get('/api/photos', netlifyAdapter(obtenerFotos));
app.get('/api/proxy-image', netlifyAdapter(proxyImagen));

app.listen(3000, () => {
    console.log('--------------------------------------------------');
    console.log('💻 Modo Local Activo');
    console.log('🌍 Abre: http://localhost:3000');
    console.log('--------------------------------------------------');
});
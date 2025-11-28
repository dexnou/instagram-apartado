const axios = require('axios');

exports.handler = async (event, context) => {
    const url = event.queryStringParameters.url;

    if (!url) return { statusCode: 400, body: "Falta URL" };

    try {
        // Descargamos la imagen como un "buffer" (datos binarios)
        const response = await axios.get(url, { responseType: 'arraybuffer' });
        
        // La convertimos a base64 porque las Lambda Functions viajan como texto
        const imageBase64 = Buffer.from(response.data, 'binary').toString('base64');

        return {
            statusCode: 200,
            headers: { 
                "Content-Type": "image/jpeg",
                "Access-Control-Allow-Origin": "*"
            },
            body: imageBase64,
            isBase64Encoded: true // Importante decirle a Netlify que esto es una imagen
        };
    } catch (error) {
        return { statusCode: 500, body: "Error cargando imagen" };
    }
};
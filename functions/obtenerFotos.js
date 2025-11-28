const { ApifyClient } = require('apify-client');

exports.handler = async (event, context) => {
    // Permitir CORS (para que funcione desde cualquier lado)
    const headers = {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type',
    };

    const username = event.queryStringParameters.username;

    if (!username) {
        return { statusCode: 400, headers, body: JSON.stringify({ error: "Falta el usuario" }) };
    }

    // AQUI ESTÁ EL TRUCO: Usamos process.env para no exponer la clave
    const client = new ApifyClient({
        token: process.env.APIFY_TOKEN, 
    });

    try {
        // Ejecutamos el Scraper
        const run = await client.actor("apify/instagram-scraper").call({
            directUrls: [`https://www.instagram.com/${username}/`],
            resultsType: "posts",
            resultsLimit: 30, // Traemos 30 fotos de golpe
        });

        // Obtenemos resultados
        const { items } = await client.dataset(run.defaultDatasetId).listItems();
        
        // Limpiamos los datos
        const photos = items.map(post => {
            const imageUrl = post.displayUrl || post.url || post.thumbnailUrl;
            return {
                id: post.id,
                url: imageUrl, 
                caption: post.caption,
                likes: post.likesCount
            };
        }).filter(p => p.url);

        return {
            statusCode: 200,
            headers,
            body: JSON.stringify(photos)
        };

    } catch (error) {
        console.error(error);
        return { 
            statusCode: 500, 
            headers, 
            body: JSON.stringify({ error: error.message || "Error desconocido en Apify" }) 
        };
    }
};
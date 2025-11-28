const { ApifyClient } = require('apify-client');

exports.handler = async (event, context) => {
    // Headers para evitar problemas de CORS
    const headers = {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type',
    };

    const username = event.queryStringParameters.username;

    if (!username) {
        return { statusCode: 400, headers, body: JSON.stringify({ error: "Falta el usuario" }) };
    }

    const client = new ApifyClient({
        token: process.env.APIFY_TOKEN, 
    });

    try {
        // --- CAMBIO IMPORTANTE: Usamos un Actor diferente (Más rápido y resistente) ---
        // Usamos "apify/instagram-api-scraper" en lugar del scraper normal.
        const run = await client.actor("apify/instagram-api-scraper").call({
            usernames: [username], // Este actor prefiere "usernames" en vez de directUrls
            resultsLimit: 12,      // Pedimos 12 para tener margen
        });

        // Obtenemos los resultados
        const { items } = await client.dataset(run.defaultDatasetId).listItems();
        
        // Filtramos y limpiamos los datos (Este actor devuelve una estructura distinta)
        const photos = items.map(post => {
            // Este actor a veces devuelve la URL en 'displayUrl' o dentro de 'images'
            let imageUrl = post.displayUrl || post.url;
            
            // Si no está directa, a veces viene en versions (calidad alta)
            if (!imageUrl && post.display_url) imageUrl = post.display_url;

            return {
                id: post.id,
                url: imageUrl, 
                caption: post.caption || (post.edge_media_to_caption?.edges[0]?.node?.text) || "",
                likes: post.likesCount || post.edge_media_preview_like?.count || 0
            };
        }).filter(p => p.url); // Solo devolvemos los que tengan URL válida

        return {
            statusCode: 200,
            headers,
            body: JSON.stringify(photos)
        };

    } catch (error) {
        console.error("Error Apify:", error);
        return { 
            statusCode: 500, 
            headers, 
            body: JSON.stringify({ error: "Instagram bloqueó la conexión o tardó demasiado." }) 
        };
    }
};
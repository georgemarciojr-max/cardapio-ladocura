// VERSÃO FINAL - Corrigindo o "C" maiúsculo em "driverCategory" para "c" minúsculo

exports.handler = async function(event) {
    if (event.httpMethod !== 'POST') {
        return { statusCode: 405, body: 'Method Not Allowed' };
    }

    const { category, street, number, neighborhood } = JSON.parse(event.body);

    const clientId = process.env.JUMA_CLIENT_ID;
    const clientSecret = process.env.JUMA_SECRET;

    if (!clientId || !clientSecret) {
        return { statusCode: 500, body: JSON.stringify({ error: "Credenciais do servidor não configuradas." }) };
    }

    try {
        const tokenResponse = await fetch('https://api.dev.jumaentregas.com.br/auth/token', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ "clientid": clientId, "secret": clientSecret })
        });
        const tokenData = await tokenResponse.json();
        if (!tokenResponse.ok) throw new Error('Falha na autenticação com a Juma.');
        const accessToken = tokenData.token;
        
        // --- A CORREÇÃO FINAL ESTÁ AQUI ---
        const requestBody = {
            "drivercategory": parseInt(category, 10), // Corrigido para "c" minúsculo
            "address": {
                "street": street,
                "number": number,
                "neighborhood": neighborhood,
                "city": "Porto Velho",
                "state": "RO"
            },
            "latitude": 0,
            "longitude": 0,
            "return": false
        };
        
        const freteResponse = await fetch('https://api.dev.jumaentregas.com.br/destinations', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${accessToken}`
            },
            body: JSON.stringify(requestBody)
        });

        const freteData = await freteResponse.json();

        if (!freteResponse.ok) {
            const errorMessage = freteData.message || 'Erro da API Juma.';
            throw new Error(Array.isArray(errorMessage) ? errorMessage.join(', ') : errorMessage);
        }
        
        return {
            statusCode: 200,
            body: JSON.stringify(freteData)
        };

    } catch (error) {
        return {
            statusCode: 500,
            body: JSON.stringify({ error: error.message })
        };
    }
};

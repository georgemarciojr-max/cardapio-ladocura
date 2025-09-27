// Função de backend final para o projeto La Doçura

exports.handler = async function(event) {
    if (event.httpMethod !== 'POST') {
        return { statusCode: 405, body: 'Method Not Allowed' };
    }

    const { street, number, neighborhood, cep } = JSON.parse(event.body);
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
        
        const requestBody = {
            "drivercategory": 3, // Categoria Padrão (Moto com bag)
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
            headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${accessToken}` },
            body: JSON.stringify(requestBody)
        });

        const freteData = await freteResponse.json();

        if (!freteResponse.ok) {
            const errorMessage = freteData.message || 'Erro da API Juma.';
            throw new Error(Array.isArray(errorMessage) ? errorMessage.join(', ') : errorMessage);
        }
        
        return {
            statusCode: 200,
            body: JSON.stringify(freteData) // Retorna o objeto completo com { cost: VALOR }
        };

    } catch (error) {
        return {
            statusCode: 500,
            body: JSON.stringify({ error: error.message })
        };
    }
};

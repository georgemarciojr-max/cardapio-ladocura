// VERSÃO FINAL - Baseada no exemplo funcional do desenvolvedor

exports.handler = async function(event) {
    if (event.httpMethod !== 'POST') {
        return { statusCode: 405, body: 'Method Not Allowed' };
    }

    // Os dados vêm separados do formulário
    const { category, street, number, neighborhood } = JSON.parse(event.body);

    const clientId = process.env.JUMA_CLIENT_ID;
    const clientSecret = process.env.JUMA_SECRET;

    if (!clientId || !clientSecret) {
        return { statusCode: 500, body: JSON.stringify({ error: "Credenciais do servidor não configuradas." }) };
    }

    try {
        // ETAPA 1: OBTER O BEARER TOKEN (Funcionando)
        const tokenResponse = await fetch('https://api.dev.jumaentregas.com.br/auth/token', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ "clientid": clientId, "secret": clientSecret })
        });
        const tokenData = await tokenResponse.json();
        if (!tokenResponse.ok) throw new Error('Falha na autenticação com a Juma.');
        const accessToken = tokenData.token;

        // ETAPA 2: CALCULAR O FRETE COM O NOVO FORMATO
        
        // --- A ESTRUTURA FINAL E CORRETA ESTÁ AQUI ---
        const requestBody = {
            "driverCategory": parseInt(category, 10),
            "address": {
                "street": street,
                "number": number,
                "neighborhood": neighborhood,
                "city": "Porto Velho", // A cidade é fixa
                "state": "RO"         // O estado é fixo
            },
            "latitude": 0,    // Usando o atalho "manda 0"
            "longitude": 0,   // Usando o atalho "manda 0"
            "return": false   // Campo do exemplo dele
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
        
        // SUCESSO!
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

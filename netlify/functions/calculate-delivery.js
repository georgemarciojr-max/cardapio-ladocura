// VERSÃO FINAL - Corrigindo o valor de "paymentType" para "DINHEIRO"

exports.handler = async function(event) {
    if (event.httpMethod !== 'POST') {
        return { statusCode: 405, body: 'Method Not Allowed' };
    }

    const { category, street, number, neighborhood, cep } = JSON.parse(event.body);

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

        // --- A MUDANÇA FINAL ESTÁ AQUI ---
        const requestBody = {
            "origin": {
                "address": "Rua José Faid, 800 - Jardim Santana, Porto Velho - RO, 76828-325",
                "latitude": 0,
                "longitude": 0
            },
            "destination": {
                "address": `${street}, ${number} - ${neighborhood}, Porto Velho - RO, ${cep}`,
                "latitude": 0,
                "longitude": 0
            },
            "driverCategory": parseInt(category, 10),
            "paymentType": "DINHEIRO" // Trocamos "ON_DELIVERY" por "DINHEIRO"
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

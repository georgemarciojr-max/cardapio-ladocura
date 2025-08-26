// VERSÃO FINAL CORRIGIDA - Autenticação com Bearer Token e chaves em camelCase

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
        // --- ETAPA 1: OBTER O BEARER TOKEN ---
        
        const tokenResponse = await fetch('https://api.dev.jumaentregas.com.br/auth/token', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                // --- CORREÇÃO CRÍTICA AQUI ---
                // Alterado de "client_id" para "clientId" e "client_secret" para "secret"
                "clientId": clientId,
                "secret": clientSecret
            })
        });

        const tokenData = await tokenResponse.json();

        if (!tokenResponse.ok) {
            console.error("Erro ao obter o token:", tokenData);
            throw new Error('Falha na autenticação com a Juma. Verifique as credenciais.');
        }

        const accessToken = tokenData.token; // Corrigido para "token" com base na foto

        // --- ETAPA 2: CALCULAR O FRETE USANDO O TOKEN ---

        const requestBody = {
            "origin": {
                "address": "Rua Francisco Said, 800 - Jardim Santana, Porto Velho - RO, 76828-325"
            },
            "destination": {
                "address": `${street}, ${number} - ${neighborhood}, Porto Velho - RO, ${cep}`
            }
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
            console.error("Erro da API Juma ao calcular o frete:", freteData);
            throw new Error(freteData.message || 'Erro da API Juma ao calcular o frete.');
        }
        
        return {
            statusCode: 200,
            body: JSON.stringify(freteData)
        };

    } catch (error) {
        console.error('Erro inesperado na função:', error);
        return {
            statusCode: 500,
            body: JSON.stringify({ error: error.message })
        };
    }
};

// VERSÃO FINAL - Autenticação com Bearer Token
// Este código primeiro busca um token de acesso e depois usa esse token para calcular o frete.

exports.handler = async function(event) {
    // 1. Validação inicial da requisição
    if (event.httpMethod !== 'POST') {
        return { statusCode: 405, body: 'Method Not Allowed' };
    }

    const { street, number, neighborhood, cep } = JSON.parse(event.body);

    // 2. Pega as credenciais permanentes do ambiente Netlify
    const clientId = process.env.JUMA_CLIENT_ID;
    const clientSecret = process.env.JUMA_SECRET;

    if (!clientId || !clientSecret) {
        return { statusCode: 500, body: JSON.stringify({ error: "Credenciais do servidor não configuradas." }) };
    }

    try {
        // --- ETAPA 1: OBTER O BEARER TOKEN ---
        
        console.log("Tentando obter o token de autenticação...");

        const tokenResponse = await fetch('https://api.dev.jumaentregas.com.br/auth/token', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                "client_id": clientId,
                "client_secret": clientSecret
            })
        });

        const tokenData = await tokenResponse.json();

        if (!tokenResponse.ok) {
            console.error("Erro ao obter o token:", tokenData);
            throw new Error('Falha na autenticação com a Juma. Verifique as credenciais.');
        }

        const accessToken = tokenData.access_token; // Extrai o token da resposta
        console.log("Token obtido com sucesso!");

        // --- ETAPA 2: CALCULAR O FRETE USANDO O TOKEN ---

        const requestBody = {
            "origin": {
                "address": "Rua Francisco Said, 800 - Jardim Santana, Porto Velho - RO, 76828-325"
            },
            "destination": {
                "address": `${street}, ${number} - ${neighborhood}, Porto Velho - RO, ${cep}`
            }
        };
        
        console.log("Calculando o frete para o destino...");

        const freteResponse = await fetch('https://api.dev.jumaentregas.com.br/destinations', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                // Usa o Bearer Token obtido na Etapa 1
                'Authorization': `Bearer ${accessToken}`
            },
            body: JSON.stringify(requestBody)
        });

        const freteData = await freteResponse.json();

        if (!freteResponse.ok) {
            console.error("Erro da API Juma ao calcular o frete:", freteData);
            throw new Error(freteData.message || 'Erro da API Juma ao calcular o frete.');
        }

        console.log("Cálculo de frete bem-sucedido!");
        
        // Retorna a resposta final para o seu site
        return {
            statusCode: 200,
            body: JSON.stringify(freteData)
        };

    } catch (error) {
        // Captura qualquer erro que acontecer no processo
        console.error('Erro inesperado na função:', error);
        return {
            statusCode: 500,
            body: JSON.stringify({ error: error.message })
        };
    }
};

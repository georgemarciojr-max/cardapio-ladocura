// VERSÃO FINAL - Estrutura do corpo da requisição corrigida conforme a documentação

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
        // --- ETAPA 1: OBTER O BEARER TOKEN (Já está funcionando) ---
        
        const tokenResponse = await fetch('https://api.dev.jumaentregas.com.br/auth/token', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                "clientid": clientId,
                "secret": clientSecret
            })
        });

        const tokenData = await tokenResponse.json();
        if (!tokenResponse.ok) throw new Error('Falha na autenticação com a Juma. Verifique as credenciais.');
        const accessToken = tokenData.token;

        // --- ETAPA 2: CALCULAR O FRETE USANDO O TOKEN ---

        // --- CORREÇÃO IMPORTANTE AQUI ---
        // Adicionamos os campos "driverCategory" e "paymentType" que estavam faltando.
        const requestBody = {
            "origin": {
                "address": "Rua Francisco Said, 800 - Jardim Santana, Porto Velho - RO, 76828-325"
            },
            "destination": {
                "address": `${street}, ${number} - ${neighborhood}, Porto Velho - RO, ${cep}`
            },
            "driverCategory": "MOTO", // Valor padrão, parece ser o mais comum.
            "paymentType": "ON_DELIVERY"  // Valor padrão para pagamento na entrega.
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
            // Se ainda der erro, agora a mensagem será mais específica.
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

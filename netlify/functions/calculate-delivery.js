// Este é o código que roda no servidor da Netlify, de forma segura.

exports.handler = async function(event) {
    if (event.httpMethod !== 'POST') {
        return { statusCode: 405, body: 'Method Not Allowed' };
    }

    const { street, number, neighborhood, cep } = JSON.parse(event.body);

    // Pega as credenciais que vamos configurar na Netlify
    const clientId = process.env.JUMA_CLIENT_ID;
    const clientSecret = process.env.JUMA_SECRET;

    if (!clientId || !clientSecret) {
        return { statusCode: 500, body: JSON.stringify({ error: "Credenciais do servidor não configuradas." }) };
    }

    // Monta o corpo da requisição para a Juma com os dados recebidos do index.html
    const requestBody = {
        "origin": {
            "address": "Rua Francisco Said, 800 - Jardim Santana, Porto Velho - RO, 76828-325" // SEU ENDEREÇO DE PARTIDA FIXO
        },
        "destination": {
            "address": `${street}, ${number} - ${neighborhood}, Porto Velho - RO, ${cep}`
        }
    };

    try {
        // Faz a chamada para a API da Juma usando o endpoint correto
        const response = await fetch('https://api.dev.jumaentregas.com.br/destinations', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'client_id': clientId,
                'secret': clientSecret
            },
            body: JSON.stringify(requestBody)
        });

        const data = await response.json();

        // Se a Juma retornar um erro (como "Unauthorized"), nós o repassamos para o index.html
        if (!response.ok) {
            return {
                statusCode: response.status,
                body: JSON.stringify({ error: data.message || 'Erro da API Juma.' })
            };
        }

        // Se tudo deu certo, retorna a resposta da Juma para o index.html
        return {
            statusCode: 200,
            body: JSON.stringify(data)
        };

    } catch (error) {
        return {
            statusCode: 500,
            body: JSON.stringify({ error: 'Não foi possível conectar ao servidor de frete.' })
        };
    }
};

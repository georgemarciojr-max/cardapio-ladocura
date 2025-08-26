// netlify/functions/calculate-delivery.js

// Versão CORRIGIDA com o endpoint /destinations, conforme informado pelo suporte da Juma.

exports.handler = async function(event, context) {
    if (!event.body) {
        return { statusCode: 400, body: JSON.stringify({ error: "Requisição sem dados." }) };
    }

    const { street, number, neighborhood, cep } = JSON.parse(event.body);

    const clientId = process.env.JUMA_CLIENT_ID;
    const clientSecret = process.env.JUMA_SECRET;

    if (!clientId || !clientSecret) {
        return { statusCode: 500, body: JSON.stringify({ error: "Credenciais do servidor não configuradas." }) };
    }

    // --- MUDANÇA IMPORTANTE AQUI ---
    // O novo endpoint /destinations espera os dados com "origin" e "destination".
    const requestBody = {
        "origin": {
            // Endereço de Coleta (sua loja/restaurante)
            "address": "Rua José Faid, 800 - Jardim Santana, Porto Velho - RO, 76828-325"
        },
        "destination": {
            // Endereço de Entrega (cliente)
            "address": `${street}, ${number} - ${neighborhood}, Porto Velho - RO, ${cep}`
        }
    };

    try {
        // --- MUDANÇA IMPORTANTE AQUI ---
        // Atualizamos a URL para o novo endpoint correto.
        const response = await fetch('https://api.dev.jumaentregas.com.br/destinations', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'client_id': clientId,
                'secret': clientSecret
            },
            body: JSON.stringify(requestBody)
        });

        const responseBody = await response.text();

        if (!response.ok) {
            let errorData;
            try {
                errorData = JSON.parse(responseBody);
            } catch (e) {
                errorData = { message: responseBody };
            }
            console.error('Erro da API Juma:', errorData);
            return {
                statusCode: response.status,
                body: JSON.stringify({ error: `Erro da API Juma: ${errorData.message || 'Resposta inválida.'}` })
            };
        }

        const data = JSON.parse(responseBody);

        // A resposta desse novo endpoint pode ter um formato diferente.
        // Se "price" não funcionar, pode ser "value" ou "amount".
        // Vamos retornar o objeto inteiro por enquanto para você ver a resposta completa.
        return {
            statusCode: 200,
            body: JSON.stringify(data) // Retorna o objeto completo: { price: XXX, distance: YYY, ... }
        };

    } catch (error) {
        console.error('Erro inesperado:', error);
        return {
            statusCode: 500,
            body: JSON.stringify({ error: 'Não foi possível conectar ao servidor de frete. Tente novamente.' })
        };
    }
};

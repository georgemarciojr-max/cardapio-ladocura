// netlify/functions/calculate-delivery.js

// Versão final e simplificada, usando o fetch nativo.

exports.handler = async function(event, context) {
    // Verifica se o corpo da requisição existe
    if (!event.body) {
        return { statusCode: 400, body: JSON.stringify({ error: "Requisição sem dados." }) };
    }

    const { street, number, neighborhood, cep } = JSON.parse(event.body);

    const clientId = process.env.JUMA_CLIENT_ID;
    const clientSecret = process.env.JUMA_SECRET;

    // Validação básica dos dados recebidos
    if (!clientId || !clientSecret) {
        return { statusCode: 500, body: JSON.stringify({ error: "Credenciais do servidor não configuradas." }) };
    }

    const requestBody = {
        "points": [
            {
                // <<< CORREÇÃO: CEP de coleta atualizado.
                "address": "Rua Francisco Said, 800 - Jardim Santana, Porto Velho - RO, 76828-325" 
            },
            {
                "address": `${street}, ${number} - ${neighborhood}, Porto Velho - RO, ${cep}` 
            }
        ]
    };

    try {
        const response = await fetch('https://api.dev.jumaentregas.com.br/v2/deliveries/price', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'client_id': clientId,
                'secret': clientSecret
            },
            body: JSON.stringify(requestBody)
        });

        const responseBody = await response.text(); // Lê a resposta como texto para depuração

        if (!response.ok) {
            // Tenta interpretar a resposta de erro como JSON, se falhar, mostra como texto
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

        return {
            statusCode: 200,
            body: JSON.stringify({ price: data.price })
        };

    } catch (error) {
        console.error('Erro inesperado:', error);
        return {
            statusCode: 500,
            body: JSON.stringify({ error: 'Não foi possível conectar ao servidor de frete. Tente novamente.' })
        };
    }
};

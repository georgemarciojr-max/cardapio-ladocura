// netlify/functions/calculate-delivery.js

// Importa a ferramenta para fazer a chamada para a Juma
const fetch = require('node-fetch');

exports.handler = async function(event, context) {
    const { street, number, neighborhood, cep } = JSON.parse(event.body);

    const clientId = process.env.JUMA_CLIENT_ID;
    const clientSecret = process.env.JUMA_SECRET;

    const requestBody = {
        "points": [
            {
                "address": "Rua Francisco Said, 800 - Jardim Santana, Porto Velho - RO, 76828-634" 
            },
            {
                "address": `${street}, ${number} - ${neighborhood}, Porto Velho - RO, ${cep}` 
            }
        ]
    };

    try {
        // <<< CORREÇÃO FINAL: Voltando para o endereço ".dev" da API.
        const response = await fetch('https://api.dev.jumaentregas.com.br/v2/deliveries/price', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'client_id': clientId,
                'secret': clientSecret
            },
            body: JSON.stringify(requestBody)
        });

        if (!response.ok) {
            const errorData = await response.json();
            console.error('Erro da API Juma:', errorData);
            return {
                statusCode: response.status,
                body: JSON.stringify({ error: `Erro da API Juma: ${errorData.message || 'Tente novamente.'}` })
            };
        }

        const data = await response.json();

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

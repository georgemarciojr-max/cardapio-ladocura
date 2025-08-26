// netlify/functions/calculate-delivery.js

// Versão final e simplificada, usando o fetch nativo.

exports.handler = async function(event, context) {
    // 1. Verifica se o corpo da requisição (com os dados do endereço) foi enviado.
    if (!event.body) {
        return { statusCode: 400, body: JSON.stringify({ error: "Requisição sem dados." }) };
    }

    // 2. Extrai os dados do endereço do corpo da requisição.
    const { street, number, neighborhood, cep } = JSON.parse(event.body);

    // 3. Pega suas credenciais da Juma configuradas no ambiente da Netlify.
    //    Isso é mais seguro do que colocar as chaves diretamente no código.
    const clientId = process.env.JUMA_CLIENT_ID;
    const clientSecret = process.env.JUMA_SECRET;

    // Validação para garantir que as credenciais estão configuradas.
    if (!clientId || !clientSecret) {
        return { statusCode: 500, body: JSON.stringify({ error: "Credenciais do servidor não configuradas." }) };
    }

    // 4. Monta o corpo da requisição para a API da Juma.
    const requestBody = {
        "points": [
            {
                // Ponto de Coleta Fixo (endereço da sua loja/restaurante).
                "address": "Rua José Faid, 800 - Jardim Santana, Porto Velho - RO, 76828-325"
            },
            {
                // Ponto de Entrega (endereço do cliente, montado com os dados recebidos).
                "address": `${street}, ${number} - ${neighborhood}, Porto Velho - RO, ${cep}`
            }
        ]
    };

    try {
        // 5. Faz a chamada para a API da Juma para calcular o preço.
        const response = await fetch('https://api.dev.jumaentregas.com.br/v2/deliveries/price', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'client_id': clientId,
                'secret': clientSecret
            },
            body: JSON.stringify(requestBody)
        });

        const responseBody = await response.text(); // Lê a resposta como texto para depuração.

        // 6. Se a resposta da API não for um sucesso (ex: erro de endereço, etc.), retorna o erro.
        if (!response.ok) {
            let errorData;
            try {
                // Tenta interpretar a mensagem de erro como JSON.
                errorData = JSON.parse(responseBody);
            } catch (e) {
                // Se não for JSON, usa o texto puro.
                errorData = { message: responseBody };
            }
            console.error('Erro da API Juma:', errorData);
            return {
                statusCode: response.status,
                body: JSON.stringify({ error: `Erro da API Juma: ${errorData.message || 'Resposta inválida.'}` })
            };
        }

        // 7. Se a chamada foi um sucesso, extrai o preço da resposta.
        const data = JSON.parse(responseBody);

        // 8. Retorna o preço para o seu site.
        return {
            statusCode: 200,
            body: JSON.stringify({ price: data.price })
        };

    } catch (error) {
        // Captura erros de rede ou outros problemas inesperados.
        console.error('Erro inesperado:', error);
        return {
            statusCode: 500,
            body: JSON.stringify({ error: 'Não foi possível conectar ao servidor de frete. Tente novamente.' })
        };
    }
};

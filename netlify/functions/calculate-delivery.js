const fetch = require('node-fetch');

exports.handler = async (event) => {
    if (event.httpMethod !== 'POST') {
        return { statusCode: 405, body: JSON.stringify({ error: 'Método não permitido.' }) };
    }

    try {
        const { totalValue } = JSON.parse(event.body);
        if (!totalValue || typeof totalValue !== 'number' || totalValue <= 0) {
            return { statusCode: 400, body: JSON.stringify({ error: "Valor total inválido." }) };
        }

        const PAGBANK_TOKEN = process.env.PAGBANK_TOKEN;
        if (!PAGBANK_TOKEN) {
            console.error("ERRO GRAVE: A variável PAGBANK_TOKEN não foi encontrada nas configurações do Netlify.");
            return { statusCode: 500, body: JSON.stringify({ error: "Token do PagBank não configurado no servidor." }) };
        }

        const url = 'https://api.pagseguro.com/orders';
        const body = {
            customer: { name: "Cliente Cardapio", email: "cliente@email.com", tax_id: "12345678901" },
            items: [{ name: "Pedido do Cardápio", quantity: 1, unit_amount: totalValue }],
            qr_codes: [{ amount: { value: totalValue } }],
            notification_urls: ["https://seusite.com/notificacoes"]
        };

        const pagbankResponse = await fetch(url, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${PAGBANK_TOKEN}`,
            },
            body: JSON.stringify(body),
        });

        // =========================================================================
        // MUDANÇA CRÍTICA AQUI: AGORA VAMOS LOGAR A RESPOSTA COMPLETA DO PAGBANK
        // =========================================================================
        const responseData = await pagbankResponse.json();

        if (!pagbankResponse.ok) {
            // Log detalhado para nós vermos no Netlify
            console.error("O PagBank retornou um erro. Status:", pagbankResponse.status);
            console.error("Resposta completa do PagBank:", JSON.stringify(responseData, null, 2));
            
            // Mensagem de erro para o usuário
            const userErrorMessage = responseData.error_messages ? responseData.error_messages[0].description : "O PagBank recusou a transação.";
            return { statusCode: 400, body: JSON.stringify({ error: userErrorMessage }) };
        }

        const paymentLink = responseData.qr_codes[0].links.find(link => link.rel === 'PAY').href;
        if (!paymentLink) {
            console.error("Sucesso na chamada, mas o link de pagamento não foi encontrado na resposta.");
            return { statusCode: 500, body: JSON.stringify({ error: "Link de pagamento não encontrado na resposta." }) };
        }

        return { statusCode: 200, body: JSON.stringify({ paymentLink }) };

    } catch (error) {
        console.error('Erro inesperado na execução da função:', error);
        return { statusCode: 500, body: JSON.stringify({ error: 'Erro interno no servidor. Verifique os logs.' }) };
    }
};



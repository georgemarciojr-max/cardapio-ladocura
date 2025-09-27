const fetch = require('node-fetch');

exports.handler = async (event) => {
    const PAGBANK_TOKEN = process.env.PAGBANK_TOKEN;

    if (!PAGBANK_TOKEN) {
        return { statusCode: 500, body: JSON.stringify({ error: 'Token do PagBank não configurado.' }) };
    }

    const { totalValue } = JSON.parse(event.body);

    const orderData = {
        "items": [{ "name": "Pedido do Site", "quantity": 1, "unit_amount": totalValue }],
        "qr_codes": [{ "amount": { "value": totalValue } }],
        // IMPORTANTE: Altere para a URL de sucesso do SEU site
        "notification_urls": ["https://SEU-SITE.netlify.app/sucesso.html"] 
    };

    try {
        const response = await fetch('https://api.pagseguro.com/orders', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${PAGBANK_TOKEN}` },
            body: JSON.stringify(orderData)
        });
        const data = await response.json();
        if (!response.ok) { throw new Error('Falha ao criar pedido no PagBank.'); }
        
        const paymentLink = data.qr_codes[0].links.find(link => link.rel === 'PAY').href;
        return { statusCode: 200, body: JSON.stringify({ paymentLink: paymentLink }) };

    } catch (error) {
        console.error("Erro na função:", error);
        return { statusCode: 500, body: JSON.stringify({ error: error.message }) };
    }
};



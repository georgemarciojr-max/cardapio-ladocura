// Este é o nosso "cofre" de cupons. Ele verifica um código de forma segura.

exports.handler = async function(event) {
    if (event.httpMethod !== 'POST') {
        return { statusCode: 405, body: 'Method Not Allowed' };
    }

    try {
        const { couponCode } = JSON.parse(event.body);

        // --- LISTA DE CUPONS VÁLIDOS ---
        // Para adicionar mais cupons, basta seguir o modelo.
        const cupons = {
          "DOCURA10": { type: "percentage", value: 10 },    // 10% de desconto
          "FRETEGRATIS": { type: "delivery", value: "free" }  // Frete Grátis
        };
        // ------------------------------------

        if (!couponCode) {
            return { statusCode: 400, body: JSON.stringify({ message: "Código do cupom não fornecido." }) };
        }

        const code = couponCode.toUpperCase().trim(); // Padroniza o código digitado
        const coupon = cupons[code];

        if (coupon) {
            // Cupom encontrado, retorna sucesso e os detalhes do cupom
            return {
                statusCode: 200,
                body: JSON.stringify({ valid: true, coupon: coupon })
            };
        } else {
            // Cupom não encontrado
            return {
                statusCode: 404,
                body: JSON.stringify({ valid: false, message: "Cupom inválido ou expirado." })
            };
        }

    } catch (error) {
        return {
            statusCode: 500,
            body: JSON.stringify({ message: 'Erro ao verificar o cupom.' })
        };
    }
};

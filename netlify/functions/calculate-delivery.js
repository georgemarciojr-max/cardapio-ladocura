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
        const tokenResponse = await fetch('https://api.dev.jumaentregas.com.br/auth/token', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ "clientid": clientId, "secret": clientSecret })
        });
        const tokenData = await tokenResponse.json();
        if (!tokenResponse.ok) throw new Error('Falha na autenticação com a Juma.');
        const accessToken = tokenData.token;

        // --- LÓGICA INTELIGENTE PARA MONTAR O ENDEREÇO ---
        let destinationAddress = `${street}, ${number} - ${neighborhood}, Porto Velho - RO`;
        // Só adiciona o CEP ao final se ele tiver sido preenchido
        if (cep && cep.trim() !== '') {
            destinationAddress += `, ${cep}`;
        }

        const requestBody = {
            "drivercategory": 3,
            "address": {
                "street": street,
                "number": number,
                "neighborhood": neighborhood,
                "city": "Porto Velho",
                "state": "RO"
            },
            "latitude": 0,
            "longitude": 0,
            "return": false
        };
        
        // Atualiza o endereço completo no corpo da requisição (se necessário pela API)
        // A API parece usar os campos separados, mas manteremos a lógica completa por segurança.
        requestBody.address.full = destinationAddress;


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
            const errorMessage = freteData.message || 'Erro da API Juma.';
            throw new Error(Array.isArray(errorMessage) ? errorMessage.join(', ') : errorMessage);
        }
        
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

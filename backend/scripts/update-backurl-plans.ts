import fetch from 'node-fetch';
import dotenv from "dotenv";
dotenv.config({ path: '../.env' })

// IDs dos planos que você enviou
const PLAN_IDS = [
    '2c93808497a7dc110197a8dfb0180090', // Plano Mensal
    '2c938084979341770197a8dfb1d107e3'  // Plano Anual
];

// Carrega variáveis de ambiente
const MP_TOKEN   = process.env.MERCADOPAGO_ACCESS_TOKEN;
const FRONT_URL  = 'https://a4a2-189-12-152-104.ngrok-free.app'

if (!MP_TOKEN) {
    console.error('❌ MERCADOPAGO_ACCESS_TOKEN não definido em .env');
    process.exit(1);
}
if (!FRONT_URL) {
    console.error('❌ FRONTEND_URL não definido em .env');
    process.exit(1);
}

async function updateBackUrls() {
    for (const planId of PLAN_IDS) {
        const url = `https://api.mercadopago.com/preapproval_plan/${planId}`;
        const body = { back_url: `${FRONT_URL}/subscribe/success` };
        console.log(`🔄 Atualizando back_url do plano ${planId} → ${body.back_url}`);

        try {
            const res = await fetch(url, {
                method: 'PUT',
                headers: {
                    'Authorization': `Bearer ${MP_TOKEN}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(body)
            });
            const data = await res.json();
            if (!res.ok) {
                console.error(`❌ Falha ao atualizar plano ${planId}:`, data);
            } else {
                console.log(`✅ Plano ${planId} atualizado com sucesso:`);
                console.log(JSON.stringify(data, null, 2));
            }
        } catch (err: any) {
            console.error(`❌ Erro na requisição para plano ${planId}:`, err.message || err);
        }
    }
}

updateBackUrls().catch(err => {
    console.error('Erro geral ao executar updateBackUrls:', err);
    process.exit(1);
});

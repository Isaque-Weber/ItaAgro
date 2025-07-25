import { AppDataSource } from '../services/typeorm/data-source'
import { Subscription, SubscriptionStatus } from '../entities/Subscription'
import { User } from '../entities/User'
import { MercadoPagoClient, transformMercadoPagoStatus } from '../services/mercadopago'

export async function syncSubscriptionsJob() {
    const subscriptionRepo = AppDataSource.getRepository(Subscription)
    const userRepo = AppDataSource.getRepository(User)
    const mpClient = new MercadoPagoClient()

    console.log('[SYNC] Iniciando sincronização...')

    // Tente buscar todas as assinaturas (adapte conforme seu método)
    let mpSubscriptions: any[] = []
    try {
        mpSubscriptions = await mpClient.listSubscriptions()
        console.log(`[SYNC] ${mpSubscriptions.length} assinaturas retornadas pelo MercadoPago`)
    } catch (err) {
        console.error('[SYNC] Erro ao buscar assinaturas no MercadoPago:', err)
        return
    }

    for (const mpSub of mpSubscriptions) {
        // console.log('\n[SYNC] ===== Novo registro MercadoPago =====')
        // console.log('[SYNC] Dados brutos da assinatura:', JSON.stringify(mpSub, null, 2))

        const localSub = await subscriptionRepo.findOne({ where: { externalId: mpSub.id }, relations: ['user'] })
        if (!localSub) {
            console.log(`[SYNC] Não existe subscription local para externalId: ${mpSub.id}`)
            continue
        }

        const newStatus = transformMercadoPagoStatus(mpSub.status) as SubscriptionStatus
        if (localSub.status !== newStatus) {
            console.log(`[SYNC] Status diferente! Local: ${localSub.status}, MercadoPago: ${mpSub.status} (transformado: ${newStatus})`)
            localSub.status = newStatus
            await subscriptionRepo.save(localSub)

            const isActive = newStatus === SubscriptionStatus.ACTIVE || newStatus === SubscriptionStatus.AUTHORIZED
            await userRepo.update(localSub.user.id, { subscriptionActive: isActive })
            console.log(`[SYNC] Usuário ${localSub.user.email || localSub.user.id} agora está com subscriptionActive = ${isActive}`)
        } else {
            console.log(`[SYNC] Status igual, nada a fazer. (${localSub.status})`)
        }
    }

    console.log('[SYNC] Fim do job de sincronização.')
}

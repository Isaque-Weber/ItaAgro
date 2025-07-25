import { AppDataSource } from '../services/typeorm/data-source'
import { Subscription, SubscriptionStatus } from '../entities/Subscription'
import { User } from '../entities/User'
import { MercadoPagoClient, transformMercadoPagoStatus } from '../services/mercadopago'

export async function syncSubscriptionsJob() {
    const subscriptionRepo = AppDataSource.getRepository(Subscription)
    const userRepo = AppDataSource.getRepository(User)
    const mpClient = new MercadoPagoClient()

    console.log('[SYNC] Iniciando sincronização...')

    // 1. Busca todas as assinaturas do MercadoPago
    let mpSubscriptions: any[] = []
    try {
        mpSubscriptions = await mpClient.listSubscriptions()
        console.log(`[SYNC] ${mpSubscriptions.length} assinaturas retornadas pelo MercadoPago`)
    } catch (err) {
        console.error('[SYNC] Erro ao buscar assinaturas no MercadoPago:', err)
        return
    }

    // 2. Atualiza todas as subscriptions locais pelo externalId
    for (const mpSub of mpSubscriptions) {
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
        } else {
            console.log(`[SYNC] Status igual, nada a fazer. (${localSub.status})`)
        }
    }

    // 3. Atualiza o campo subscriptionActive de TODOS os usuários
    const allUsers = await userRepo.find({ relations: ['subscriptions'] })
    for (const user of allUsers) {
        // checa se tem pelo menos uma assinatura ativa/autorizada
        const hasActive = user.subscriptions.some(
            s => s.status === SubscriptionStatus.ACTIVE || s.status === SubscriptionStatus.AUTHORIZED
        )
        if (user.subscriptionActive !== hasActive) {
            user.subscriptionActive = hasActive
            await userRepo.save(user)
            console.log(`[SYNC] Usuário ${user.email || user.id} atualizado: subscriptionActive = ${hasActive}`)
        }
    }

    console.log('[SYNC] Fim do job de sincronização.')
}


// backend/src/seed.ts
import 'reflect-metadata'
import 'dotenv/config'
import { AppDataSource } from './services/typeorm/data-source'
import { User } from './entities/User'

async function seed() {
    // 1) inicializa a conexão
    const dataSource = await AppDataSource.initialize()
    const repo = dataSource.getRepository(User)

    if (process.env.NODE_ENV === 'production') {
        console.log('Seed não deve ser executado em produção automaticamente')
        process.exit(1)
    }

    // 2) Função auxiliar pra criar ou atualizar um usuário
    async function upsertUser(email: string, rawPassword: string, role: 'admin' | 'user', name: string) {
        // tenta buscar pelo e-mail
        let user = await repo.findOneBy({ email })

        if (!user) {
            // cria um novo (vai disparar @BeforeInsert)
            user = repo.create({ email, password: rawPassword, role, name })
        } else {
            // já existe → atualiza a senha e o nome (vai disparar @BeforeUpdate)
            user.password = rawPassword
            user.role     = role
            user.name     = name
        }

        // salva no banco (insert ou update conforme o caso)
        await repo.save(user)
        console.log(`Usuário ${email} inserido/atualizado com ID ${user.id}`)
    }

    // 3) Seed dos dois usuários
    await upsertUser('admin@itaagro.com', 'itapass', 'admin', 'Administrador')
    await upsertUser('user@itaagro.com',   'itauser', 'user', 'Usuário Padrão')

    console.log('Seed completo')
    await dataSource.destroy()
    process.exit(0)
}

seed().catch(err => {
    console.error(err)
    process.exit(1)
})

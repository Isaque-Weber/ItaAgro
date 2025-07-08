// backend/src/index.ts
import 'reflect-metadata'
import { AppDataSource } from './services/typeorm/data-source'
import { build } from './app'

async function start() {
  // Initialize the database connection
  await AppDataSource.initialize()
      .then(async () => {
        console.log('Data Source initialized')
        // Run migrations
        try {
          const migrations = await AppDataSource.runMigrations()
          if (migrations.length > 0) {
            console.log(`Applied ${migrations.length} migrations`)
          }
        } catch (err) {
          console.error('Error running migrations:', err)
        }
      })
      .catch(err => { console.error(err); process.exit(1) })

  // Build the application using the shared build function
  const app = await build()

  // Enable logger for production (it's disabled in tests)
  app.log = app.log || console
  app.log.level = 'info'

  const port = Number(process.env.PORT) || 4000
  await app.listen({ port, host: '0.0.0.0' })
  app.log.info(`Servidor rodando em http://localhost:${port}`)

  // app.get('/health', async (req, res) => {
  //   return { status: 'ok', uptime: process.uptime() }
  // })
}

start().catch(err => {
  console.error('Erro ao iniciar o servidor Fastify:', err)
  process.exit(1)
})

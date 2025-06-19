# Correção do Erro no Webhook de Pagamentos

Este documento explica como corrigir o erro `QueryFailedError: column Subscription.updated_at does not exist` que ocorre ao processar webhooks de pagamento do Mercado Pago.

## Problema

O erro ocorre porque a entidade `Subscription` no código tem um campo `updatedAt` decorado com `@UpdateDateColumn`, mas a coluna correspondente `updated_at` não existe na tabela `subscriptions` do banco de dados.

## Solução Implementada

Foram implementadas duas soluções:

1. **Solução Temporária**: Modificação da entidade `Subscription` para tornar o campo `updatedAt` opcional (nullable).
   - Arquivo modificado: `src/entities/Subscription.ts`
   - Alteração: Adicionado `nullable: true` ao decorador `@UpdateDateColumn` e tornado o campo opcional com `?`

2. **Solução Permanente**: Criação de um script de migração SQL para adicionar a coluna faltante ao banco de dados.
   - Arquivo criado: `src/services/typeorm/migrations/add-updated-at-to-subscriptions.sql`

## Como Aplicar a Solução Permanente

Para adicionar a coluna `updated_at` à tabela `subscriptions` no banco de dados:

1. Conecte-se ao banco de dados PostgreSQL:
   ```bash
   psql -U seu_usuario -d seu_banco_de_dados
   ```
   
   Ou, se estiver usando uma URL de conexão:
   ```bash
   psql "sua_url_de_conexao"
   ```

2. Execute o script SQL:
   ```sql
   ALTER TABLE subscriptions 
   ADD COLUMN updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();
   
   COMMENT ON COLUMN subscriptions.updated_at IS 'Timestamp of last update, managed by TypeORM UpdateDateColumn';
   ```

3. Verifique se a coluna foi adicionada:
   ```sql
   \d subscriptions
   ```

## Como Testar a Correção

1. Certifique-se de que o servidor backend está rodando:
   ```bash
   cd backend
   npm run dev
   ```

2. Use o script de teste para enviar um webhook simulado:
   ```bash
   node scripts/test-payment-webhook.js
   ```

3. Verifique a resposta e os logs do servidor. Se a correção foi aplicada com sucesso, você não deverá mais ver o erro `column Subscription.updated_at does not exist`.

## Prevenção de Problemas Futuros

Para evitar problemas semelhantes no futuro:

1. **Use Migrações TypeORM**: Configure e use o sistema de migrações do TypeORM para gerenciar alterações no esquema do banco de dados.

2. **Sincronização em Desenvolvimento**: Durante o desenvolvimento, você pode temporariamente ativar a opção `synchronize: true` no arquivo `data-source.ts` para que o TypeORM atualize automaticamente o esquema do banco de dados. Lembre-se de desativar esta opção em produção.

3. **Verificação de Esquema**: Antes de implantar alterações nas entidades, verifique se o esquema do banco de dados está atualizado.
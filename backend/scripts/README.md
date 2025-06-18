# Scripts do Backend

Este diretório contém scripts utilitários para o backend do Ita Agro.

## Scripts Disponíveis

### Criação de Planos de Assinatura no Mercado Pago

O script `create-subscription-plans.ts` cria dois planos de assinatura no Mercado Pago:

1. **Plano Mensal**: R$ 40,00 por mês
2. **Plano Anual**: R$ 36,00 por mês (desconto de 10%) por 12 meses (total R$ 432,00)

#### Como executar

Você pode executar o script de duas maneiras:

1. Usando o script npm:
   ```bash
   npm run create-plans
   ```

2. Diretamente com tsx:
   ```bash
   npx tsx scripts/create-subscription-plans.ts
   ```

#### Requisitos

- Variável de ambiente `MERCADOPAGO_ACCESS_TOKEN` configurada no arquivo `.env`

#### Resultado

O script exibirá os IDs dos planos criados no console. Esses IDs podem ser utilizados para criar assinaturas para os usuários.

Exemplo de saída:
```
Iniciando criação de planos de assinatura no Mercado Pago...
Criando plano mensal...
Plano mensal criado: { id: '2c938084726fca370172750000000000', ... }
Criando plano anual...
Plano anual criado: { id: '2c938084726fca370172750000000001', ... }

IDs dos planos criados:
Plano mensal: 2c938084726fca370172750000000000
Plano anual: 2c938084726fca370172750000000001

Utilize estes IDs para criar assinaturas para os usuários.
```

#### Observações

- Os planos criados têm o status `active` e estão prontos para uso imediato
- O `back_url` está configurado para `/chat` conforme solicitado
- Os IDs dos planos devem ser armazenados para uso posterior na criação de assinaturas
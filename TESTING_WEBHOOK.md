# Guia de Teste para Webhook do Mercado Pago

Este guia explica como testar a integração de webhook do Mercado Pago implementada no backend.

## 1. Iniciando o Servidor Backend

Primeiro, você precisa iniciar o servidor backend:

```bash
cd backend
npm install        # Instala as dependências (se ainda não instalou)
npm run dev        # Inicia o servidor em modo de desenvolvimento
```

O servidor estará rodando em `http://localhost:4000`.

## 2. Expondo o Servidor Local para a Internet

Para que o Mercado Pago possa enviar webhooks para o seu servidor local, você precisa expor seu servidor para a internet. Existem várias ferramentas que podem fazer isso:

### Usando ngrok (Recomendado)

1. Instale o [ngrok](https://ngrok.com/download)
2. Execute o comando:

```bash
ngrok http 4000
```

3. Copie a URL HTTPS fornecida pelo ngrok (algo como `https://a1b2c3d4.ngrok.io`)

### Alternativas

- [Localtunnel](https://github.com/localtunnel/localtunnel)
- [Cloudflare Tunnel](https://www.cloudflare.com/products/tunnel/)

## 3. Configurando o Webhook no Mercado Pago

1. Acesse sua [conta do Mercado Pago](https://www.mercadopago.com.br/)
2. Vá para a seção de Desenvolvedores > Webhooks
3. Adicione um novo webhook com:
   - URL: `https://sua-url-ngrok.io/webhook/mercadopago`
   - Eventos: Selecione "preapproval" (para assinaturas)
   - Descrição: "Webhook de teste para assinaturas"
4. Salve a configuração

## 4. Testando o Webhook Manualmente

### Usando o Script de Teste

Foi criado um script para facilitar o teste do webhook localmente:

```bash
cd backend
node scripts/test-webhook.js [id-da-assinatura]
```

Se você não fornecer um ID de assinatura, será usado um ID de exemplo. O script:
- Cria um payload de webhook com o ID da assinatura
- Gera uma assinatura HMAC válida usando o segredo do webhook
- Envia uma requisição POST para o endpoint local
- Exibe a resposta ou quaisquer erros

### Usando curl

Você também pode testar o webhook manualmente enviando uma requisição POST para o endpoint:

```bash
curl -X POST \
  http://localhost:4000/webhook/mercadopago \
  -H 'Content-Type: application/json' \
  -H 'X-Signature: assinatura-simulada' \
  -d '{
    "type": "preapproval",
    "data": {
      "id": "seu-id-de-assinatura"
    }
  }'
```

### Exemplo de Payload Completo

```json
{
  "type": "preapproval",
  "data": {
    "id": "seu-id-de-assinatura"
  },
  "action": "payment.created",
  "api_version": "v1",
  "date_created": "2023-06-12T12:00:00Z",
  "user_id": "123456789"
}
```

## 5. Verificando se o Webhook Funcionou

Para verificar se o webhook foi processado corretamente:

1. **Verifique os logs do servidor**: O servidor deve mostrar logs detalhados do processamento do webhook.

2. **Verifique o banco de dados**: Uma nova assinatura deve ser criada ou uma existente atualizada.

3. **Resposta HTTP**: O servidor deve responder com status 200 e um JSON `{ "received": true }`.

## 6. Testando com Eventos Reais do Mercado Pago

Para testar com eventos reais:

1. Crie uma assinatura de teste no Mercado Pago usando sua aplicação
2. Faça alguma alteração na assinatura (como cancelar ou pausar)
3. O Mercado Pago enviará automaticamente um webhook para a URL configurada
4. Verifique os logs e o banco de dados para confirmar que o evento foi processado

## 7. Solução de Problemas

Se o webhook não estiver funcionando:

1. **Verifique a URL**: Certifique-se de que a URL do webhook está correta e acessível
2. **Verifique os logs**: Procure por erros nos logs do servidor
3. **Verifique a assinatura HMAC**: Em ambiente de produção, a assinatura HMAC é validada
4. **Teste com Postman**: Use o Postman para enviar requisições de teste mais detalhadas

## 8. Ambiente de Produção vs Desenvolvimento

- **Desenvolvimento**: A validação da assinatura HMAC é ignorada, apenas registrada nos logs
- **Produção**: A validação da assinatura HMAC é obrigatória, e requisições com assinaturas inválidas são rejeitadas

## Referências

- [Documentação de Webhooks do Mercado Pago](https://www.mercadopago.com.br/developers/pt/guides/notifications/webhooks)
- [Documentação de Assinaturas do Mercado Pago](https://www.mercadopago.com.br/developers/pt/guides/online-payments/subscriptions/introduction)

# Backend Testing Guide

Este guia explica como executar e criar testes automatizados para o backend do ItaAgro.

## Estrutura de Testes

Os testes estão organizados em diferentes categorias:

- **Testes de Entidades**: Testam os modelos de dados e suas validações
- **Testes de Controladores**: Testam as rotas da API e seus endpoints
- **Testes de Serviços**: Testam a lógica de negócios isoladamente
- **Testes de Integração**: Testam a interação entre diferentes componentes

## Como Executar os Testes

### Executar Todos os Testes

```bash
cd backend
npm test
```

### Executar Testes com Watch Mode (desenvolvimento)

```bash
cd backend
npm run test:watch
```

### Executar Testes com Cobertura

```bash
cd backend
npm run test:coverage
```

### Executar Testes Específicos

```bash
cd backend
npm test -- tests/entities/User.test.ts
```

## Configuração do Banco de Dados para Testes

Para os testes de integração, é necessário configurar um banco de dados de teste. Recomendamos criar um banco de dados separado para testes.

1. Crie um arquivo `.env.test` na raiz do projeto backend com as seguintes variáveis:

```
DATABASE_URL=postgres://usuario:senha@localhost:5432/itaagro_test
NODE_ENV=test
```

2. Para executar testes de integração, use:

```bash
NODE_ENV=test npm test -- tests/integration
```

## Criando Novos Testes

### Testes de Entidades

Os testes de entidades verificam se os modelos de dados estão funcionando corretamente, incluindo validações, relacionamentos e métodos.

Exemplo: `tests/entities/User.test.ts`

### Testes de Controladores

Os testes de controladores verificam se as rotas da API estão funcionando corretamente, incluindo validação de entrada, autenticação e respostas.

Exemplo: `tests/controllers/auth.test.ts`

### Testes de Serviços

Os testes de serviços verificam se a lógica de negócios está funcionando corretamente, isolando-a de outras partes do sistema.

Exemplo: `tests/services/openai/processMessageWithAssistant.test.ts`

### Testes de Integração

Os testes de integração verificam se diferentes componentes do sistema funcionam corretamente juntos, usando um banco de dados real.

Exemplo: `tests/integration/auth.integration.test.ts`

## Melhores Práticas

1. **Isolamento**: Cada teste deve ser independente e não depender do estado de outros testes
2. **Mocking**: Use mocks para isolar o código que está sendo testado de suas dependências
3. **Limpeza**: Limpe os dados de teste após cada teste para evitar efeitos colaterais
4. **Cobertura**: Tente alcançar uma boa cobertura de código, especialmente para lógica de negócios crítica
5. **Clareza**: Escreva testes claros e descritivos que documentem o comportamento esperado

## Ferramentas Utilizadas

- **Jest**: Framework de testes
- **ts-jest**: Suporte a TypeScript para Jest
- **Supertest**: Testes de API HTTP
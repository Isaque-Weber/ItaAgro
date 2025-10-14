# ItaAgro

O ItaAgro é uma plataforma de software como serviço (SaaS) projetada para auxiliar agrônomos e produtores rurais a obter informações cruciais sobre defensivos agrícolas, pragas e culturas de forma rápida e precisa. A plataforma utiliza um assistente de IA para fornecer respostas instantâneas e personalizadas, otimizando a tomada de decisões no campo.

## Funcionalidades

- **Assistente Virtual com IA:** Converse com um assistente inteligente treinado para responder perguntas sobre defensivos, pragas, doenças e culturas.
- **Consulta de Produtos:** Acesse um banco de dados completo de defensivos agrícolas, com informações sobre ingredientes ativos, marcas e recomendações de uso.
- **Gerenciamento de Assinaturas:** Planos de assinatura flexíveis para acesso a funcionalidades premium.
- **Autenticação Segura:** Sistema de login e registro seguro, com opção de autenticação via Google.
- **Painel Administrativo:** Ferramentas para administração de usuários e assinaturas.

## Tecnologias Utilizadas

### Backend

- **Node.js** com **Fastify:** Framework web de alta performance.
- **TypeScript:** Superset de JavaScript que adiciona tipagem estática.
- **PostgreSQL** com **TypeORM:** Banco de dados relacional e ORM para manipulação de dados.
- **OpenAI API:** Integração com modelos de linguagem para o assistente de IA.
- **MercadoPago API:** Processamento de pagamentos para as assinaturas.
- **Jest:** Framework de testes para garantir a qualidade do código.
- **Docker:** Para facilitar a configuração e o deploy do ambiente de desenvolvimento.

### Frontend

- **React:** Biblioteca para construção de interfaces de usuário.
- **Vite:** Ferramenta de build moderna e ultrarrápida.
- **TypeScript:** Para um desenvolvimento mais seguro e robusto.
- **Tailwind CSS:** Framework de CSS para estilização rápida e customizável.
- **React Router:** Para gerenciamento de rotas na aplicação.

## Instalação e Execução

### Pré-requisitos

- [Node.js](https://nodejs.org/) (versão 20 ou superior)
- [Docker](https://www.docker.com/) e [Docker Compose](https://docs.docker.com/compose/)
- [Git](https://git-scm.com/)

### Backend

1.  **Clone o repositório:**
    ```bash
    git clone https://github.com/seu-usuario/itaagro.git
    cd itaagro/backend
    ```

2.  **Instale as dependências:**
    ```bash
    npm install
    ```

3.  **Configure as variáveis de ambiente:**
    - Renomeie o arquivo `.env.test.example` para `.env.test`.
    - Preencha as variáveis de ambiente necessárias, como as credenciais do banco de dados, chaves de API (OpenAI, MercadoPago, Google) e outras configurações.

4.  **Inicie o banco de dados com Docker:**
    ```bash
    docker-compose up -d
    ```

5.  **Rode as migrações do banco de dados:**
    ```bash
    npm run migration:run
    ```

6.  **Inicie o servidor de desenvolvimento:**
    ```bash
    npm run dev.b
    ```

### Frontend

1.  **Acesse a pasta do frontend:**
    ```bash
    cd ../frontend
    ```

2.  **Instale as dependências:**
    ```bash
    npm install
    ```

3.  **Inicie o servidor de desenvolvimento:**
    ```bash
    npm run dev
    ```

A aplicação estará disponível em `http://localhost:5173`.

## Scripts Disponíveis

### Backend

- `npm run dev.b`: Inicia o servidor em modo de desenvolvimento com watch.
- `npm run build`: Compila o código TypeScript para produção.
- `npm run start`: Inicia o servidor em modo de produção.
- `npm run test`: Executa os testes.
- `npm run lint`: Executa o linter para verificar a qualidade do código.
- `npm run migration:run`: Aplica as migrações do banco de dados.

### Frontend

- `npm run dev`: Inicia o servidor de desenvolvimento.
- `npm run build`: Gera a build de produção.
- `npm run start`: Serve a build de produção.
- `npm run lint`: Executa o linter.

## Contribuição

Contribuições são bem-vindas! Sinta-se à vontade para abrir issues e pull requests. 


## Licença

Este projeto é licenciado sob a licença MIT.

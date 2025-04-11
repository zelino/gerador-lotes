# Gerador de Lotes

Uma aplicação web moderna para gerenciamento e emissão de lotes com sistema de notificação por email. Construída com Next.js, Prisma ORM e NextAuth para autenticação.

![Versão](https://img.shields.io/badge/versão-0.1.0-blue)
![Next.js](https://img.shields.io/badge/Next.js-15.3.0-black)
![React](https://img.shields.io/badge/React-19.0.0-61DAFB)
![Prisma](https://img.shields.io/badge/Prisma-6.6.0-cyan)

## Visão Geral

O Gerador de Lotes é uma aplicação que permite aos usuários autenticados:

- **Criar lotes**: Gere lotes com número único e informações de produtos/serviços
- **Acompanhar status**: Visualize todos os lotes gerados em uma interface amigável
- **Enviar notificações**: Envie emails automáticos com informações do lote gerado
- **Segurança**: Sistema com autenticação completa e proteção de rotas

## Tecnologias Utilizadas

### Frontend
- **Next.js 15**: Framework React para renderização híbrida (SSR + CSR)
- **React 19**: Biblioteca para construção de interfaces
- **Tailwind CSS 4**: Framework CSS utilitário para design responsivo
- **shadcn/ui**: Componentes acessíveis e estilizáveis
- **Zod**: Validação de formulários e dados

### Backend
- **Next.js API Routes**: Endpoints serverless
- **Prisma ORM**: Modelagem de dados e consultas
- **PostgreSQL**: Banco de dados relacional
- **NextAuth.js**: Autenticação completa com JWT
- **Nodemailer**: Envio de emails

## Funcionalidades

### Autenticação de Usuários
- Login seguro com usuário e senha
- Proteção de rotas com sessões
- Gerenciamento de tokens JWT

### Gestão de Lotes
- Criação de lotes com dados completos
- Geração automática de números de lote únicos (formato: MP-XXXXX/YYYY)
- Filtragem de lotes por usuário
- Visualização em tabela com ordenação por data de criação

### Envio de Notificações
- Envio de emails com detalhes do lote
- Marcação automática de status de envio
- Confirmação visual na interface

## Estrutura do Projeto

```
gerador-lotes/
│
├── prisma/                  # Configuração do banco de dados 
│   ├── schema.prisma        # Modelo de dados
│   ├── seed.ts              # Seed para dados iniciais
│   └── migrations/          # Migrações do banco de dados
│
├── public/                  # Arquivos estáticos
│
├── src/
│   ├── app/                 # Estrutura do App Router (Next.js)
│   │   ├── api/             # API Routes
│   │   │   ├── auth/        # Rotas de autenticação
│   │   │   └── lotes/       # CRUD de lotes e envio de emails
│   │   ├── dashboard/       # Página do painel principal
│   │   └── login/           # Página de login
│   │
│   ├── components/          # Componentes React reutilizáveis
│   │   └── ui/              # Componentes de UI (shadcn)
│   │
│   ├── lib/                 # Utilitários e funções auxiliares
│   │   └── prisma.ts        # Cliente Prisma
│   │
│   └── types/               # Definição de tipos TypeScript
│       └── next-auth.d.ts   # Tipagem para NextAuth
│
└── ...                      # Arquivos de configuração
```

## Instalação e Configuração

### Pré-requisitos
- Node.js 18.0 ou superior
- PostgreSQL
- Npm ou Yarn

### Configuração

1. Clone o repositório
```bash
git clone https://seu-repositorio/gerador-lotes.git
cd gerador-lotes
```

2. Instale as dependências
```bash
npm install
# ou
yarn install
```

3. Configure as variáveis de ambiente
Crie um arquivo `.env` na raiz do projeto:
```
# Banco de dados
DATABASE_URL="postgresql://usuario:senha@localhost:5432/gerador_lotes"

# NextAuth
NEXTAUTH_SECRET="sua-chave-secreta-aqui"
NEXTAUTH_URL="http://localhost:3000"

# Email
EMAIL_SERVER_HOST="smtp.servidor.com"
EMAIL_SERVER_PORT="587"
EMAIL_FROM_ADDRESS="seu-email@exemplo.com"
EMAIL_APP_PASSWORD="sua-senha-de-app"
EMAIL_RECIPIENTS="destinatario1@email.com,destinatario2@email.com"
```

4. Execute as migrações do Prisma
```bash
npx prisma migrate dev
# ou
yarn prisma migrate dev
```

5. (Opcional) Alimente o banco com dados iniciais
```bash
npx prisma db seed
# ou
yarn prisma db seed
```

## Executando o Projeto

### Ambiente de desenvolvimento
```bash
npm run dev
# ou
yarn dev
```
Acesse `http://localhost:3000` no navegador.

### Produção
```bash
npm run build
npm start
# ou
yarn build
yarn start
```

## Uso

1. Faça login com suas credenciais
2. Na dashboard, você pode:
   - Criar novos lotes preenchendo o formulário
   - Visualizar lotes existentes na tabela
   - Enviar notificações por email clicando no botão "Enviar Email"
   - Verificar status do envio através dos badges

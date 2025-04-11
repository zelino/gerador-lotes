// Arquivo: app/api/auth/[...nextauth]/route.ts

import NextAuth, { type NextAuthOptions } from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';
// Ajuste o caminho se o alias '@/' não funcionar ou não estiver configurado
import prisma from '@/lib/prisma';
import bcrypt from 'bcryptjs';

// Definindo as opções de configuração do NextAuth
export const authOptions: NextAuthOptions = {
  // Provedor de Autenticação: Usaremos apenas 'credentials' (login/senha)
  providers: [
    CredentialsProvider({
      // Nome interno do provedor
      name: 'Credentials',
      // Campos esperados pelo provedor (útil para tipagem e forms padrão do NextAuth)
      credentials: {
        username: { label: "Usuário", type: "text" },
        password: { label: "Senha", type: "password" }
      },
      // Função principal que valida as credenciais do usuário
      async authorize(credentials) {
        // 1. Validação básica de entrada
        if (!credentials?.username || !credentials.password) {
          console.error('Authorize: Credenciais não fornecidas.');
          return null; // Indica falha na autorização
        }

        const { username, password } = credentials;
        console.log(`Authorize: Processando login para "${username}"...`);

        try {
          // 2. Busca o usuário no banco de dados
          const user = await prisma.user.findUnique({
            where: { username: username },
          });

          // 3. Verifica se o usuário existe e tem senha
          if (!user) {
            console.log(`Authorize: Usuário "${username}" não encontrado.`);
            return null;
          }
          if (!user.password) {
            console.error(`Authorize: Usuário "${username}" não possui senha registrada.`);
            return null;
          }

          // 4. Compara a senha fornecida com o hash armazenado
          console.log(`Authorize: Comparando senha para "${username}"...`);
          const isPasswordValid = await bcrypt.compare(password, user.password);

          if (!isPasswordValid) {
            console.log(`Authorize: Senha inválida para "${username}".`);
            return null;
          }

          // 5. Autenticação bem-sucedida!
          console.log(`Authorize: Login OK para "${username}" (ID: ${user.id}).`);
          // Retorna o objeto do usuário (sem a senha!) que será usado no callback 'jwt'
          // Os campos aqui devem corresponder à interface 'User' que estendemos em types/next-auth.d.ts
          return {
            id: user.id,
            name: user.name,       // Nome do usuário
            username: user.username // Username
          };

        } catch (error) {
          // Captura erros durante o acesso ao banco ou comparação bcrypt
          console.error("Authorize: Erro inesperado durante a autorização:", error);
          return null; // Falha em caso de erro
        }
      } // Fim da função authorize
    }) // Fim do CredentialsProvider
    // Você poderia adicionar outros providers aqui (Google, GitHub, etc.)
  ],

  // Configuração da Sessão
  session: {
    // Usaremos JSON Web Tokens (JWT) para gerenciar a sessão.
    // A sessão não é persistida no banco por padrão com esta estratégia.
    strategy: 'jwt',
  },

  // Callbacks para customizar o fluxo e os dados
  callbacks: {
    // Chamado após 'authorize' e sempre que um JWT é criado/atualizado.
    // Adiciona dados customizados ao token.
    jwt({ token, user }) {
      console.log("--- JWT Callback INICIO ---"); // Log adicional
      if (user) {
        console.log("JWT Callback: User object recebido:", JSON.stringify(user)); // Log adicional
        try {
          token.id = user.id;
          // --- AJUSTE AQUI: Garante que não estamos atribuindo null ao token ---
          token.username = user.username ?? ''; // Se user.username for null ou undefined, usa ''
          token.name = user.name ?? 'Usuário';   // Se user.name for null ou undefined, usa 'Usuário'
          // --- FIM DO AJUSTE ---
          console.log(`JWT Callback: Token populado com username: ${token.username}, name: ${token.name}`); // Log com os valores atribuídos
        } catch (jwtError) {
          console.error("!!! ERRO DENTRO DO BLOCO IF(USER) DO JWT CALLBACK !!!", jwtError);
          // Retornar o token original pode ser mais seguro aqui
          return token;
        }
      } else {
        console.log("--- JWT Callback: 'user' não presente (não é login inicial?) ---");
      }
      console.log("--- JWT Callback FIM, retornando token ---"); // Log adicional
      return token;
    },

    // session callback permanece o mesmo por enquanto
    session({ session, token }) {
      console.log("--- Session Callback INICIO ---"); // Log adicional
      if (token && session.user) {
        session.user.id = token.id;
        session.user.username = token.username;
        session.user.name = token.name;
        console.log(`Session Callback: Sessão preparada para ${session.user.username}`);
      } else {
        console.warn("Session Callback: Token ou session.user ausente.");
      }
      console.log("--- Session Callback FIM ---"); // Log adicional
      return session;
    },
  },

  // Configuração das páginas customizadas
  pages: {
    signIn: '/login',     // Redireciona para cá se o usuário precisar logar
    error: '/auth/error', // Página para exibir erros de autenticação (você pode criar essa página)
  },

  // Segredo usado para assinar os JWTs, cookies, etc.
  // Deve vir de uma variável de ambiente!
  secret: process.env.NEXTAUTH_SECRET,

  // Habilita logs mais detalhados do NextAuth no console durante o desenvolvimento
  debug: process.env.NODE_ENV === 'development',

}; // Fim do authOptions

// Cria o handler do NextAuth com as opções configuradas
const handler = NextAuth(authOptions);

// Exporta os handlers GET e POST para o App Router
export { handler as GET, handler as POST };
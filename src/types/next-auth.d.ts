// types/next-auth.d.ts

import 'next-auth';
import 'next-auth/jwt';

// --- CORREÇÃO APLICADA AQUI ---
// Estende a interface User base do NextAuth para incluir os campos
// que você retorna da sua função `authorize`.
declare module 'next-auth' {
    /**
     * Interface User estendida.
     * Agora o objeto `user` passado para o callback `jwt` (vindo do `authorize`)
     * será reconhecido como tendo `id` e `username`.
     */
    interface User {
        id: string;
        username: string | null;
        // Inclua 'name' se também o retornar e usar.
        // O 'name' padrão pode ser string | null | undefined, então tipar como 'string | null' pode ser mais seguro.
        name: string | null;
        // Adicione outros campos que você retorna de `authorize` se houver
    }

    /**
     * Interface Session estendida para incluir os dados no objeto `session.user`.
     */
    interface Session {
        user: {
            id: string;
            username: string | null;
            name: string | null; // Correspondendo ao tipo em User
            // Adicione outros campos aqui também se forem passados do token para a sessão
        } // & DefaultSession['user']; // Pode usar '& DefaultSession['user']' se quiser manter email/image padrão
    }
}

declare module 'next-auth/jwt' {
    /**
     * Interface JWT (token) estendida para incluir os dados que colocamos nela.
     */
    interface JWT {
        id: string;
        username: string | null;
        name: string | null; // Correspondendo ao tipo em User
        // Adicione outros campos aqui se você os colocar no token
    }
}
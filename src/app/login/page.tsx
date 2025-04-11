// app/login/page.tsx
'use client'; // ESSENCIAL: Marca este como um Client Component

import { useState } from 'react';
import { signIn } from 'next-auth/react'; // Função para iniciar o processo de login
import { useRouter, useSearchParams } from 'next/navigation'; // Para redirecionamento e leitura de erros da URL

export default function LoginPage() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState<string | null>(null); // Para exibir mensagens de erro
    const [isLoading, setIsLoading] = useState(false); // Para feedback visual durante o login

    // Tenta pegar a mensagem de erro da URL (se o NextAuth redirecionou com erro)
    const callbackError = searchParams.get('error');
    // Mapeia erros comuns do NextAuth para mensagens amigáveis
    const errorMessage = error || (callbackError === 'CredentialsSignin'
        ? 'Usuário ou senha inválidos.'
        : callbackError ? 'Ocorreu um erro ao tentar fazer login.' : null);


    const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
        event.preventDefault(); // Impede o recarregamento da página padrão do form
        setError(null); // Limpa erros anteriores
        setIsLoading(true); // Ativa o estado de carregamento

        try {
            // Chama a função signIn do NextAuth
            const result = await signIn('credentials', {
                // Indica o provider que configuramos (o 'id'/'name' no route.ts)
                redirect: false, // IMPORTANTE: Não redireciona automaticamente, vamos tratar o resultado
                username: username, // Passa o username do estado
                password: password, // Passa a senha do estado
                // callbackUrl: '/' // Opcional: para onde redirecionar após sucesso (se redirect=true)
                // Se redirect=false, o router.push() abaixo cuidará disso.
            });

            setIsLoading(false); // Desativa o carregamento após a resposta

            if (result?.error && !result.error) {
                // Se o NextAuth retornou um erro (ex: credenciais inválidas via 'authorize')
                console.error('Erro de login retornado pelo signIn:', result.error);
                if (result.error === 'CredentialsSignin') {
                    setError('Usuário ou senha inválidos.');
                } else {
                    setError(`Erro ao fazer login: ${result.error}`);
                }
            } else if (result?.ok && !result.error) {
                // Login bem-sucedido!
                console.log('Login bem-sucedido, redirecionando...');
                // Redireciona para a página principal (ou para onde o usuário tentou ir antes)
                // O ideal é redirecionar para a 'callbackUrl' se ela existir, ou para a raiz '/'
                const callbackUrl = searchParams.get('callbackUrl') || '/dashboard';
                router.push(callbackUrl); // Usa o router do Next.js para navegar
                // router.refresh(); // Opcional: Força atualização dos dados do servidor se necessário na próxima página
            } else {
                // Caso inesperado
                setError('Ocorreu uma resposta inesperada durante o login.');
                console.warn('Resposta inesperada do signIn:', result);
            }
        } catch (err) {
            setIsLoading(false); // Garante que desativa o loading em caso de erro na chamada
            console.error('Erro inesperado ao chamar signIn:', err);
            setError('Ocorreu um erro inesperado. Tente novamente.');
        }
    };

    return (
        <div className="flex min-h-screen items-center justify-center bg-gray-100">
            <div className="w-full max-w-md rounded-lg bg-white p-8 shadow-md">
                <h1 className="mb-6 text-center text-2xl font-bold text-gray-800">
                    Login - Gerador de Lotes
                </h1>

                {/* Exibe mensagens de erro */}
                {errorMessage && (
                    <div className="mb-4 rounded border border-red-400 bg-red-100 px-4 py-3 text-red-700" role="alert">
                        <span className="block sm:inline">{errorMessage}</span>
                    </div>
                )}


                <form onSubmit={handleSubmit}>
                    <div className="mb-4">
                        <label
                            htmlFor="username"
                            className="mb-2 block text-sm font-bold text-gray-700"
                        >
                            Usuário
                        </label>
                        <input
                            type="text"
                            id="username"
                            value={username}
                            onChange={(e) => setUsername(e.target.value)}
                            required // Campo obrigatório
                            className="focus:shadow-outline w-full appearance-none rounded border px-3 py-2 leading-tight text-gray-700 shadow focus:outline-none"
                            disabled={isLoading} // Desabilita durante o carregamento
                        />
                    </div>
                    <div className="mb-6">
                        <label
                            htmlFor="password"
                            className="mb-2 block text-sm font-bold text-gray-700"
                        >
                            Senha
                        </label>
                        <input
                            type="password"
                            id="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            required // Campo obrigatório
                            className="focus:shadow-outline w-full appearance-none rounded border px-3 py-2 leading-tight text-gray-700 shadow focus:outline-none"
                            disabled={isLoading} // Desabilita durante o carregamento
                        />
                    </div>
                    <div className="flex items-center justify-between">
                        <button
                            type="submit"
                            className={`focus:shadow-outline rounded bg-blue-500 px-4 py-2 font-bold text-white hover:bg-blue-700 focus:outline-none ${isLoading ? 'cursor-not-allowed opacity-50' : '' // Estilo de loading
                                }`}
                            disabled={isLoading} // Desabilita durante o carregamento
                        >
                            {isLoading ? 'Entrando...' : 'Entrar'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
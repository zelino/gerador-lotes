// app/login/page.tsx
'use client'; // ESSENCIAL: Marca este como um Client Component

import { Suspense } from 'react';

// Componente que encapsula o formulário de login
function LoginFormWrapper() {
  return (
    <Suspense fallback={<div>Carregando...</div>}>
      <LoginFormContent />
    </Suspense>
  );
}

// Componente que usa useSearchParams (precisa estar dentro de Suspense)
import { useState } from 'react';
import { signIn } from 'next-auth/react';
import { useRouter, useSearchParams } from 'next/navigation';

function LoginFormContent() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(false);

    // Tenta pegar a mensagem de erro da URL
    const callbackError = searchParams.get('error');
    // Mapeia erros comuns do NextAuth para mensagens amigáveis
    const errorMessage = error || (callbackError === 'CredentialsSignin'
        ? 'Usuário ou senha inválidos.'
        : callbackError ? 'Ocorreu um erro ao tentar fazer login.' : null);

    const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        setError(null);
        setIsLoading(true);

        try {
            const result = await signIn('credentials', {
                redirect: false,
                username: username,
                password: password,
            });

            setIsLoading(false);

            if (result?.error) {
                console.error('Erro de login retornado pelo signIn:', result.error);
                if (result.error === 'CredentialsSignin') {
                    setError('Usuário ou senha inválidos.');
                } else {
                    setError(`Erro ao fazer login: ${result.error}`);
                }
            } else if (result?.ok) {
                console.log('Login bem-sucedido, redirecionando...');
                const callbackUrl = searchParams.get('callbackUrl') || '/dashboard';
                router.push(callbackUrl);
            } else {
                setError('Ocorreu uma resposta inesperada durante o login.');
                console.warn('Resposta inesperada do signIn:', result);
            }
        } catch (err) {
            setIsLoading(false);
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
                            required
                            className="focus:shadow-outline w-full appearance-none rounded border px-3 py-2 leading-tight text-gray-700 shadow focus:outline-none"
                            disabled={isLoading}
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
                            required
                            className="focus:shadow-outline w-full appearance-none rounded border px-3 py-2 leading-tight text-gray-700 shadow focus:outline-none"
                            disabled={isLoading}
                        />
                    </div>
                    <div className="flex items-center justify-between">
                        <button
                            type="submit"
                            className={`focus:shadow-outline rounded bg-blue-500 px-4 py-2 font-bold text-white hover:bg-blue-700 focus:outline-none ${isLoading ? 'cursor-not-allowed opacity-50' : ''}`}
                            disabled={isLoading}
                        >
                            {isLoading ? 'Entrando...' : 'Entrar'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}

// Exportamos o componente que será renderizado
export default LoginFormWrapper;

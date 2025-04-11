// app/dashboard/page.tsx
import { getServerSession } from "next-auth/next";
import { authOptions } from "../api/auth/[...nextauth]/route";
import { redirect } from "next/navigation";
import LotesClientPage from "../../components/LotesClientPage";
import LogoutButton from "@/components/LogoutButton";

export default async function Dashboard() {
    // ... (verificação de sessão e redirecionamento) ...
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
         redirect('/login?callbackUrl=/dashboard');
    }

    return (
        <main className="container mx-auto p-4">
            <div className="mb-4 flex items-center justify-between">
                <h1 className="text-2xl font-bold">
                    Dashboard - Bem vindo, {session.user.name || session.user.username}!
                </h1>
                <LogoutButton />
            </div>
            {/* 2. Renderiza o componente cliente */}
            <LotesClientPage />
        </main>
    )
}
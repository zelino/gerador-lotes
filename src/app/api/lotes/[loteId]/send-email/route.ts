// Arquivo: app/api/lotes/[loteId]/send-email/route.ts
import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
// Ajuste o caminho se a estrutura for diferente
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import prisma from '@/lib/prisma'; // Seu Prisma Client
import nodemailer from 'nodemailer'; // Importa o nodemailer

// Helper para verificar se o erro é do Prisma
// function isPrismaError(e: unknown): e is { code: string; meta?: any } {
//     return typeof e === 'object' && e !== null && 'code' in e;
// }

// --- Handler POST ---
export async function POST(
    request: Request,
) {
    // Extrair loteId dos segmentos da URL
    const url = new URL(request.url);
    const pathSegments = url.pathname.split('/');
    const loteIdIndex = pathSegments.findIndex(segment => segment === 'lotes') + 1;
    const loteId = pathSegments[loteIdIndex];
    
    console.log(`[API Send Email] Recebida requisição para lote ID: ${loteId}`);

    // 1. Verificar Autenticação
    const session = await getServerSession(authOptions);
    if (!session || !session.user?.id) {
        console.log(`[API Send Email] Falha: Não autorizado.`);
        return NextResponse.json({ message: 'Não autorizado' }, { status: 401 });
    }
    if (!loteId) {
        console.log(`[API Send Email] Falha: ID do lote ausente na URL.`);
        return NextResponse.json({ message: 'ID do lote ausente' }, { status: 400 });
    }

    try {
        // 2. Buscar Lote e Verificar Permissão/Status
        console.log(`[API Send Email] Buscando lote ${loteId}...`);
        const lote = await prisma.lote.findUnique({
            where: { id: loteId },
        });

        if (!lote) {
            console.log(`[API Send Email] Falha: Lote ${loteId} não encontrado.`);
            return NextResponse.json({ message: 'Lote não encontrado' }, { status: 404 });
        }
        if (lote.userId !== session.user.id) {
            console.warn(`[API Send Email] Falha: Usuário ${session.user.id} tentando acessar lote ${loteId} de outro usuário.`);
            return NextResponse.json({ message: 'Acesso negado ao lote' }, { status: 403 }); // 403 Forbidden
        }
        if (lote.email_enviado) {
            console.log(`[API Send Email] Info: Email para lote ${loteId} já foi enviado.`);
            return NextResponse.json({ message: 'Email já enviado anteriormente' }, { status: 409 }); // 409 Conflict
        }

        // 3. Configurar e Enviar Email com Nodemailer
        console.log(`[API Send Email] Preparando email para lote ${lote.numero_lote}...`);
        const recipientsEnv = process.env.EMAIL_RECIPIENTS;
        if (!recipientsEnv) throw new Error("Variável EMAIL_RECIPIENTS não configurada.");
        const recipients = recipientsEnv.split(',').map(e => e.trim()).filter(Boolean);
        if (recipients.length === 0) throw new Error("Nenhum destinatário válido configurado.");

        // Valida se as credenciais básicas existem
        if (!process.env.EMAIL_SERVER_HOST || !process.env.EMAIL_SERVER_PORT || !process.env.EMAIL_FROM_ADDRESS || !process.env.EMAIL_APP_PASSWORD) {
            throw new Error("Configuração do servidor de email incompleta nas variáveis de ambiente.");
        }

        const transporter = nodemailer.createTransport({
            host: process.env.EMAIL_SERVER_HOST,
            port: parseInt(process.env.EMAIL_SERVER_PORT, 10),
            secure: parseInt(process.env.EMAIL_SERVER_PORT, 10) === 465,
            auth: {
                user: process.env.EMAIL_FROM_ADDRESS,
                pass: process.env.EMAIL_APP_PASSWORD,
            },
        });

        // Verificar conexão (opcional)
        // await transporter.verify(); console.log("SMTP Connection Verified");

        const mailOptions = {
            from: `"Gerador de Lotes App" <${process.env.EMAIL_FROM_ADDRESS}>`,
            to: recipients.join(', '),
            subject: `Notificação de Lote: ${lote.numero_lote}`,
            text: `Lote gerado:\n\nNúmero: ${lote.numero_lote}\nRef: ${lote.referencia || '-'}\nFatura: ${lote.numero_fatura || '-'}\nProduto: ${lote.nome_produto || '-'}\nEmpresa: ${lote.nome_empresa || '-'}\nData: ${new Date(lote.createdAt).toLocaleString('pt-BR')}`,
            // html: "..."
        };

        console.log(`[API Send Email] Enviando para: ${recipients.join(', ')}...`);
        await transporter.sendMail(mailOptions);
        console.log(`[API Send Email] Email para lote ${loteId} enviado com sucesso.`);

        // 4. Atualizar Status no Banco de Dados
        console.log(`[API Send Email] Atualizando status do lote ${loteId} no banco...`);
        const loteAtualizado = await prisma.lote.update({
            where: { id: loteId },
            data: { email_enviado: true },
        });
        console.log(`[API Send Email] Status do lote ${loteId} atualizado.`);

        // 5. Retornar Sucesso
        return NextResponse.json(loteAtualizado);

    } catch (error: unknown) {
        console.error(`[API Send Email] !!! ERRO GERAL para lote ${loteId}:`, error);
        // Verificação de erro mais genérica
        let errorMessage = 'Erro interno no servidor ao processar o envio.';
        if (error instanceof Error) {
            errorMessage = error.message; // Pega a mensagem do erro se for uma instância de Error
        }
        // Poderia adicionar checagens específicas para erros de nodemailer aqui se necessário
        return NextResponse.json({ message: errorMessage }, { status: 500 });
    }
}
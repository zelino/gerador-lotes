// app/api/lotes/route.ts
import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '../auth/[...nextauth]/route'; // Importa suas opções de auth
import prisma from '@/lib/prisma'; // Importa o Prisma Client
import { z } from 'zod'; // Biblioteca para validação de dados (opcional mas recomendado)

// --- Esquema de Validação para Criação (usando Zod) ---
const createLoteSchema = z.object({
    numero_fatura: z.string().optional().nullable(), // Permite string, null ou undefined
    nome_produto: z.string().optional().nullable(),
    nome_empresa: z.string().optional().nullable(),
    referencia: z.string().optional().nullable(),
    // Não incluímos numero_lote, data_geracao, userId, email_enviado - serão gerados/obtidos no backend
});

// --- Função para gerar o número do lote ---
// Exemplo: MP-XXXXX/YYYY (XXXXX = 5 números aleatórios, YYYY = ano atual)
function gerarNumeroLote(): string {
    const ano = new Date().getFullYear();
    // Gera 5 números aleatórios (00000 a 99999) e formata com padding
    const sequencia = Math.floor(Math.random() * 100000).toString().padStart(5, '0');
    return `MP-${sequencia}/${ano}`;
}

// --- Handler para GET /api/lotes ---
// Retorna os lotes pertencentes ao usuário logado
export async function GET() {
    console.log('--- API GET /api/lotes ---');
    const session = await getServerSession(authOptions);

    if (!session || !session.user?.id) {
        console.log('GET /api/lotes: Não autorizado.');
        return NextResponse.json({ message: 'Não autorizado' }, { status: 401 });
    }

    try {
        const lotes = await prisma.lote.findMany({
            where: {
                userId: session.user.id, // Filtra pelos lotes do usuário logado
            },
            orderBy: {
                createdAt: 'desc', // Ordena pelos mais recentes primeiro
            },
            // Opcional: Incluir dados do usuário relacionado (se precisar exibir o nome do criador na tabela)
            // include: {
            //   user: {
            //     select: { name: true }, // Seleciona apenas o nome do usuário
            //   },
            // },
        });
        console.log(`GET /api/lotes: ${lotes.length} lotes encontrados para usuário ${session.user.id}`);
        return NextResponse.json(lotes);

    } catch (error) {
        console.error('GET /api/lotes: Erro ao buscar lotes:', error);
        return NextResponse.json({ message: 'Erro interno ao buscar lotes' }, { status: 500 });
    }
}

// --- Handler para POST /api/lotes ---
// Cria um novo lote
export async function POST(request: Request) {
    console.log('--- API POST /api/lotes ---');
    const session = await getServerSession(authOptions);

    if (!session || !session.user?.id) {
        console.log('POST /api/lotes: Não autorizado.');
        return NextResponse.json({ message: 'Não autorizado' }, { status: 401 });
    }

    try {
        const body = await request.json();
        console.log('POST /api/lotes: Body recebido:', body);

        // Validar os dados recebidos usando Zod
        const validation = createLoteSchema.safeParse(body);
        if (!validation.success) {
            console.log('POST /api/lotes: Dados inválidos:', validation.error.errors);
            return NextResponse.json({ message: 'Dados inválidos', errors: validation.error.errors }, { status: 400 });
        }

        // Pegar os dados validados
        const { numero_fatura, nome_produto, nome_empresa, referencia } = validation.data;

        // Gerar o número do lote único
        // TODO: Adicionar lógica para garantir unicidade se houver chance de colisão (raro com 5 dígitos aleatórios)
        //       Uma abordagem seria tentar gerar e salvar, e se der erro de unicidade, tentar gerar outro.
        const numeroLote = gerarNumeroLote();
        console.log(`POST /api/lotes: Numero de lote gerado: ${numeroLote}`);

        // Criar o lote no banco de dados
        const novoLote = await prisma.lote.create({
            data: {
                numero_fatura: numero_fatura,
                nome_produto: nome_produto,
                nome_empresa: nome_empresa,
                referencia: referencia,
                numero_lote: numeroLote, // Número gerado
                userId: session.user.id, // Associa ao usuário logado
                // email_enviado é false por padrão (definido no schema)
                // createdAt e updatedAt são gerenciados pelo Prisma/DB
            },
        });

        console.log(`POST /api/lotes: Lote criado com sucesso: ${novoLote.id}`);
        // Retorna o lote recém-criado com status 201 (Created)
        return NextResponse.json(novoLote, { status: 201 });

    } catch (error: any) { // eslint-disable-line @typescript-eslint/no-explicit-any
        console.error('POST /api/lotes: Erro ao criar lote:', error);
        // Verifica se o erro é de violação de unicidade (código P2002 do Prisma)
        if (error.code === 'P2002' && error.meta?.target?.includes('numero_lote')) {
            console.error('POST /api/lotes: Conflito - número de lote gerado já existe.');
            return NextResponse.json({ message: 'Erro ao gerar número de lote único, tente novamente.' }, { status: 409 }); // 409 Conflict
        }
        return NextResponse.json({ message: 'Erro interno ao criar lote' }, { status: 500 });
    }
}
// app/components/LotesClientPage.tsx
'use client';

import React, { useState, useEffect, useCallback } from 'react';
// eslint-disable-next-line @typescript-eslint/no-unused-vars
import { set, z } from 'zod';
import { ReloadIcon } from "@radix-ui/react-icons"; // Ícone de loading

// Importando componentes shadcn/ui
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
    Card,
    CardContent,
    CardDescription,
    CardFooter,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";

// --- Tipagem para o Lote (Frontend) ---
const LoteSchemaFrontend = z.object({
    id: z.string(),
    numero_fatura: z.string().nullable(),
    nome_produto: z.string().nullable(),
    quantidade: z.number().int().default(1).nullable(),
    nome_empresa: z.string().nullable(),
    referencia: z.string().nullable(),
    numero_lote: z.string(),
    createdAt: z.string(),
    updatedAt: z.string(),
    email_enviado: z.boolean().nullable().default(false),
    userId: z.string(),
    // Não precisamos incluir prefixo_lote no schema frontend pois ele não é retornado pela API
});
type Lote = z.infer<typeof LoteSchemaFrontend>;

// --- Componente Principal ---
export default function LotesClientPage() {
    // --- Estados do Formulário ---
    const [numeroFatura, setNumeroFatura] = useState('');
    const [nomeProduto, setNomeProduto] = useState('');
    const [nomeEmpresa, setNomeEmpresa] = useState('');
    const [quantidade, setQuantidade] = useState('');
    const [prefixoLote, setPrefixoLote] = useState('');

    // --- Estados da Aplicação ---
    const [lotes, setLotes] = useState<Lote[]>([]);
    const [isLoading, setIsLoading] = useState(true); // Começa true para busca inicial
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [formError, setFormError] = useState<string | null>(null);
    // Estado para envio de email - CORRETO, DENTRO DO COMPONENTE
    const [sendingEmailLoteId, setSendingEmailLoteId] = useState<string | null>(null);

    // --- Função para buscar os lotes da API ---
    const fetchLotes = useCallback(async () => {
        console.log('Buscando lotes...');
        setIsLoading(true);
        setError(null);
        try {
            const response = await fetch('/api/lotes');
            if (!response.ok) {
                const errorData = await response.json().catch(() => ({ message: `Erro HTTP: ${response.status}` }));
                throw new Error(errorData.message || `Erro HTTP: ${response.status}`);
            }
            const data = await response.json();
            const parsedLotes = z.array(LoteSchemaFrontend).safeParse(data);
            if (!parsedLotes.success) {
                console.error("Erro Zod ao validar lotes recebidos:", parsedLotes.error);
                throw new Error("Dados recebidos da API de lotes são inválidos.");
            }
            setLotes(parsedLotes.data);
            console.log('Lotes carregados:', parsedLotes.data);
        } catch (err: unknown) {
            console.error('Erro ao buscar lotes:', err);
            if (err instanceof Error) {
                setError(err.message || 'Falha ao carregar lotes.');
            } else {
                setError('Falha ao carregar lotes.');
            }
        } finally {
            setIsLoading(false);
        }
    }, []); // Fim fetchLotes

    // --- Efeito para buscar lotes na montagem inicial ---
    useEffect(() => {
        fetchLotes();
    }, [fetchLotes]);

    // --- Função para lidar com o submit do formulário ---
    const handleSubmitLote = async (event: React.FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        setFormError(null);
        setIsSubmitting(true);

        const loteData = {
            numero_fatura: numeroFatura.trim() || null,
            nome_produto: nomeProduto.trim() || null,
            nome_empresa: nomeEmpresa.trim() || null,
            referencia: null, // Mantemos o campo no backend, mas enviamos como null
            quantidade: quantidade ? parseInt(quantidade, 10) : 0,
            prefixo_lote: prefixoLote.trim()
        };

        console.log('Enviando dados para criar lote:', loteData);

        try {
            const response = await fetch('/api/lotes', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(loteData),
            });

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({ message: `Erro HTTP: ${response.status}` }));
                console.error('Erro da API ao criar lote:', errorData);
                throw new Error(errorData.message || `Erro ${response.status} ao criar lote.`);
            }

            const novoLote = await response.json();
            const parsedLote = LoteSchemaFrontend.safeParse(novoLote);
            if (!parsedLote.success) {
                console.error("Novo lote recebido da API é inválido:", parsedLote.error);
                throw new Error("Resposta recebida após criação do lote é inválida.");
            }

            console.log('Lote criado com sucesso:', parsedLote.data);
            setLotes(prevLotes => [parsedLote.data, ...prevLotes]);

            // Limpa o formulário
            setNumeroFatura('');
            setNomeProduto('');
            setNomeEmpresa('');
            setQuantidade(''); // Limpa também o campo de quantidade
            setPrefixoLote(''); // Reseta para valor vazio

        } catch (err: unknown) {
            console.error('Falha ao criar lote:', err);
            if (err instanceof Error) {
                setFormError(err.message || 'Não foi possível criar o lote.');
            } else {
                setFormError('Não foi possível criar o lote.');
            }
        } finally {
            setIsSubmitting(false);
        }
    }; // Fim handleSubmitLote

    // --- Função para Enviar Email (Implementação real na Etapa 11.4) ---
    const handleSendEmail = async (loteId: string) => {
        if (!loteId || sendingEmailLoteId) return;
        setSendingEmailLoteId(loteId);
        setError(null);
        setFormError(null); // Limpa erros de form também
        console.log(`[Frontend] Iniciando envio para lote ID: ${loteId}`);
        try {
            const response = await fetch(`/api/lotes/${loteId}/send-email`, {
                method: 'POST',
            });
            const responseData = await response.json();
            if (!response.ok) {
                console.error(`[Frontend] Erro ${response.status} da API ao enviar email:`, responseData);
                throw new Error(responseData.message || `Erro ${response.status}`);
            }
            const parsedLote = LoteSchemaFrontend.safeParse(responseData);
            if (!parsedLote.success) {
                console.error("[Frontend] Resposta da API de envio de email inválida:", parsedLote.error);
                throw new Error("Resposta da API após envio de email inválida.");
            }
            console.log('[Frontend] Email enviado e lote atualizado pela API:', parsedLote.data);
            setLotes(prevLotes =>
                prevLotes.map(lote =>
                    lote.id === loteId ? parsedLote.data : lote
                )
            );
            console.log(`[Frontend] Estado local do lote ${loteId} atualizado para 'enviado'.`);
        } catch (err: unknown) {
            console.error('[Frontend] Falha ao enviar email:', err);
            if (err instanceof Error) {
                setError(`Erro ao enviar email: ${err.message}`);
            } else {
                setError('Ocorreu um erro desconhecido ao tentar enviar o email.');
            }
        } finally {
            setSendingEmailLoteId(null);
            console.log(`[Frontend] Finalizado processo de envio para lote ID: ${loteId}`);
        }
    }; // Fim handleSendEmail

    // --- Renderização do Componente ---
    return (
        <div className="space-y-8">
            {/* Seção do Formulário */}
            <Card>
                <CardHeader>
                    <CardTitle>Criar Novo Lote</CardTitle>
                    <CardDescription>Preencha os detalhes abaixo para gerar um novo lote.</CardDescription>
                </CardHeader>
                <form onSubmit={handleSubmitLote}>
                    <CardContent className="space-y-4">
                        {formError && (
                            <Alert variant="destructive">
                                <AlertTitle>Erro ao Criar</AlertTitle>
                                <AlertDescription>{formError}</AlertDescription>
                            </Alert>
                        )}
                        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                            <div className="space-y-1">
                                <Label htmlFor="numero_fatura">Número Fatura</Label>
                                <Input id="numero_fatura" value={numeroFatura} onChange={e => setNumeroFatura(e.target.value)} placeholder="Ex: NF-12345" disabled={isSubmitting} required />
                            </div>
                            <div className="space-y-1">
                                <Label htmlFor="nome_produto">Nome Produto</Label>
                                <Input id="nome_produto" value={nomeProduto} onChange={e => setNomeProduto(e.target.value)} placeholder="Ex: Componente X" disabled={isSubmitting} required />
                            </div>
                            <div className="space-y-1">
                                <Label htmlFor="quantidade">Quantidade</Label>
                                <Input 
                                    id="quantidade" 
                                    type="number"
                                    min="0" 
                                    value={quantidade} 
                                    onChange={e => setQuantidade(e.target.value)} 
                                    placeholder="Ex: 100" 
                                    disabled={isSubmitting} 
                                    required 
                                />
                            </div>
                            <div className="space-y-1">
                                <Label htmlFor="nome_empresa">Nome Empresa</Label>
                                <Input id="nome_empresa" value={nomeEmpresa} onChange={e => setNomeEmpresa(e.target.value)} placeholder="Ex: Indústria ABC" disabled={isSubmitting} required />
                            </div>
                            <div className="space-y-1">
                                <Label htmlFor="prefixo_lote">Prefixo do Lote (4 letras)</Label>
                                <Input 
                                    id="prefixo_lote" 
                                    value={prefixoLote} 
                                    onChange={e => {
                                        // Filtra apenas letras, limita a 4 caracteres e converte para maiúsculas
                                        const value = e.target.value.replace(/[^A-Za-z]/g, '').toUpperCase().slice(0, 4);
                                        setPrefixoLote(value);
                                    }} 
                                    placeholder="Ex: ABCD" 
                                    maxLength={4}
                                    disabled={isSubmitting} 
                                    required 
                                />
                            </div>
                        </div>
                    </CardContent>
                    <CardFooter className="flex justify-end">
                        <Button type="submit" disabled={isSubmitting}>
                            {isSubmitting && (<ReloadIcon className="mr-2 h-4 w-4 animate-spin" />)}
                            {isSubmitting ? 'Criando...' : 'Criar Lote'}
                        </Button>
                    </CardFooter>
                </form>
            </Card>

            {/* Seção da Grade/Lista de Lotes */}
            <Card>
                <CardHeader>
                    <CardTitle>Lotes Gerados</CardTitle>
                </CardHeader>
                <CardContent>
                    {isLoading && (
                        <div className="space-y-3 p-4"> {/* Adicionado padding para Skeletons */}
                            <Skeleton className="h-8 w-full" />
                            <Skeleton className="h-8 w-full" />
                            <Skeleton className="h-8 w-full" />
                        </div>
                    )}
                    {error && !isLoading && (
                        <Alert variant="destructive" className="mb-4"> {/* Adicionado margin bottom */}
                            <AlertTitle>Erro ao Carregar Lotes</AlertTitle>
                            <AlertDescription>{error}</AlertDescription>
                        </Alert>
                    )}
                    {!isLoading && !error && lotes.length === 0 && (
                        <div className="text-center text-sm text-muted-foreground py-6">
                            Nenhum lote encontrado. Crie um novo lote acima.
                        </div>
                    )}
                    {!isLoading && !error && lotes.length > 0 && (
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Número Lote</TableHead>
                                    <TableHead>Referência</TableHead>
                                    <TableHead className="hidden sm:table-cell">Produto</TableHead>
                                    <TableHead className="hidden sm:table-cell">Quantidade</TableHead>
                                    <TableHead className="hidden sm:table-cell">Empresa</TableHead>
                                    <TableHead className="hidden md:table-cell">Data Criação</TableHead>
                                    <TableHead>Status Email</TableHead>
                                    <TableHead className="text-right">Ações</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {lotes.map((lote) => (
                                    <TableRow key={lote.id}>
                                        <TableCell className="font-medium">{lote.numero_lote}</TableCell>
                                        <TableCell>{lote.referencia || '-'}</TableCell>
                                        <TableCell className="hidden sm:table-cell">{lote.nome_produto || '-'}</TableCell>
                                        <TableCell className="hidden sm:table-cell">{lote.quantidade || '-'}</TableCell>
                                        <TableCell className="hidden sm:table-cell">{lote.nome_empresa || '-'}</TableCell>
                                        <TableCell className="hidden md:table-cell">{new Date(lote.createdAt).toLocaleDateString()}</TableCell>
                                        <TableCell>
                                            <Badge variant={lote.email_enviado ? "default" : "secondary"}>
                                                {lote.email_enviado ? 'Enviado' : 'Pendente'}
                                            </Badge>
                                        </TableCell>
                                        <TableCell className="text-right">
                                            <Button
                                                variant={lote.email_enviado ? "outline" : "default"}
                                                size="sm"
                                                onClick={() => handleSendEmail(lote.id)}
                                                disabled={!!lote.email_enviado || sendingEmailLoteId !== null}
                                            >
                                                {sendingEmailLoteId === lote.id && <ReloadIcon className="mr-2 h-4 w-4 animate-spin" />}
                                                {lote.email_enviado ? 'Enviado' : sendingEmailLoteId === lote.id ? 'Enviando...' : 'Enviar Email'}
                                            </Button>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}
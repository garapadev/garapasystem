import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';

const aprovacaoSchema = z.object({
  aprovado: z.boolean(),
  observacoes: z.string().optional()
});

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    const body = await request.json();
    const { aprovado, observacoes } = aprovacaoSchema.parse(body);

    // Buscar o colaborador do usuário logado
    const colaborador = await prisma.colaborador.findFirst({
      where: { usuarioId: session.user.id }
    });

    if (!colaborador) {
      return NextResponse.json(
        { error: 'Colaborador não encontrado' },
        { status: 404 }
      );
    }

    // Buscar a solicitação de compra
    const solicitacao = await prisma.solicitacaoCompra.findUnique({
      where: { id: params.id },
      include: {
        solicitante: true,
        centroCusto: true,
        itens: {
          include: {
            produto: true
          }
        }
      }
    });

    if (!solicitacao) {
      return NextResponse.json(
        { error: 'Solicitação de compra não encontrada' },
        { status: 404 }
      );
    }

    // Verificar se a solicitação está pendente
    if (solicitacao.status !== 'PENDENTE') {
      return NextResponse.json(
        { error: 'Solicitação já foi processada' },
        { status: 400 }
      );
    }

    // Atualizar o status da solicitação
    const novoStatus = aprovado ? 'APROVADA' : 'REJEITADA';
    
    const solicitacaoAtualizada = await prisma.solicitacaoCompra.update({
      where: { id: params.id },
      data: {
        status: novoStatus,
        aprovadorId: colaborador.id,
        dataAprovacao: new Date(),
        observacoesAprovacao: observacoes
      },
      include: {
        solicitante: {
          select: { id: true, nome: true, email: true }
        },
        aprovador: {
          select: { id: true, nome: true, email: true }
        },
        centroCusto: {
          select: { id: true, nome: true, codigo: true }
        },
        itens: {
          include: {
            produto: {
              select: { id: true, nome: true, codigo: true, unidadeMedida: true }
            }
          }
        }
      }
    });

    // Se aprovado, criar automaticamente uma cotação
    if (aprovado) {
      await prisma.cotacao.create({
        data: {
          numero: `COT-${Date.now()}`,
          descricao: `Cotação para ${solicitacao.descricao}`,
          solicitacaoCompraId: solicitacao.id,
          status: 'PENDENTE',
          itens: {
            create: solicitacao.itens.map(item => ({
              produtoId: item.produtoId,
              quantidade: item.quantidade,
              valorReferencia: item.valorEstimado
            }))
          }
        }
      });
    }

    return NextResponse.json(solicitacaoAtualizada);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Dados inválidos', details: error.errors },
        { status: 400 }
      );
    }

    console.error('Erro ao aprovar solicitação de compra:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}
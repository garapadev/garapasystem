import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function GET(
  request: NextRequest,
  { params }: { params: { codigo: string } }
) {
  try {
    const codigo = params.codigo;

    const aprovacao = await db.ordemServicoAprovacao.findUnique({
      where: { codigo },
      include: {
        ordemServico: {
          include: {
            cliente: {
              select: {
                nome: true,
                email: true
              }
            },
            responsavel: {
              select: {
                nome: true
              }
            },
            itens: true
          }
        }
      }
    });

    if (!aprovacao) {
      return NextResponse.json({ error: 'Código de aprovação não encontrado' }, { status: 404 });
    }

    return NextResponse.json(aprovacao);

  } catch (error) {
    console.error('Erro ao buscar aprovação:', error);
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 });
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: { codigo: string } }
) {
  try {
    const codigo = params.codigo;
    const { acao, observacoes } = await request.json();

    if (!['APROVADA', 'REJEITADA'].includes(acao)) {
      return NextResponse.json({ error: 'Ação inválida' }, { status: 400 });
    }

    // Buscar aprovação
    const aprovacao = await db.ordemServicoAprovacao.findUnique({
      where: { codigo },
      include: {
        ordemServico: true
      }
    });

    if (!aprovacao) {
      return NextResponse.json({ error: 'Código de aprovação não encontrado' }, { status: 404 });
    }

    // Verificar se já foi processada
    if (aprovacao.status !== 'PENDENTE') {
      return NextResponse.json({ error: 'Esta aprovação já foi processada' }, { status: 400 });
    }

    // Verificar se expirou
    if (new Date(aprovacao.expiresAt) < new Date()) {
      return NextResponse.json({ error: 'Este código de aprovação expirou' }, { status: 400 });
    }

    // Atualizar aprovação e ordem de serviço em uma transação
    const result = await db.$transaction(async (tx) => {
      // Atualizar aprovação
      const aprovacaoAtualizada = await tx.ordemServicoAprovacao.update({
        where: { codigo },
        data: {
          status: acao,
          observacoes,
          processadoEm: new Date()
        }
      });

      // Atualizar status da ordem de serviço
      const novoStatus = acao === 'APROVADA' ? 'APROVADA' : 'REJEITADA';
      const ordemServicoAtualizada = await tx.ordemServico.update({
        where: { id: aprovacao.ordemServicoId },
        data: { status: novoStatus }
      });

      return { aprovacao: aprovacaoAtualizada, ordemServico: ordemServicoAtualizada };
    });

    return NextResponse.json({ 
      success: true, 
      message: `Ordem de serviço ${acao.toLowerCase()} com sucesso`,
      aprovacao: result.aprovacao
    });

  } catch (error) {
    console.error('Erro ao processar aprovação:', error);
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 });
  }
}
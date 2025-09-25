import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { StatusOrdemServico } from '@prisma/client';

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json();
    const { acao, colaboradorId, observacoes } = body;

    // Verificar se ordem de serviço existe
    const ordemServico = await db.ordemServico.findUnique({
      where: { id: params.id },
      include: {
        cliente: {
          select: {
            id: true,
            nome: true,
            email: true
          }
        }
      }
    });

    if (!ordemServico) {
      return NextResponse.json(
        { error: 'Ordem de serviço não encontrada' },
        { status: 404 }
      );
    }

    // Verificar se colaborador existe
    const colaborador = await db.colaborador.findUnique({
      where: { id: colaboradorId }
    });

    if (!colaborador) {
      return NextResponse.json(
        { error: 'Colaborador não encontrado' },
        { status: 404 }
      );
    }

    let novoStatus: StatusOrdemServico;
    let codigoAprovacao: string | null = null;
    let dataAprovacao: Date | null = null;
    let dataInicio: Date | null = null;
    let dataFim: Date | null = null;

    // Validar transições de status
    switch (acao) {
      case 'enviar_aprovacao':
        if (ordemServico.status !== 'RASCUNHO') {
          return NextResponse.json(
            { error: 'Apenas ordens em rascunho podem ser enviadas para aprovação' },
            { status: 400 }
          );
        }
        novoStatus = 'AGUARDANDO_APROVACAO';
        // Gerar código de aprovação único
        codigoAprovacao = Math.random().toString(36).substring(2, 15).toUpperCase();
        break;

      case 'aprovar':
        if (ordemServico.status !== 'AGUARDANDO_APROVACAO') {
          return NextResponse.json(
            { error: 'Apenas ordens aguardando aprovação podem ser aprovadas' },
            { status: 400 }
          );
        }
        novoStatus = 'APROVADA';
        dataAprovacao = new Date();
        break;

      case 'rejeitar':
        if (ordemServico.status !== 'AGUARDANDO_APROVACAO') {
          return NextResponse.json(
            { error: 'Apenas ordens aguardando aprovação podem ser rejeitadas' },
            { status: 400 }
          );
        }
        novoStatus = 'REJEITADA';
        break;

      case 'iniciar':
        if (!['APROVADA', 'PAUSADA'].includes(ordemServico.status)) {
          return NextResponse.json(
            { error: 'Apenas ordens aprovadas ou pausadas podem ser iniciadas' },
            { status: 400 }
          );
        }
        novoStatus = 'EM_EXECUCAO';
        if (ordemServico.status === 'APROVADA') {
          dataInicio = new Date();
        }
        break;

      case 'pausar':
        if (ordemServico.status !== 'EM_EXECUCAO') {
          return NextResponse.json(
            { error: 'Apenas ordens em execução podem ser pausadas' },
            { status: 400 }
          );
        }
        novoStatus = 'PAUSADA';
        break;

      case 'concluir':
        if (ordemServico.status !== 'EM_EXECUCAO') {
          return NextResponse.json(
            { error: 'Apenas ordens em execução podem ser concluídas' },
            { status: 400 }
          );
        }
        novoStatus = 'CONCLUIDA';
        dataFim = new Date();
        break;

      case 'cancelar':
        if (['CONCLUIDA', 'CANCELADA'].includes(ordemServico.status)) {
          return NextResponse.json(
            { error: 'Ordens concluídas ou canceladas não podem ser canceladas' },
            { status: 400 }
          );
        }
        novoStatus = 'CANCELADA';
        break;

      default:
        return NextResponse.json(
          { error: 'Ação inválida' },
          { status: 400 }
        );
    }

    // Atualizar ordem de serviço
    const ordemServicoAtualizada = await db.ordemServico.update({
      where: { id: params.id },
      data: {
        status: novoStatus,
        codigoAprovacao,
        dataAprovacao,
        dataInicio,
        dataFim,
        updatedAt: new Date(),
        historico: {
          create: {
            acao: `Status alterado para ${novoStatus}`,
            valorAnterior: ordemServico.status,
            valorNovo: novoStatus,
            observacoes,
            colaboradorId
          }
        }
      },
      include: {
        cliente: {
          select: {
            id: true,
            nome: true,
            email: true,
            telefone: true
          }
        },
        responsavel: {
          select: {
            id: true,
            nome: true,
            email: true
          }
        },
        criadoPor: {
          select: {
            id: true,
            nome: true,
            email: true
          }
        },
        historico: {
          include: {
            colaborador: {
              select: {
                id: true,
                nome: true,
                email: true
              }
            }
          },
          orderBy: {
            createdAt: 'desc'
          },
          take: 5
        }
      }
    });

    // TODO: Enviar notificações por email baseado na ação
    // - enviar_aprovacao: enviar email para cliente com código
    // - aprovar/rejeitar: notificar responsável
    // - iniciar/pausar/concluir/cancelar: notificar cliente e stakeholders

    return NextResponse.json({
      ordemServico: ordemServicoAtualizada,
      message: `Ordem de serviço ${acao.replace('_', ' ')} com sucesso`
    });
  } catch (error) {
    console.error('Erro ao executar ação na ordem de serviço:', error);
    return NextResponse.json(
      { error: 'Erro ao executar ação na ordem de serviço' },
      { status: 500 }
    );
  }
}
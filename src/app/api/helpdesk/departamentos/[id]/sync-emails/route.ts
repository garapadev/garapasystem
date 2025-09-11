import { NextRequest, NextResponse } from 'next/server';
import { createHelpdeskEmailService } from '@/lib/email/helpdesk-email-service';
import { db } from '@/lib/db';

// POST - Sincronizar emails do departamento
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const departamentoId = params.id;

    // Verifica se o departamento existe
    const departamento = await db.departamentoHelpdesk.findUnique({
      where: { id: departamentoId }
    });

    if (!departamento) {
      return NextResponse.json(
        { error: 'Departamento não encontrado' },
        { status: 404 }
      );
    }

    // Verifica se a sincronização está habilitada
    if (!departamento.sincronizacaoAtiva) {
      return NextResponse.json(
        { error: 'Sincronização não está ativa para este departamento' },
        { status: 400 }
      );
    }

    // Verifica se as configurações IMAP estão completas
    if (!departamento.imapHost || !departamento.imapUser || !departamento.imapPassword) {
      return NextResponse.json(
        { error: 'Configurações IMAP incompletas' },
        { status: 400 }
      );
    }

    const emailService = await createHelpdeskEmailService(departamentoId);
    const syncResult = await emailService.syncEmails();

    return NextResponse.json({
      success: true,
      message: 'Sincronização concluída com sucesso',
      data: {
        emailsProcessados: syncResult.processed,
        ticketsCriados: syncResult.tickets.length,
        tickets: syncResult.tickets,
        ultimaSincronizacao: new Date().toISOString()
      }
    });
  } catch (error) {
    console.error('Erro ao sincronizar emails:', error);
    
    return NextResponse.json(
      { 
        error: 'Erro interno do servidor',
        details: error instanceof Error ? error.message : 'Erro desconhecido'
      },
      { status: 500 }
    );
  }
}

// GET - Obter status da última sincronização
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const departamentoId = params.id;

    const departamento = await db.departamentoHelpdesk.findUnique({
      where: { id: departamentoId },
      select: {
        id: true,
        nome: true,
        sincronizacaoAtiva: true,
        ultimaSincronizacao: true,
        intervaloSincronizacao: true,
        _count: {
          select: {
            tickets: true
          }
        }
      }
    });

    if (!departamento) {
      return NextResponse.json(
        { error: 'Departamento não encontrado' },
        { status: 404 }
      );
    }

    // Calcula próxima sincronização
    let proximaSincronizacao: string | null = null;
    if (departamento.ultimaSincronizacao && departamento.intervaloSincronizacao) {
      const proxima = new Date(departamento.ultimaSincronizacao);
      proxima.setMinutes(proxima.getMinutes() + departamento.intervaloSincronizacao);
      proximaSincronizacao = proxima.toISOString();
    }

    return NextResponse.json({
      success: true,
      data: {
        departamento: departamento.nome,
        sincronizacaoAtiva: departamento.sincronizacaoAtiva,
        ultimaSincronizacao: departamento.ultimaSincronizacao,
        proximaSincronizacao,
        intervaloSincronizacao: departamento.intervaloSincronizacao,
        totalTickets: departamento._count.tickets
      }
    });
  } catch (error) {
    console.error('Erro ao obter status de sincronização:', error);
    
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}
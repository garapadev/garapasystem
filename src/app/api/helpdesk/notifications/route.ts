import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { db } from '@/lib/db';
import { HelpdeskEmailService } from '@/lib/email/helpdesk-email-service';

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    const { ticketId, type, data } = await request.json();

    if (!ticketId || !type) {
      return NextResponse.json({ error: 'Parâmetros obrigatórios ausentes' }, { status: 400 });
    }

    // Buscar o ticket
    const ticket = await db.helpdeskTicket.findUnique({
      where: { id: ticketId },
      include: {
        solicitante: true,
        atribuido: true,
        departamento: true,
        observadores: {
          include: {
            colaborador: true
          }
        }
      }
    });

    if (!ticket) {
      return NextResponse.json({ error: 'Ticket não encontrado' }, { status: 404 });
    }

    const emailService = new HelpdeskEmailService();
    const emailsToNotify: string[] = [];

    // Coletar emails dos observadores
    ticket.observadores.forEach(obs => {
      if (obs.email) {
        emailsToNotify.push(obs.email);
      }
      if (obs.colaborador?.email) {
        emailsToNotify.push(obs.colaborador.email);
      }
    });

    // Adicionar email do atribuído se existir
    if (ticket.atribuido?.email) {
      emailsToNotify.push(ticket.atribuido.email);
    }

    // Remover duplicatas
    const uniqueEmails = [...new Set(emailsToNotify)];

    if (uniqueEmails.length === 0) {
      return NextResponse.json({ message: 'Nenhum email para notificar' });
    }

    // Preparar dados do email baseado no tipo
    let emailData;
    switch (type) {
      case 'ticket_updated':
        emailData = {
          ticketNumber: ticket.numero,
          subject: ticket.assunto,
          changes: data.changes || [],
          updatedBy: session.user.name || session.user.email,
          ticketUrl: `${process.env.NEXTAUTH_URL}/helpdesk/tickets/${ticket.id}`
        };
        break;
      case 'new_message':
        emailData = {
          ticketNumber: ticket.numero,
          subject: ticket.assunto,
          message: data.message || '',
          author: session.user.name || session.user.email,
          ticketUrl: `${process.env.NEXTAUTH_URL}/helpdesk/tickets/${ticket.id}`
        };
        break;
      case 'observer_added':
        emailData = {
          ticketNumber: ticket.numero,
          subject: ticket.assunto,
          addedBy: session.user.name || session.user.email,
          ticketUrl: `${process.env.NEXTAUTH_URL}/helpdesk/tickets/${ticket.id}`
        };
        break;
      default:
        return NextResponse.json({ error: 'Tipo de notificação inválido' }, { status: 400 });
    }

    // Enviar emails
    const results = await Promise.allSettled(
      uniqueEmails.map(email => 
        emailService.sendTicketNotification(email, type, emailData)
      )
    );

    // Registrar no histórico do ticket
    await db.helpdeskHistorico.create({
      data: {
        ticketId: ticket.id,
        acao: 'notification_sent',
        detalhes: `Notificação enviada para ${uniqueEmails.length} observador(es): ${type}`,
        usuarioId: session.user.id,
        dataHora: new Date()
      }
    });

    const successful = results.filter(r => r.status === 'fulfilled').length;
    const failed = results.filter(r => r.status === 'rejected').length;

    return NextResponse.json({
      message: `Notificações processadas: ${successful} enviadas, ${failed} falharam`,
      successful,
      failed,
      totalEmails: uniqueEmails.length
    });

  } catch (error) {
    console.error('Erro ao enviar notificações:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}
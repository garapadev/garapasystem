import { db } from '@/lib/db';
import { HelpdeskLogTipo } from '@prisma/client';

interface TicketChange {
  field: string;
  oldValue: any;
  newValue: any;
  label: string;
}

interface AuditContext {
  autorNome: string;
  autorEmail: string;
  autorId?: string;
}

export class TicketAuditService {
  /**
   * Registra a criação de um ticket
   */
  static async logTicketCreation(
    ticketId: string,
    ticketData: any,
    context: AuditContext
  ): Promise<void> {
    try {
      await db.helpdeskTicketLog.create({
        data: {
          ticketId,
          tipo: HelpdeskLogTipo.CRIACAO,
          descricao: `Ticket criado com assunto: "${ticketData.assunto}"`,
          valorNovo: JSON.stringify({
            assunto: ticketData.assunto,
            prioridade: ticketData.prioridade,
            status: ticketData.status,
            solicitante: ticketData.solicitanteNome
          }),
          autorNome: context.autorNome,
          autorEmail: context.autorEmail,
          autorId: context.autorId
        }
      });
    } catch (error) {
      console.error('Erro ao registrar criação do ticket:', error);
    }
  }

  /**
   * Registra alterações em um ticket
   */
  static async logTicketUpdate(
    ticketId: string,
    oldData: any,
    newData: any,
    context: AuditContext
  ): Promise<void> {
    try {
      const changes = this.detectChanges(oldData, newData);
      
      for (const change of changes) {
        await this.createLogEntry(ticketId, change, context);
      }
    } catch (error) {
      console.error('Erro ao registrar alterações do ticket:', error);
    }
  }

  /**
   * Registra adição de mensagem
   */
  static async logMessageAdded(
    ticketId: string,
    messageData: any,
    context: AuditContext
  ): Promise<void> {
    try {
      const isInternal = messageData.isInterno ? ' (interna)' : '';
      
      await db.helpdeskTicketLog.create({
        data: {
          ticketId,
          tipo: HelpdeskLogTipo.MENSAGEM_ADICIONADA,
          descricao: `Nova mensagem${isInternal} adicionada por ${messageData.remetenteNome}`,
          valorNovo: JSON.stringify({
            remetente: messageData.remetenteNome,
            email: messageData.remetenteEmail,
            isInterno: messageData.isInterno,
            preview: messageData.conteudo.substring(0, 100) + (messageData.conteudo.length > 100 ? '...' : '')
          }),
          autorNome: context.autorNome,
          autorEmail: context.autorEmail,
          autorId: context.autorId
        }
      });
    } catch (error) {
      console.error('Erro ao registrar adição de mensagem:', error);
    }
  }

  /**
   * Registra fechamento de ticket
   */
  static async logTicketClosure(
    ticketId: string,
    context: AuditContext
  ): Promise<void> {
    try {
      await db.helpdeskTicketLog.create({
        data: {
          ticketId,
          tipo: HelpdeskLogTipo.FECHAMENTO,
          descricao: 'Ticket fechado',
          valorNovo: new Date().toISOString(),
          autorNome: context.autorNome,
          autorEmail: context.autorEmail,
          autorId: context.autorId
        }
      });
    } catch (error) {
      console.error('Erro ao registrar fechamento do ticket:', error);
    }
  }

  /**
   * Registra reabertura de ticket
   */
  static async logTicketReopening(
    ticketId: string,
    context: AuditContext
  ): Promise<void> {
    try {
      await db.helpdeskTicketLog.create({
        data: {
          ticketId,
          tipo: HelpdeskLogTipo.REABERTURA,
          descricao: 'Ticket reaberto',
          valorNovo: new Date().toISOString(),
          autorNome: context.autorNome,
          autorEmail: context.autorEmail,
          autorId: context.autorId
        }
      });
    } catch (error) {
      console.error('Erro ao registrar reabertura do ticket:', error);
    }
  }

  /**
   * Detecta mudanças entre dois objetos
   */
  private static detectChanges(oldData: any, newData: any): TicketChange[] {
    const changes: TicketChange[] = [];
    
    // Mapear campos que devem ser monitorados
    const fieldMappings = {
      status: { label: 'Status', type: HelpdeskLogTipo.STATUS_ALTERADO },
      prioridade: { label: 'Prioridade', type: HelpdeskLogTipo.PRIORIDADE_ALTERADA },
      responsavelId: { label: 'Responsável', type: HelpdeskLogTipo.RESPONSAVEL_ALTERADO },
      assunto: { label: 'Assunto', type: HelpdeskLogTipo.ASSUNTO_ALTERADO },
      descricao: { label: 'Descrição', type: HelpdeskLogTipo.DESCRICAO_ALTERADA }
    };

    for (const [field, config] of Object.entries(fieldMappings)) {
      if (oldData[field] !== newData[field]) {
        let oldValue = oldData[field];
        let newValue = newData[field];
        
        // Tratamento especial para responsável
        if (field === 'responsavelId') {
          oldValue = oldData.responsavel?.nome || 'Não atribuído';
          newValue = newData.responsavel?.nome || 'Não atribuído';
        }
        
        changes.push({
          field,
          oldValue,
          newValue,
          label: config.label
        });
      }
    }
    
    return changes;
  }

  /**
   * Cria uma entrada de log para uma mudança específica
   */
  private static async createLogEntry(
    ticketId: string,
    change: TicketChange,
    context: AuditContext
  ): Promise<void> {
    const typeMapping: Record<string, HelpdeskLogTipo> = {
      status: HelpdeskLogTipo.STATUS_ALTERADO,
      prioridade: HelpdeskLogTipo.PRIORIDADE_ALTERADA,
      responsavelId: HelpdeskLogTipo.RESPONSAVEL_ALTERADO,
      assunto: HelpdeskLogTipo.ASSUNTO_ALTERADO,
      descricao: HelpdeskLogTipo.DESCRICAO_ALTERADA
    };

    const tipo = typeMapping[change.field];
    if (!tipo) return;

    const descricao = `${change.label} alterado de "${change.oldValue}" para "${change.newValue}"`;

    await db.helpdeskTicketLog.create({
      data: {
        ticketId,
        tipo,
        descricao,
        valorAnterior: String(change.oldValue),
        valorNovo: String(change.newValue),
        autorNome: context.autorNome,
        autorEmail: context.autorEmail,
        autorId: context.autorId
      }
    });
  }

  /**
   * Obtém o contexto do autor baseado na sessão ou dados fornecidos
   */
  static getAuditContext(
    autorNome?: string,
    autorEmail?: string,
    autorId?: string
  ): AuditContext {
    // Em produção, isso deveria vir da sessão do usuário
    return {
      autorNome: autorNome || 'Sistema',
      autorEmail: autorEmail || 'sistema@helpdesk.com',
      autorId: autorId
    };
  }

  /**
   * Formata valores para exibição no histórico
   */
  static formatValueForDisplay(field: string, value: any): string {
    if (value === null || value === undefined) {
      return 'Não definido';
    }

    switch (field) {
      case 'prioridade':
        const prioridadeLabels: Record<string, string> = {
          BAIXA: 'Baixa',
          MEDIA: 'Média',
          ALTA: 'Alta',
          URGENTE: 'Urgente'
        };
        return prioridadeLabels[value] || value;

      case 'status':
        const statusLabels: Record<string, string> = {
          ABERTO: 'Aberto',
          EM_ANDAMENTO: 'Em Andamento',
          AGUARDANDO: 'Aguardando',
          RESOLVIDO: 'Resolvido',
          FECHADO: 'Fechado'
        };
        return statusLabels[value] || value;

      default:
        return String(value);
    }
  }
}
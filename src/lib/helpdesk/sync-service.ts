import { db } from '@/lib/db';
import { Cliente, HelpdeskTicket, HelpdeskStatus } from '@prisma/client';
import { ClientIntegrationService } from './client-integration-service';

export interface SyncStats {
  ticketsProcessed: number;
  clientsUpdated: number;
  clientsCreated: number;
  ticketsAssociated: number;
  errors: string[];
  startTime: Date;
  endTime?: Date;
  duration?: number;
}

export interface SyncOptions {
  batchSize?: number;
  maxRetries?: number;
  syncUnassociatedOnly?: boolean;
  syncClientData?: boolean;
  syncTicketHistory?: boolean;
}

export class HelpdeskClientSyncService {
  private static instance: HelpdeskClientSyncService;
  private syncRunning = false;
  private lastSyncTime: Date | null = null;

  static getInstance(): HelpdeskClientSyncService {
    if (!HelpdeskClientSyncService.instance) {
      HelpdeskClientSyncService.instance = new HelpdeskClientSyncService();
    }
    return HelpdeskClientSyncService.instance;
  }

  /**
   * Executa sincronização completa entre Helpdesk e Clientes
   */
  async fullSync(options: SyncOptions = {}): Promise<SyncStats> {
    if (this.syncRunning) {
      throw new Error('Sincronização já está em execução');
    }

    this.syncRunning = true;
    const stats: SyncStats = {
      ticketsProcessed: 0,
      clientsUpdated: 0,
      clientsCreated: 0,
      ticketsAssociated: 0,
      errors: [],
      startTime: new Date()
    };

    try {
      console.log('Iniciando sincronização completa Helpdesk-Clientes...');

      // 1. Sincronizar tickets não associados
      if (options.syncUnassociatedOnly !== false) {
        await this.syncUnassociatedTickets(stats, options);
      }

      // 2. Sincronizar dados de clientes existentes
      if (options.syncClientData) {
        await this.syncClientData(stats, options);
      }

      // 3. Sincronizar histórico de tickets
      if (options.syncTicketHistory) {
        await this.syncTicketHistory(stats, options);
      }

      stats.endTime = new Date();
      stats.duration = stats.endTime.getTime() - stats.startTime.getTime();
      
      this.lastSyncTime = stats.endTime;
      
      console.log('Sincronização concluída:', {
        duration: `${stats.duration}ms`,
        ticketsProcessed: stats.ticketsProcessed,
        clientsCreated: stats.clientsCreated,
        ticketsAssociated: stats.ticketsAssociated,
        errors: stats.errors.length
      });

      return stats;

    } catch (error) {
      stats.errors.push(`Erro geral na sincronização: ${error instanceof Error ? error.message : 'Erro desconhecido'}`);
      throw error;
    } finally {
      this.syncRunning = false;
    }
  }

  /**
   * Sincroniza tickets que não possuem cliente associado
   */
  private async syncUnassociatedTickets(stats: SyncStats, options: SyncOptions): Promise<void> {
    const batchSize = options.batchSize || 50;
    let offset = 0;
    let hasMore = true;

    while (hasMore) {
      try {
        // Buscar tickets sem cliente associado
        const tickets = await db.helpdeskTicket.findMany({
          where: {
            clienteId: null,
            solicitanteEmail: {
              not: null
            }
          },
          take: batchSize,
          skip: offset,
          orderBy: {
            createdAt: 'asc'
          }
        });

        if (tickets.length === 0) {
          hasMore = false;
          break;
        }

        // Processar cada ticket
        for (const ticket of tickets) {
          try {
            stats.ticketsProcessed++;
            
            if (!ticket.solicitanteEmail) continue;

            // Tentar associar automaticamente
            const result = await ClientIntegrationService.autoAssociateTicketToClient(
              ticket.id,
              ticket.solicitanteEmail,
              ticket.solicitanteTelefone || undefined,
              ticket.solicitanteNome
            );

            if (result.success) {
              if (result.clienteId) {
                stats.ticketsAssociated++;
                if (result.clienteId && !result.existingClient) {
                  stats.clientsCreated++;
                }
              }
            } else if (result.message) {
              stats.errors.push(`Ticket ${ticket.numero}: ${result.message}`);
            }

            // Pequena pausa para evitar sobrecarga
            await new Promise(resolve => setTimeout(resolve, 10));

          } catch (error) {
            stats.errors.push(`Erro ao processar ticket ${ticket.numero}: ${error instanceof Error ? error.message : 'Erro desconhecido'}`);
          }
        }

        offset += batchSize;

      } catch (error) {
        stats.errors.push(`Erro ao buscar tickets: ${error instanceof Error ? error.message : 'Erro desconhecido'}`);
        break;
      }
    }
  }

  /**
   * Sincroniza dados de clientes com base nos tickets
   */
  private async syncClientData(stats: SyncStats, options: SyncOptions): Promise<void> {
    try {
      // Buscar clientes que possuem tickets
      const clientesComTickets = await db.cliente.findMany({
        where: {
          helpdeskTickets: {
            some: {}
          }
        },
        include: {
          helpdeskTickets: {
            orderBy: {
              createdAt: 'desc'
            },
            take: 1
          }
        }
      });

      for (const cliente of clientesComTickets) {
        try {
          const ultimoTicket = cliente.helpdeskTickets[0];
          let updated = false;

          // Atualizar telefone se não existir
          if (!cliente.telefone && ultimoTicket?.solicitanteTelefone) {
            await db.cliente.update({
              where: { id: cliente.id },
              data: { telefone: ultimoTicket.solicitanteTelefone }
            });
            updated = true;
          }

          // Atualizar nome se for mais completo
          if (ultimoTicket?.solicitanteNome && 
              ultimoTicket.solicitanteNome.length > cliente.nome.length) {
            await db.cliente.update({
              where: { id: cliente.id },
              data: { nome: ultimoTicket.solicitanteNome }
            });
            updated = true;
          }

          if (updated) {
            stats.clientsUpdated++;
          }

        } catch (error) {
          stats.errors.push(`Erro ao atualizar cliente ${cliente.nome}: ${error instanceof Error ? error.message : 'Erro desconhecido'}`);
        }
      }

    } catch (error) {
      stats.errors.push(`Erro na sincronização de dados de clientes: ${error instanceof Error ? error.message : 'Erro desconhecido'}`);
    }
  }

  /**
   * Sincroniza histórico de tickets para análise
   */
  private async syncTicketHistory(stats: SyncStats, options: SyncOptions): Promise<void> {
    try {
      // Atualizar estatísticas de clientes baseadas nos tickets
      const clientesComTickets = await db.cliente.findMany({
        where: {
          helpdeskTickets: {
            some: {}
          }
        },
        include: {
          helpdeskTickets: {
            select: {
              id: true,
              status: true,
              prioridade: true,
              dataAbertura: true,
              dataFechamento: true
            }
          }
        }
      });

      for (const cliente of clientesComTickets) {
        try {
          const tickets = cliente.helpdeskTickets;
          const ticketsResolvidos = tickets.filter(t => 
            t.status === HelpdeskStatus.RESOLVIDO || t.status === HelpdeskStatus.FECHADO
          );
          
          // Calcular valor potencial baseado no histórico de tickets
          const valorPotencial = this.calculatePotentialValue(tickets);
          
          if (valorPotencial > 0) {
            await db.cliente.update({
              where: { id: cliente.id },
              data: { valorPotencial }
            });
            stats.clientsUpdated++;
          }

        } catch (error) {
          stats.errors.push(`Erro ao sincronizar histórico do cliente ${cliente.nome}: ${error instanceof Error ? error.message : 'Erro desconhecido'}`);
        }
      }

    } catch (error) {
      stats.errors.push(`Erro na sincronização de histórico: ${error instanceof Error ? error.message : 'Erro desconhecido'}`);
    }
  }

  /**
   * Calcula valor potencial do cliente baseado no histórico de tickets
   */
  private calculatePotentialValue(tickets: any[]): number {
    if (tickets.length === 0) return 0;

    // Fórmula simples: número de tickets * fator de prioridade * fator de resolução
    let valor = 0;
    
    for (const ticket of tickets) {
      let ticketValue = 100; // Valor base por ticket
      
      // Fator de prioridade
      switch (ticket.prioridade) {
        case 'URGENTE':
          ticketValue *= 2;
          break;
        case 'ALTA':
          ticketValue *= 1.5;
          break;
        case 'MEDIA':
          ticketValue *= 1;
          break;
        case 'BAIXA':
          ticketValue *= 0.5;
          break;
      }
      
      // Fator de resolução
      if (ticket.status === 'RESOLVIDO' || ticket.status === 'FECHADO') {
        ticketValue *= 1.2; // Bônus por resolução
      }
      
      valor += ticketValue;
    }
    
    return Math.round(valor);
  }

  /**
   * Executa sincronização incremental (apenas novos dados)
   */
  async incrementalSync(options: SyncOptions = {}): Promise<SyncStats> {
    const since = this.lastSyncTime || new Date(Date.now() - 24 * 60 * 60 * 1000); // Últimas 24h se nunca sincronizou
    
    return this.fullSync({
      ...options,
      syncUnassociatedOnly: true // Apenas tickets não associados
    });
  }

  /**
   * Verifica se a sincronização está em execução
   */
  isSyncRunning(): boolean {
    return this.syncRunning;
  }

  /**
   * Obtém a data da última sincronização
   */
  getLastSyncTime(): Date | null {
    return this.lastSyncTime;
  }

  /**
   * Obtém estatísticas de sincronização
   */
  async getSyncStats(): Promise<{
    totalTickets: number;
    ticketsWithClients: number;
    ticketsWithoutClients: number;
    totalClients: number;
    clientsWithTickets: number;
  }> {
    const [totalTickets, ticketsWithClients, totalClients, clientsWithTickets] = await Promise.all([
      db.helpdeskTicket.count(),
      db.helpdeskTicket.count({ where: { clienteId: { not: null } } }),
      db.cliente.count(),
      db.cliente.count({ where: { helpdeskTickets: { some: {} } } })
    ]);

    return {
      totalTickets,
      ticketsWithClients,
      ticketsWithoutClients: totalTickets - ticketsWithClients,
      totalClients,
      clientsWithTickets
    };
  }
}

// Instância singleton
export const syncService = HelpdeskClientSyncService.getInstance();
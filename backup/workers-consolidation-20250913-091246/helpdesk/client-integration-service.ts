import { db } from '../db';
import { Cliente, HelpdeskTicket } from '@prisma/client';

export interface ClientSearchResult {
  id: string;
  nome: string;
  email: string | null;
  telefone: string | null;
  empresa: string | null;
  tipo: string;
  status: string;
  confidence: number; // 0-100, confiança da correspondência
}

export interface ClientAssociationResult {
  success: boolean;
  clienteId?: string;
  cliente?: Cliente;
  message: string;
  confidence?: number;
}

export class ClientIntegrationService {
  /**
   * Busca clientes por email com correspondência exata
   */
  static async findClientByEmail(email: string): Promise<Cliente | null> {
    if (!email || !email.includes('@')) {
      return null;
    }

    try {
      const cliente = await db.cliente.findUnique({
        where: {
          email: email.toLowerCase().trim()
        },
        include: {
          grupoHierarquico: {
            select: {
              id: true,
              nome: true
            }
          },
          enderecos: {
            where: {
              ativo: true
            }
          }
        }
      });

      return cliente;
    } catch (error) {
      console.error('Erro ao buscar cliente por email:', error);
      return null;
    }
  }

  /**
   * Busca clientes por telefone com correspondência aproximada
   */
  static async findClientByPhone(telefone: string): Promise<Cliente | null> {
    if (!telefone) {
      return null;
    }

    // Normalizar telefone (remover caracteres especiais)
    const phoneNormalized = telefone.replace(/\D/g, '');
    
    if (phoneNormalized.length < 8) {
      return null;
    }

    try {
      // Buscar por telefone exato primeiro
      let cliente = await db.cliente.findFirst({
        where: {
          telefone: {
            contains: phoneNormalized
          }
        },
        include: {
          grupoHierarquico: {
            select: {
              id: true,
              nome: true
            }
          }
        }
      });

      // Se não encontrou, tentar busca mais flexível
      if (!cliente && phoneNormalized.length >= 10) {
        const lastDigits = phoneNormalized.slice(-8); // Últimos 8 dígitos
        cliente = await db.cliente.findFirst({
          where: {
            telefone: {
              contains: lastDigits
            }
          },
          include: {
            grupoHierarquico: {
              select: {
                id: true,
                nome: true
              }
            }
          }
        });
      }

      return cliente;
    } catch (error) {
      console.error('Erro ao buscar cliente por telefone:', error);
      return null;
    }
  }

  /**
   * Busca clientes por nome com correspondência aproximada
   */
  static async findClientsByName(nome: string): Promise<ClientSearchResult[]> {
    if (!nome || nome.length < 3) {
      return [];
    }

    try {
      const clientes = await db.cliente.findMany({
        where: {
          nome: {
            contains: nome.trim(),
            mode: 'insensitive'
          }
        },
        take: 10,
        orderBy: {
          createdAt: 'desc'
        }
      });

      return clientes.map(cliente => ({
        id: cliente.id,
        nome: cliente.nome,
        email: cliente.email,
        telefone: cliente.telefone,
        empresa: cliente.empresa,
        tipo: cliente.tipo,
        status: cliente.status,
        confidence: this.calculateNameConfidence(nome, cliente.nome)
      }));
    } catch (error) {
      console.error('Erro ao buscar clientes por nome:', error);
      return [];
    }
  }

  /**
   * Busca inteligente de cliente baseada em múltiplos critérios
   */
  static async smartClientSearch(
    email?: string,
    telefone?: string,
    nome?: string
  ): Promise<ClientSearchResult[]> {
    const results: ClientSearchResult[] = [];

    // 1. Busca por email (maior prioridade)
    if (email) {
      const clienteByEmail = await this.findClientByEmail(email);
      if (clienteByEmail) {
        results.push({
          id: clienteByEmail.id,
          nome: clienteByEmail.nome,
          email: clienteByEmail.email,
          telefone: clienteByEmail.telefone,
          empresa: clienteByEmail.empresa,
          tipo: clienteByEmail.tipo,
          status: clienteByEmail.status,
          confidence: 95 // Alta confiança para email exato
        });
      }
    }

    // 2. Busca por telefone (média prioridade)
    if (telefone && results.length === 0) {
      const clienteByPhone = await this.findClientByPhone(telefone);
      if (clienteByPhone) {
        results.push({
          id: clienteByPhone.id,
          nome: clienteByPhone.nome,
          email: clienteByPhone.email,
          telefone: clienteByPhone.telefone,
          empresa: clienteByPhone.empresa,
          tipo: clienteByPhone.tipo,
          status: clienteByPhone.status,
          confidence: 80 // Média confiança para telefone
        });
      }
    }

    // 3. Busca por nome (menor prioridade)
    if (nome && results.length === 0) {
      const clientesByName = await this.findClientsByName(nome);
      results.push(...clientesByName);
    }

    // Remover duplicatas e ordenar por confiança
    const uniqueResults = results.filter((result, index, self) => 
      index === self.findIndex(r => r.id === result.id)
    );

    return uniqueResults.sort((a, b) => b.confidence - a.confidence);
  }

  /**
   * Associa automaticamente um ticket a um cliente
   */
  static async autoAssociateTicketToClient(
    ticketId: string,
    email?: string,
    telefone?: string,
    nome?: string
  ): Promise<ClientAssociationResult> {
    try {
      // Buscar o ticket
      const ticket = await db.helpdeskTicket.findUnique({
        where: { id: ticketId }
      });

      if (!ticket) {
        return {
          success: false,
          message: 'Ticket não encontrado'
        };
      }

      // Se já tem cliente associado, não fazer nada
      if (ticket.clienteId) {
        const cliente = await db.cliente.findUnique({
          where: { id: ticket.clienteId }
        });
        
        return {
          success: true,
          clienteId: ticket.clienteId,
          cliente: cliente || undefined,
          message: 'Ticket já possui cliente associado',
          confidence: 100
        };
      }

      // Buscar cliente
      const searchResults = await this.smartClientSearch(email, telefone, nome);
      
      if (searchResults.length === 0) {
        return {
          success: false,
          message: 'Nenhum cliente encontrado com os dados fornecidos'
        };
      }

      // Pegar o resultado com maior confiança
      const bestMatch = searchResults[0];
      
      // Só associar automaticamente se a confiança for alta (>= 80)
      if (bestMatch.confidence < 80) {
        return {
          success: false,
          message: `Cliente encontrado mas com baixa confiança (${bestMatch.confidence}%). Associação manual recomendada.`,
          confidence: bestMatch.confidence
        };
      }

      // Associar o ticket ao cliente
      const updatedTicket = await db.helpdeskTicket.update({
        where: { id: ticketId },
        data: {
          clienteId: bestMatch.id
        },
        include: {
          cliente: true
        }
      });

      return {
        success: true,
        clienteId: bestMatch.id,
        cliente: updatedTicket.cliente || undefined,
        message: `Ticket associado automaticamente ao cliente ${bestMatch.nome}`,
        confidence: bestMatch.confidence
      };
    } catch (error) {
      console.error('Erro ao associar ticket ao cliente:', error);
      return {
        success: false,
        message: 'Erro interno ao associar ticket ao cliente'
      };
    }
  }

  /**
   * Cria um novo cliente a partir dos dados do ticket
   */
  static async createClientFromTicket(
    email: string,
    nome?: string,
    telefone?: string
  ): Promise<ClientAssociationResult> {
    try {
      // Verificar se já existe cliente com este email
      const existingClient = await this.findClientByEmail(email);
      if (existingClient) {
        return {
          success: false,
          message: 'Cliente com este email já existe'
        };
      }

      // Criar novo cliente
      const cliente = await db.cliente.create({
        data: {
          nome: nome || email.split('@')[0], // Usar parte do email como nome se não fornecido
          email: email.toLowerCase().trim(),
          telefone: telefone || null,
          tipo: 'PESSOA_FISICA',
          status: 'LEAD',
          observacoes: 'Cliente criado automaticamente via sistema de helpdesk'
        }
      });

      return {
        success: true,
        clienteId: cliente.id,
        cliente,
        message: `Novo cliente criado: ${cliente.nome}`,
        confidence: 100
      };
    } catch (error) {
      console.error('Erro ao criar cliente a partir do ticket:', error);
      return {
        success: false,
        message: 'Erro interno ao criar cliente'
      };
    }
  }

  /**
   * Calcula a confiança da correspondência de nomes
   */
  private static calculateNameConfidence(searchName: string, clientName: string): number {
    const search = searchName.toLowerCase().trim();
    const client = clientName.toLowerCase().trim();

    // Correspondência exata
    if (search === client) {
      return 90;
    }

    // Correspondência parcial
    if (client.includes(search) || search.includes(client)) {
      return 70;
    }

    // Correspondência de palavras
    const searchWords = search.split(' ');
    const clientWords = client.split(' ');
    const matchingWords = searchWords.filter(word => 
      clientWords.some(clientWord => 
        clientWord.includes(word) || word.includes(clientWord)
      )
    );

    const matchPercentage = (matchingWords.length / Math.max(searchWords.length, clientWords.length)) * 100;
    return Math.min(matchPercentage, 60); // Máximo 60% para correspondência de palavras
  }

  /**
   * Obtém histórico de tickets de um cliente
   */
  static async getClientTicketHistory(clienteId: string): Promise<HelpdeskTicket[]> {
    try {
      return await db.helpdeskTicket.findMany({
        where: {
          clienteId
        },
        include: {
          departamento: {
            select: {
              id: true,
              nome: true
            }
          },
          atribuidoPara: {
            select: {
              id: true,
              nome: true
            }
          }
        },
        orderBy: {
          createdAt: 'desc'
        }
      });
    } catch (error) {
      console.error('Erro ao buscar histórico de tickets do cliente:', error);
      return [];
    }
  }

  /**
   * Obtém estatísticas de tickets por cliente
   */
  static async getClientTicketStats(clienteId: string) {
    try {
      const [total, abertos, fechados, emAndamento] = await Promise.all([
        db.helpdeskTicket.count({
          where: { clienteId }
        }),
        db.helpdeskTicket.count({
          where: { 
            clienteId,
            status: 'ABERTO'
          }
        }),
        db.helpdeskTicket.count({
          where: { 
            clienteId,
            status: 'FECHADO'
          }
        }),
        db.helpdeskTicket.count({
          where: { 
            clienteId,
            status: 'EM_ANDAMENTO'
          }
        })
      ]);

      return {
        total,
        abertos,
        fechados,
        emAndamento,
        taxaResolucao: total > 0 ? Math.round((fechados / total) * 100) : 0
      };
    } catch (error) {
      console.error('Erro ao buscar estatísticas de tickets do cliente:', error);
      return {
        total: 0,
        abertos: 0,
        fechados: 0,
        emAndamento: 0,
        taxaResolucao: 0
      };
    }
  }
}
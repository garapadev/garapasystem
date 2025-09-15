import { PrismaClient } from '@prisma/client';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

const prisma = new PrismaClient();

export interface CreateTaskFromEmailData {
  emailId: string;
  titulo?: string;
  descricao?: string;
  prioridade?: 'BAIXA' | 'MEDIA' | 'ALTA' | 'URGENTE';
  dataVencimento?: Date;
  responsavelId?: string;
  clienteId?: string;
  oportunidadeId?: string;
}

export interface EmailTaskResult {
  success: boolean;
  task?: any;
  error?: string;
}

export class EmailTaskService {
  /**
   * Cria uma tarefa a partir de um email
   */
  static async createTaskFromEmail(data: CreateTaskFromEmailData): Promise<EmailTaskResult> {
    try {
      const session = await getServerSession(authOptions);
      if (!session?.user?.id) {
        return { success: false, error: 'Usuário não autenticado' };
      }

      // Buscar o email
      const email = await prisma.email.findUnique({
        where: { id: data.emailId },
        include: {
          emailConfig: {
            include: {
              colaborador: true
            }
          },
          folder: true
        }
      });

      if (!email) {
        return { success: false, error: 'Email não encontrado' };
      }

      // Verificar se o usuário tem acesso ao email
      const hasAccess = email.emailConfig.colaboradorId === session.user.id;
      if (!hasAccess) {
        return { success: false, error: 'Sem permissão para acessar este email' };
      }

      // Extrair informações do email para a tarefa
      const fromData = JSON.parse(email.from || '[]');
      const toData = JSON.parse(email.to || '[]');
      
      const fromEmail = fromData[0]?.address || '';
      const fromName = fromData[0]?.name || fromEmail;
      
      // Gerar título da tarefa se não fornecido
      const taskTitle = data.titulo || `Email: ${email.subject || 'Sem assunto'}`;
      
      // Gerar descrição da tarefa
      const emailContent = email.textContent || email.htmlContent || '';
      const taskDescription = data.descricao || 
        `**Email de:** ${fromName} (${fromEmail})\n` +
        `**Data:** ${email.date.toLocaleString('pt-BR')}\n` +
        `**Assunto:** ${email.subject || 'Sem assunto'}\n\n` +
        `**Conteúdo:**\n${emailContent.substring(0, 1000)}${emailContent.length > 1000 ? '...' : ''}`;

      // Tentar identificar cliente pelo email
      let clienteId = data.clienteId;
      if (!clienteId && fromEmail) {
        const cliente = await prisma.cliente.findFirst({
          where: {
            email: fromEmail
          }
        });
        if (cliente) {
          clienteId = cliente.id;
        }
      }

      // Criar a tarefa
      const task = await prisma.task.create({
        data: {
          titulo: taskTitle,
          descricao: taskDescription,
          prioridade: data.prioridade || 'MEDIA',
          status: 'PENDENTE',
          dataVencimento: data.dataVencimento,
          responsavelId: data.responsavelId || session.user.id,
          criadoPorId: session.user.id,
          clienteId,
          oportunidadeId: data.oportunidadeId,
          emailId: email.id,
          metadados: JSON.stringify({
            emailMessageId: email.messageId,
            emailSubject: email.subject,
            emailFrom: fromData,
            emailTo: toData,
            emailDate: email.date,
            createdFromEmail: true
          })
        },
        include: {
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
          cliente: {
            select: {
              id: true,
              nome: true,
              email: true
            }
          },
          email: {
            select: {
              id: true,
              subject: true,
              messageId: true,
              date: true
            }
          }
        }
      });

      return { success: true, task };
    } catch (error) {
      console.error('Erro ao criar tarefa a partir do email:', error);
      return { success: false, error: 'Erro interno do servidor' };
    }
  }

  /**
   * Lista tarefas criadas a partir de emails
   */
  static async getTasksFromEmails(userId: string) {
    try {
      const tasks = await prisma.task.findMany({
        where: {
          emailId: { not: null },
          OR: [
            { responsavelId: userId },
            { criadoPorId: userId }
          ]
        },
        include: {
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
          cliente: {
            select: {
              id: true,
              nome: true,
              email: true
            }
          },
          email: {
            select: {
              id: true,
              subject: true,
              messageId: true,
              date: true,
              from: true
            }
          }
        },
        orderBy: {
          createdAt: 'desc'
        }
      });

      return tasks;
    } catch (error) {
      console.error('Erro ao buscar tarefas de emails:', error);
      throw error;
    }
  }

  /**
   * Verifica se um email já foi transformado em tarefa
   */
  static async isEmailAlreadyTask(emailId: string): Promise<boolean> {
    try {
      const existingTask = await prisma.task.findFirst({
        where: { emailId }
      });
      return !!existingTask;
    } catch (error) {
      console.error('Erro ao verificar se email já é tarefa:', error);
      return false;
    }
  }

  /**
   * Busca colaboradores para atribuir tarefas
   */
  static async getAvailableAssignees() {
    try {
      const colaboradores = await prisma.colaborador.findMany({
        where: {
          ativo: true
        },
        select: {
          id: true,
          nome: true,
          email: true
        },
        orderBy: {
          nome: 'asc'
        }
      });

      return colaboradores;
    } catch (error) {
      console.error('Erro ao buscar colaboradores:', error);
      return [];
    }
  }

  /**
   * Busca clientes para vincular tarefas
   */
  static async getAvailableClients() {
    try {
      const clientes = await prisma.cliente.findMany({
        select: {
          id: true,
          nome: true,
          email: true
        },
        orderBy: {
          nome: 'asc'
        }
      });

      return clientes;
    } catch (error) {
      console.error('Erro ao buscar clientes:', error);
      return [];
    }
  }
}
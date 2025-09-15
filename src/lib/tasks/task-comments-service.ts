import { PrismaClient } from '@prisma/client';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

const prisma = new PrismaClient();

export interface CreateTaskCommentData {
  taskId: string;
  conteudo: string;
  isInterno?: boolean;
}

export interface TaskCommentResult {
  success: boolean;
  comment?: any;
  error?: string;
}

export interface TaskCommentsListResult {
  success: boolean;
  comments?: any[];
  error?: string;
}

export class TaskCommentsService {
  /**
   * Criar um novo comentário em uma tarefa
   */
  static async createComment(data: CreateTaskCommentData): Promise<TaskCommentResult> {
    try {
      const session = await getServerSession(authOptions);
      if (!session?.user?.id) {
        return { success: false, error: 'Usuário não autenticado' };
      }

      // Verificar se a tarefa existe e se o usuário tem acesso
      const task = await prisma.task.findUnique({
        where: { id: data.taskId },
        include: {
          responsavel: true,
          criadoPor: true
        }
      });

      if (!task) {
        return { success: false, error: 'Tarefa não encontrada' };
      }

      // Verificar se o usuário tem permissão para comentar
      const hasAccess = 
        task.responsavelId === session.user.id ||
        task.criadoPorId === session.user.id;

      if (!hasAccess) {
        return { success: false, error: 'Sem permissão para comentar nesta tarefa' };
      }

      // Criar o comentário
      const comment = await prisma.taskComment.create({
        data: {
          taskId: data.taskId,
          conteudo: data.conteudo,
          isInterno: data.isInterno || false,
          autorId: session.user.id
        },
        include: {
          autor: {
            select: {
              id: true,
              nome: true,
              email: true
            }
          }
        }
      });

      // Registrar no audit trail
      await TaskCommentsService.createAuditLog({
        taskId: data.taskId,
        acao: 'COMENTARIO_ADICIONADO',
        descricao: `Comentário adicionado: ${data.conteudo.substring(0, 100)}${data.conteudo.length > 100 ? '...' : ''}`,
        autorId: session.user.id,
        autorNome: session.user.name || 'Usuário',
        autorEmail: session.user.email || ''
      });

      return { success: true, comment };
    } catch (error) {
      console.error('Erro ao criar comentário:', error);
      return { success: false, error: 'Erro interno do servidor' };
    }
  }

  /**
   * Listar comentários de uma tarefa
   */
  static async getTaskComments(taskId: string): Promise<TaskCommentsListResult> {
    try {
      const session = await getServerSession(authOptions);
      if (!session?.user?.id) {
        return { success: false, error: 'Usuário não autenticado' };
      }

      // Verificar se a tarefa existe e se o usuário tem acesso
      const task = await prisma.task.findUnique({
        where: { id: taskId },
        include: {
          responsavel: true,
          criadoPor: true
        }
      });

      if (!task) {
        return { success: false, error: 'Tarefa não encontrada' };
      }

      // Verificar se o usuário tem permissão para ver os comentários
      const hasAccess = 
        task.responsavelId === session.user.id ||
        task.criadoPorId === session.user.id;

      if (!hasAccess) {
        return { success: false, error: 'Sem permissão para ver comentários desta tarefa' };
      }

      // Buscar comentários
      const comments = await prisma.taskComment.findMany({
        where: { taskId },
        include: {
          autor: {
            select: {
              id: true,
              nome: true,
              email: true
            }
          }
        },
        orderBy: {
          createdAt: 'asc'
        }
      });

      return { success: true, comments };
    } catch (error) {
      console.error('Erro ao buscar comentários:', error);
      return { success: false, error: 'Erro interno do servidor' };
    }
  }

  /**
   * Atualizar um comentário
   */
  static async updateComment(commentId: string, conteudo: string): Promise<TaskCommentResult> {
    try {
      const session = await getServerSession(authOptions);
      if (!session?.user?.id) {
        return { success: false, error: 'Usuário não autenticado' };
      }

      // Verificar se o comentário existe e se o usuário é o autor
      const existingComment = await prisma.taskComment.findUnique({
        where: { id: commentId },
        include: {
          autor: true,
          task: true
        }
      });

      if (!existingComment) {
        return { success: false, error: 'Comentário não encontrado' };
      }

      if (existingComment.autorId !== session.user.id) {
        return { success: false, error: 'Sem permissão para editar este comentário' };
      }

      // Atualizar o comentário
      const updatedComment = await prisma.taskComment.update({
        where: { id: commentId },
        data: {
          conteudo,
          updatedAt: new Date()
        },
        include: {
          autor: {
            select: {
              id: true,
              nome: true,
              email: true
            }
          }
        }
      });

      // Registrar no audit trail
      await TaskCommentsService.createAuditLog({
        taskId: existingComment.taskId,
        acao: 'COMENTARIO_EDITADO',
        descricao: `Comentário editado`,
        autorId: session.user.id,
        autorNome: session.user.name || 'Usuário',
        autorEmail: session.user.email || ''
      });

      return { success: true, comment: updatedComment };
    } catch (error) {
      console.error('Erro ao atualizar comentário:', error);
      return { success: false, error: 'Erro interno do servidor' };
    }
  }

  /**
   * Excluir um comentário
   */
  static async deleteComment(commentId: string): Promise<{ success: boolean; error?: string }> {
    try {
      const session = await getServerSession(authOptions);
      if (!session?.user?.id) {
        return { success: false, error: 'Usuário não autenticado' };
      }

      // Verificar se o comentário existe e se o usuário é o autor
      const existingComment = await prisma.taskComment.findUnique({
        where: { id: commentId },
        include: {
          autor: true,
          task: true
        }
      });

      if (!existingComment) {
        return { success: false, error: 'Comentário não encontrado' };
      }

      if (existingComment.autorId !== session.user.id) {
        return { success: false, error: 'Sem permissão para excluir este comentário' };
      }

      // Excluir o comentário
      await prisma.taskComment.delete({
        where: { id: commentId }
      });

      // Registrar no audit trail
      await TaskCommentsService.createAuditLog({
        taskId: existingComment.taskId,
        acao: 'COMENTARIO_REMOVIDO',
        descricao: `Comentário removido`,
        autorId: session.user.id,
        autorNome: session.user.name || 'Usuário',
        autorEmail: session.user.email || ''
      });

      return { success: true };
    } catch (error) {
      console.error('Erro ao excluir comentário:', error);
      return { success: false, error: 'Erro interno do servidor' };
    }
  }

  /**
   * Criar entrada no audit trail
   */
  static async createAuditLog(data: {
    taskId: string;
    acao: string;
    descricao: string;
    autorId: string;
    autorNome: string;
    autorEmail: string;
    valorAnterior?: string;
    valorNovo?: string;
  }) {
    try {
      await prisma.taskLog.create({
        data: {
          taskId: data.taskId,
          tipo: data.acao as any, // Convertendo acao para tipo
          descricao: data.descricao,
          valorAnterior: data.valorAnterior,
          valorNovo: data.valorNovo,
          autorId: data.autorId
        }
      });
    } catch (error) {
      console.error('Erro ao criar log de auditoria:', error);
    }
  }

  /**
   * Buscar audit trail de uma tarefa
   */
  static async getTaskAuditTrail(taskId: string) {
    try {
      const session = await getServerSession(authOptions);
      if (!session?.user?.id) {
        return { success: false, error: 'Usuário não autenticado' };
      }

      // Verificar se a tarefa existe e se o usuário tem acesso
      const task = await prisma.task.findUnique({
        where: { id: taskId },
        include: {
          responsavel: true,
          criadoPor: true
        }
      });

      if (!task) {
        return { success: false, error: 'Tarefa não encontrada' };
      }

      // Verificar se o usuário tem permissão
      const hasAccess = 
        task.responsavelId === session.user.id ||
        task.criadoPorId === session.user.id;

      if (!hasAccess) {
        return { success: false, error: 'Sem permissão para ver o histórico desta tarefa' };
      }

      // Buscar logs de auditoria
      const logs = await prisma.taskLog.findMany({
        where: { taskId },
        include: {
          autor: {
            select: {
              id: true,
              nome: true,
              email: true
            }
          }
        },
        orderBy: {
          createdAt: 'desc'
        }
      });

      return { success: true, logs };
    } catch (error) {
      console.error('Erro ao buscar audit trail:', error);
      return { success: false, error: 'Erro interno do servidor' };
    }
  }
}
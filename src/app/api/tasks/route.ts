import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { ApiMiddleware, API_PERMISSIONS } from '@/lib/api-middleware';
import { createTaskSchema } from '@/lib/validations/task';

export async function GET(request: NextRequest) {
  try {
    // Validar autenticação
    const auth = await ApiMiddleware.validateAuth(request);
    if (!auth.valid) {
      return ApiMiddleware.createErrorResponse(auth.error || 'Não autorizado');
    }

    // Verificar permissões
    if (!ApiMiddleware.hasAuthPermission(auth, '/api/tasks', 'GET')) {
      return ApiMiddleware.createErrorResponse('Sem permissão para visualizar tarefas', 403);
    }

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const search = searchParams.get('search') || '';
    const status = searchParams.get('status') || '';
    const priority = searchParams.get('priority') || '';
    const responsavelId = searchParams.get('responsavelId') || '';
    const clienteId = searchParams.get('clienteId') || '';
    const oportunidadeId = searchParams.get('oportunidadeId') || '';
    const emailId = searchParams.get('emailId') || '';
    const helpdeskTicketId = searchParams.get('helpdeskTicketId') || '';
    const overdue = searchParams.get('overdue') === 'true';

    const skip = (page - 1) * limit;

    // Construir a query com filtros
    const where: any = {};
    
    if (search) {
      where.OR = [
        { titulo: { contains: search, mode: 'insensitive' } },
        { descricao: { contains: search, mode: 'insensitive' } }
      ];
    }

    if (status) {
      where.status = status;
    }

    if (priority) {
      where.prioridade = priority;
    }

    if (responsavelId) {
      where.responsavelId = responsavelId;
    }

    if (clienteId) {
      where.clienteId = clienteId;
    }

    if (oportunidadeId) {
      where.oportunidadeId = oportunidadeId;
    }

    if (emailId) {
      where.emailId = emailId;
    }

    if (helpdeskTicketId) {
      where.helpdeskTicketId = helpdeskTicketId;
    }

    if (overdue) {
      where.dataVencimento = {
        lt: new Date()
      };
      where.status = {
        notIn: ['CONCLUIDA', 'CANCELADA']
      };
    }

    const [tasks, total] = await Promise.all([
      db.task.findMany({
        where,
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
          oportunidade: {
            select: {
              id: true,
              titulo: true,
              valor: true
            }
          },
          email: {
            select: {
              id: true,
              subject: true,
              from: true
            }
          },
          helpdeskTicket: {
            select: {
              id: true,
              numero: true,
              assunto: true
            }
          },
          recorrencia: true,
          _count: {
            select: {
              comentarios: true,
              anexos: true
            }
          }
        },
        skip,
        take: limit,
        orderBy: {
          createdAt: 'desc'
        }
      }),
      db.task.count({ where })
    ]);

    return NextResponse.json({
      data: tasks,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('Erro ao buscar tarefas:', error);
    return ApiMiddleware.createErrorResponse('Erro interno do servidor ao buscar tarefas', 500);
  }
}

export async function POST(request: NextRequest) {
  try {
    // Validar autenticação
    const auth = await ApiMiddleware.validateAuth(request);
    if (!auth.valid) {
      return ApiMiddleware.createErrorResponse(auth.error || 'Não autorizado');
    }

    // Verificar permissões
    if (!ApiMiddleware.hasAuthPermission(auth, '/api/tasks', 'POST')) {
      return ApiMiddleware.createErrorResponse('Sem permissão para criar tarefas', 403);
    }

    const body = await request.json();

    // DEBUG: Log do body recebido
    console.log('=== DEBUG API TASKS ===');
    console.log('Body recebido:', JSON.stringify(body, null, 2));
    console.log('responsavelId no body:', body.responsavelId);
    console.log('=== FIM DEBUG API ===');

    // Validar dados com Zod
    const validationResult = createTaskSchema.safeParse(body);
    if (!validationResult.success) {
      return ApiMiddleware.createErrorResponse(
        `Dados inválidos: ${validationResult.error.errors.map(e => e.message).join(', ')}`,
        400
      );
    }

    // Verificar se o responsável existe
    console.log('Procurando responsável com ID:', body.responsavelId);
    const responsavel = await db.colaborador.findUnique({
      where: { id: body.responsavelId }
    });
    
    console.log('Responsável encontrado:', responsavel ? 'SIM' : 'NÃO');
    if (responsavel) {
      console.log('Dados do responsável:', { id: responsavel.id, nome: responsavel.nome });
    }

    if (!responsavel) {
      return ApiMiddleware.createErrorResponse('Responsável não encontrado', 404);
    }

    // Verificar se cliente existe (se fornecido)
    if (body.clienteId) {
      const cliente = await db.cliente.findUnique({
        where: { id: body.clienteId }
      });

      if (!cliente) {
        return ApiMiddleware.createErrorResponse('Cliente não encontrado', 404);
      }
    }

    // Verificar se oportunidade existe (se fornecida)
    if (body.oportunidadeId) {
      const oportunidade = await db.oportunidade.findUnique({
        where: { id: body.oportunidadeId }
      });

      if (!oportunidade) {
        return ApiMiddleware.createErrorResponse('Oportunidade não encontrada', 404);
      }
    }

    // Obter ID do criador (usuário logado)
    console.log('Auth user:', auth.user);
    let criadorId = null;
    if (auth.user?.id) {
      console.log('Buscando colaborador para usuário:', auth.user.id);
      // Buscar colaborador pelo usuário
      const colaborador = await db.colaborador.findFirst({
        where: { 
          usuarios: {
            some: {
              id: auth.user.id
            }
          }
        }
      });
      console.log('Colaborador encontrado:', colaborador ? colaborador.id : 'NENHUM');
      criadorId = colaborador?.id;
    } else {
      console.log('Usuário não autenticado');
    }
    
    console.log('criadorId final:', criadorId);
    
    // Se não há usuário autenticado, usar o primeiro colaborador ativo como fallback
    if (!criadorId) {
      console.log('Usando fallback para criadorId');
      const fallbackColaborador = await db.colaborador.findFirst({
        where: { ativo: true },
        orderBy: { createdAt: 'asc' }
      });
      criadorId = fallbackColaborador?.id;
      console.log('Fallback criadorId:', criadorId);
    }

    // Validar se temos um criadorId válido
    if (!criadorId) {
      console.error('Erro: criadorId é null após todas as tentativas');
      return NextResponse.json(
        { error: 'Não foi possível identificar o criador da tarefa' },
        { status: 400 }
      );
    }

    // Preparar dados da tarefa
    const taskData: any = {
      titulo: body.titulo,
      descricao: body.descricao || null,
      prioridade: body.prioridade || 'MEDIA',
      status: body.status || 'PENDENTE',
      dataVencimento: new Date(body.dataVencimento),
      responsavelId: body.responsavelId,
      criadoPorId: criadorId,
      clienteId: body.clienteId || null,
      oportunidadeId: body.oportunidadeId || null,
      emailId: body.emailId || null,
      helpdeskTicketId: body.helpdeskTicketId || null
    };

    // Criar tarefa
    console.log('Dados da tarefa a serem criados:', taskData);
    
    try {
      const task = await db.task.create({
        data: taskData,
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
        oportunidade: {
          select: {
            id: true,
            titulo: true,
            valor: true
          }
        }
      }
    });

    // Criar log de criação
    if (criadorId) {
      await db.taskLog.create({
        data: {
          taskId: task.id,
          autorId: criadorId,
          tipo: 'CRIACAO',
          descricao: `Tarefa criada: ${task.titulo}`,
          valorAnterior: null,
          valorNovo: JSON.stringify(taskData)
        }
      });
    }

    // Criar recorrência se especificada
    if (body.recorrencia) {
      const recorrencia = await db.taskRecurrence.create({
        data: {
          tipo: body.recorrencia.tipo,
          intervalo: body.recorrencia.intervalo || 1,
          diasSemana: body.recorrencia.diasSemana || null,
          diaMes: body.recorrencia.diaMes || null,
          dataFim: body.recorrencia.dataFim ? new Date(body.recorrencia.dataFim) : null,
          ativo: true
        }
      });
      
      // Atualizar tarefa com a recorrência
      await db.task.update({
        where: { id: task.id },
        data: {
          recorrenciaId: recorrencia.id,
          isRecorrente: true
        }
      });
    }

    return NextResponse.json(task, { status: 201 });
    } catch (taskError: any) {
      console.error('Erro específico na criação da tarefa:', taskError);
      throw taskError;
    }

  } catch (error: any) {
    console.error('Erro geral ao criar tarefa:', error);
    console.error('Stack trace:', error?.stack);
    return ApiMiddleware.createErrorResponse('Erro interno do servidor ao criar tarefa', 500);
  }
}
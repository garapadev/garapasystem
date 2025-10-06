import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { ApiMiddleware, API_PERMISSIONS } from '@/lib/api-middleware';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
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

    const { id } = await params;
    
    if (!id) {
      return ApiMiddleware.createErrorResponse('ID da tarefa é obrigatório', 400);
    }

    const task = await db.task.findUnique({
      where: { id },
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
            assunto: true,
            remetente: true
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
        comentarios: {
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
        },
        anexos: {
          include: {
            uploadPor: {
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
        },
        logs: {
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
        }
      }
    });

    if (!task) {
      return NextResponse.json(
        { error: 'Tarefa não encontrada' },
        { status: 404 }
      );
    }

    return NextResponse.json(task);
  } catch (error) {
    console.error('Erro ao buscar tarefa:', error);
    return NextResponse.json(
      { error: 'Erro ao buscar tarefa' },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Validar autenticação
    const auth = await ApiMiddleware.validateAuth(request);
    if (!auth.valid) {
      return ApiMiddleware.createErrorResponse(auth.error || 'Não autorizado');
    }

    // Verificar permissões
    if (!ApiMiddleware.hasAuthPermission(auth, '/api/tasks', 'PUT')) {
      return ApiMiddleware.createErrorResponse('Sem permissão para editar tarefas', 403);
    }

    const { id } = await params;
    
    if (!id) {
      return ApiMiddleware.createErrorResponse('ID da tarefa é obrigatório', 400);
    }

    const body = await request.json();

    // Buscar tarefa atual
    const currentTask = await db.task.findUnique({
      where: { id }
    });

    if (!currentTask) {
      return NextResponse.json(
        { error: 'Tarefa não encontrada' },
        { status: 404 }
      );
    }

    // Validar dados obrigatórios se fornecidos
    if (body.responsavelId) {
      const responsavel = await db.colaborador.findUnique({
        where: { id: body.responsavelId }
      });

      if (!responsavel) {
        return NextResponse.json(
          { error: 'Responsável não encontrado' },
          { status: 400 }
        );
      }
    }

    // Verificar se cliente existe (se fornecido)
    if (body.clienteId) {
      const cliente = await db.cliente.findUnique({
        where: { id: body.clienteId }
      });

      if (!cliente) {
        return NextResponse.json(
          { error: 'Cliente não encontrado' },
          { status: 400 }
        );
      }
    }

    // Verificar se oportunidade existe (se fornecida)
    if (body.oportunidadeId) {
      const oportunidade = await db.oportunidade.findUnique({
        where: { id: body.oportunidadeId }
      });

      if (!oportunidade) {
        return NextResponse.json(
          { error: 'Oportunidade não encontrada' },
          { status: 400 }
        );
      }
    }

    // Obter ID do colaborador que está fazendo a alteração
    let autorId = null;
    if (auth.user?.id) {
      const colaborador = await db.colaborador.findFirst({
        where: { 
          usuarios: {
            some: {
              id: auth.user.id
            }
          }
        }
      });
      autorId = colaborador?.id;
    }

    // Preparar dados para atualização
    const updateData: any = {};
    const changedFields: string[] = [];

    if (body.titulo !== undefined && body.titulo !== currentTask.titulo) {
      updateData.titulo = body.titulo;
      changedFields.push(`título: "${currentTask.titulo}" → "${body.titulo}"`);
    }

    if (body.descricao !== undefined && body.descricao !== currentTask.descricao) {
      updateData.descricao = body.descricao;
      changedFields.push(`descrição alterada`);
    }

    if (body.prioridade !== undefined && body.prioridade !== currentTask.prioridade) {
      updateData.prioridade = body.prioridade;
      changedFields.push(`prioridade: ${currentTask.prioridade} → ${body.prioridade}`);
    }

    if (body.status !== undefined && body.status !== currentTask.status) {
      updateData.status = body.status;
      changedFields.push(`status: ${currentTask.status} → ${body.status}`);
      
      // Se marcando como concluída, definir data de conclusão
      if (body.status === 'CONCLUIDA') {
        updateData.dataConclusao = new Date();
        changedFields.push('data de conclusão definida');
      } else if (currentTask.status === 'CONCLUIDA') {
        updateData.dataConclusao = null;
        changedFields.push('data de conclusão removida');
      }
    }

    if (body.dataVencimento !== undefined) {
      const newDate = new Date(body.dataVencimento);
      if (newDate.getTime() !== currentTask.dataVencimento.getTime()) {
        updateData.dataVencimento = newDate;
        changedFields.push(`vencimento: ${currentTask.dataVencimento.toLocaleDateString()} → ${newDate.toLocaleDateString()}`);
      }
    }

    if (body.responsavelId !== undefined && body.responsavelId !== currentTask.responsavelId) {
      updateData.responsavelId = body.responsavelId;
      changedFields.push('responsável alterado');
    }

    if (body.clienteId !== undefined && body.clienteId !== currentTask.clienteId) {
      updateData.clienteId = body.clienteId;
      changedFields.push('cliente alterado');
    }

    if (body.oportunidadeId !== undefined && body.oportunidadeId !== currentTask.oportunidadeId) {
      updateData.oportunidadeId = body.oportunidadeId;
      changedFields.push('oportunidade alterada');
    }

    if (body.observacoes !== undefined && body.observacoes !== currentTask.observacoes) {
      updateData.observacoes = body.observacoes;
      changedFields.push('observações alteradas');
    }

    // Se não há alterações, retornar a tarefa atual
    if (Object.keys(updateData).length === 0) {
      return NextResponse.json(currentTask);
    }

    // Atualizar tarefa
    const updatedTask = await db.task.update({
      where: { id },
      data: updateData,
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

    // Criar log da alteração
    if (autorId && changedFields.length > 0) {
      await db.taskLog.create({
        data: {
          taskId: id,
          autorId: autorId,
          tipo: 'ATUALIZACAO',
          descricao: `Alterações: ${changedFields.join(', ')}`,
          valorAnterior: JSON.stringify(currentTask),
          valorNovo: JSON.stringify(updateData)
        }
      });
    }

    return NextResponse.json(updatedTask);
  } catch (error) {
    console.error('Erro ao atualizar tarefa:', error);
    return NextResponse.json(
      { error: 'Erro ao atualizar tarefa' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Validar autenticação
    const auth = await ApiMiddleware.validateAuth(request);
    if (!auth.valid) {
      return ApiMiddleware.createErrorResponse(auth.error || 'Não autorizado');
    }

    // Verificar permissões
    if (!ApiMiddleware.hasAuthPermission(auth, '/api/tasks', 'DELETE')) {
      return ApiMiddleware.createErrorResponse('Sem permissão para excluir tarefas', 403);
    }

    const { id } = await params;
    
    if (!id) {
      return ApiMiddleware.createErrorResponse('ID da tarefa é obrigatório', 400);
    }

    // Verificar se a tarefa existe
    const task = await db.task.findUnique({
      where: { id }
    });

    if (!task) {
      return NextResponse.json(
        { error: 'Tarefa não encontrada' },
        { status: 404 }
      );
    }

    // Obter ID do colaborador que está fazendo a exclusão
    let colaboradorId = null;
    if (auth.user?.id) {
      const colaborador = await db.colaborador.findFirst({
        where: { usuarioId: auth.user.id }
      });
      colaboradorId = colaborador?.id;
    }

    // Excluir tarefa (cascade irá remover relacionamentos)
    await db.task.delete({
      where: { id }
    });

    // Criar log da exclusão
    if (colaboradorId) {
      await db.taskLog.create({
        data: {
          taskId: id,
          colaboradorId: colaboradorId,
          acao: 'EXCLUIDA',
          descricao: `Tarefa excluída: ${task.titulo}`,
          dadosAnteriores: JSON.stringify(task),
          dadosNovos: null
        }
      });
    }

    return NextResponse.json({ message: 'Tarefa excluída com sucesso' });
  } catch (error) {
    console.error('Erro ao excluir tarefa:', error);
    return NextResponse.json(
      { error: 'Erro ao excluir tarefa' },
      { status: 500 }
    );
  }
}
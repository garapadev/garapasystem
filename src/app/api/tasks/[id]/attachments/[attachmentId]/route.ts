import { NextRequest, NextResponse } from 'next/server';
import { ApiMiddleware } from '@/lib/api-middleware';
import { PrismaClient } from '@prisma/client';
import fs from 'fs';
import path from 'path';

const prisma = new PrismaClient();

// GET /api/tasks/[id]/attachments/[attachmentId] - Buscar anexo específico
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string; attachmentId: string } }
) {
  try {
    // Validar autenticação
    const authResult = await ApiMiddleware.validateAuth(request);
    if (!authResult.success) {
      return NextResponse.json(
        { error: authResult.error },
        { status: authResult.status }
      );
    }

    // Verificar permissões
    const hasPermission = await ApiMiddleware.checkPermission(
      authResult.user!.id,
      'TASKS_READ'
    );
    if (!hasPermission) {
      return NextResponse.json(
        { error: 'Sem permissão para visualizar anexos de tarefas' },
        { status: 403 }
      );
    }

    const taskId = params.id;
    const attachmentId = params.attachmentId;

    // Verificar se a tarefa existe
    const task = await prisma.task.findUnique({
      where: { id: taskId },
      select: { id: true }
    });

    if (!task) {
      return NextResponse.json(
        { error: 'Tarefa não encontrada' },
        { status: 404 }
      );
    }

    // Buscar anexo específico
    const attachment = await prisma.taskAttachment.findFirst({
      where: {
        id: attachmentId,
        taskId: taskId
      },
      select: {
        id: true,
        nomeArquivo: true,
        caminhoArquivo: true,
        tamanhoArquivo: true,
        tipoMime: true,
        criadoEm: true,
        uploadPor: {
          select: {
            id: true,
            nome: true,
            email: true
          }
        }
      }
    });

    if (!attachment) {
      return NextResponse.json(
        { error: 'Anexo não encontrado' },
        { status: 404 }
      );
    }

    return NextResponse.json(attachment);
  } catch (error) {
    console.error('Erro ao buscar anexo:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}

// PUT /api/tasks/[id]/attachments/[attachmentId] - Atualizar anexo
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string; attachmentId: string } }
) {
  try {
    // Validar autenticação
    const authResult = await ApiMiddleware.validateAuth(request);
    if (!authResult.success) {
      return NextResponse.json(
        { error: authResult.error },
        { status: authResult.status }
      );
    }

    // Verificar permissões
    const hasPermission = await ApiMiddleware.checkPermission(
      authResult.user!.id,
      'TASKS_WRITE'
    );
    if (!hasPermission) {
      return NextResponse.json(
        { error: 'Sem permissão para editar anexos de tarefas' },
        { status: 403 }
      );
    }

    const taskId = params.id;
    const attachmentId = params.attachmentId;

    const body = await request.json();
    const { nomeArquivo } = body;

    if (!nomeArquivo || typeof nomeArquivo !== 'string') {
      return NextResponse.json(
        { error: 'Nome do arquivo é obrigatório' },
        { status: 400 }
      );
    }

    // Verificar se a tarefa existe
    const task = await prisma.task.findUnique({
      where: { id: taskId },
      select: { id: true }
    });

    if (!task) {
      return NextResponse.json(
        { error: 'Tarefa não encontrada' },
        { status: 404 }
      );
    }

    // Verificar se o anexo existe
    const existingAttachment = await prisma.taskAttachment.findFirst({
      where: {
        id: attachmentId,
        taskId: taskId
      }
    });

    if (!existingAttachment) {
      return NextResponse.json(
        { error: 'Anexo não encontrado' },
        { status: 404 }
      );
    }

    // Atualizar anexo
    const updatedAttachment = await prisma.taskAttachment.update({
      where: { id: attachmentId },
      data: {
        nomeArquivo,
        updatedAt: new Date()
      },
      select: {
        id: true,
        nomeArquivo: true,
        caminhoArquivo: true,
        tamanhoArquivo: true,
        tipoMime: true,
        criadoEm: true,
        atualizadoEm: true,
        uploadPor: {
          select: {
            id: true,
            nome: true,
            email: true
          }
        }
      }
    });

    // Registrar log de alteração
    await prisma.taskLog.create({
      data: {
        taskId,
        autorId: authResult.user!.id,
        tipo: 'ANEXO_ALTERADO',
        descricao: `Anexo "${nomeArquivo}" foi renomeado`,
        valorAnterior: existingAttachment.nomeArquivo,
        valorNovo: nomeArquivo
      }
    });

    return NextResponse.json(updatedAttachment);
  } catch (error) {
    console.error('Erro ao atualizar anexo:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}

// DELETE /api/tasks/[id]/attachments/[attachmentId] - Excluir anexo
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string; attachmentId: string } }
) {
  try {
    // Validar autenticação
    const authResult = await ApiMiddleware.validateAuth(request);
    if (!authResult.success) {
      return NextResponse.json(
        { error: authResult.error },
        { status: authResult.status }
      );
    }

    // Verificar permissões
    const hasPermission = await ApiMiddleware.checkPermission(
      authResult.user!.id,
      'TASKS_DELETE'
    );
    if (!hasPermission) {
      return NextResponse.json(
        { error: 'Sem permissão para excluir anexos de tarefas' },
        { status: 403 }
      );
    }

    const taskId = parseInt(params.id);
    const attachmentId = parseInt(params.attachmentId);

    if (isNaN(taskId) || isNaN(attachmentId)) {
      return NextResponse.json(
        { error: 'IDs inválidos' },
        { status: 400 }
      );
    }

    // Verificar se a tarefa existe
    const task = await prisma.task.findUnique({
      where: { id: taskId },
      select: { id: true }
    });

    if (!task) {
      return NextResponse.json(
        { error: 'Tarefa não encontrada' },
        { status: 404 }
      );
    }

    // Buscar anexo para obter informações antes da exclusão
    const attachment = await prisma.taskAttachment.findFirst({
      where: {
        id: attachmentId,
        taskId: taskId
      }
    });

    if (!attachment) {
      return NextResponse.json(
        { error: 'Anexo não encontrado' },
        { status: 404 }
      );
    }

    // Excluir arquivo físico
    try {
      const fullPath = path.join(process.cwd(), 'uploads', attachment.caminhoArquivo);
      if (fs.existsSync(fullPath)) {
        fs.unlinkSync(fullPath);
      }
    } catch (fileError) {
      console.error('Erro ao excluir arquivo físico:', fileError);
      // Continua com a exclusão do registro mesmo se o arquivo físico não puder ser removido
    }

    // Excluir registro do banco
    await prisma.taskAttachment.delete({
      where: { id: attachmentId }
    });

    // Registrar log de exclusão
    await prisma.taskLog.create({
      data: {
        taskId,
        autorId: authResult.user!.id,
        tipo: 'ANEXO_REMOVIDO',
        descricao: `Anexo "${attachment.nomeArquivo}" foi removido`,
        valorAnterior: attachment.nomeArquivo,
        valorNovo: null
      }
    });

    return NextResponse.json(
      { message: 'Anexo excluído com sucesso' },
      { status: 200 }
    );
  } catch (error) {
    console.error('Erro ao excluir anexo:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}
import { NextRequest, NextResponse } from 'next/server';
import { ApiMiddleware } from '@/lib/api-middleware';
import { db } from '@/lib/db';
import fs from 'fs';
import path from 'path';

// GET /api/tasks/[id]/attachments/[attachmentId]/download - Download do anexo
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string; attachmentId: string } }
) {
  try {
    // Validar autenticação
    const authResult = await ApiMiddleware.validateAuth(request);
    if (!authResult.valid) {
      return NextResponse.json(
        { error: authResult.error },
        { status: 401 }
      );
    }

    // Verificar permissões
    const hasPermission = ApiMiddleware.hasAuthPermission(
      authResult,
      '/api/tasks',
      'GET'
    );
    if (!hasPermission) {
      return NextResponse.json(
        { error: 'Sem permissão para baixar anexos de tarefas' },
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
    const task = await db.task.findUnique({
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
    const attachment = await db.taskAttachment.findFirst({
      where: {
        id: attachmentId,
        taskId: taskId
      },
      select: {
        id: true,
        nomeArquivo: true,
        caminhoArquivo: true,
        tamanhoArquivo: true,
        tipoMime: true
      }
    });

    if (!attachment) {
      return NextResponse.json(
        { error: 'Anexo não encontrado' },
        { status: 404 }
      );
    }

    // Verificar se o arquivo existe no sistema de arquivos
    const fullPath = path.join(process.cwd(), 'uploads', attachment.caminhoArquivo);
    
    if (!fs.existsSync(fullPath)) {
      return NextResponse.json(
        { error: 'Arquivo não encontrado no servidor' },
        { status: 404 }
      );
    }

    // Ler o arquivo
    const fileBuffer = fs.readFileSync(fullPath);

    // Registrar log de download
    await db.taskLog.create({
      data: {
        taskId,
        autorId: authResult.user!.id,
        tipo: 'ANEXO_BAIXADO',
        descricao: `Anexo "${attachment.nomeArquivo}" foi baixado`,
        valorAnterior: null,
        valorNovo: attachment.nomeArquivo
      }
    });

    // Retornar o arquivo com headers apropriados
    return new NextResponse(fileBuffer, {
      status: 200,
      headers: {
        'Content-Type': attachment.tipoMime || 'application/octet-stream',
        'Content-Disposition': `attachment; filename="${attachment.nomeArquivo}"`,
        'Content-Length': attachment.tamanhoArquivo.toString(),
        'Cache-Control': 'no-cache'
      }
    });
  } catch (error) {
    console.error('Erro ao fazer download do anexo:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}
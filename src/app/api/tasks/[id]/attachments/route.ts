import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { ApiMiddleware, API_PERMISSIONS } from '@/lib/api-middleware';
import { writeFile, mkdir } from 'fs/promises';
import { join } from 'path';
import { existsSync } from 'fs';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Validar autenticação
    const auth = await ApiMiddleware.validateAuth(request);
    if (!auth.valid) {
      return ApiMiddleware.createErrorResponse(auth.error || 'Não autorizado');
    }

    // Verificar permissões
    if (!ApiMiddleware.hasAuthPermission(auth, 'tasks', 'GET')) {
      return ApiMiddleware.createErrorResponse('Sem permissão para visualizar anexos', 403);
    }

    // Verificar se a tarefa existe
    const task = await db.task.findUnique({
      where: { id: params.id }
    });

    if (!task) {
      return NextResponse.json(
        { error: 'Tarefa não encontrada' },
        { status: 404 }
      );
    }

    const attachments = await db.taskAttachment.findMany({
      where: { taskId: params.id },
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
    });

    return NextResponse.json(attachments);
  } catch (error) {
    console.error('Erro ao buscar anexos:', error);
    return NextResponse.json(
      { error: 'Erro ao buscar anexos' },
      { status: 500 }
    );
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Validar autenticação
    const auth = await ApiMiddleware.validateAuth(request);
    if (!auth.valid) {
      return ApiMiddleware.createErrorResponse(auth.error || 'Não autorizado');
    }

    // Verificar permissões
    if (!ApiMiddleware.hasAuthPermission(auth, 'tasks', 'POST')) {
      return ApiMiddleware.createErrorResponse('Sem permissão para adicionar anexos', 403);
    }

    // Verificar se a tarefa existe
    const task = await db.task.findUnique({
      where: { id: params.id }
    });

    if (!task) {
      return NextResponse.json(
        { error: 'Tarefa não encontrada' },
        { status: 404 }
      );
    }

    // Obter ID do colaborador
    let colaboradorId = null;
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
      colaboradorId = colaborador?.id || null;
    }

    if (!colaboradorId) {
      return NextResponse.json(
        { error: 'Colaborador não encontrado' },
        { status: 400 }
      );
    }

    const formData = await request.formData();
    const file = formData.get('file') as File;

    if (!file) {
      return NextResponse.json(
        { error: 'Arquivo é obrigatório' },
        { status: 400 }
      );
    }

    // Validar tamanho do arquivo (máximo 10MB)
    const maxSize = 10 * 1024 * 1024; // 10MB
    if (file.size > maxSize) {
      return NextResponse.json(
        { error: 'Arquivo muito grande. Máximo 10MB.' },
        { status: 400 }
      );
    }

    // Criar diretório de uploads se não existir
    const uploadsDir = join(process.cwd(), 'uploads', 'tasks', params.id);
    if (!existsSync(uploadsDir)) {
      await mkdir(uploadsDir, { recursive: true });
    }

    // Gerar nome único para o arquivo
    const timestamp = Date.now();
    const fileName = `${timestamp}-${file.name}`;
    const filePath = join(uploadsDir, fileName);
    const relativePath = join('uploads', 'tasks', params.id, fileName);

    // Salvar arquivo
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    await writeFile(filePath, buffer);

    // Criar registro no banco
    const attachment = await db.taskAttachment.create({
      data: {
        taskId: params.id,
        uploadPorId: colaboradorId,
        nomeArquivo: file.name,
        tipoConteudo: file.type,
        tamanho: file.size,
        caminhoArquivo: relativePath
      },
      include: {
        uploadPor: {
          select: {
            id: true,
            nome: true,
            email: true
          }
        }
      }
    });

    // Criar log do anexo
    await db.taskLog.create({
      data: {
        taskId: params.id,
        autorId: colaboradorId,
        tipo: 'ANEXO_ADICIONADO',
        descricao: `Anexo adicionado: ${file.name}`,
        valorAnterior: null,
        valorNovo: JSON.stringify({ 
          nomeArquivo: file.name,
          tamanho: file.size,
          tipo: file.type
        })
      }
    });

    return NextResponse.json(attachment, { status: 201 });
  } catch (error) {
    console.error('Erro ao adicionar anexo:', error);
    return NextResponse.json(
      { error: 'Erro ao adicionar anexo' },
      { status: 500 }
    );
  }
}
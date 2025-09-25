import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const skip = (page - 1) * limit;

    // Verificar se ordem de serviço existe
    const ordemServico = await db.ordemServico.findUnique({
      where: { id: params.id },
      select: { id: true }
    });

    if (!ordemServico) {
      return NextResponse.json(
        { error: 'Ordem de serviço não encontrada' },
        { status: 404 }
      );
    }

    const [anexos, total] = await Promise.all([
      db.anexoOrdemServico.findMany({
        where: { ordemServicoId: params.id },
        include: {
          colaborador: {
            select: {
              id: true,
              nome: true,
              email: true
            }
          }
        },
        orderBy: {
          createdAt: 'desc'
        },
        skip,
        take: limit
      }),
      db.anexoOrdemServico.count({
        where: { ordemServicoId: params.id }
      })
    ]);

    return NextResponse.json({
      anexos,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit)
      }
    });
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
    const body = await request.json();
    const { 
      nomeArquivo, 
      caminhoArquivo, 
      tamanhoBytes, 
      tipoMime, 
      descricao, 
      colaboradorId 
    } = body;

    // Validar dados obrigatórios
    if (!nomeArquivo || !caminhoArquivo || !colaboradorId) {
      return NextResponse.json(
        { error: 'Nome do arquivo, caminho e colaborador são obrigatórios' },
        { status: 400 }
      );
    }

    // Verificar se ordem de serviço existe
    const ordemServico = await db.ordemServico.findUnique({
      where: { id: params.id },
      select: { id: true, titulo: true }
    });

    if (!ordemServico) {
      return NextResponse.json(
        { error: 'Ordem de serviço não encontrada' },
        { status: 404 }
      );
    }

    // Verificar se colaborador existe
    const colaborador = await db.colaborador.findUnique({
      where: { id: colaboradorId },
      select: { id: true, nome: true, email: true }
    });

    if (!colaborador) {
      return NextResponse.json(
        { error: 'Colaborador não encontrado' },
        { status: 404 }
      );
    }

    // Criar anexo
    const novoAnexo = await db.anexoOrdemServico.create({
      data: {
        nomeArquivo,
        caminhoArquivo,
        tamanhoBytes: tamanhoBytes || 0,
        tipoMime: tipoMime || 'application/octet-stream',
        descricao,
        ordemServicoId: params.id,
        colaboradorId
      },
      include: {
        colaborador: {
          select: {
            id: true,
            nome: true,
            email: true
          }
        }
      }
    });

    // Registrar no histórico
    await db.historicoOrdemServico.create({
      data: {
        acao: 'Anexo adicionado',
        valorNovo: nomeArquivo,
        ordemServicoId: params.id,
        colaboradorId
      }
    });

    return NextResponse.json(novoAnexo, { status: 201 });
  } catch (error) {
    console.error('Erro ao criar anexo:', error);
    return NextResponse.json(
      { error: 'Erro ao criar anexo' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { searchParams } = new URL(request.url);
    const anexoId = searchParams.get('anexoId');
    const colaboradorId = searchParams.get('colaboradorId');

    if (!anexoId || !colaboradorId) {
      return NextResponse.json(
        { error: 'ID do anexo e colaborador são obrigatórios' },
        { status: 400 }
      );
    }

    // Verificar se anexo existe e pertence à ordem de serviço
    const anexo = await db.anexoOrdemServico.findFirst({
      where: {
        id: anexoId,
        ordemServicoId: params.id
      }
    });

    if (!anexo) {
      return NextResponse.json(
        { error: 'Anexo não encontrado' },
        { status: 404 }
      );
    }

    // Deletar anexo
    await db.anexoOrdemServico.delete({
      where: { id: anexoId }
    });

    // Registrar no histórico
    await db.historicoOrdemServico.create({
      data: {
        acao: 'Anexo removido',
        valorAnterior: anexo.nomeArquivo,
        ordemServicoId: params.id,
        colaboradorId
      }
    });

    // TODO: Remover arquivo físico do sistema de arquivos

    return NextResponse.json({ message: 'Anexo removido com sucesso' });
  } catch (error) {
    console.error('Erro ao remover anexo:', error);
    return NextResponse.json(
      { error: 'Erro ao remover anexo' },
      { status: 500 }
    );
  }
}
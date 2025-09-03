import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const permissao = await db.permissao.findUnique({
      where: { id: params.id },
      include: {
        perfis: {
          select: {
            perfil: {
              select: {
                id: true,
                nome: true,
                descricao: true
              }
            }
          }
        }
      }
    });

    if (!permissao) {
      return NextResponse.json(
        { error: 'Permissão não encontrada' },
        { status: 404 }
      );
    }

    return NextResponse.json(permissao);
  } catch (error) {
    console.error('Erro ao buscar permissão:', error);
    return NextResponse.json(
      { error: 'Erro ao buscar permissão' },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json();

    // Validar dados obrigatórios
    if (!body.nome || !body.recurso || !body.acao) {
      return NextResponse.json(
        { error: 'Nome, recurso e ação são obrigatórios' },
        { status: 400 }
      );
    }

    // Verificar se permissão existe
    const existingPermissao = await db.permissao.findUnique({
      where: { id: params.id }
    });

    if (!existingPermissao) {
      return NextResponse.json(
        { error: 'Permissão não encontrada' },
        { status: 404 }
      );
    }

    // Verificar se nome já existe (excluindo a atual)
    const nomeExists = await db.permissao.findFirst({
      where: {
        nome: body.nome,
        id: { not: params.id }
      }
    });

    if (nomeExists) {
      return NextResponse.json(
        { error: 'Já existe uma permissão com este nome' },
        { status: 400 }
      );
    }

    // Verificar se já existe permissão para o mesmo recurso e ação (excluindo a atual)
    const duplicatePermissao = await db.permissao.findFirst({
      where: {
        recurso: body.recurso,
        acao: body.acao,
        id: { not: params.id }
      }
    });

    if (duplicatePermissao) {
      return NextResponse.json(
        { error: 'Já existe uma permissão para este recurso e ação' },
        { status: 400 }
      );
    }

    // Atualizar permissão
    const permissao = await db.permissao.update({
      where: { id: params.id },
      data: {
        nome: body.nome,
        descricao: body.descricao,
        recurso: body.recurso,
        acao: body.acao
      }
    });

    return NextResponse.json(permissao);
  } catch (error) {
    console.error('Erro ao atualizar permissão:', error);
    return NextResponse.json(
      { error: 'Erro ao atualizar permissão' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Verificar se permissão existe
    const existingPermissao = await db.permissao.findUnique({
      where: { id: params.id },
      include: {
        _count: {
          select: {
            perfis: true
          }
        }
      }
    });

    if (!existingPermissao) {
      return NextResponse.json(
        { error: 'Permissão não encontrada' },
        { status: 404 }
      );
    }

    // Verificar se está sendo usada por algum perfil
    if (existingPermissao._count.perfis > 0) {
      return NextResponse.json(
        { error: 'Não é possível excluir permissão que está sendo usada por perfis' },
        { status: 400 }
      );
    }

    // Excluir permissão
    await db.permissao.delete({
      where: { id: params.id }
    });

    return NextResponse.json({ message: 'Permissão excluída com sucesso' });
  } catch (error) {
    console.error('Erro ao excluir permissão:', error);
    return NextResponse.json(
      { error: 'Erro ao excluir permissão' },
      { status: 500 }
    );
  }
}
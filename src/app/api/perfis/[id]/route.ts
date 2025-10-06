import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    
    if (!id) {
      return NextResponse.json(
        { error: 'ID do perfil é obrigatório' },
        { status: 400 }
      );
    }

    const perfil = await db.perfil.findUnique({
      where: { id },
      include: {
        permissoes: {
          include: {
            permissao: true
          }
        },
        colaboradores: true
      }
    });

    if (!perfil) {
      return NextResponse.json(
        { error: 'Perfil não encontrado' },
        { status: 404 }
      );
    }

    return NextResponse.json(perfil);
  } catch (error) {
    console.error('Erro ao buscar perfil:', error);
    return NextResponse.json(
      { error: 'Erro ao buscar perfil' },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    
    if (!id) {
      return NextResponse.json(
        { error: 'ID do perfil é obrigatório' },
        { status: 400 }
      );
    }

    const body = await request.json();
    
    const {
      nome,
      descricao,
      ativo,
      permissoesIds = []
    } = body;

    // Verificar se perfil existe
    const existingPerfil = await db.perfil.findUnique({
      where: { id }
    });

    if (!existingPerfil) {
      return NextResponse.json(
        { error: 'Perfil não encontrado' },
        { status: 404 }
      );
    }

    // Verificar se nome já existe (se foi alterado)
    if (nome && nome !== existingPerfil.nome) {
      const nomeExists = await db.perfil.findUnique({
        where: { nome }
      });

      if (nomeExists) {
        return NextResponse.json(
          { error: 'Perfil com este nome já existe' },
          { status: 400 }
        );
      }
    }

    // Verificar se as permissões existem
    if (permissoesIds.length > 0) {
      const permissoesCount = await db.permissao.count({
        where: {
          id: {
            in: permissoesIds
          }
        }
      });

      if (permissoesCount !== permissoesIds.length) {
        return NextResponse.json(
          { error: 'Uma ou mais permissões não foram encontradas' },
          { status: 400 }
        );
      }
    }

    // Atualizar o perfil - primeiro remover todas as permissões existentes
    await db.perfilPermissao.deleteMany({
      where: {
        perfilId: params.id
      }
    });

    // Depois adicionar as novas permissões
    const perfil = await db.perfil.update({
      where: { id: params.id },
      data: {
        nome,
        descricao,
        ativo,
        permissoes: {
          create: permissoesIds.map((permissaoId: string) => ({
            permissaoId
          }))
        }
      },
      include: {
        permissoes: {
          include: {
            permissao: true
          }
        },
        colaboradores: true
      }
    });

    return NextResponse.json(perfil);
  } catch (error) {
    console.error('Erro ao atualizar perfil:', error);
    return NextResponse.json(
      { error: 'Erro ao atualizar perfil' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    
    if (!id) {
      return NextResponse.json(
        { error: 'ID do perfil é obrigatório' },
        { status: 400 }
      );
    }

    // Verificar se perfil existe
    const existingPerfil = await db.perfil.findUnique({
      where: { id },
      include: {
        colaboradores: true
      }
    });

    if (!existingPerfil) {
      return NextResponse.json(
        { error: 'Perfil não encontrado' },
        { status: 404 }
      );
    }

    // Verificar se está associado a algum colaborador
    if (existingPerfil.colaboradores.length > 0) {
      return NextResponse.json(
        { error: 'Não é possível excluir um perfil que está associado a colaboradores' },
        { status: 400 }
      );
    }

    // Excluir as associações de permissões primeiro
    await db.perfilPermissao.deleteMany({
      where: {
        perfilId: id
      }
    });

    // Depois excluir o perfil
    await db.perfil.delete({
      where: { id }
    });

    return NextResponse.json({ message: 'Perfil excluído com sucesso' });
  } catch (error) {
    console.error('Erro ao excluir perfil:', error);
    return NextResponse.json(
      { error: 'Erro ao excluir perfil' },
      { status: 500 }
    );
  }
}
import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const grupo = await db.grupoHierarquico.findUnique({
      where: { id: params.id },
      include: {
        parent: {
          select: {
            id: true,
            nome: true,
            descricao: true
          }
        },
        children: {
          select: {
            id: true,
            nome: true,
            descricao: true,
            ativo: true
          }
        },
        clientes: {
          select: {
            id: true,
            nome: true,
            email: true,
            status: true
          }
        },
        colaboradores: {
          select: {
            id: true,
            nome: true,
            email: true,
            cargo: true,
            ativo: true
          }
        }
      }
    });

    if (!grupo) {
      return NextResponse.json(
        { error: 'Grupo hierárquico não encontrado' },
        { status: 404 }
      );
    }

    return NextResponse.json(grupo);
  } catch (error) {
    console.error('Erro ao buscar grupo hierárquico:', error);
    return NextResponse.json(
      { error: 'Erro ao buscar grupo hierárquico' },
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

    // Verificar se grupo existe
    const existingGrupo = await db.grupoHierarquico.findUnique({
      where: { id: params.id }
    });

    if (!existingGrupo) {
      return NextResponse.json(
        { error: 'Grupo hierárquico não encontrado' },
        { status: 404 }
      );
    }

    // Verificar se grupo com mesmo nome já existe no mesmo nível (excluindo o atual)
    const where: any = {
      nome: body.nome,
      id: { not: params.id }
    };

    if (body.parentId) {
      where.parentId = body.parentId;
    } else {
      where.parentId = null;
    }

    const duplicateGrupo = await db.grupoHierarquico.findFirst({ where });

    if (duplicateGrupo) {
      return NextResponse.json(
        { error: 'Já existe um grupo com este nome neste nível' },
        { status: 400 }
      );
    }

    // Verificar se está tentando criar referência circular
    if (body.parentId) {
      const isCircular = await checkCircularReference(params.id, body.parentId);
      if (isCircular) {
        return NextResponse.json(
          { error: 'Não é possível criar referência circular na hierarquia' },
          { status: 400 }
        );
      }
    }

    // Atualizar grupo hierárquico
    const grupo = await db.grupoHierarquico.update({
      where: { id: params.id },
      data: {
        nome: body.nome,
        descricao: body.descricao,
        ativo: body.ativo,
        parentId: body.parentId
      },
      include: {
        parent: {
          select: {
            id: true,
            nome: true
          }
        },
        children: {
          select: {
            id: true,
            nome: true
          }
        }
      }
    });

    return NextResponse.json(grupo);
  } catch (error) {
    console.error('Erro ao atualizar grupo hierárquico:', error);
    return NextResponse.json(
      { error: 'Erro ao atualizar grupo hierárquico' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Verificar se grupo existe
    const existingGrupo = await db.grupoHierarquico.findUnique({
      where: { id: params.id },
      include: {
        _count: {
          select: {
            children: true,
            clientes: true,
            colaboradores: true
          }
        }
      }
    });

    if (!existingGrupo) {
      return NextResponse.json(
        { error: 'Grupo hierárquico não encontrado' },
        { status: 404 }
      );
    }

    // Verificar se tem subgrupos, clientes ou colaboradores associados
    if (
      existingGrupo._count.children > 0 ||
      existingGrupo._count.clientes > 0 ||
      existingGrupo._count.colaboradores > 0
    ) {
      return NextResponse.json(
        { error: 'Não é possível excluir grupo com subgrupos, clientes ou colaboradores associados' },
        { status: 400 }
      );
    }

    // Excluir grupo hierárquico
    await db.grupoHierarquico.delete({
      where: { id: params.id }
    });

    return NextResponse.json({ message: 'Grupo hierárquico excluído com sucesso' });
  } catch (error) {
    console.error('Erro ao excluir grupo hierárquico:', error);
    return NextResponse.json(
      { error: 'Erro ao excluir grupo hierárquico' },
      { status: 500 }
    );
  }
}

// Função auxiliar para verificar referência circular
async function checkCircularReference(groupId: string, newParentId: string): Promise<boolean> {
  let currentId = newParentId;
  
  while (currentId) {
    if (currentId === groupId) {
      return true;
    }
    
    const parent = await db.grupoHierarquico.findUnique({
      where: { id: currentId },
      select: { parentId: true }
    });
    
    if (!parent || !parent.parentId) {
      break;
    }
    
    currentId = parent.parentId;
  }
  
  return false;
}
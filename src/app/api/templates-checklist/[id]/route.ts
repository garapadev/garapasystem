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
        { error: 'ID do template é obrigatório' },
        { status: 400 }
      );
    }

    const template = await db.templateChecklist.findUnique({
      where: { id },
      include: {
        itens: {
          orderBy: {
            ordem: 'asc'
          }
        },
        criadoPor: {
          select: {
            id: true,
            nome: true,
            email: true
          }
        }
      }
    });

    if (!template) {
      return NextResponse.json(
        { error: 'Template de checklist não encontrado' },
        { status: 404 }
      );
    }

    return NextResponse.json(template);
  } catch (error) {
    console.error('Erro ao buscar template de checklist:', error);
    return NextResponse.json(
      { error: 'Erro ao buscar template de checklist' },
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
        { error: 'ID do template é obrigatório' },
        { status: 400 }
      );
    }

    const body = await request.json();
    const { nome, descricao, ativo, itens } = body;

    // Verificar se template existe
    const templateExistente = await db.templateChecklist.findUnique({
      where: { id: params.id },
      include: {
        itens: true
      }
    });

    if (!templateExistente) {
      return NextResponse.json(
        { error: 'Template de checklist não encontrado' },
        { status: 404 }
      );
    }

    // Verificar se nome já existe em outro template
    if (nome && nome !== templateExistente.nome) {
      const nomeExistente = await db.templateChecklist.findFirst({
        where: {
          nome,
          id: { not: params.id }
        }
      });

      if (nomeExistente) {
        return NextResponse.json(
          { error: 'Já existe um template com este nome' },
          { status: 400 }
        );
      }
    }

    // Preparar dados para atualização
    const updateData: any = {};
    
    if (nome !== undefined) updateData.nome = nome;
    if (descricao !== undefined) updateData.descricao = descricao;
    if (ativo !== undefined) updateData.ativo = ativo;
    
    updateData.updatedAt = new Date();

    // Se itens foram fornecidos, atualizar
    if (itens) {
      // Deletar itens existentes
      await db.itemTemplateChecklist.deleteMany({
        where: { templateId: id }
      });

      // Criar novos itens
      const itensTemplate = itens.map((item: any, index: number) => ({
        titulo: item.titulo,
        descricao: item.descricao,
        obrigatorio: item.obrigatorio || false,
        ordem: item.ordem || index + 1,
        templateId: id
      }));

      updateData.itens = {
        create: itensTemplate
      };
    }

    // Atualizar template
    const template = await db.templateChecklist.update({
      where: { id },
      data: updateData,
      include: {
        itens: {
          orderBy: {
            ordem: 'asc'
          }
        },
        criadoPor: {
          select: {
            id: true,
            nome: true,
            email: true
          }
        }
      }
    });

    return NextResponse.json(template);
  } catch (error) {
    console.error('Erro ao atualizar template de checklist:', error);
    return NextResponse.json(
      { error: 'Erro ao atualizar template de checklist' },
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
        { error: 'ID do template é obrigatório' },
        { status: 400 }
      );
    }

    // Verificar se template existe
    const template = await db.templateChecklist.findUnique({
      where: { id }
    });

    if (!template) {
      return NextResponse.json(
        { error: 'Template de checklist não encontrado' },
        { status: 404 }
      );
    }

    // Verificar se template está sendo usado em alguma ordem de serviço
    const checklistsUsando = await db.checklistOrdemServico.count({
      where: { templateId: id }
    });

    if (checklistsUsando > 0) {
      return NextResponse.json(
        { error: 'Template não pode ser deletado pois está sendo usado em ordens de serviço' },
        { status: 400 }
      );
    }

    // Deletar template (cascade irá deletar itens)
    await db.templateChecklist.delete({
      where: { id }
    });

    return NextResponse.json({ message: 'Template de checklist deletado com sucesso' });
  } catch (error) {
    console.error('Erro ao deletar template de checklist:', error);
    return NextResponse.json(
      { error: 'Erro ao deletar template de checklist' },
      { status: 500 }
    );
  }
}
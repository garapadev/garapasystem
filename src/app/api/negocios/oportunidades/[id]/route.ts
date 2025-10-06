import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { db } from '@/lib/db';
import { z } from 'zod';
import { getSocketIO } from '@/lib/socket';

// Schema de validação para atualização de oportunidade
const updateOportunidadeSchema = z.object({
  titulo: z.string().min(1, 'Título é obrigatório').optional(),
  descricao: z.string().optional(),
  valor: z.number().positive().optional(),
  probabilidade: z.number().min(0).max(100).optional(),
  dataFechamento: z.string().datetime().optional(),
  observacoes: z.string().optional(),
  clienteId: z.string().min(1, 'Cliente é obrigatório').optional(),
  responsavelId: z.string().optional(),
  etapaId: z.string().min(1, 'Etapa é obrigatória').optional()
});

// GET - Buscar oportunidade por ID
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    const { id } = await params;
    
    if (!id) {
      return NextResponse.json(
        { error: 'ID da oportunidade é obrigatório' },
        { status: 400 }
      );
    }

    const oportunidade = await db.oportunidade.findUnique({
      where: { id },
      include: {
        cliente: {
          select: {
            id: true,
            nome: true,
            email: true,
            telefone: true,
            status: true
          }
        },
        responsavel: {
          select: {
            id: true,
            nome: true,
            email: true
          }
        },
        etapa: {
          select: {
            id: true,
            nome: true,
            cor: true,
            ordem: true
          }
        },
        historico: {
          include: {
            usuario: {
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

    if (!oportunidade) {
      return NextResponse.json(
        { error: 'Oportunidade não encontrada' },
        { status: 404 }
      );
    }

    return NextResponse.json(oportunidade);

  } catch (error) {
    console.error('Erro ao buscar oportunidade:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}

// PUT - Atualizar oportunidade
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    const { id } = await params;
    
    if (!id) {
      return NextResponse.json(
        { error: 'ID da oportunidade é obrigatório' },
        { status: 400 }
      );
    }

    const body = await request.json();
    const validatedData = updateOportunidadeSchema.parse(body);

    // Verificar se oportunidade existe
    const oportunidadeExistente = await db.oportunidade.findUnique({
      where: { id },
      include: {
        etapa: true
      }
    });

    if (!oportunidadeExistente) {
      return NextResponse.json(
        { error: 'Oportunidade não encontrada' },
        { status: 404 }
      );
    }

    // Verificar se cliente existe (se fornecido)
    if (validatedData.clienteId) {
      const cliente = await db.cliente.findUnique({
        where: { id: validatedData.clienteId }
      });
      if (!cliente) {
        return NextResponse.json(
          { error: 'Cliente não encontrado' },
          { status: 404 }
        );
      }
    }

    // Verificar se etapa existe (se fornecida)
    let novaEtapa: { id: string; nome: string; } | null = null;
    if (validatedData.etapaId) {
      novaEtapa = await db.etapaPipeline.findUnique({
        where: { id: validatedData.etapaId },
        select: { id: true, nome: true }
      });
      if (!novaEtapa) {
        return NextResponse.json(
          { error: 'Etapa não encontrada' },
          { status: 404 }
        );
      }
    }

    // Verificar se responsável existe (se fornecido)
    if (validatedData.responsavelId) {
      const responsavel = await db.colaborador.findUnique({
        where: { id: validatedData.responsavelId }
      });
      if (!responsavel) {
        return NextResponse.json(
          { error: 'Responsável não encontrado' },
          { status: 404 }
        );
      }
    }

    // Preparar dados para atualização
    const updateData: any = { ...validatedData };
    if (validatedData.dataFechamento) {
      updateData.dataFechamento = new Date(validatedData.dataFechamento);
    }

    // Atualizar oportunidade
    const oportunidadeAtualizada = await db.oportunidade.update({
      where: { id: params.id },
      data: updateData,
      include: {
        cliente: {
          select: {
            id: true,
            nome: true,
            email: true,
            status: true
          }
        },
        responsavel: {
          select: {
            id: true,
            nome: true,
            email: true
          }
        },
        etapa: {
          select: {
            id: true,
            nome: true,
            cor: true,
            ordem: true
          }
        }
      }
    });

    // Registrar mudanças no histórico
    const mudancas: string[] = [];
    
    if (validatedData.titulo && validatedData.titulo !== oportunidadeExistente.titulo) {
      mudancas.push(`Título alterado de "${oportunidadeExistente.titulo}" para "${validatedData.titulo}"`);
    }
    
    if (validatedData.valor !== undefined && validatedData.valor !== oportunidadeExistente.valor) {
      mudancas.push(`Valor alterado de ${oportunidadeExistente.valor || 0} para ${validatedData.valor}`);
    }
    
    if (validatedData.etapaId && validatedData.etapaId !== oportunidadeExistente.etapaId && novaEtapa) {
      mudancas.push(`Etapa alterada de "${oportunidadeExistente.etapa.nome}" para "${novaEtapa.nome}"`);
    }

    if (mudancas.length > 0) {
      await db.historicoOportunidade.create({
        data: {
          oportunidadeId: params.id,
          acao: 'atualizada',
          valorNovo: mudancas.join('; '),
          usuarioId: session.user.id
        }
      });
    }

    // Emitir evento Socket.IO
    const io = getSocketIO();
    if (io) {
      const action = validatedData.etapaId && validatedData.etapaId !== oportunidadeExistente.etapaId ? 'moved' : 'updated';
      io.emit('oportunidade-notification', {
        action,
        oportunidadeId: params.id,
        oportunidadeTitulo: oportunidadeAtualizada.titulo,
        etapaAnterior: oportunidadeExistente.etapa.nome,
        etapaNova: novaEtapa?.nome || oportunidadeAtualizada.etapa.nome,
        userId: session.user.id
      });
    }

    return NextResponse.json({ oportunidade: oportunidadeAtualizada });

  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Dados inválidos', details: error.issues },
        { status: 400 }
      );
    }

    console.error('Erro ao atualizar oportunidade:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}

// DELETE - Excluir oportunidade
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    const { id } = await params;
    
    if (!id) {
      return NextResponse.json(
        { error: 'ID da oportunidade é obrigatório' },
        { status: 400 }
      );
    }

    // Verificar se oportunidade existe
    const oportunidade = await db.oportunidade.findUnique({
      where: { id },
      select: {
        id: true,
        titulo: true
      }
    });

    if (!oportunidade) {
      return NextResponse.json(
        { error: 'Oportunidade não encontrada' },
        { status: 404 }
      );
    }

    // Excluir histórico primeiro (devido à foreign key)
    await db.historicoOportunidade.deleteMany({
      where: { oportunidadeId: id }
    });

    // Excluir oportunidade
    await db.oportunidade.delete({
      where: { id }
    });

    // Emitir evento Socket.IO
    const io = getSocketIO();
    if (io) {
      io.emit('oportunidade-notification', {
        action: 'deleted',
        oportunidadeId: id,
        oportunidadeTitulo: oportunidade.titulo,
        userId: session.user.id
      });
    }

    return NextResponse.json(
      { message: 'Oportunidade excluída com sucesso' },
      { status: 200 }
    );

  } catch (error) {
    console.error('Erro ao excluir oportunidade:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}
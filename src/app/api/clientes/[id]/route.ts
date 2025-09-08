import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const cliente = await db.cliente.findUnique({
      where: { id: params.id },
      include: {
        grupoHierarquico: {
          select: {
            id: true,
            nome: true,
            descricao: true
          }
        },
        enderecos: true
      }
    });

    if (!cliente) {
      return NextResponse.json(
        { error: 'Cliente não encontrado' },
        { status: 404 }
      );
    }

    return NextResponse.json(cliente);
  } catch (error) {
    console.error('Erro ao buscar cliente:', error);
    return NextResponse.json(
      { error: 'Erro ao buscar cliente' },
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

    // Verificar se cliente existe
    const existingCliente = await db.cliente.findUnique({
      where: { id: params.id }
    });

    if (!existingCliente) {
      return NextResponse.json(
        { error: 'Cliente não encontrado' },
        { status: 404 }
      );
    }

    // Verificar se email já existe (se fornecido e for diferente do atual)
    if (body.email && body.email !== existingCliente.email) {
      const emailExists = await db.cliente.findUnique({
        where: { email: body.email }
      });

      if (emailExists) {
        return NextResponse.json(
          { error: 'Email já cadastrado' },
          { status: 400 }
        );
      }
    }

    // Processar endereços se fornecidos
    let enderecosUpdate = {};
    if (body.enderecos) {
      // Garantir que pelo menos um endereço seja principal
      if (!body.enderecos.some((endereco: any) => endereco.principal)) {
        body.enderecos[0].principal = true;
      }
      
      enderecosUpdate = {
        enderecos: {
          deleteMany: {},
          create: body.enderecos
        }
      };
    }

    // Atualizar cliente
    const cliente = await db.cliente.update({
      where: { id: params.id },
      data: {
        nome: body.nome,
        email: body.email,
        telefone: body.telefone,
        documento: body.documento,
        tipo: body.tipo,
        status: body.status,
        observacoes: body.observacoes,
        valorPotencial: body.valorPotencial ? parseFloat(body.valorPotencial) : null,
        grupoHierarquicoId: body.grupoHierarquicoId,
        ...enderecosUpdate
      },
      include: {
        grupoHierarquico: {
          select: {
            id: true,
            nome: true
          }
        }
      }
    });

    return NextResponse.json(cliente);
  } catch (error) {
    console.error('Erro ao atualizar cliente:', error);
    return NextResponse.json(
      { error: 'Erro ao atualizar cliente' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Verificar se cliente existe
    const existingCliente = await db.cliente.findUnique({
      where: { id: params.id }
    });

    if (!existingCliente) {
      return NextResponse.json(
        { error: 'Cliente não encontrado' },
        { status: 404 }
      );
    }

    // Excluir cliente
    await db.cliente.delete({
      where: { id: params.id }
    });

    return NextResponse.json({ message: 'Cliente excluído com sucesso' });
  } catch (error) {
    console.error('Erro ao excluir cliente:', error);
    return NextResponse.json(
      { error: 'Erro ao excluir cliente' },
      { status: 500 }
    );
  }
}
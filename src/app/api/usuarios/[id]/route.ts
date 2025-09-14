import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import bcrypt from 'bcryptjs';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const usuario = await db.usuario.findUnique({
      where: { id: params.id },
      include: {
        colaborador: {
          select: {
            id: true,
            nome: true,
            email: true,
            cargo: true,
            perfil: {
              select: {
                id: true,
                nome: true,
                descricao: true
              }
            },
            grupoHierarquico: {
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

    if (!usuario) {
      return NextResponse.json(
        { error: 'Usuário não encontrado' },
        { status: 404 }
      );
    }

    return NextResponse.json(usuario);
  } catch (error) {
    console.error('Erro ao buscar usuário:', error);
    return NextResponse.json(
      { error: 'Erro ao buscar usuário' },
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
    if (!body.email || !body.nome) {
      return NextResponse.json(
        { error: 'Email e nome são obrigatórios' },
        { status: 400 }
      );
    }

    // Verificar se usuário existe
    const existingUsuario = await db.usuario.findUnique({
      where: { id: params.id }
    });

    if (!existingUsuario) {
      return NextResponse.json(
        { error: 'Usuário não encontrado' },
        { status: 404 }
      );
    }

    // Verificar se email já existe (se for diferente do atual)
    if (body.email !== existingUsuario.email) {
      const emailExists = await db.usuario.findUnique({
        where: { email: body.email }
      });

      if (emailExists) {
        return NextResponse.json(
          { error: 'Email já cadastrado' },
          { status: 400 }
        );
      }
    }

    // Verificar se colaborador existe (se fornecido)
    if (body.colaboradorId) {
      const colaborador = await db.colaborador.findUnique({
        where: { id: body.colaboradorId }
      });

      if (!colaborador) {
        return NextResponse.json(
          { error: 'Colaborador não encontrado' },
          { status: 400 }
        );
      }

      // Verificar se colaborador já tem usuário (se for diferente do atual)
      if (body.colaboradorId !== existingUsuario.colaboradorId) {
        const existingUserForCollaborator = await db.usuario.findFirst({
          where: {
            colaboradorId: body.colaboradorId,
            id: { not: params.id }
          }
        });

        if (existingUserForCollaborator) {
          return NextResponse.json(
            { error: 'Colaborador já possui um usuário associado' },
            { status: 400 }
          );
        }
      }
    }

    // Preparar dados para atualização
    const updateData: any = {
      email: body.email,
      nome: body.nome,
      ativo: body.ativo,
      colaboradorId: body.colaboradorId
    };

    // Atualizar senha apenas se fornecida
    if (body.senha) {
      // Hash da nova senha com bcrypt
      updateData.senha = await bcrypt.hash(body.senha, 10);
    }

    // Atualizar usuário
    const usuario = await db.usuario.update({
      where: { id: params.id },
      data: updateData,
      include: {
        colaborador: {
          select: {
            id: true,
            nome: true,
            email: true,
            cargo: true
          }
        }
      }
    });

    return NextResponse.json(usuario);
  } catch (error) {
    console.error('Erro ao atualizar usuário:', error);
    return NextResponse.json(
      { error: 'Erro ao atualizar usuário' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Verificar se usuário existe
    const existingUsuario = await db.usuario.findUnique({
      where: { id: params.id }
    });

    if (!existingUsuario) {
      return NextResponse.json(
        { error: 'Usuário não encontrado' },
        { status: 404 }
      );
    }

    // Excluir usuário
    await db.usuario.delete({
      where: { id: params.id }
    });

    return NextResponse.json({ message: 'Usuário excluído com sucesso' });
  } catch (error) {
    console.error('Erro ao excluir usuário:', error);
    return NextResponse.json(
      { error: 'Erro ao excluir usuário' },
      { status: 500 }
    );
  }
}
import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { z } from 'zod';

const updateDepartamentoSchema = z.object({
  nome: z.string().min(1, 'Nome é obrigatório').optional(),
  descricao: z.string().optional(),
  ativo: z.boolean().optional(),
  grupoHierarquicoId: z.string().optional(),
  imapHost: z.string().optional(),
  imapPort: z.number().int().min(1).max(65535).optional(),
  imapSecure: z.boolean().optional(),
  imapEmail: z.string().email().optional(),
  imapPassword: z.string().optional(),
  smtpHost: z.string().optional(),
  smtpPort: z.number().int().min(1).max(65535).optional(),
  smtpSecure: z.boolean().optional(),
  smtpEmail: z.string().email().optional(),
  smtpPassword: z.string().optional(),
  syncEnabled: z.boolean().optional(),
  syncInterval: z.number().int().min(60).optional()
});

interface RouteParams {
  params: Promise<{
    id: string;
  }>;
}

// GET - Buscar departamento por ID
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;

    const departamento = await db.helpdeskDepartamento.findUnique({
      where: { id },
      include: {
        grupoHierarquico: {
          select: {
            id: true,
            nome: true
          }
        },
        _count: {
          select: {
            tickets: true
          }
        }
      }
    });

    if (!departamento) {
      return NextResponse.json(
        { error: 'Departamento não encontrado' },
        { status: 404 }
      );
    }

    // Remove senhas dos dados retornados por segurança
    const departamentoResponse = {
      ...departamento,
      imapPassword: undefined,
      smtpPassword: undefined
    };

    return NextResponse.json(departamentoResponse);
  } catch (error) {
    console.error('Erro ao buscar departamento:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}

// PUT - Atualizar departamento
export async function PUT(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;
    const body = await request.json();
    const validatedData = updateDepartamentoSchema.parse(body);

    // Verificar se o departamento existe
    const existingDepartamento = await db.helpdeskDepartamento.findUnique({
      where: { id }
    });

    if (!existingDepartamento) {
      return NextResponse.json(
        { error: 'Departamento não encontrado' },
        { status: 404 }
      );
    }

    // Verificar se já existe outro departamento com o mesmo nome (se nome foi alterado)
    if (validatedData.nome && validatedData.nome !== existingDepartamento.nome) {
      const duplicateDepartamento = await db.helpdeskDepartamento.findFirst({
        where: {
          nome: validatedData.nome,
          id: { not: id }
        }
      });

      if (duplicateDepartamento) {
        return NextResponse.json(
          { error: 'Já existe um departamento com este nome' },
          { status: 400 }
        );
      }
    }

    // Verificar se o grupo hierárquico existe (se fornecido)
    if (validatedData.grupoHierarquicoId) {
      const grupoExists = await db.grupoHierarquico.findUnique({
        where: { id: validatedData.grupoHierarquicoId }
      });

      if (!grupoExists) {
        return NextResponse.json(
          { error: 'Grupo hierárquico não encontrado' },
          { status: 400 }
        );
      }
    }

    // Preparar dados para atualização
    const updateData: any = { ...validatedData };
    
    // Se as senhas estão vazias, não as atualize
    if (updateData.imapPassword === '') {
      delete updateData.imapPassword;
    }
    if (updateData.smtpPassword === '') {
      delete updateData.smtpPassword;
    }

    const departamento = await db.helpdeskDepartamento.update({
      where: { id },
      data: updateData,
      include: {
        grupoHierarquico: {
          select: {
            id: true,
            nome: true
          }
        }
      }
    });

    // Remove senha dos dados retornados
    const departamentoResponse = {
      ...departamento,
      imapPassword: undefined,
      smtpPassword: undefined
    };

    return NextResponse.json(departamentoResponse);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Dados inválidos', details: error.issues },
        { status: 400 }
      );
    }

    console.error('Erro ao atualizar departamento:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}

// DELETE - Excluir departamento
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;

    // Verificar se o departamento existe
    const existingDepartamento = await db.helpdeskDepartamento.findUnique({
      where: { id },
      include: {
        _count: {
          select: {
            tickets: true
          }
        }
      }
    });

    if (!existingDepartamento) {
      return NextResponse.json(
        { error: 'Departamento não encontrado' },
        { status: 404 }
      );
    }

    // Verificar se há tickets associados
    if (existingDepartamento._count.tickets > 0) {
      return NextResponse.json(
        { 
          error: 'Não é possível excluir o departamento pois há tickets associados a ele',
          ticketsCount: existingDepartamento._count.tickets
        },
        { status: 400 }
      );
    }

    await db.helpdeskDepartamento.delete({
      where: { id }
    });

    return NextResponse.json(
      { message: 'Departamento excluído com sucesso' },
      { status: 200 }
    );
  } catch (error) {
    console.error('Erro ao excluir departamento:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}
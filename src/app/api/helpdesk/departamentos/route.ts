import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { db } from '@/lib/db';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { HelpdeskMiddleware } from '@/lib/helpdesk/helpdesk-middleware';

const createDepartamentoSchema = z.object({
  nome: z.string().min(1, 'Nome é obrigatório'),
  descricao: z.string().optional(),
  ativo: z.boolean().default(true),
  grupoHierarquicoId: z.string().optional(),
  imapHost: z.string().optional(),
  imapPort: z.number().int().min(1).max(65535).optional(),
  imapSecure: z.boolean().default(true),
  imapEmail: z.string().email().optional(),
  imapPassword: z.string().optional(),
  smtpHost: z.string().optional(),
  smtpPort: z.number().int().min(1).max(65535).optional(),
  smtpSecure: z.boolean().default(false),
  smtpEmail: z.string().email().optional(),
  smtpPassword: z.string().optional(),
  syncEnabled: z.boolean().default(true),
  syncInterval: z.number().int().min(60).default(300)
});

// GET - Listar departamentos
export async function GET(request: NextRequest) {
  try {
    // Validar acesso ao helpdesk
    const authResult = await HelpdeskMiddleware.validateHelpdeskAccess(request);
    if (!authResult.hasAccess) {
      return NextResponse.json({ error: authResult.error }, { status: 401 });
    }

    // Construir filtros baseado no grupo hierárquico
    const isAdmin = HelpdeskMiddleware.isHelpdeskAdmin(authResult.colaborador);
    let whereClause = {};
    
    if (!isAdmin) {
      // Para não-administradores, filtrar apenas departamentos do seu grupo hierárquico
      whereClause = HelpdeskMiddleware.buildDepartamentoFilter(authResult.grupoHierarquicoId);
    }
    // Administradores podem ver todos os departamentos

    const departamentos = await db.helpdeskDepartamento.findMany({
      where: whereClause,
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
      },
      orderBy: {
        nome: 'asc'
      }
    });

    // Remove senhas dos dados retornados por segurança
    const departamentosSemSenhas = departamentos.map(dep => ({
      ...dep,
      imapPassword: undefined,
      smtpPassword: undefined
    }));

    return NextResponse.json({ departamentos: departamentosSemSenhas });
  } catch (error) {
    console.error('Erro ao buscar departamentos:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}

// POST - Criar departamento
export async function POST(request: NextRequest) {
  try {
    // Validar acesso ao helpdesk
    const authResult = await HelpdeskMiddleware.validateHelpdeskAccess(request);
    if (!authResult.hasAccess) {
      return NextResponse.json({ error: authResult.error }, { status: 401 });
    }

    // Verificar se é administrador para criar departamentos
    const isAdmin = HelpdeskMiddleware.isHelpdeskAdmin(authResult.colaborador);
    if (!isAdmin) {
      return NextResponse.json(
        { error: 'Apenas administradores podem criar departamentos' },
        { status: 403 }
      );
    }
    const body = await request.json();
    const validatedData = createDepartamentoSchema.parse(body);

    // Verificar se já existe um departamento com o mesmo nome
    const existingDepartamento = await db.helpdeskDepartamento.findFirst({
      where: {
        nome: validatedData.nome
      }
    });

    if (existingDepartamento) {
      return NextResponse.json(
        { error: 'Já existe um departamento com este nome' },
        { status: 400 }
      );
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

    const departamento = await db.helpdeskDepartamento.create({
      data: validatedData,
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

    return NextResponse.json(departamentoResponse, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Dados inválidos', details: error.issues },
        { status: 400 }
      );
    }

    console.error('Erro ao criar departamento:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}
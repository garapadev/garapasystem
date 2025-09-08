import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { db } from '@/lib/db';
import { z } from 'zod';
import bcrypt from 'bcryptjs';

// Schema de validação para configuração de email
const emailConfigSchema = z.object({
  imapHost: z.string().min(1, 'Host IMAP é obrigatório'),
  imapPort: z.number().int().min(1).max(65535),
  imapSecure: z.boolean(),
  smtpHost: z.string().min(1, 'Host SMTP é obrigatório'),
  smtpPort: z.number().int().min(1).max(65535),
  smtpSecure: z.boolean(),
  email: z.string().email('Email inválido'),
  password: z.string().min(1, 'Senha é obrigatória'),
  syncEnabled: z.boolean().optional(),
  syncInterval: z.number().int().min(60).max(3600).optional(), // 1 minuto a 1 hora
});

// GET - Buscar configuração de email do colaborador
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.email) {
      return NextResponse.json(
        { error: 'Não autorizado' },
        { status: 401 }
      );
    }

    // Buscar colaborador pelo email da sessão
    const colaborador = await db.colaborador.findFirst({
      where: {
        usuarios: {
          some: {
            email: session.user.email
          }
        }
      }
    });

    if (!colaborador) {
      return NextResponse.json(
        { error: 'Colaborador não encontrado' },
        { status: 404 }
      );
    }

    // Buscar configuração de email do colaborador
    const emailConfig = await db.emailConfig.findUnique({
      where: {
        colaboradorId: colaborador.id
      },
      select: {
        id: true,
        imapHost: true,
        imapPort: true,
        imapSecure: true,
        smtpHost: true,
        smtpPort: true,
        smtpSecure: true,
        email: true,
        syncEnabled: true,
        syncInterval: true,
        lastSync: true,
        ativo: true,
        createdAt: true,
        updatedAt: true
      }
    });

    return NextResponse.json({
      success: true,
      data: emailConfig
    });

  } catch (error) {
    console.error('Erro ao buscar configuração de email:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}

// POST - Criar/Atualizar configuração de email
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.email) {
      return NextResponse.json(
        { error: 'Não autorizado' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const validatedData = emailConfigSchema.parse(body);

    // Buscar o colaborador pelo email do usuário
    const colaborador = await db.colaborador.findUnique({
      where: { email: session.user.email }
    });

    if (!colaborador) {
      return NextResponse.json(
        { error: 'Colaborador não encontrado' },
        { status: 404 }
      );
    }

    // Criptografar a senha
    const hashedPassword = await bcrypt.hash(validatedData.password, 12);

    // Criar ou atualizar configuração de email
    const emailConfig = await db.emailConfig.upsert({
      where: {
        colaboradorId: colaborador.id
      },
      create: {
        ...validatedData,
        password: hashedPassword,
        colaboradorId: colaborador.id
      },
      update: {
        ...validatedData,
        password: hashedPassword,
        updatedAt: new Date()
      },
      select: {
        id: true,
        imapHost: true,
        imapPort: true,
        imapSecure: true,
        smtpHost: true,
        smtpPort: true,
        smtpSecure: true,
        email: true,
        syncEnabled: true,
        syncInterval: true,
        lastSync: true,
        ativo: true,
        createdAt: true,
        updatedAt: true,
      }
    });

    return NextResponse.json({
      success: true,
      message: 'Configuração de email salva com sucesso',
      data: emailConfig
    });

  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { 
          error: 'Dados inválidos',
          details: error.issues
        },
        { status: 400 }
      );
    }

    console.error('Erro ao salvar configuração de email:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}

// DELETE - Remover configuração de email
export async function DELETE(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.email) {
      return NextResponse.json(
        { error: 'Não autorizado' },
        { status: 401 }
      );
    }

    // Buscar colaborador pelo email da sessão
    const colaborador = await db.colaborador.findFirst({
      where: {
        usuarios: {
          some: {
            email: session.user.email
          }
        }
      }
    });

    if (!colaborador) {
      return NextResponse.json(
        { error: 'Colaborador não encontrado' },
        { status: 404 }
      );
    }

    // Buscar configuração de email diretamente
    const emailConfig = await db.emailConfig.findUnique({
      where: {
        colaboradorId: colaborador.id
      }
    });

    if (!emailConfig) {
      return NextResponse.json(
        { success: false, error: 'Configuração de email não encontrada' },
        { status: 404 }
      );
    }

    // Deletar a configuração
    await db.emailConfig.delete({
      where: {
        id: emailConfig.id
      }
    });

    return NextResponse.json({
      success: true,
      message: 'Configuração de email removida com sucesso'
    });

  } catch (error) {
    console.error('Erro ao remover configuração de email:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}
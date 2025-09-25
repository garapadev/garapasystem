import { NextRequest, NextResponse } from 'next/server';
import { ApiMiddleware } from '@/lib/api-middleware';
import { db as prisma } from '@/lib/db';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Validar autenticação usando o sistema unificado
    const authResult = await ApiMiddleware.validateAuth(request);
    if (!authResult.valid) {
      return ApiMiddleware.createErrorResponse(authResult.error!, authResult.status!);
    }

    // Verificar permissões
    if (!ApiMiddleware.hasAuthPermission(authResult, '/api/colaboradores/whatsapp-token', 'GET')) {
      return ApiMiddleware.createErrorResponse('Permissão insuficiente', 403);
    }

    // Buscar colaborador com campos específicos
    const colaborador = await prisma.colaborador.findUnique({
      where: { id: params.id },
      select: {
        id: true,
        nome: true,
        whatsappToken: true,
        whatsappInstanceName: true
      }
    });

    if (!colaborador) {
      return NextResponse.json({ error: 'Colaborador não encontrado' }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      data: {
        id: colaborador.id,
        nome: colaborador.nome,
        whatsappToken: colaborador.whatsappToken || 'Não definido',
        whatsappInstanceName: colaborador.whatsappInstanceName || 'Não definido'
      },
      authType: authResult.apiKey ? 'apikey' : 'session'
    });

  } catch (error) {
    console.error('Erro ao buscar token do WhatsApp:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Validar autenticação usando o sistema unificado
    const authResult = await ApiMiddleware.validateAuth(request);
    if (!authResult.valid) {
      return ApiMiddleware.createErrorResponse(authResult.error!, authResult.status!);
    }

    // Verificar permissões
    if (!ApiMiddleware.hasAuthPermission(authResult, '/api/colaboradores/whatsapp-token', 'PUT')) {
      return ApiMiddleware.createErrorResponse('Permissão insuficiente', 403);
    }

    const { whatsappToken, whatsappInstanceName } = await request.json();

    if (!whatsappToken) {
      return NextResponse.json({ error: 'Token do WhatsApp é obrigatório' }, { status: 400 });
    }

    // Verificar se o colaborador existe
    const colaboradorExistente = await prisma.colaborador.findUnique({
      where: { id: params.id },
      select: { id: true, nome: true }
    });

    if (!colaboradorExistente) {
      return NextResponse.json({ error: 'Colaborador não encontrado' }, { status: 404 });
    }

    // Atualizar o colaborador
    const colaboradorAtualizado = await prisma.colaborador.update({
      where: { id: params.id },
      data: {
        whatsappToken,
        whatsappInstanceName: whatsappInstanceName || null
      },
      select: {
        id: true,
        nome: true,
        whatsappToken: true,
        whatsappInstanceName: true
      }
    });

    return NextResponse.json({
      success: true,
      data: {
        id: colaboradorAtualizado.id,
        nome: colaboradorAtualizado.nome,
        whatsappToken: colaboradorAtualizado.whatsappToken,
        whatsappInstanceName: colaboradorAtualizado.whatsappInstanceName
      },
      authType: authResult.apiKey ? 'apikey' : 'session'
    });

  } catch (error) {
    console.error('Erro ao atualizar token do WhatsApp:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}
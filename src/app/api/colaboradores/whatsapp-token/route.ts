import { NextRequest, NextResponse } from 'next/server';
import { ApiMiddleware } from '@/lib/api-middleware';
import { prisma } from '@/lib/prisma';

export async function PUT(request: NextRequest) {
  try {
    // Validar autenticação usando o sistema unificado
    const authResult = await ApiMiddleware.validateAuth(request);
    if (!authResult.valid) {
      return ApiMiddleware.createErrorResponse(authResult.error!, authResult.status!);
    }

    // Verificar permissões
    if (!ApiMiddleware.hasPermission(authResult.apiKey, '/api/colaboradores/whatsapp-token', 'PUT')) {
      return ApiMiddleware.createErrorResponse('Permissão insuficiente', 403);
    }

    const { whatsappToken, whatsappInstanceName } = await request.json();

    if (!whatsappToken) {
      return NextResponse.json({ error: 'Token do WhatsApp é obrigatório' }, { status: 400 });
    }

    if (authResult.apiKey) {
      // Para API Key, não permitir atualização de tokens específicos de colaboradores
      // API Keys são para acesso geral, não para colaboradores específicos
      return NextResponse.json({ 
        error: 'API Keys não podem atualizar tokens de colaboradores específicos. Use autenticação de sessão.' 
      }, { status: 403 });
    } else {
      // Para sessão, buscar pelo email
      const usuario = await prisma.usuario.findUnique({
        where: { email: authResult.session!.user!.email! },
        include: { colaborador: true }
      });
      
      const colaborador = usuario?.colaborador;
      
      if (!colaborador) {
        return NextResponse.json({ error: 'Colaborador não encontrado' }, { status: 404 });
      }

      // Atualizar o token do WhatsApp do colaborador
      const colaboradorAtualizado = await prisma.colaborador.update({
        where: { id: colaborador.id },
        data: {
          whatsappToken,
          whatsappInstanceName: whatsappInstanceName || null
        }
      });

      return NextResponse.json({
        success: true,
        data: {
          id: colaboradorAtualizado.id,
          whatsappToken: colaboradorAtualizado.whatsappToken,
          whatsappInstanceName: colaboradorAtualizado.whatsappInstanceName
        },
        authType: 'session'
      });
    }

  } catch (error) {
    console.error('Erro ao atualizar token do WhatsApp:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    // Validar autenticação usando o sistema unificado
    const authResult = await ApiMiddleware.validateAuth(request);
    if (!authResult.valid) {
      return ApiMiddleware.createErrorResponse(authResult.error!, authResult.status!);
    }

    // Verificar permissões
    if (!ApiMiddleware.hasPermission(authResult.apiKey, '/api/colaboradores/whatsapp-token', 'GET')) {
      return ApiMiddleware.createErrorResponse('Permissão insuficiente', 403);
    }

    if (authResult.apiKey) {
      // Para API Key, retornar informações genéricas do sistema
      // API Keys não estão associadas a colaboradores específicos
      return NextResponse.json({
        success: true,
        data: {
          message: 'API Key autenticada com sucesso',
          authType: 'apikey',
          permissions: authResult.apiKey.permissoes
        }
      });
    } else {
      // Para sessão, buscar pelo email
      const usuario = await prisma.usuario.findUnique({
        where: { email: authResult.session!.user!.email! },
        include: { colaborador: true }
      });
      
      const colaborador = usuario?.colaborador;
      
      if (!colaborador) {
        return NextResponse.json({ error: 'Colaborador não encontrado' }, { status: 404 });
      }

      return NextResponse.json({
        success: true,
        data: {
          id: colaborador.id,
          whatsappToken: colaborador.whatsappToken,
          whatsappInstanceName: colaborador.whatsappInstanceName
        },
        authType: 'session'
      });
    }

  } catch (error) {
    console.error('Erro ao buscar token do WhatsApp:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}
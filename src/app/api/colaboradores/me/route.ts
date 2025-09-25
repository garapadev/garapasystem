import { NextRequest, NextResponse } from 'next/server';
import { ApiMiddleware } from '@/lib/api-middleware';
import { prisma } from '@/lib/prisma';

export async function GET(request: NextRequest) {
  try {
    // Validar autenticação (sessão ou API Key)
    const authResult = await ApiMiddleware.validateAuth(request);
    if (!authResult.valid) {
      return ApiMiddleware.createErrorResponse(authResult.error!, authResult.status!);
    }

    // Verificar permissões
    if (!ApiMiddleware.hasAuthPermission(authResult, '/api/colaboradores/me', 'GET')) {
      return ApiMiddleware.createErrorResponse('Permissão insuficiente', 403);
    }

    let colaborador = null;

    // Se autenticado por sessão
    if (authResult.authType === 'session' && authResult.user?.email) {
      const usuario = await prisma.usuario.findUnique({
        where: { email: authResult.user.email },
        include: { 
          colaborador: {
            select: {
              id: true,
              nome: true,
              email: true,
              cargo: true,
              whatsappToken: true,
              whatsappInstanceName: true
            }
          }
        }
      });

      if (!usuario?.colaborador) {
        return NextResponse.json({ error: 'Colaborador não encontrado' }, { status: 404 });
      }

      colaborador = usuario.colaborador;
    }
    // Se autenticado por API Key
    else if (authResult.authType === 'apikey' && authResult.apiKey) {
      // Para API Keys, retornar informações da própria chave
      colaborador = {
        id: authResult.apiKey.id,
        nome: authResult.apiKey.nome,
        email: null,
        cargo: 'API Key',
        whatsappToken: null,
        whatsappInstanceName: null,
        apiKey: true,
        permissoes: authResult.apiKey.permissoes
      };
    }

    if (!colaborador) {
      return NextResponse.json({ error: 'Dados não encontrados' }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      data: colaborador,
      authType: authResult.authType
    });

  } catch (error) {
    console.error('Erro ao buscar dados do colaborador:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}
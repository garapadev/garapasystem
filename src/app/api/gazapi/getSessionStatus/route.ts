import { NextRequest, NextResponse } from 'next/server';
import { SessionResponse } from '@/lib/gazapi/gazapi-service';
import { ApiMiddleware } from '@/lib/api-middleware';
import { getGazapiInstance } from '@/lib/gazapi/config';
import { getSessionParams } from '@/lib/gazapi/session-utils';

interface GetSessionStatusRequest {
  colaboradorId?: string; // Opcional, para uso com API keys
}

export async function POST(request: NextRequest): Promise<NextResponse<SessionResponse>> {
  try {
    // Validar autenticação
    const authResult = await ApiMiddleware.validateAuth(request);
    if (!authResult.valid) {
      return ApiMiddleware.createErrorResponse(authResult.error || 'Autenticação necessária', 401);
    }

    // Verificar permissões
    if (!ApiMiddleware.hasAuthPermission(authResult, '/api/gazapi/getSessionStatus', 'POST')) {
      return ApiMiddleware.createErrorResponse('Permissão insuficiente para verificar status da sessão', 403);
    }

    const body: GetSessionStatusRequest = await request.json();
    
    // Obter parâmetros de sessão padronizados
    let sessionParams;
    try {
      sessionParams = getSessionParams(authResult, { colaboradorId: body.colaboradorId });
    } catch (error) {
      return NextResponse.json({
        success: false,
        message: error instanceof Error ? error.message : 'Erro ao obter parâmetros de sessão',
        error: 'INVALID_SESSION_IDENTIFIER'
      }, { status: 400 });
    }

    // Obter instância do Gazapi
    const gazapi = getGazapiInstance();
    
    // Obter status da sessão
    const result = await gazapi.getSessionStatus(sessionParams);

    const statusCode = result.success ? 200 : 400;
    return NextResponse.json(result, { status: statusCode });

  } catch (error) {
    console.error('[Gazapi] Erro no endpoint /getSessionStatus:', error);
    
    return NextResponse.json({
      success: false,
      message: 'Erro interno do servidor',
      error: error instanceof Error ? error.message : 'Erro desconhecido'
    }, { status: 500 });
  }
}

export async function GET(): Promise<NextResponse> {
  return NextResponse.json({
    success: false,
    message: 'Método não permitido. Use POST para obter status da sessão.',
    error: 'METHOD_NOT_ALLOWED'
  }, { status: 405 });
}
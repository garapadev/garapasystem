import { NextRequest, NextResponse } from 'next/server';
import { ApiMiddleware } from '@/lib/api-middleware';
import { getGazapiInstance } from '@/lib/gazapi/config';
import { getSessionParams } from '@/lib/gazapi/session-utils';

interface GetQrCodeRequest {
  colaboradorId?: string; // Opcional, para uso com API keys
}

export async function POST(request: NextRequest) {
  try {
    // Validar autenticação
    const authResult = await ApiMiddleware.validateAuth(request);
    if (!authResult.valid) {
      return ApiMiddleware.createErrorResponse(authResult.error || 'Autenticação necessária', 401);
    }

    // Verificar permissões
    if (!ApiMiddleware.hasAuthPermission(authResult, '/api/gazapi/getQrCode', 'POST')) {
      return ApiMiddleware.createErrorResponse('Permissão insuficiente para obter QR Code', 403);
    }

    const body: GetQrCodeRequest = await request.json();

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

    const gazapi = getGazapiInstance();
    const result = await gazapi.getQrCode(sessionParams);
    return NextResponse.json(result);
  } catch (error) {
    console.error('Erro no endpoint getQrCode:', error);
    return NextResponse.json(
      { success: false, message: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}

export async function GET(): Promise<NextResponse> {
  return NextResponse.json({
    success: false,
    message: 'Método não permitido. Use POST para obter QR Code.',
    error: 'METHOD_NOT_ALLOWED'
  }, { status: 405 });
}
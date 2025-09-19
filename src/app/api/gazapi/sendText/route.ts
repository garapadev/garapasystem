import { NextRequest, NextResponse } from 'next/server';
import { MessageResponse } from '@/lib/gazapi/gazapi-service';
import { ApiMiddleware } from '@/lib/api-middleware';
import { getGazapiInstance } from '@/lib/gazapi/config';
import { getSessionParams } from '@/lib/gazapi/session-utils';

interface SendTextRequest {
  colaboradorId?: string; // Opcional, para uso com API keys
  chatId: string;
  message: string;
}

export async function POST(request: NextRequest): Promise<NextResponse<MessageResponse>> {
  try {
    // Validar autenticação
    const authResult = await ApiMiddleware.validateAuth(request);
    if (!authResult.valid) {
      return ApiMiddleware.createErrorResponse(authResult.error || 'Autenticação necessária', 401);
    }

    // Verificar permissões
    if (!ApiMiddleware.hasAuthPermission(authResult, '/api/gazapi/sendText', 'POST')) {
      return ApiMiddleware.createErrorResponse('Permissão insuficiente para enviar mensagens', 403);
    }

    const body: SendTextRequest = await request.json();
    
    // Validar parâmetros obrigatórios
    if (!body.chatId || !body.message) {
      return NextResponse.json({
        success: false,
        message: 'Parâmetros obrigatórios: chatId, message',
        error: 'INVALID_PARAMETERS'
      }, { status: 400 });
    }

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

    // Validar formato do chatId
    if (!body.chatId.includes('@')) {
      return NextResponse.json({
        success: false,
        message: 'chatId deve estar no formato: numero@c.us ou numero@g.us',
        error: 'INVALID_CHAT_ID'
      }, { status: 400 });
    }

    // Obter instância do Gazapi
    const gazapi = getGazapiInstance();
    
    // Enviar mensagem de texto
    const result = await gazapi.sendText({
      ...sessionParams,
      chatId: body.chatId,
      message: body.message
    });

    const statusCode = result.success ? 200 : 400;
    return NextResponse.json(result, { status: statusCode });

  } catch (error) {
    console.error('[Gazapi] Erro no endpoint /sendText:', error);
    
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
    message: 'Método não permitido. Use POST para enviar mensagem de texto.',
    error: 'METHOD_NOT_ALLOWED'
  }, { status: 405 });
}
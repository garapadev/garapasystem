import { NextRequest, NextResponse } from 'next/server';
import { ApiMiddleware } from '@/lib/api-middleware';
import { MessageResponse } from '@/lib/gazapi/gazapi-service';
import { getGazapiInstance } from '@/lib/gazapi/config';
import { getSessionParams } from '@/lib/gazapi/session-utils';

interface SendImageRequest {
  colaboradorId?: string; // Opcional, para uso com API keys
  chatId: string;
  mediaUrl: string;
  caption?: string;
}

export async function POST(request: NextRequest): Promise<NextResponse<MessageResponse>> {
  try {
    // Validar autenticação
    const authResult = await ApiMiddleware.validateAuth(request);
    if (!authResult.valid) {
      return ApiMiddleware.createErrorResponse(authResult.error || 'Autenticação necessária', 401);
    }

    // Verificar permissões
    if (!ApiMiddleware.hasAuthPermission(authResult, '/api/gazapi/sendImage', 'POST')) {
      return ApiMiddleware.createErrorResponse('Permissão insuficiente para enviar imagens', 403);
    }

    const body: SendImageRequest = await request.json();
    
    // Validar parâmetros obrigatórios
    if (!body.chatId || !body.mediaUrl) {
      return NextResponse.json({
        success: false,
        message: 'Parâmetros obrigatórios: chatId, mediaUrl',
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

    // Validar URL da mídia
    try {
      new URL(body.mediaUrl);
    } catch {
      return NextResponse.json({
        success: false,
        message: 'mediaUrl deve ser uma URL válida',
        error: 'INVALID_MEDIA_URL'
      }, { status: 400 });
    }

    // Obter instância do Gazapi
    const gazapi = getGazapiInstance();
    
    // Enviar imagem
    const result = await gazapi.sendImage({
      ...sessionParams,
      chatId: body.chatId,
      mediaUrl: body.mediaUrl,
      caption: body.caption
    });

    const statusCode = result.success ? 200 : 400;
    return NextResponse.json(result, { status: statusCode });

  } catch (error) {
    console.error('[Gazapi] Erro no endpoint /sendImage:', error);
    
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
    message: 'Método não permitido. Use POST para enviar imagem.',
    error: 'METHOD_NOT_ALLOWED'
  }, { status: 405 });
}
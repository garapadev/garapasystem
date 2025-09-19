import { NextRequest, NextResponse } from 'next/server';
import { GazapiSessionResponse } from '@/lib/gazapi/types';
import { ApiMiddleware } from '@/lib/api-middleware';
import { getGazapiInstance } from '@/lib/gazapi/config';

interface StartSessionRequest {
  colaboradorId?: string; // Opcional, se não fornecido usa o usuário da sessão
}

export async function POST(request: NextRequest): Promise<NextResponse<GazapiSessionResponse>> {
  try {
    // Validar autenticação
    const authResult = await ApiMiddleware.validateAuth(request);
    if (!authResult.valid) {
      return ApiMiddleware.createErrorResponse(authResult.error || 'Autenticação necessária', 401);
    }

    // Verificar permissões
    if (!ApiMiddleware.hasAuthPermission(authResult, '/api/gazapi/start', 'POST')) {
      return ApiMiddleware.createErrorResponse('Permissão insuficiente para iniciar sessão WhatsApp', 403);
    }

    const body: StartSessionRequest = await request.json();
    
    // Determinar o identificador da sessão
    let sessionId: string;
    
    if (authResult.authType === 'session' && authResult.user?.colaborador?.id) {
      // Usuário logado - usar ID do colaborador
      sessionId = authResult.user.colaborador.id;
    } else if (authResult.authType === 'apikey' && body.colaboradorId) {
      // API Key - usar colaboradorId fornecido
      sessionId = body.colaboradorId;
    } else {
      return NextResponse.json({
        success: false,
        message: 'Não foi possível determinar o identificador da sessão',
        error: 'INVALID_SESSION_IDENTIFIER'
      }, { status: 400 });
    }

    // Converter para formato válido (letras minúsculas, números e underscore)
    const session = sessionId.toLowerCase().replace(/[^a-z0-9]/g, '_');
    const sessionKey = `key_${session}`;
    
    // Usar token admin do ambiente
    const adminToken = process.env.GAZAPI_ADMIN_TOKEN || 'gazapi_admin_2024';

    // Obter instância do Gazapi
    const gazapi = getGazapiInstance();
    
    // Iniciar sessão
    const result = await gazapi.startSession({
      session,
      sessionKey,
      token: adminToken,
      webhookUrl: body.webhookUrl,
      autoReconnect: body.autoReconnect
    });

    const statusCode = result.success ? 200 : 400;
    return NextResponse.json(result, { status: statusCode });

  } catch (error) {
    console.error('[Gazapi] Erro no endpoint /start:', error);
    
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
    message: 'Método não permitido. Use POST para iniciar uma sessão.',
    error: 'METHOD_NOT_ALLOWED'
  }, { status: 405 });
}
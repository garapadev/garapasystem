import { NextRequest, NextResponse } from 'next/server';
import { ApiMiddleware } from '@/lib/api-middleware';

interface WebhookEvent {
  event: string;
  session: string;
  data: any;
  timestamp: string;
}

export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    // Validar autenticação administrativa para webhook
    const authResult = await ApiMiddleware.validateAuth(request);
    if (!authResult.valid) {
      return ApiMiddleware.createErrorResponse(authResult.error || 'Autenticação necessária', 401);
    }

    // Verificar permissões administrativas
    if (!ApiMiddleware.hasAuthPermission(authResult, '/api/gazapi/webhook', 'POST')) {
      return ApiMiddleware.createErrorResponse('Permissão insuficiente para webhook', 403);
    }

    const body: WebhookEvent = await request.json();
    
    console.log('[Gazapi Webhook] Evento recebido:', {
      event: body.event,
      session: body.session,
      timestamp: body.timestamp
    });

    // Processar diferentes tipos de eventos
    switch (body.event) {
      case 'session.status':
        console.log(`[Gazapi] Status da sessão ${body.session}:`, body.data.status);
        break;
        
      case 'qr.updated':
        console.log(`[Gazapi] QR Code atualizado para sessão ${body.session}`);
        break;
        
      case 'message.received':
        console.log(`[Gazapi] Mensagem recebida na sessão ${body.session}:`, {
          from: body.data.from,
          message: body.data.message,
          type: body.data.type
        });
        break;
        
      case 'message.sent':
        console.log(`[Gazapi] Mensagem enviada na sessão ${body.session}:`, {
          to: body.data.to,
          messageId: body.data.messageId,
          status: body.data.status
        });
        break;
        
      case 'contact.updated':
        console.log(`[Gazapi] Contato atualizado na sessão ${body.session}:`, body.data);
        break;
        
      case 'group.updated':
        console.log(`[Gazapi] Grupo atualizado na sessão ${body.session}:`, body.data);
        break;
        
      default:
        console.log(`[Gazapi] Evento desconhecido: ${body.event}`);
    }

    // Aqui você pode implementar lógica adicional como:
    // - Salvar eventos no banco de dados
    // - Enviar notificações em tempo real via WebSocket
    // - Processar mensagens automaticamente
    // - Integrar com outros sistemas

    return NextResponse.json({
      success: true,
      message: 'Webhook processado com sucesso',
      event: body.event,
      session: body.session
    });

  } catch (error) {
    console.error('[Gazapi Webhook] Erro ao processar webhook:', error);
    
    return NextResponse.json({
      success: false,
      message: 'Erro ao processar webhook',
      error: error instanceof Error ? error.message : 'Erro desconhecido'
    }, { status: 500 });
  }
}

export async function GET(): Promise<NextResponse> {
  return NextResponse.json({
    success: true,
    message: 'Gazapi Webhook está funcionando',
    timestamp: new Date().toISOString(),
    endpoints: [
      'POST /api/gazapi/webhook - Receber eventos'
    ]
  });
}
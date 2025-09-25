import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    console.log('📨 Webhook WhatsApp recebido:', JSON.stringify(body, null, 2));
    
    // Aqui você pode processar diferentes tipos de eventos
    if (body.event) {
      switch (body.event) {
        case 'message':
          console.log('💬 Nova mensagem recebida:', body.data);
          // Processar nova mensagem
          break;
        case 'status':
          console.log('📊 Status atualizado:', body.data);
          // Processar mudança de status
          break;
        case 'qr':
          console.log('📱 QR Code gerado:', body.data);
          // Processar QR code
          break;
        default:
          console.log('❓ Evento desconhecido:', body.event);
      }
    }
    
    // Retornar 200 para confirmar recebimento
    return NextResponse.json({ success: true, received: true });
    
  } catch (error) {
    console.error('❌ Erro ao processar webhook WhatsApp:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  // Endpoint para verificar se o webhook está funcionando
  return NextResponse.json({ 
    status: 'active',
    endpoint: '/api/webhooks/whatsapp',
    message: 'Webhook WhatsApp está ativo'
  });
}
import { NextRequest, NextResponse } from 'next/server';

/**
 * Esta rota existe apenas para evitar que o Next.js tente processar
 * requisições para /api/socketio como rotas de API normais.
 * O Socket.IO é configurado no server.ts customizado e deve ser
 * acessado via WebSocket, não via HTTP.
 */

export async function GET(request: NextRequest) {
  return NextResponse.json(
    { 
      error: 'Socket.IO endpoint - use WebSocket connection',
      message: 'This endpoint is reserved for Socket.IO WebSocket connections. Use the Socket.IO client to connect.',
      socketPath: '/api/socketio'
    }, 
    { status: 400 }
  );
}

export async function POST(request: NextRequest) {
  return NextResponse.json(
    { 
      error: 'Socket.IO endpoint - use WebSocket connection',
      message: 'This endpoint is reserved for Socket.IO WebSocket connections. Use the Socket.IO client to connect.',
      socketPath: '/api/socketio'
    }, 
    { status: 400 }
  );
}

export async function PUT(request: NextRequest) {
  return NextResponse.json(
    { 
      error: 'Socket.IO endpoint - use WebSocket connection',
      message: 'This endpoint is reserved for Socket.IO WebSocket connections. Use the Socket.IO client to connect.',
      socketPath: '/api/socketio'
    }, 
    { status: 400 }
  );
}

export async function DELETE(request: NextRequest) {
  return NextResponse.json(
    { 
      error: 'Socket.IO endpoint - use WebSocket connection',
      message: 'This endpoint is reserved for Socket.IO WebSocket connections. Use the Socket.IO client to connect.',
      socketPath: '/api/socketio'
    }, 
    { status: 400 }
  );
}
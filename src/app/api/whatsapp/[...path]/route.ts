import { NextRequest, NextResponse } from 'next/server';
import { getWhatsAppAdapter } from '@/lib/whatsapp';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ path: string[] }> }
) {
  return handleRequest(request, 'GET', params);
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ path: string[] }> }
) {
  return handleRequest(request, 'POST', params);
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ path: string[] }> }
) {
  return handleRequest(request, 'PUT', params);
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ path: string[] }> }
) {
  return handleRequest(request, 'DELETE', params);
}

export async function OPTIONS(request: NextRequest) {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization, token, X-Api-Key',
    },
  });
}

async function handleRequest(
  request: NextRequest,
  method: string,
  params: Promise<{ path: string[] }>
) {
  try {
    const resolvedParams = await params;
    const path = resolvedParams.path.join('/');

    // Obter o adaptador atual
    const adapter = await getWhatsAppAdapter();

    // Roteamento baseado no path
    switch (path) {
      case 'status':
        return handleStatus(adapter);
      
      case 'sessions':
        return handleSessions(adapter, method, request);
      
      case 'users':
        return handleUsers(adapter, method, request);
      
      default:
        if (path.startsWith('sessions/')) {
          return handleSessionAction(adapter, method, request, path);
        } else if (path.startsWith('send/')) {
          return handleSendMessage(adapter, method, request, path);
        }
        
        return NextResponse.json(
          { error: 'Endpoint não encontrado' },
          { status: 404 }
        );
    }
  } catch (error) {
    console.error('Erro na API WhatsApp:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}

async function handleStatus(adapter: any) {
  try {
    const status = await adapter.getStatus();
    return NextResponse.json(status);
  } catch (error) {
    return NextResponse.json(
      { error: 'Erro ao obter status' },
      { status: 500 }
    );
  }
}

async function handleSessions(adapter: any, method: string, request: NextRequest) {
  try {
    switch (method) {
      case 'GET':
        const sessions = await adapter.getSessions();
        return NextResponse.json(sessions);
      
      case 'POST':
        const body = await request.json();
        const session = await adapter.createSession(body.sessionId, body.name);
        return NextResponse.json(session);
      
      default:
        return NextResponse.json(
          { error: 'Método não permitido' },
          { status: 405 }
        );
    }
  } catch (error) {
    return NextResponse.json(
      { error: 'Erro ao gerenciar sessões' },
      { status: 500 }
    );
  }
}

async function handleUsers(adapter: any, method: string, request: NextRequest) {
  try {
    switch (method) {
      case 'GET':
        const users = await adapter.getUsers();
        return NextResponse.json(users);
      
      case 'POST':
        const body = await request.json();
        const user = await adapter.createUser(body);
        return NextResponse.json(user);
      
      default:
        return NextResponse.json(
          { error: 'Método não permitido' },
          { status: 405 }
        );
    }
  } catch (error) {
    return NextResponse.json(
      { error: 'Erro ao gerenciar usuários' },
      { status: 500 }
    );
  }
}

async function handleSessionAction(adapter: any, method: string, request: NextRequest, path: string) {
  try {
    const pathParts = path.split('/');
    const sessionId = pathParts[1];
    const action = pathParts[2];

    switch (action) {
      case 'delete':
        if (method === 'DELETE') {
          const success = await adapter.deleteSession(sessionId);
          return NextResponse.json({ success });
        }
        break;
      
      case 'status':
        if (method === 'GET') {
          const session = await adapter.getSession(sessionId);
          return NextResponse.json(session);
        }
        break;
      
      case 'send':
        if (method === 'POST') {
          const body = await request.json();
          const result = await adapter.sendMessage(sessionId, body);
          return NextResponse.json(result);
        }
        break;
    }

    return NextResponse.json(
      { error: 'Ação não encontrada' },
      { status: 404 }
    );
  } catch (error) {
    return NextResponse.json(
      { error: 'Erro na ação da sessão' },
      { status: 500 }
    );
  }
}

async function handleSendMessage(adapter: any, method: string, request: NextRequest, path: string) {
  try {
    if (method !== 'POST') {
      return NextResponse.json(
        { error: 'Método não permitido' },
        { status: 405 }
      );
    }

    const body = await request.json();
    const sessionId = request.headers.get('session') || body.session;
    
    if (!sessionId) {
      return NextResponse.json(
        { error: 'Session ID é obrigatório' },
        { status: 400 }
      );
    }

    const result = await adapter.sendMessage(sessionId, body);
    return NextResponse.json(result);
  } catch (error) {
    return NextResponse.json(
      { error: 'Erro ao enviar mensagem' },
      { status: 500 }
    );
  }
}
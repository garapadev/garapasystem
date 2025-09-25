import { NextRequest, NextResponse } from 'next/server';
import { getWhatsAppAdapter } from '@/lib/whatsapp';

export async function GET(
  request: NextRequest,
  { params }: { params: { path: string[] } }
) {
  return handleRequest(request, params, 'GET');
}

export async function POST(
  request: NextRequest,
  { params }: { params: { path: string[] } }
) {
  return handleRequest(request, params, 'POST');
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { path: string[] } }
) {
  return handleRequest(request, params, 'PUT');
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { path: string[] } }
) {
  return handleRequest(request, params, 'DELETE');
}

async function handleRequest(
  request: NextRequest,
  params: { path: string[] },
  method: string
) {
  try {
    // Aguardar params conforme requerido pelo Next.js
    const resolvedParams = await params;
    
    // Obter configurações atuais
    const configResponse = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000'}/api/configuracoes`);
    const configuracoes = await configResponse.json();
    
    const configMap = new Map(configuracoes.map((c: any) => [c.chave, c.valor]));
    const apiType = configMap.get('whatsapp_api_type') || 'wuzapi';
    
    const apiPath = resolvedParams.path.join('/');
    let targetUrl: string;
    let headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };

    if (apiType === 'wuzapi') {
      const wuzapiUrl = configMap.get('wuzapi_url');
      const adminToken = configMap.get('wuzapi_admin_token');
      
      if (!wuzapiUrl) {
        return NextResponse.json(
          { error: 'Configuração da API WuzAPI não encontrada' },
          { status: 500 }
        );
      }

      // Normalizar URL removendo barra final se existir
      const normalizedWuzapiUrl = wuzapiUrl.endsWith('/') ? wuzapiUrl.slice(0, -1) : wuzapiUrl;
      targetUrl = `${normalizedWuzapiUrl}/${apiPath}`;
      
      // Lógica de autenticação WuzAPI
      const userToken = request.headers.get('token');
      const authHeader = request.headers.get('authorization');
      const isAdminEndpoint = apiPath.startsWith('admin/');
      
      if (isAdminEndpoint) {
        if (authHeader) {
          headers['Authorization'] = authHeader;
        } else if (adminToken) {
          headers['Authorization'] = adminToken;
        }
      } else {
        if (userToken) {
          headers['token'] = userToken;
        } else if (adminToken) {
          headers['Authorization'] = adminToken;
        }
      }
    } else {
      // WAHA
      const wahaUrl = configMap.get('waha_url') || 'https://waha.devlike.pro';
      const apiKey = configMap.get('waha_api_key');
      
      // Mapear endpoints WuzAPI para WAHA
      const mappedPath = mapWuzApiToWaha(apiPath);
      targetUrl = `${wahaUrl}${mappedPath}`;
      
      if (apiKey) {
        headers['X-Api-Key'] = apiKey;
      }
    }
    
    console.log('WhatsApp API Proxy Debug:', {
      apiType,
      apiPath,
      targetUrl,
      pathParams: resolvedParams.path,
      method
    });
    
    // Log para debug
    console.log('WuzAPI Proxy:', {
      targetUrl,
      apiPath,
      isAdminEndpoint,
      hasUserToken: !!userToken,
      hasAuthHeader: !!authHeader,
      hasAdminToken: !!adminToken,
      authMethod: headers['Authorization'] ? 'Authorization header' : headers['token'] ? 'Token header' : 'No auth',
      finalHeaders: Object.keys(headers).filter(h => h.toLowerCase().includes('auth') || h === 'token')
    });
    
    // Preparar body para métodos que suportam
    let body: string | undefined;
    if (['POST', 'PUT', 'PATCH'].includes(method)) {
      try {
        const requestBody = await request.text();
        body = requestBody;
      } catch (error) {
        // Ignorar erro se não houver body
      }
    }
    
    // Log detalhado antes da requisição
    console.log('WuzAPI Request Details:', {
      targetUrl,
      method,
      headers,
      body: body ? JSON.parse(body) : null
    });

    // Fazer requisição para a API WuzAPI
    const response = await fetch(targetUrl, {
      method,
      headers,
      body,
    });

    console.log('WuzAPI Response:', {
      status: response.status,
      statusText: response.statusText,
      headers: Object.fromEntries(response.headers.entries())
    });
    
    // Obter resposta
    const responseText = await response.text();
    let responseData;
    
    try {
      responseData = JSON.parse(responseText);
      console.log('WuzAPI Response Data:', responseData);
    } catch {
      console.log('WuzAPI Response Text:', responseText);
      responseData = responseText;
    }
    
    // Retornar resposta com status correto
    return NextResponse.json(responseData, { 
      status: response.status,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization, Token',
      }
    });
    
  } catch (error) {
    console.error('Erro no proxy WuzAPI:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}

export async function OPTIONS() {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization, Token',
    },
  });
}
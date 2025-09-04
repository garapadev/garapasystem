import { NextRequest, NextResponse } from 'next/server';
import { ApiMiddleware } from '@/lib/api-middleware';
import { ApiKeyManager } from '@/lib/api-key-manager';

/**
 * @swagger
 * /api/api-keys/{id}/stats:
 *   get:
 *     tags:
 *       - API Keys
 *     summary: Obtém estatísticas de uso de uma chave de API
 *     description: Retorna estatísticas detalhadas de uso de uma chave de API específica
 *     security:
 *       - ApiKeyAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID da chave de API
 *       - in: query
 *         name: days
 *         required: false
 *         schema:
 *           type: integer
 *           default: 30
 *           minimum: 1
 *           maximum: 365
 *         description: Número de dias para análise (padrão: 30)
 *     responses:
 *       200:
 *         description: Estatísticas obtidas com sucesso
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 totalRequests:
 *                   type: integer
 *                   description: Total de requisições no período
 *                 successfulRequests:
 *                   type: integer
 *                   description: Requisições bem-sucedidas (status 2xx-3xx)
 *                 failedRequests:
 *                   type: integer
 *                   description: Requisições com falha (status 4xx-5xx)
 *                 averageResponseTime:
 *                   type: integer
 *                   description: Tempo médio de resposta em milissegundos
 *                 requestsByDay:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       date:
 *                         type: string
 *                         format: date
 *                       count:
 *                         type: integer
 *                   description: Requisições agrupadas por dia
 *                 requestsByEndpoint:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       endpoint:
 *                         type: string
 *                       count:
 *                         type: integer
 *                   description: Requisições agrupadas por endpoint
 *                 requestsByStatus:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       status:
 *                         type: integer
 *                       count:
 *                         type: integer
 *                   description: Requisições agrupadas por status HTTP
 *             example:
 *               totalRequests: 1250
 *               successfulRequests: 1180
 *               failedRequests: 70
 *               averageResponseTime: 245
 *               requestsByDay:
 *                 - date: "2024-01-15"
 *                   count: 45
 *                 - date: "2024-01-16"
 *                   count: 52
 *               requestsByEndpoint:
 *                 - endpoint: "/api/clientes"
 *                   count: 450
 *                 - endpoint: "/api/oportunidades"
 *                   count: 380
 *               requestsByStatus:
 *                 - status: 200
 *                   count: 1050
 *                 - status: 404
 *                   count: 45
 *                 - status: 500
 *                   count: 25
 *       401:
 *         description: Não autorizado
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       403:
 *         description: Permissão insuficiente
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       404:
 *         description: Chave de API não encontrada
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       500:
 *         description: Erro interno do servidor
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */

interface RouteParams {
  params: {
    id: string;
  };
}

// GET - Obter estatísticas da chave de API
export async function GET(
  request: NextRequest,
  { params }: RouteParams
) {
  try {
    // Valida autenticação
    const authResult = await ApiMiddleware.validateApiKey(request);
    if (!authResult.valid) {
      return NextResponse.json(
        { error: authResult.error },
        { status: 401 }
      );
    }

    // Verifica permissões
    if (!ApiMiddleware.hasPermission(authResult.apiKey!, 'admin', 'GET')) {
      return NextResponse.json(
        { error: 'Permissão insuficiente' },
        { status: 403 }
      );
    }

    const { id } = params;
    const { searchParams } = new URL(request.url);
    const days = parseInt(searchParams.get('days') || '30');

    // Valida o parâmetro days
    if (days < 1 || days > 365) {
      return NextResponse.json(
        { error: 'O parâmetro days deve estar entre 1 e 365' },
        { status: 400 }
      );
    }
    
    // Verifica se a chave existe
    const existingKey = await ApiKeyManager.getApiKey(id);
    if (!existingKey) {
      return NextResponse.json(
        { error: 'Chave de API não encontrada' },
        { status: 404 }
      );
    }

    const stats = await ApiKeyManager.getApiKeyStats(id, days);
    
    return NextResponse.json(stats, { status: 200 });
  } catch (error) {
    console.error('Erro ao obter estatísticas da chave de API:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}
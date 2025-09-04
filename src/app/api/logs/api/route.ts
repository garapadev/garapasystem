import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

/**
 * @swagger
 * /api/logs/api:
 *   get:
 *     summary: Lista logs de uso da API
 *     tags: [Logs]
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *         description: Número da página
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 50
 *           maximum: 100
 *         description: Número de registros por página
 *       - in: query
 *         name: apiKeyId
 *         schema:
 *           type: string
 *         description: Filtrar por ID da chave de API
 *       - in: query
 *         name: endpoint
 *         schema:
 *           type: string
 *         description: Filtrar por endpoint
 *       - in: query
 *         name: method
 *         schema:
 *           type: string
 *           enum: [GET, POST, PUT, DELETE, PATCH]
 *         description: Filtrar por método HTTP
 *       - in: query
 *         name: status
 *         schema:
 *           type: integer
 *         description: Filtrar por status HTTP
 *       - in: query
 *         name: dateFrom
 *         schema:
 *           type: string
 *           format: date
 *         description: Data inicial (YYYY-MM-DD)
 *       - in: query
 *         name: dateTo
 *         schema:
 *           type: string
 *           format: date
 *         description: Data final (YYYY-MM-DD)
 *     responses:
 *       200:
 *         description: Lista de logs de API
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 logs:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       id:
 *                         type: string
 *                       apiKeyId:
 *                         type: string
 *                       endpoint:
 *                         type: string
 *                       method:
 *                         type: string
 *                       status:
 *                         type: integer
 *                       tempoResposta:
 *                         type: integer
 *                       ip:
 *                         type: string
 *                       userAgent:
 *                         type: string
 *                       createdAt:
 *                         type: string
 *                         format: date-time
 *                       apiKey:
 *                         type: object
 *                         properties:
 *                           nome:
 *                             type: string
 *                 pagination:
 *                   type: object
 *                   properties:
 *                     page:
 *                       type: integer
 *                     limit:
 *                       type: integer
 *                     total:
 *                       type: integer
 *                     pages:
 *                       type: integer
 */

// GET - Listar logs de API
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    
    const page = parseInt(searchParams.get('page') || '1');
    const limit = Math.min(parseInt(searchParams.get('limit') || '50'), 100);
    const apiKeyId = searchParams.get('apiKeyId');
    const endpoint = searchParams.get('endpoint');
    const method = searchParams.get('method');
    const status = searchParams.get('status');
    const dateFrom = searchParams.get('dateFrom');
    const dateTo = searchParams.get('dateTo');

    const skip = (page - 1) * limit;

    // Construir filtros
    const where: any = {};

    if (apiKeyId) {
      where.apiKeyId = apiKeyId;
    }

    if (endpoint) {
      where.endpoint = {
        contains: endpoint,
        mode: 'insensitive'
      };
    }

    if (method) {
      where.method = method;
    }

    if (status) {
      where.statusCode = parseInt(status);
    }

    if (dateFrom || dateTo) {
      where.createdAt = {};
      if (dateFrom) {
        where.createdAt.gte = new Date(dateFrom);
      }
      if (dateTo) {
        const endDate = new Date(dateTo);
        endDate.setHours(23, 59, 59, 999);
        where.createdAt.lte = endDate;
      }
    }

    // Buscar logs
    const [logs, total] = await Promise.all([
      db.apiLog.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          apiKey: {
            select: {
              nome: true
            }
          }
        }
      }),
      db.apiLog.count({ where })
    ]);

    const pages = Math.ceil(total / limit);

    return NextResponse.json({
      logs,
      pagination: {
        page,
        limit,
        total,
        pages
      }
    });
  } catch (error) {
    console.error('Erro ao buscar logs de API:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}
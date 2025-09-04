import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

/**
 * @swagger
 * /api/logs/webhooks:
 *   get:
 *     summary: Lista logs de webhooks
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
 *         name: webhookConfigId
 *         schema:
 *           type: string
 *         description: Filtrar por ID da configuração de webhook
 *       - in: query
 *         name: evento
 *         schema:
 *           type: string
 *         description: Filtrar por tipo de evento
 *       - in: query
 *         name: sucesso
 *         schema:
 *           type: boolean
 *         description: Filtrar por sucesso/falha
 *       - in: query
 *         name: teste
 *         schema:
 *           type: boolean
 *         description: Filtrar por logs de teste
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
 *         description: Lista de logs de webhooks
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
 *                       webhookConfigId:
 *                         type: string
 *                       evento:
 *                         type: string
 *                       url:
 *                         type: string
 *                       status:
 *                         type: integer
 *                       response:
 *                         type: string
 *                       tempoResposta:
 *                         type: integer
 *                       sucesso:
 *                         type: boolean
 *                       teste:
 *                         type: boolean
 *                       createdAt:
 *                         type: string
 *                         format: date-time
 *                       webhookConfig:
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

// GET - Listar logs de webhooks
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    
    const page = parseInt(searchParams.get('page') || '1');
    const limit = Math.min(parseInt(searchParams.get('limit') || '50'), 100);
    const webhookConfigId = searchParams.get('webhookConfigId');
    const evento = searchParams.get('evento');
    const sucesso = searchParams.get('sucesso');
    const teste = searchParams.get('teste');
    const dateFrom = searchParams.get('dateFrom');
    const dateTo = searchParams.get('dateTo');

    const skip = (page - 1) * limit;

    // Construir filtros
    const where: any = {};

    if (webhookConfigId) {
      where.webhookConfigId = webhookConfigId;
    }

    if (evento) {
      where.evento = evento;
    }

    if (sucesso !== null && sucesso !== undefined) {
      where.sucesso = sucesso === 'true';
    }

    if (teste !== null && teste !== undefined) {
      where.teste = teste === 'true';
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
      db.webhookLog.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          webhookConfig: {
            select: {
              nome: true
            }
          }
        }
      }),
      db.webhookLog.count({ where })
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
    console.error('Erro ao buscar logs de webhooks:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}
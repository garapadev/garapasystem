import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

/**
 * @swagger
 * /api/helpdesk/tickets/{id}/logs:
 *   get:
 *     summary: Busca histórico de alterações de um ticket
 *     tags: [Helpdesk]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID do ticket
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
 *         name: tipo
 *         schema:
 *           type: string
 *           enum: [CRIACAO, STATUS_ALTERADO, PRIORIDADE_ALTERADA, RESPONSAVEL_ALTERADO, ASSUNTO_ALTERADO, DESCRICAO_ALTERADA, MENSAGEM_ADICIONADA, ANEXO_ADICIONADO, FECHAMENTO, REABERTURA]
 *         description: Filtrar por tipo de alteração
 *     responses:
 *       200:
 *         description: Lista de logs do ticket
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
 *                       tipo:
 *                         type: string
 *                       descricao:
 *                         type: string
 *                       valorAnterior:
 *                         type: string
 *                       valorNovo:
 *                         type: string
 *                       autorNome:
 *                         type: string
 *                       autorEmail:
 *                         type: string
 *                       createdAt:
 *                         type: string
 *                         format: date-time
 *                       autor:
 *                         type: object
 *                         properties:
 *                           id:
 *                             type: string
 *                           nome:
 *                             type: string
 *                           email:
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
 *       404:
 *         description: Ticket não encontrado
 *       500:
 *         description: Erro interno do servidor
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = Math.min(parseInt(searchParams.get('limit') || '50'), 100);
    const tipo = searchParams.get('tipo');
    const skip = (page - 1) * limit;

    // Verificar se o ticket existe
    const ticket = await db.helpdeskTicket.findUnique({
      where: { id: params.id },
      select: { id: true }
    });

    if (!ticket) {
      return NextResponse.json(
        { error: 'Ticket não encontrado' },
        { status: 404 }
      );
    }

    // Construir filtros
    const where: any = {
      ticketId: params.id
    };

    if (tipo) {
      where.tipo = tipo;
    }

    // Buscar logs com paginação
    const [logs, total] = await Promise.all([
      db.helpdeskTicketLog.findMany({
        where,
        include: {
          autor: {
            select: {
              id: true,
              nome: true,
              email: true
            }
          }
        },
        orderBy: {
          createdAt: 'desc'
        },
        skip,
        take: limit
      }),
      db.helpdeskTicketLog.count({ where })
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
    console.error('Erro ao buscar logs do ticket:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}

/**
 * @swagger
 * /api/helpdesk/tickets/{id}/logs:
 *   post:
 *     summary: Cria um novo log de alteração para o ticket
 *     tags: [Helpdesk]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID do ticket
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - tipo
 *               - descricao
 *               - autorNome
 *               - autorEmail
 *             properties:
 *               tipo:
 *                 type: string
 *                 enum: [CRIACAO, STATUS_ALTERADO, PRIORIDADE_ALTERADA, RESPONSAVEL_ALTERADO, ASSUNTO_ALTERADO, DESCRICAO_ALTERADA, MENSAGEM_ADICIONADA, ANEXO_ADICIONADO, FECHAMENTO, REABERTURA]
 *               descricao:
 *                 type: string
 *               valorAnterior:
 *                 type: string
 *               valorNovo:
 *                 type: string
 *               autorNome:
 *                 type: string
 *               autorEmail:
 *                 type: string
 *               autorId:
 *                 type: string
 *     responses:
 *       201:
 *         description: Log criado com sucesso
 *       400:
 *         description: Dados inválidos
 *       404:
 *         description: Ticket não encontrado
 *       500:
 *         description: Erro interno do servidor
 */
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json();
    const {
      tipo,
      descricao,
      valorAnterior,
      valorNovo,
      autorNome,
      autorEmail,
      autorId
    } = body;

    // Validar campos obrigatórios
    if (!tipo || !descricao || !autorNome || !autorEmail) {
      return NextResponse.json(
        { error: 'Campos obrigatórios: tipo, descricao, autorNome, autorEmail' },
        { status: 400 }
      );
    }

    // Verificar se o ticket existe
    const ticket = await db.helpdeskTicket.findUnique({
      where: { id: params.id },
      select: { id: true }
    });

    if (!ticket) {
      return NextResponse.json(
        { error: 'Ticket não encontrado' },
        { status: 404 }
      );
    }

    // Criar o log
    const log = await db.helpdeskTicketLog.create({
      data: {
        ticketId: params.id,
        tipo,
        descricao,
        valorAnterior,
        valorNovo,
        autorNome,
        autorEmail,
        autorId
      },
      include: {
        autor: {
          select: {
            id: true,
            nome: true,
            email: true
          }
        }
      }
    });

    return NextResponse.json(log, { status: 201 });

  } catch (error) {
    console.error('Erro ao criar log do ticket:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}
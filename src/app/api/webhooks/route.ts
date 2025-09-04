import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { ApiMiddleware } from '@/lib/api-middleware';
import { z } from 'zod';

/**
 * @swagger
 * /api/webhooks:
 *   get:
 *     tags:
 *       - Webhooks
 *     summary: Lista todas as configurações de webhook
 *     description: Retorna uma lista paginada de todas as configurações de webhook
 *     security:
 *       - ApiKeyAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         required: false
 *         schema:
 *           type: integer
 *           default: 1
 *           minimum: 1
 *         description: Número da página
 *       - in: query
 *         name: limit
 *         required: false
 *         schema:
 *           type: integer
 *           default: 10
 *           minimum: 1
 *           maximum: 100
 *         description: Número de itens por página
 *       - in: query
 *         name: ativo
 *         required: false
 *         schema:
 *           type: boolean
 *         description: Filtrar por status ativo/inativo
 *       - in: query
 *         name: evento
 *         required: false
 *         schema:
 *           type: string
 *         description: Filtrar por tipo de evento
 *     responses:
 *       200:
 *         description: Lista de webhooks obtida com sucesso
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 webhooks:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/WebhookConfig'
 *                 pagination:
 *                   type: object
 *                   properties:
 *                     page:
 *                       type: integer
 *                     limit:
 *                       type: integer
 *                     total:
 *                       type: integer
 *                     totalPages:
 *                       type: integer
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
 *       500:
 *         description: Erro interno do servidor
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *   post:
 *     tags:
 *       - Webhooks
 *     summary: Cria uma nova configuração de webhook
 *     description: Cria uma nova configuração de webhook com os dados fornecidos
 *     security:
 *       - ApiKeyAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - nome
 *               - url
               - eventos
             properties:
               nome:
                 type: string
                 minLength: 1
                 maxLength: 100
                 description: Nome identificador do webhook
               url:
                 type: string
                 format: uri
                 description: URL de destino do webhook
               eventos:
                 type: array
                 items:
                   type: string
                 minItems: 1
                 description: Lista de eventos que disparam o webhook
               descricao:
                 type: string
                 maxLength: 500
                 description: Descrição opcional do webhook
               headers:
                 type: object
                 additionalProperties:
                   type: string
                 description: Headers customizados para envio
               secret:
                 type: string
                 minLength: 8
                 description: Chave secreta para assinatura HMAC
               timeout:
                 type: integer
                 minimum: 1000
                 maximum: 30000
                 default: 5000
                 description: Timeout em milissegundos
               ativo:
                 type: boolean
                 default: true
                 description: Status ativo/inativo
     responses:
       201:
         description: Webhook criado com sucesso
         content:
           application/json:
             schema:
               $ref: '#/components/schemas/WebhookConfig'
       400:
         description: Dados inválidos
         content:
           application/json:
             schema:
               $ref: '#/components/schemas/Error'
       401:
         description: Não autorizado
         content:
           application/json:
             schema:
               $ref: '#/components/schemas/Error'
       403:
         description: Permissão insuficiente
         content:
           application/json:
             schema:
               $ref: '#/components/schemas/Error'
       500:
         description: Erro interno do servidor
         content:
           application/json:
             schema:
               $ref: '#/components/schemas/Error'
 */

// Schema de validação para criação de webhook
const createWebhookSchema = z.object({
  nome: z.string().min(1, 'Nome é obrigatório').max(100, 'Nome deve ter no máximo 100 caracteres'),
  url: z.string().url('URL deve ser válida'),
  eventos: z.array(z.string()).min(1, 'Pelo menos um evento deve ser selecionado'),
  descricao: z.string().max(500, 'Descrição deve ter no máximo 500 caracteres').optional(),
  headers: z.record(z.string()).optional(),
  secret: z.string().min(8, 'Secret deve ter pelo menos 8 caracteres').optional(),
  timeout: z.number().min(1000).max(30000).default(5000),
  ativo: z.boolean().default(true)
});

// GET - Listar configurações de webhook
export async function GET(request: NextRequest) {
  try {
    // Validar autenticação (sessão ou API Key)
    const authResult = await ApiMiddleware.validateAuth(request);
    if (!authResult.valid) {
      return ApiMiddleware.createErrorResponse(authResult.error || 'Autenticação necessária', 401);
    }

    // Verificar permissões
    if (!ApiMiddleware.hasAuthPermission(authResult, '/api/webhooks', 'GET')) {
      return ApiMiddleware.createErrorResponse('Permissão insuficiente', 403);
    }

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = Math.min(parseInt(searchParams.get('limit') || '10'), 100);
    const ativo = searchParams.get('ativo');
    const evento = searchParams.get('evento');

    // Construir filtros
    const where: any = {};
    
    if (ativo !== null) {
      where.ativo = ativo === 'true';
    }
    
    if (evento) {
      where.eventos = {
        has: evento
      };
    }

    // Buscar webhooks com paginação
    const [webhooks, total] = await Promise.all([
      db.webhookConfig.findMany({
        where,
        orderBy: {
          createdAt: 'desc'
        },
        skip: (page - 1) * limit,
        take: limit,
        select: {
          id: true,
          nome: true,
          url: true,
          evento: true,
          ativo: true,
          secret: true,
          headers: true,
          ultimoEnvio: true,
          createdAt: true,
          updatedAt: true,
        },
      }),
      db.webhookConfig.count({ where })
    ]);

    const totalPages = Math.ceil(total / limit);

    return NextResponse.json({
      webhooks,
      pagination: {
        page,
        limit,
        total,
        totalPages
      }
    }, { status: 200 });
  } catch (error) {
    console.error('Erro ao buscar configurações de webhook:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}

// POST - Criar nova configuração de webhook
export async function POST(request: NextRequest) {
  try {
    // Validar autenticação (sessão ou API Key)
    const authResult = await ApiMiddleware.validateAuth(request);
    if (!authResult.valid) {
      return ApiMiddleware.createErrorResponse(authResult.error || 'Autenticação necessária', 401);
    }

    // Verificar permissões
    if (!ApiMiddleware.hasAuthPermission(authResult, '/api/webhooks', 'POST')) {
      return ApiMiddleware.createErrorResponse('Permissão insuficiente', 403);
    }

    const body = await request.json();
    
    // Valida dados de entrada
    const validationResult = createWebhookSchema.safeParse(body);
    if (!validationResult.success) {
      return NextResponse.json(
        { 
           error: 'Dados inválidos',
           details: validationResult.error.issues
         },
        { status: 400 }
      );
    }

    const webhookData = validationResult.data;
    
    const webhook = await db.webhookConfig.create({
      data: {
        nome: webhookData.nome,
        url: webhookData.url,
        eventos: webhookData.eventos,
        descricao: webhookData.descricao,
        secret: webhookData.secret,
        headers: webhookData.headers ? JSON.stringify(webhookData.headers) : null,
        timeout: webhookData.timeout,
        ativo: webhookData.ativo,
      },
    });

    return NextResponse.json(webhook, { status: 201 });
  } catch (error) {
    console.error('Erro ao criar configuração de webhook:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}
import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { ApiMiddleware } from '@/lib/api-middleware';
import { z } from 'zod';

/**
 * @swagger
 * /api/webhooks/{id}:
 *   get:
 *     summary: Busca uma configuração de webhook específica
 *     tags: [Webhooks]
 *     security:
 *       - ApiKeyAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID da configuração de webhook
 *     responses:
 *       200:
 *         description: Configuração de webhook encontrada
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 id:
 *                   type: string
 *                 nome:
 *                   type: string
 *                 url:
 *                   type: string
 *                 eventos:
 *                   type: array
 *                   items:
 *                     type: string
 *                 ativo:
 *                   type: boolean
 *                 secret:
 *                   type: string
 *                 headers:
 *                   type: object
 *                 descricao:
 *                   type: string
 *                 timeout:
 *                   type: number
 *                 ultimoEnvio:
 *                   type: string
 *                   format: date-time
 *                 createdAt:
 *                   type: string
 *                   format: date-time
 *                 updatedAt:
 *                   type: string
 *                   format: date-time
 *       401:
 *         description: Não autorizado - chave de API inválida
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
 *         description: Configuração de webhook não encontrada
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
 *   put:
 *     summary: Atualiza uma configuração de webhook
 *     tags: [Webhooks]
 *     security:
 *       - ApiKeyAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID da configuração de webhook
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - nome
 *               - url
 *               - eventos
 *             properties:
 *               nome:
 *                 type: string
 *                 minLength: 1
 *                 maxLength: 100
 *                 description: Nome da configuração de webhook
 *               url:
 *                 type: string
 *                 format: uri
 *                 description: URL de destino do webhook
 *               eventos:
 *                 type: array
 *                 items:
 *                   type: string
 *                 minItems: 1
 *                 description: Lista de eventos que acionam o webhook
 *               ativo:
 *                 type: boolean
 *                 default: true
 *                 description: Status ativo/inativo do webhook
 *               secret:
 *                 type: string
 *                 description: Chave secreta para validação do webhook
 *               headers:
 *                 type: object
 *                 additionalProperties:
 *                   type: string
 *                 description: Headers customizados para o webhook
 *               descricao:
 *                 type: string
 *                 description: Descrição opcional do webhook
 *               timeout:
 *                 type: number
 *                 minimum: 1000
 *                 maximum: 30000
 *                 default: 5000
 *                 description: Timeout em milissegundos para o webhook
 *     responses:
 *       200:
 *         description: Configuração de webhook atualizada com sucesso
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/WebhookConfig'
 *       400:
 *         description: Dados inválidos
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       401:
 *         description: Não autorizado - chave de API inválida
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
 *         description: Configuração de webhook não encontrada
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
 *   delete:
 *     summary: Remove uma configuração de webhook
 *     tags: [Webhooks]
 *     security:
 *       - ApiKeyAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID da configuração de webhook
 *     responses:
 *       200:
 *         description: Configuração de webhook removida com sucesso
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Configuração de webhook removida com sucesso
 *       401:
 *         description: Não autorizado - chave de API inválida
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
 *         description: Configuração de webhook não encontrada
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

// GET - Buscar configuração de webhook específica
export async function GET(request: NextRequest, { params }: RouteParams) {
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

    const webhook = await db.webhookConfig.findUnique({
      where: {
        id: params.id
      }
    });

    if (!webhook) {
      return NextResponse.json(
        { error: 'Configuração de webhook não encontrada' },
        { status: 404 }
      );
    }

    return NextResponse.json(webhook);
  } catch (error) {
    console.error('Erro ao buscar configuração de webhook:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}

const updateWebhookSchema = z.object({
  nome: z.string().min(1, 'Nome é obrigatório').max(100),
  url: z.string().url('URL deve ser válida'),
  eventos: z.array(z.string()).min(1, 'Pelo menos um evento é obrigatório'),
  ativo: z.boolean().optional().default(true),
  secret: z.string().optional(),
  headers: z.record(z.string()).optional().default({}),
  descricao: z.string().optional(),
  timeout: z.number().min(1000).max(30000).optional().default(5000)
});

// PUT - Atualizar configuração de webhook
export async function PUT(request: NextRequest, { params }: RouteParams) {
  try {
    // Validar autenticação (sessão ou API Key)
    const authResult = await ApiMiddleware.validateAuth(request);
    if (!authResult.valid) {
      return ApiMiddleware.createErrorResponse(authResult.error || 'Autenticação necessária', 401);
    }

    // Verificar permissões
    if (!ApiMiddleware.hasAuthPermission(authResult, '/api/webhooks', 'PUT')) {
      return ApiMiddleware.createErrorResponse('Permissão insuficiente', 403);
    }

    const body = await request.json();

    // Validação com Zod
    const validationResult = updateWebhookSchema.safeParse(body);
    if (!validationResult.success) {
      return NextResponse.json(
        { 
          error: 'Dados inválidos',
          details: validationResult.error.issues
        },
        { status: 400 }
      );
    }

    // Verifica se o webhook existe
    const existingWebhook = await db.webhookConfig.findUnique({
      where: { id: params.id }
    });

    if (!existingWebhook) {
      return NextResponse.json(
        { error: 'Configuração de webhook não encontrada' },
        { status: 404 }
      );
    }

    const validatedData = validationResult.data;

    // Atualiza o webhook
    const updatedWebhook = await db.webhookConfig.update({
      where: { id: params.id },
      data: {
        nome: validatedData.nome,
        url: validatedData.url,
        eventos: validatedData.eventos,
        ativo: validatedData.ativo,
        secret: validatedData.secret,
        headers: validatedData.headers,
        descricao: validatedData.descricao,
        timeout: validatedData.timeout,
        updatedAt: new Date()
      }
    });

    return NextResponse.json(updatedWebhook);
  } catch (error) {
    console.error('Erro ao atualizar configuração de webhook:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}

// DELETE - Remover configuração de webhook
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    // Validar autenticação (sessão ou API Key)
    const authResult = await ApiMiddleware.validateAuth(request);
    if (!authResult.valid) {
      return ApiMiddleware.createErrorResponse(authResult.error || 'Autenticação necessária', 401);
    }

    // Verificar permissões
    if (!ApiMiddleware.hasAuthPermission(authResult, '/api/webhooks', 'DELETE')) {
      return ApiMiddleware.createErrorResponse('Permissão insuficiente', 403);
    }

    // Verifica se o webhook existe
    const existingWebhook = await db.webhookConfig.findUnique({
      where: { id: params.id }
    });

    if (!existingWebhook) {
      return NextResponse.json(
        { error: 'Configuração de webhook não encontrada' },
        { status: 404 }
      );
    }

    // Remove o webhook
    await db.webhookConfig.delete({
      where: { id: params.id }
    });

    return NextResponse.json(
      { message: 'Configuração de webhook removida com sucesso' },
      { status: 200 }
    );
  } catch (error) {
    console.error('Erro ao remover configuração de webhook:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}
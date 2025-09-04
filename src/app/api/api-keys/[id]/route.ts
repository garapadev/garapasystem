import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { ApiMiddleware } from '@/lib/api-middleware';
import { ApiKeyManager } from '@/lib/api-key-manager';

/**
 * @swagger
 * /api/api-keys/{id}:
 *   get:
 *     summary: Busca uma chave de API específica
 *     tags: [API Keys]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID da chave de API
 *     responses:
 *       200:
 *         description: Chave de API encontrada
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 id:
 *                   type: string
 *                 nome:
 *                   type: string
 *                 chave:
 *                   type: string
 *                 ativo:
 *                   type: boolean
 *                 ultimoUso:
 *                   type: string
 *                   format: date-time
 *                 expiresAt:
 *                   type: string
 *                   format: date-time
 *                 createdAt:
 *                   type: string
 *                   format: date-time
 *       404:
 *         description: Chave de API não encontrada
 *   put:
 *     summary: Atualiza uma chave de API
 *     tags: [API Keys]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID da chave de API
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               nome:
 *                 type: string
 *               ativo:
 *                 type: boolean
 *               expiresAt:
 *                 type: string
 *                 format: date-time
 *               permissoes:
 *                 type: object
 *     responses:
 *       200:
 *         description: Chave de API atualizada com sucesso
 *       404:
 *         description: Chave de API não encontrada
 *   delete:
 *     summary: Remove uma chave de API
 *     tags: [API Keys]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID da chave de API
 *     responses:
 *       200:
 *         description: Chave de API removida com sucesso
 *       404:
 *         description: Chave de API não encontrada
 */

interface RouteParams {
  params: {
    id: string;
  };
}

// GET - Buscar chave de API específica
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    // Validar autenticação (sessão ou API Key)
    const authResult = await ApiMiddleware.validateAuth(request);
    if (!authResult.valid) {
      return ApiMiddleware.createErrorResponse(authResult.error || 'Autenticação necessária', 401);
    }

    // Verificar permissões
    if (!ApiMiddleware.hasAuthPermission(authResult, '/api/api-keys', 'GET')) {
      return ApiMiddleware.createErrorResponse('Permissão insuficiente', 403);
    }

    const { id } = params;
    const apiKey = await ApiKeyManager.getApiKey(id);

    if (!apiKey) {
      return NextResponse.json(
        { error: 'Chave de API não encontrada' },
        { status: 404 }
      );
    }

    return NextResponse.json(apiKey);
  } catch (error) {
    console.error('Erro ao buscar chave de API:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}

// PUT - Atualizar chave de API
export async function PUT(request: NextRequest, { params }: RouteParams) {
  try {
    // Validar autenticação (sessão ou API Key)
    const authResult = await ApiMiddleware.validateAuth(request);
    if (!authResult.valid) {
      return ApiMiddleware.createErrorResponse(authResult.error || 'Autenticação necessária', 401);
    }

    // Verificar permissões
    if (!ApiMiddleware.hasAuthPermission(authResult, '/api/api-keys', 'PUT')) {
      return ApiMiddleware.createErrorResponse('Permissão insuficiente', 403);
    }

    const { id } = params;
    const body = await request.json();
    const { nome, permissoes, expiresAt, limiteTaxa, descricao } = body;

    const updates: any = {};
    if (nome !== undefined) updates.nome = nome;
    if (permissoes !== undefined) updates.permissoes = permissoes;
    if (expiresAt !== undefined) updates.expiresAt = expiresAt ? new Date(expiresAt) : undefined;
    if (limiteTaxa !== undefined) updates.limiteTaxa = limiteTaxa;
    if (descricao !== undefined) updates.descricao = descricao;

    const apiKey = await ApiKeyManager.updateApiKey(id, updates);
    return NextResponse.json(apiKey);
  } catch (error) {
    console.error('Erro ao atualizar chave de API:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}

// DELETE - Remover chave de API
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    // Validar autenticação (sessão ou API Key)
    const authResult = await ApiMiddleware.validateAuth(request);
    if (!authResult.valid) {
      return ApiMiddleware.createErrorResponse(authResult.error || 'Autenticação necessária', 401);
    }

    // Verificar permissões
    if (!ApiMiddleware.hasAuthPermission(authResult, '/api/api-keys', 'DELETE')) {
      return ApiMiddleware.createErrorResponse('Permissão insuficiente', 403);
    }

    const { id } = params;
    await ApiKeyManager.deleteApiKey(id);

    return NextResponse.json(
      { message: 'Chave de API removida com sucesso' },
      { status: 200 }
    );
  } catch (error) {
    console.error('Erro ao remover chave de API:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}
import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { ApiMiddleware } from '@/lib/api-middleware';
import { ApiKeyManager } from '@/lib/api-key-manager';
import { randomBytes } from 'crypto';

/**
 * @swagger
 * /api/api-keys:
 *   get:
 *     summary: Lista todas as chaves de API
 *     tags: [API Keys]
 *     responses:
 *       200:
 *         description: Lista de chaves de API
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   id:
 *                     type: string
 *                   nome:
 *                     type: string
 *                   chave:
 *                     type: string
 *                   ativo:
 *                     type: boolean
 *                   ultimoUso:
 *                     type: string
 *                     format: date-time
 *                   expiresAt:
 *                     type: string
 *                     format: date-time
 *                   createdAt:
 *                     type: string
 *                     format: date-time
 *   post:
 *     summary: Cria uma nova chave de API
 *     tags: [API Keys]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - nome
 *             properties:
 *               nome:
 *                 type: string
 *                 description: Nome descritivo da chave
 *               expiresAt:
 *                 type: string
 *                 format: date-time
 *                 description: Data de expiração (opcional)
 *               permissoes:
 *                 type: object
 *                 description: Permissões específicas da chave
 *     responses:
 *       201:
 *         description: Chave de API criada com sucesso
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
 *                 createdAt:
 *                   type: string
 *                   format: date-time
 */

// GET - Listar chaves de API
export async function GET(request: NextRequest) {
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

    const apiKeys = await ApiKeyManager.listApiKeys();
    return NextResponse.json(apiKeys);
  } catch (error) {
    console.error('Erro ao buscar chaves de API:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}

// POST - Criar nova chave de API
export async function POST(request: NextRequest) {
  try {
    // TODO: Temporariamente desabilitado para testes
    // Validar autenticação (sessão ou API Key)
    // const authResult = await ApiMiddleware.validateAuth(request);
    // if (!authResult.valid) {
    //   return ApiMiddleware.createErrorResponse(authResult.error || 'Autenticação necessária', 401);
    // }

    // Verificar permissões
    // if (!ApiMiddleware.hasAuthPermission(authResult, '/api/api-keys', 'POST')) {
    //   return ApiMiddleware.createErrorResponse('Permissão insuficiente', 403);
    // }

    const body = await request.json();
    const { nome, permissoes, expiresAt, limiteTaxa, descricao } = body;

    // Validações
    if (!nome) {
      return NextResponse.json(
        { error: 'Nome é obrigatório' },
        { status: 400 }
      );
    }

    const apiKey = await ApiKeyManager.createApiKey({
      nome,
      permissoes,
      expiresAt: expiresAt ? new Date(expiresAt) : undefined,
      limiteTaxa,
      descricao
    });

    return NextResponse.json(apiKey, { status: 201 });
  } catch (error) {
    console.error('Erro ao criar chave de API:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}
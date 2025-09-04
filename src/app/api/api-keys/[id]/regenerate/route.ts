import { NextRequest, NextResponse } from 'next/server';
import { ApiMiddleware } from '@/lib/api-middleware';
import { ApiKeyManager } from '@/lib/api-key-manager';

/**
 * @swagger
 * /api/api-keys/{id}/regenerate:
 *   post:
 *     tags:
 *       - API Keys
 *     summary: Regenera uma chave de API
 *     description: Gera uma nova chave para uma API Key existente, mantendo todas as outras configurações
 *     security:
 *       - ApiKeyAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID da chave de API
 *     responses:
 *       200:
 *         description: Chave regenerada com sucesso
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
 *                   description: Nova chave gerada (visível apenas nesta resposta)
 *                 permissoes:
 *                   type: array
 *                   items:
 *                     type: string
 *                 ativo:
 *                   type: boolean
 *                 expiresAt:
 *                   type: string
 *                   format: date-time
 *                   nullable: true
 *                 limiteTaxa:
 *                   type: integer
 *                   nullable: true
 *                 descricao:
 *                   type: string
 *                   nullable: true
 *                 createdAt:
 *                   type: string
 *                   format: date-time
 *                 updatedAt:
 *                   type: string
 *                   format: date-time
 *             example:
 *               id: "clm123abc"
 *               nome: "API Key Produção"
 *               chave: "sk_1234567890abcdef"
 *               permissoes: ["clientes.read", "clientes.write"]
 *               ativo: true
 *               expiresAt: null
 *               limiteTaxa: 1000
 *               descricao: "Chave para ambiente de produção"
 *               createdAt: "2024-01-15T10:30:00Z"
 *               updatedAt: "2024-01-15T14:45:00Z"
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

// POST - Regenerar chave de API
export async function POST(
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
    if (!ApiMiddleware.hasPermission(authResult.apiKey!, 'admin', 'POST')) {
      return NextResponse.json(
        { error: 'Permissão insuficiente' },
        { status: 403 }
      );
    }

    const { id } = params;
    
    // Verifica se a chave existe antes de regenerar
    const existingKey = await ApiKeyManager.getApiKey(id);
    if (!existingKey) {
      return NextResponse.json(
        { error: 'Chave de API não encontrada' },
        { status: 404 }
      );
    }

    const regeneratedKey = await ApiKeyManager.regenerateApiKey(id);
    
    return NextResponse.json(regeneratedKey, { status: 200 });
  } catch (error) {
    console.error('Erro ao regenerar chave de API:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}
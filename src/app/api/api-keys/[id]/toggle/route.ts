import { NextRequest, NextResponse } from 'next/server';
import { ApiMiddleware } from '@/lib/api-middleware';
import { ApiKeyManager } from '@/lib/api-key-manager';

/**
 * @swagger
 * /api/api-keys/{id}/toggle:
 *   post:
 *     tags:
 *       - API Keys
 *     summary: Alterna o status de uma chave de API
 *     description: Ativa ou desativa uma chave de API (alterna entre ativo/inativo)
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
 *         description: Status alterado com sucesso
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 id:
 *                   type: string
 *                 ativo:
 *                   type: boolean
 *                   description: Novo status da chave
 *                 message:
 *                   type: string
 *                   description: Mensagem de confirmação
 *             example:
 *               id: "clm123abc"
 *               ativo: false
 *               message: "Chave de API desativada com sucesso"
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

// POST - Alternar status da chave de API
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
    
    // Verifica se a chave existe antes de alterar
    const existingKey = await ApiKeyManager.getApiKey(id);
    if (!existingKey) {
      return NextResponse.json(
        { error: 'Chave de API não encontrada' },
        { status: 404 }
      );
    }

    const newStatus = await ApiKeyManager.toggleApiKey(id);
    
    return NextResponse.json({
      id,
      ativo: newStatus,
      message: newStatus 
        ? 'Chave de API ativada com sucesso' 
        : 'Chave de API desativada com sucesso'
    }, { status: 200 });
  } catch (error) {
    console.error('Erro ao alternar status da chave de API:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}
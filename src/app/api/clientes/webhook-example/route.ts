import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { triggerWebhook, WEBHOOK_EVENTS } from '@/lib/webhook';
import { ApiMiddleware } from '@/lib/api-middleware';

/**
 * @swagger
 * /api/clientes/webhook-example:
 *   post:
 *     summary: Exemplo de criação de cliente com webhook
 *     description: Demonstra como integrar webhooks ao criar um cliente
 *     tags: [Clientes, Webhooks]
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
 *               - email
 *             properties:
 *               nome:
 *                 type: string
 *                 description: Nome do cliente
 *               email:
 *                 type: string
 *                 format: email
 *                 description: Email do cliente
 *               telefone:
 *                 type: string
 *                 description: Telefone do cliente
 *               empresa:
 *                 type: string
 *                 description: Empresa do cliente
 *               tipo:
 *                 type: string
 *                 enum: [PESSOA_FISICA, PESSOA_JURIDICA]
 *                 description: Tipo do cliente
 *               status:
 *                 type: string
 *                 enum: [ATIVO, INATIVO, PROSPECTO]
 *                 description: Status do cliente
 *     responses:
 *       201:
 *         description: Cliente criado com sucesso
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 id:
 *                   type: string
 *                 nome:
 *                   type: string
 *                 email:
 *                   type: string
 *                 telefone:
 *                   type: string
 *                 empresa:
 *                   type: string
 *                 tipo:
 *                   type: string
 *                 status:
 *                   type: string
 *                 createdAt:
 *                   type: string
 *                   format: date-time
 *                 updatedAt:
 *                   type: string
 *                   format: date-time
 *       400:
 *         description: Dados inválidos
 *       401:
 *         description: Não autorizado
 *       403:
 *         description: Permissão insuficiente
 */
export async function POST(request: NextRequest) {
  return ApiMiddleware.handleApiRequest(request, async (req, apiKey) => {
    try {
      const body = await req.json();
      const { nome, email, telefone, empresa, tipo, status } = body;

      // Validação básica
      if (!nome || !email) {
        return NextResponse.json(
          { error: 'Nome e email são obrigatórios' },
          { status: 400 }
        );
      }

      // Verifica se o email já existe
      const existingCliente = await db.cliente.findUnique({
        where: { email }
      });

      if (existingCliente) {
        return NextResponse.json(
          { error: 'Cliente com este email já existe' },
          { status: 400 }
        );
      }

      // Cria o cliente
      const cliente = await db.cliente.create({
        data: {
          nome,
          email,
          telefone,
          empresa,
          tipo: tipo || 'PESSOA_FISICA',
          status: status || 'PROSPECTO'
        }
      });

      // Dispara webhook para cliente criado
      await triggerWebhook(WEBHOOK_EVENTS.CLIENTE_CRIADO, {
        cliente: {
          id: cliente.id,
          nome: cliente.nome,
          email: cliente.email,
          telefone: cliente.telefone,
          empresa: cliente.empresa,
          tipo: cliente.tipo,
          status: cliente.status,
          createdAt: cliente.createdAt
        },
        metadata: {
          apiKey: {
            id: apiKey.id,
            nome: apiKey.nome
          },
          timestamp: new Date().toISOString()
        }
      });

      return NextResponse.json(cliente, { status: 201 });
    } catch (error) {
      console.error('Erro ao criar cliente:', error);
      return NextResponse.json(
        { error: 'Erro interno do servidor' },
        { status: 500 }
      );
    }
  });
}

/**
 * @swagger
 * /api/clientes/webhook-example/{id}:
 *   put:
 *     summary: Exemplo de atualização de cliente com webhook
 *     description: Demonstra como integrar webhooks ao atualizar um cliente
 *     tags: [Clientes, Webhooks]
 *     security:
 *       - ApiKeyAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID do cliente
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               nome:
 *                 type: string
 *               email:
 *                 type: string
 *                 format: email
 *               telefone:
 *                 type: string
 *               empresa:
 *                 type: string
 *               tipo:
 *                 type: string
 *                 enum: [PESSOA_FISICA, PESSOA_JURIDICA]
 *               status:
 *                 type: string
 *                 enum: [ATIVO, INATIVO, PROSPECTO]
 *     responses:
 *       200:
 *         description: Cliente atualizado com sucesso
 *       400:
 *         description: Dados inválidos
 *       401:
 *         description: Não autorizado
 *       403:
 *         description: Permissão insuficiente
 *       404:
 *         description: Cliente não encontrado
 */
export async function PUT(request: NextRequest) {
  return ApiMiddleware.handleApiRequest(request, async (req, apiKey) => {
    try {
      const url = new URL(req.url);
      const id = url.pathname.split('/').slice(-1)[0];
      const body = await req.json();

      // Busca o cliente atual
      const clienteAtual = await db.cliente.findUnique({
        where: { id }
      });

      if (!clienteAtual) {
        return NextResponse.json(
          { error: 'Cliente não encontrado' },
          { status: 404 }
        );
      }

      // Atualiza o cliente
      const clienteAtualizado = await db.cliente.update({
        where: { id },
        data: body
      });

      // Identifica quais campos foram alterados
      const camposAlterados: Record<string, { anterior: any; atual: any }> = {};
      Object.keys(body).forEach(campo => {
        if (clienteAtual[campo as keyof typeof clienteAtual] !== body[campo]) {
          camposAlterados[campo] = {
            anterior: clienteAtual[campo as keyof typeof clienteAtual],
            atual: body[campo]
          };
        }
      });

      // Dispara webhook para cliente atualizado
      await triggerWebhook(WEBHOOK_EVENTS.CLIENTE_ATUALIZADO, {
        cliente: {
          id: clienteAtualizado.id,
          nome: clienteAtualizado.nome,
          email: clienteAtualizado.email,
          telefone: clienteAtualizado.telefone,
          empresa: clienteAtualizado.empresa,
          tipo: clienteAtualizado.tipo,
          status: clienteAtualizado.status,
          updatedAt: clienteAtualizado.updatedAt
        },
        alteracoes: camposAlterados,
        metadata: {
          apiKey: {
            id: apiKey.id,
            nome: apiKey.nome
          },
          timestamp: new Date().toISOString()
        }
      });

      return NextResponse.json(clienteAtualizado);
    } catch (error) {
      console.error('Erro ao atualizar cliente:', error);
      return NextResponse.json(
        { error: 'Erro interno do servidor' },
        { status: 500 }
      );
    }
  });
}

/**
 * @swagger
 * /api/clientes/webhook-example/{id}:
 *   delete:
 *     summary: Exemplo de exclusão de cliente com webhook
 *     description: Demonstra como integrar webhooks ao excluir um cliente
 *     tags: [Clientes, Webhooks]
 *     security:
 *       - ApiKeyAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID do cliente
 *     responses:
 *       200:
 *         description: Cliente excluído com sucesso
 *       401:
 *         description: Não autorizado
 *       403:
 *         description: Permissão insuficiente
 *       404:
 *         description: Cliente não encontrado
 */
export async function DELETE(request: NextRequest) {
  return ApiMiddleware.handleApiRequest(request, async (req, apiKey) => {
    try {
      const url = new URL(req.url);
      const id = url.pathname.split('/').slice(-1)[0];

      // Busca o cliente antes de excluir
      const cliente = await db.cliente.findUnique({
        where: { id }
      });

      if (!cliente) {
        return NextResponse.json(
          { error: 'Cliente não encontrado' },
          { status: 404 }
        );
      }

      // Exclui o cliente
      await db.cliente.delete({
        where: { id }
      });

      // Dispara webhook para cliente excluído
      await triggerWebhook(WEBHOOK_EVENTS.CLIENTE_EXCLUIDO, {
        cliente: {
          id: cliente.id,
          nome: cliente.nome,
          email: cliente.email,
          telefone: cliente.telefone,
          empresa: cliente.empresa,
          tipo: cliente.tipo,
          status: cliente.status
        },
        metadata: {
          apiKey: {
            id: apiKey.id,
            nome: apiKey.nome
          },
          timestamp: new Date().toISOString(),
          deletedAt: new Date().toISOString()
        }
      });

      return NextResponse.json(
        { message: 'Cliente excluído com sucesso' },
        { status: 200 }
      );
    } catch (error) {
      console.error('Erro ao excluir cliente:', error);
      return NextResponse.json(
        { error: 'Erro interno do servidor' },
        { status: 500 }
      );
    }
  });
}
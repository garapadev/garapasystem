import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { db } from '@/lib/db';

/**
 * @swagger
 * /api/permissoes/recursos:
 *   get:
 *     summary: Lista todos os recursos únicos disponíveis no sistema
 *     tags: [Permissões]
 *     responses:
 *       200:
 *         description: Lista de recursos únicos
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: string
 *       401:
 *         description: Não autorizado
 *       500:
 *         description: Erro interno do servidor
 */

// GET - Listar recursos únicos
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    // Buscar todos os recursos únicos das permissões
    const recursos = await db.permissao.findMany({
      select: {
        recurso: true
      },
      distinct: ['recurso'],
      orderBy: {
        recurso: 'asc'
      }
    });

    // Extrair apenas os valores dos recursos
    const recursosUnicos = recursos.map(item => item.recurso);

    return NextResponse.json(recursosUnicos);
  } catch (error) {
    console.error('Erro ao buscar recursos:', error);
    return NextResponse.json(
      { error: 'Erro ao buscar recursos' },
      { status: 500 }
    );
  }
}
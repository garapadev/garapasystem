import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

// POST - Concluir laudo técnico
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string; laudoId: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    const { id: ordemServicoId, laudoId } = params;

    // Verificar se o laudo existe e pertence à ordem de serviço
    const laudoExistente = await prisma.laudoTecnico.findFirst({
      where: {
        id: laudoId,
        ordemServicoId
      },
      include: {
        itens: true
      }
    });

    if (!laudoExistente) {
      return NextResponse.json({ error: 'Laudo técnico não encontrado' }, { status: 404 });
    }

    // Verificar se o laudo pode ser concluído
    if (laudoExistente.status !== 'RASCUNHO') {
      return NextResponse.json({ error: 'Laudo técnico já foi concluído' }, { status: 400 });
    }

    // Validar se o laudo tem informações mínimas necessárias
    if (!laudoExistente.diagnostico || !laudoExistente.solucaoRecomendada) {
      return NextResponse.json({ 
        error: 'Laudo técnico deve ter diagnóstico e solução recomendada para ser concluído' 
      }, { status: 400 });
    }

    // Concluir laudo técnico
    const laudo = await prisma.$transaction(async (tx) => {
      const laudoConcluido = await tx.laudoTecnico.update({
        where: { id: laudoId },
        data: {
          status: 'CONCLUIDO',
          dataFinalizacao: new Date(),
          historico: {
            create: {
              acao: 'CONCLUIDO',
              descricao: 'Laudo técnico concluído e enviado para aprovação do cliente',
              tecnicoId: laudoExistente.tecnicoId
            }
          }
        },
        include: {
          tecnico: {
            select: {
              id: true,
              nome: true,
              email: true
            }
          },
          itens: {
            orderBy: { createdAt: 'asc' }
          },
          anexos: {
            orderBy: { createdAt: 'desc' }
          },
          historico: {
            include: {
              tecnico: {
                select: {
                  id: true,
                  nome: true,
                  email: true
                }
              }
            },
            orderBy: { createdAt: 'desc' }
          }
        }
      });

      // Atualizar status da ordem de serviço se necessário
      await tx.ordemServico.update({
        where: { id: ordemServicoId },
        data: {
          status: 'AGUARDANDO_APROVACAO_CLIENTE'
        }
      });

      return laudoConcluido;
    });

    return NextResponse.json(laudo);
  } catch (error) {
    console.error('Erro ao concluir laudo técnico:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}
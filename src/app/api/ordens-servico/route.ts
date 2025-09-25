import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const search = searchParams.get('search') || '';
    const status = searchParams.get('status') || '';
    const prioridade = searchParams.get('prioridade') || '';
    const clienteId = searchParams.get('clienteId') || '';
    const responsavelId = searchParams.get('responsavelId') || '';
    const dataInicio = searchParams.get('dataInicio') || '';
    const dataFim = searchParams.get('dataFim') || '';

    const skip = (page - 1) * limit;

    // Construir a query com filtros
    const where: any = {};
    
    if (search) {
      where.OR = [
        { titulo: { contains: search, mode: 'insensitive' } },
        { descricao: { contains: search, mode: 'insensitive' } },
        { cliente: { nome: { contains: search, mode: 'insensitive' } } }
      ];
    }

    if (status) {
      where.status = status;
    }

    if (prioridade) {
      where.prioridade = prioridade;
    }

    if (clienteId) {
      where.clienteId = clienteId;
    }

    if (responsavelId) {
      where.responsavelId = responsavelId;
    }

    if (dataInicio) {
      where.dataInicio = {
        gte: new Date(dataInicio)
      };
    }

    if (dataFim) {
      where.dataFim = {
        lte: new Date(dataFim)
      };
    }

    const [ordensServico, total] = await Promise.all([
      db.ordemServico.findMany({
        where,
        include: {
          cliente: {
            select: {
              id: true,
              nome: true,
              email: true,
              telefone: true
            }
          },
          responsavel: {
            select: {
              id: true,
              nome: true,
              email: true
            }
          },
          criadoPor: {
            select: {
              id: true,
              nome: true,
              email: true
            }
          },
          oportunidade: {
            select: {
              id: true,
              titulo: true
            }
          },
          itens: {
            orderBy: {
              createdAt: 'asc'
            }
          },
          checklists: {
            include: {
              itens: {
                orderBy: {
                  ordem: 'asc'
                }
              }
            }
          },
          _count: {
            select: {
              comentarios: true,
              anexos: true,
              historico: true
            }
          }
        },
        skip,
        take: limit,
        orderBy: {
          createdAt: 'desc'
        }
      }),
      db.ordemServico.count({ where })
    ]);

    return NextResponse.json({
      data: ordensServico,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('Erro ao buscar ordens de serviço:', error);
    return NextResponse.json(
      { error: 'Erro ao buscar ordens de serviço' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // Validar dados obrigatórios
    if (!body.titulo) {
      return NextResponse.json(
        { error: 'Título é obrigatório' },
        { status: 400 }
      );
    }

    if (!body.descricao) {
      return NextResponse.json(
        { error: 'Descrição é obrigatória' },
        { status: 400 }
      );
    }

    if (!body.clienteId) {
      return NextResponse.json(
        { error: 'Cliente é obrigatório' },
        { status: 400 }
      );
    }

    if (!body.criadoPorId) {
      return NextResponse.json(
        { error: 'Criador é obrigatório' },
        { status: 400 }
      );
    }

    // Verificar se cliente existe
    const cliente = await db.cliente.findUnique({
      where: { id: body.clienteId }
    });

    if (!cliente) {
      return NextResponse.json(
        { error: 'Cliente não encontrado' },
        { status: 404 }
      );
    }

    // Verificar se colaborador criador existe
    const criadoPor = await db.colaborador.findUnique({
      where: { id: body.criadoPorId }
    });

    if (!criadoPor) {
      return NextResponse.json(
        { error: 'Colaborador criador não encontrado' },
        { status: 404 }
      );
    }

    // Verificar se responsável existe (se fornecido)
    if (body.responsavelId) {
      const responsavel = await db.colaborador.findUnique({
        where: { id: body.responsavelId }
      });

      if (!responsavel) {
        return NextResponse.json(
          { error: 'Responsável não encontrado' },
          { status: 404 }
        );
      }
    }

    // Processar itens da OS
    const itensData = body.itens || [];
    
    // Criar ordem de serviço
    const ordemServico = await db.ordemServico.create({
      data: {
        titulo: body.titulo,
        descricao: body.descricao,
        localExecucao: body.localExecucao || null,
        dataInicio: body.dataInicio ? new Date(body.dataInicio) : null,
        dataFim: body.dataFim ? new Date(body.dataFim) : null,
        valorOrcamento: body.valorOrcamento ? parseFloat(body.valorOrcamento) : null,
        status: body.status || 'RASCUNHO',
        prioridade: body.prioridade || 'MEDIA',
        observacoesInternas: body.observacoesInternas || null,
        clienteId: body.clienteId,
        responsavelId: body.responsavelId || null,
        criadoPorId: body.criadoPorId,
        oportunidadeId: body.oportunidadeId || null,
        itens: {
          create: itensData.map((item: any) => ({
            descricao: item.descricao,
            quantidade: parseFloat(item.quantidade || 1),
            valorUnitario: parseFloat(item.valorUnitario || 0),
            valorTotal: parseFloat(item.valorTotal || 0),
            observacoes: item.observacoes || null
          }))
        },
        historico: {
          create: {
            acao: 'Ordem de serviço criada',
            colaboradorId: body.criadoPorId
          }
        }
      },
      include: {
        cliente: {
          select: {
            id: true,
            nome: true,
            email: true,
            telefone: true
          }
        },
        responsavel: {
          select: {
            id: true,
            nome: true,
            email: true
          }
        },
        criadoPor: {
          select: {
            id: true,
            nome: true,
            email: true
          }
        },
        oportunidade: {
          select: {
            id: true,
            titulo: true
          }
        },
        itens: true,
        historico: {
          include: {
            colaborador: {
              select: {
                id: true,
                nome: true,
                email: true
              }
            }
          },
          orderBy: {
            createdAt: 'desc'
          }
        }
      }
    });

    return NextResponse.json(ordemServico, { status: 201 });
  } catch (error) {
    console.error('Erro ao criar ordem de serviço:', error);
    return NextResponse.json(
      { error: 'Erro ao criar ordem de serviço' },
      { status: 500 }
    );
  }
}
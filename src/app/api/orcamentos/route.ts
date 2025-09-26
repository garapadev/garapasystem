import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const search = searchParams.get('search') || '';
    const status = searchParams.get('status') || '';
    const clienteId = searchParams.get('clienteId') || '';
    const ordemServicoId = searchParams.get('ordemServicoId') || '';
    const laudoTecnicoId = searchParams.get('laudoTecnicoId') || '';
    const dataInicio = searchParams.get('dataInicio') || '';
    const dataFim = searchParams.get('dataFim') || '';
    const geradoAutomaticamente = searchParams.get('geradoAutomaticamente');

    const skip = (page - 1) * limit;

    // Construir a query com filtros
    const where: any = {};
    
    if (search) {
      where.OR = [
        { numero: { contains: search, mode: 'insensitive' } },
        { titulo: { contains: search, mode: 'insensitive' } },
        { descricao: { contains: search, mode: 'insensitive' } },
        { ordemServico: { titulo: { contains: search, mode: 'insensitive' } } },
        { ordemServico: { cliente: { nome: { contains: search, mode: 'insensitive' } } } }
      ];
    }

    if (status) {
      where.status = status;
    }

    if (clienteId) {
      where.ordemServico = {
        clienteId: clienteId
      };
    }

    if (ordemServicoId) {
      where.ordemServicoId = ordemServicoId;
    }

    if (laudoTecnicoId) {
      where.laudoTecnicoId = laudoTecnicoId;
    }

    if (dataInicio) {
      where.createdAt = {
        gte: new Date(dataInicio)
      };
    }

    if (dataFim) {
      where.createdAt = {
        ...where.createdAt,
        lte: new Date(dataFim)
      };
    }

    if (geradoAutomaticamente !== null && geradoAutomaticamente !== undefined) {
      where.geradoAutomaticamente = geradoAutomaticamente === 'true';
    }

    const [orcamentos, total] = await Promise.all([
      db.orcamento.findMany({
        where,
        include: {
          ordemServico: {
            include: {
              cliente: {
                select: {
                  id: true,
                  nome: true,
                  email: true,
                  telefone: true
                }
              }
            }
          },
          laudoTecnico: {
            select: {
              id: true,
              numero: true,
              titulo: true
            }
          },
          criadoPor: {
            select: {
              id: true,
              nome: true,
              email: true
            }
          },
          itens: {
            orderBy: {
              createdAt: 'asc'
            }
          },
          _count: {
            select: {
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
      db.orcamento.count({ where })
    ]);

    return NextResponse.json({
      data: orcamentos,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('Erro ao buscar orçamentos:', error);
    return NextResponse.json(
      { error: 'Erro ao buscar orçamentos' },
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

    if (!body.ordemServicoId) {
      return NextResponse.json(
        { error: 'Ordem de serviço é obrigatória' },
        { status: 400 }
      );
    }

    if (!body.criadoPorId) {
      return NextResponse.json(
        { error: 'Criador é obrigatório' },
        { status: 400 }
      );
    }

    if (!body.valorTotal || parseFloat(body.valorTotal) <= 0) {
      return NextResponse.json(
        { error: 'Valor total deve ser maior que zero' },
        { status: 400 }
      );
    }

    // Verificar se ordem de serviço existe
    const ordemServico = await db.ordemServico.findUnique({
      where: { id: body.ordemServicoId },
      include: {
        cliente: true
      }
    });

    if (!ordemServico) {
      return NextResponse.json(
        { error: 'Ordem de serviço não encontrada' },
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

    // Verificar se laudo técnico existe (se fornecido)
    if (body.laudoTecnicoId) {
      const laudoTecnico = await db.laudoTecnico.findUnique({
        where: { id: body.laudoTecnicoId }
      });

      if (!laudoTecnico) {
        return NextResponse.json(
          { error: 'Laudo técnico não encontrado' },
          { status: 404 }
        );
      }
    }

    // Processar itens do orçamento
    const itensData = body.itens || [];
    
    // Gerar número sequencial do orçamento
    const hoje = new Date();
    const ano = hoje.getFullYear();
    const mes = String(hoje.getMonth() + 1).padStart(2, '0');
    
    // Buscar o último número do mês atual
    const ultimoOrcamento = await db.orcamento.findFirst({
      where: {
        numero: {
          startsWith: `ORC${ano}${mes}`
        }
      },
      orderBy: {
        numero: 'desc'
      }
    });
    
    let proximoNumero = 1;
    if (ultimoOrcamento) {
      const ultimoNumero = parseInt(ultimoOrcamento.numero.slice(-4));
      proximoNumero = ultimoNumero + 1;
    }
    
    const numeroOrcamento = `ORC${ano}${mes}${String(proximoNumero).padStart(4, '0')}`;
    
    // Calcular data de validade (30 dias por padrão)
    const dataValidade = new Date();
    dataValidade.setDate(dataValidade.getDate() + (body.diasValidade || 30));
    
    // Criar orçamento
    const orcamento = await db.orcamento.create({
      data: {
        numero: numeroOrcamento,
        titulo: body.titulo,
        descricao: body.descricao || null,
        valorTotal: parseFloat(body.valorTotal),
        valorDesconto: body.valorDesconto ? parseFloat(body.valorDesconto) : null,
        percentualDesconto: body.percentualDesconto ? parseFloat(body.percentualDesconto) : null,
        dataValidade: dataValidade,
        observacoes: body.observacoes || null,
        status: body.status || 'RASCUNHO',
        geradoAutomaticamente: body.geradoAutomaticamente || false,
        ordemServicoId: body.ordemServicoId,
        laudoTecnicoId: body.laudoTecnicoId || null,
        criadoPorId: body.criadoPorId,
        itens: {
          create: itensData.map((item: any) => ({
            tipo: item.tipo || 'SERVICO',
            descricao: item.descricao,
            quantidade: parseFloat(item.quantidade || 1),
            valorUnitario: parseFloat(item.valorUnitario || 0),
            valorTotal: parseFloat(item.valorTotal || 0),
            observacoes: item.observacoes || null
          }))
        },
        historico: {
          create: {
            acao: 'criado',
            descricao: 'Orçamento criado',
            colaboradorId: body.criadoPorId
          }
        }
      },
      include: {
        ordemServico: {
          include: {
            cliente: {
              select: {
                id: true,
                nome: true,
                email: true,
                telefone: true
              }
            }
          }
        },
        laudoTecnico: {
          select: {
            id: true,
            numero: true,
            titulo: true
          }
        },
        criadoPor: {
          select: {
            id: true,
            nome: true,
            email: true
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

    return NextResponse.json(orcamento, { status: 201 });
  } catch (error) {
    console.error('Erro ao criar orçamento:', error);
    return NextResponse.json(
      { error: 'Erro ao criar orçamento' },
      { status: 500 }
    );
  }
}
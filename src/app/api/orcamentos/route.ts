import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { ApiMiddleware } from '@/lib/api-middleware';
import { 
  orcamentoFilterSchema, 
  createOrcamentoSchema, 
  updateOrcamentoSchema 
} from '@/lib/validations/orcamento';

export async function GET(request: NextRequest) {
  try {
    // Validar autenticação
    const auth = await ApiMiddleware.validateAuth(request);
    if (!auth.valid) {
      return ApiMiddleware.createErrorResponse(auth.error || 'Não autorizado');
    }

    // Verificar permissões
    if (!ApiMiddleware.hasAuthPermission(auth, '/api/orcamentos', 'GET')) {
      return ApiMiddleware.createErrorResponse('Sem permissão para visualizar orçamentos', 403);
    }

    const { searchParams } = new URL(request.url);
    
    // Validar parâmetros de consulta com Zod
    const queryParams = {
      page: searchParams.get('page') || '1',
      limit: searchParams.get('limit') || '10',
      search: searchParams.get('search') || '',
      status: searchParams.get('status') || '',
      clienteId: searchParams.get('clienteId') || '',
      ordemServicoId: searchParams.get('ordemServicoId') || '',
      laudoTecnicoId: searchParams.get('laudoTecnicoId') || '',
      dataInicio: searchParams.get('dataInicio') || '',
      dataFim: searchParams.get('dataFim') || '',
      geradoAutomaticamente: searchParams.get('geradoAutomaticamente') || ''
    };

    const validationResult = orcamentoFilterSchema.safeParse(queryParams);
    if (!validationResult.success) {
      return ApiMiddleware.createErrorResponse(
        `Parâmetros de consulta inválidos: ${validationResult.error.errors.map(e => e.message).join(', ')}`,
        400
      );
    }

    const { 
      page, 
      limit, 
      search, 
      status, 
      clienteId, 
      ordemServicoId, 
      laudoTecnicoId, 
      dataInicio, 
      dataFim, 
      geradoAutomaticamente 
    } = validationResult.data;

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
    return ApiMiddleware.createErrorResponse('Erro interno do servidor ao buscar orçamentos', 500);
  }
}

export async function POST(request: NextRequest) {
  try {
    // Validar autenticação
    const auth = await ApiMiddleware.validateAuth(request);
    if (!auth.valid) {
      return ApiMiddleware.createErrorResponse(auth.error || 'Não autorizado');
    }

    // Verificar permissões
    if (!ApiMiddleware.hasAuthPermission(auth, '/api/orcamentos', 'POST')) {
      return ApiMiddleware.createErrorResponse('Sem permissão para criar orçamentos', 403);
    }

    const body = await request.json();

    // Validar dados com Zod
    const validationResult = createOrcamentoSchema.safeParse(body);
    if (!validationResult.success) {
      return ApiMiddleware.createErrorResponse(
        `Dados inválidos: ${validationResult.error.errors.map(e => e.message).join(', ')}`,
        400
      );
    }

    const validatedData = validationResult.data;

    // Verificar se ordem de serviço existe
    const ordemServico = await db.ordemServico.findUnique({
      where: { id: validatedData.ordemServicoId },
      include: {
        cliente: true
      }
    });

    if (!ordemServico) {
      return ApiMiddleware.createErrorResponse('Ordem de serviço não encontrada', 404);
    }

    // Verificar se colaborador criador existe
    const criadoPor = await db.colaborador.findUnique({
      where: { id: validatedData.criadoPorId }
    });

    if (!criadoPor) {
      return ApiMiddleware.createErrorResponse('Colaborador criador não encontrado', 404);
    }

    // Verificar se laudo técnico existe (se fornecido)
    if (validatedData.laudoTecnicoId) {
      const laudoTecnico = await db.laudoTecnico.findUnique({
        where: { id: validatedData.laudoTecnicoId }
      });

      if (!laudoTecnico) {
        return ApiMiddleware.createErrorResponse('Laudo técnico não encontrado', 404);
      }
    }

    // Processar itens do orçamento
    const itensData = validatedData.itens || [];
    
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
        titulo: validatedData.titulo,
        descricao: validatedData.descricao || null,
        valorTotal: validatedData.valorTotal,
        valorDesconto: validatedData.valorDesconto || null,
        percentualDesconto: validatedData.percentualDesconto || null,
        dataValidade: validatedData.dataValidade ? new Date(validatedData.dataValidade) : null,
        observacoes: validatedData.observacoes || null,
        status: validatedData.status || 'RASCUNHO',
        geradoAutomaticamente: validatedData.geradoAutomaticamente || false,
        ordemServicoId: validatedData.ordemServicoId,
        laudoTecnicoId: validatedData.laudoTecnicoId || null,
        criadoPorId: validatedData.criadoPorId,
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
            colaboradorId: validatedData.criadoPorId
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
    return ApiMiddleware.createErrorResponse('Erro interno do servidor ao criar orçamento', 500);
  }
}
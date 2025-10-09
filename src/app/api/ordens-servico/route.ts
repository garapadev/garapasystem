import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { ApiMiddleware } from '@/lib/api-middleware';
import { 
  ordemServicoFilterSchema, 
  createOrdemServicoSchema, 
  updateOrdemServicoSchema 
} from '@/lib/validations/ordem-servico';

export async function GET(request: NextRequest) {
  try {
    // Validar autenticação
    const auth = await ApiMiddleware.validateAuth(request);
    if (!auth.valid) {
      return ApiMiddleware.createErrorResponse(auth.error || 'Não autorizado');
    }

    // Verificar permissões
    if (!ApiMiddleware.hasAuthPermission(auth, '/api/ordens-servico', 'GET')) {
      return ApiMiddleware.createErrorResponse('Sem permissão para visualizar ordens de serviço', 403);
    }

    const { searchParams } = new URL(request.url);
    
    // Validar parâmetros de consulta com Zod
    const queryParams = {
      page: searchParams.get('page') || '1',
      limit: searchParams.get('limit') || '10',
      search: searchParams.get('search') || '',
      status: searchParams.get('status') || '',
      prioridade: searchParams.get('prioridade') || '',
      clienteId: searchParams.get('clienteId') || '',
      responsavelId: searchParams.get('responsavelId') || '',
      dataInicio: searchParams.get('dataInicio') || '',
      dataFim: searchParams.get('dataFim') || ''
    };

    const validationResult = ordemServicoFilterSchema.safeParse(queryParams);
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
      prioridade, 
      clienteId, 
      responsavelId, 
      dataInicio, 
      dataFim 
    } = validationResult.data;

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
    return ApiMiddleware.createErrorResponse('Erro interno do servidor ao buscar ordens de serviço', 500);
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
    if (!ApiMiddleware.hasAuthPermission(auth, '/api/ordens-servico', 'POST')) {
      return ApiMiddleware.createErrorResponse('Sem permissão para criar ordens de serviço', 403);
    }

    const body = await request.json();

    // Validar dados com Zod
    const validationResult = createOrdemServicoSchema.safeParse(body);
    if (!validationResult.success) {
      return ApiMiddleware.createErrorResponse(
        `Dados inválidos: ${validationResult.error.errors.map(e => e.message).join(', ')}`,
        400
      );
    }

    const validatedData = validationResult.data;

    // Verificar se cliente existe
    const cliente = await db.cliente.findUnique({
      where: { id: validatedData.clienteId }
    });

    if (!cliente) {
      return ApiMiddleware.createErrorResponse('Cliente não encontrado', 404);
    }

    // Verificar se colaborador criador existe
    const criadoPor = await db.colaborador.findUnique({
      where: { id: validatedData.criadoPorId }
    });

    if (!criadoPor) {
      return NextResponse.json(
        { error: 'Colaborador criador não encontrado' },
        { status: 404 }
      );
    }

    // Verificar se responsável existe (se fornecido)
    if (validatedData.responsavelId) {
      const responsavel = await db.colaborador.findUnique({
        where: { id: validatedData.responsavelId }
      });

      if (!responsavel) {
        return ApiMiddleware.createErrorResponse('Responsável não encontrado', 404);
      }
    }

    // Processar itens da OS
    const itensData = validatedData.itens || [];
    
    // Calcular valor final baseado nos itens
    let valorFinal = 0;
    if (itensData.length > 0) {
      valorFinal = itensData.reduce((total: number, item: any) => {
        const quantidade = parseFloat(item.quantidade || 1);
        const valorUnitario = parseFloat(item.valorUnitario || 0);
        return total + (quantidade * valorUnitario);
      }, 0);
    }
    
    // Gerar número sequencial da OS
    const hoje = new Date();
    const ano = hoje.getFullYear();
    const mes = String(hoje.getMonth() + 1).padStart(2, '0');
    
    // Buscar o último número do mês atual
    const ultimaOS = await db.ordemServico.findFirst({
      where: {
        numero: {
          startsWith: `OS${ano}${mes}`
        }
      },
      orderBy: {
        numero: 'desc'
      }
    });
    
    let proximoNumero = 1;
    if (ultimaOS) {
      const ultimoNumero = parseInt(ultimaOS.numero.slice(-4));
      proximoNumero = ultimoNumero + 1;
    }
    
    const numeroOS = `OS${ano}${mes}${String(proximoNumero).padStart(4, '0')}`;
    
    // Criar ordem de serviço
    const ordemServico = await db.ordemServico.create({
      data: {
        numero: numeroOS,
        titulo: validatedData.titulo,
        descricao: validatedData.descricao,
        localExecucao: validatedData.localExecucao || null,
        dataInicio: validatedData.dataInicio ? new Date(validatedData.dataInicio) : null,
        dataFim: validatedData.dataFim ? new Date(validatedData.dataFim) : null,
        prazoEstimado: validatedData.prazoEstimado ? new Date(validatedData.prazoEstimado) : null,
        valorOrcamento: validatedData.valorOrcamento || null,
        valorFinal: valorFinal,
        status: validatedData.status || 'RASCUNHO',
        prioridade: validatedData.prioridade || 'MEDIA',
        observacoes: validatedData.observacoes || null,
        clienteId: validatedData.clienteId,
        responsavelId: validatedData.responsavelId || null,
        criadoPorId: validatedData.criadoPorId,
        oportunidadeId: validatedData.oportunidadeId || null,
        itens: {
          create: itensData.map((item: any) => {
            const quantidade = parseFloat(item.quantidade || 1);
            const valorUnitario = parseFloat(item.valorUnitario || 0);
            return {
              descricao: item.descricao,
              quantidade: quantidade,
              valorUnitario: valorUnitario,
              valorTotal: quantidade * valorUnitario,
              observacoes: item.observacoes || null
            };
          })
        },
        historico: {
          create: {
            acao: 'criada',
            descricao: 'Ordem de serviço criada',
            colaboradorId: validatedData.criadoPorId
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
    return ApiMiddleware.createErrorResponse('Erro interno do servidor ao criar ordem de serviço', 500);
  }
}
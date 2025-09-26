import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { db } from '@/lib/db';
import { z } from 'zod';

const gerarOrcamentoSchema = z.object({
  clienteId: z.string().uuid().optional(),
  ordemServicoId: z.string().uuid().optional(),
  laudoTecnicoId: z.string().uuid().optional(),
  titulo: z.string().min(1).optional(),
  descricao: z.string().optional(),
  observacoes: z.string().optional(),
  dataValidade: z.string().transform((str) => new Date(str)).optional(),
  margemLucro: z.number().min(0).max(100).optional().default(20),
  preview: z.boolean().optional().default(false),
  criadoPorId: z.string().uuid().optional(), // Para compatibilidade com implementação anterior
  forcarRecriacao: z.boolean().optional().default(false),
});

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { message: 'Não autorizado' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const data = gerarOrcamentoSchema.parse(body);

    // Verificar permissão
    const user = await db.user.findUnique({
      where: { id: session.user.id },
      include: {
        profile: {
          include: {
            permissions: true
          }
        }
      }
    });

    const hasPermission = user?.profile?.permissions.some(
      p => p.resource === 'orcamentos' && p.action === 'create'
    ) || user?.profile?.name === 'Administrador';

    if (!hasPermission) {
      return NextResponse.json(
        { message: 'Sem permissão para criar orçamentos' },
        { status: 403 }
      );
    }

    // Modo de compatibilidade: geração a partir de laudo técnico
    if (data.laudoTecnicoId && !data.ordemServicoId) {
      return await gerarOrcamentoDoLaudo(data, session.user.id);
    }

    // Novo modo: geração a partir de ordem de serviço
    if (data.ordemServicoId) {
      return await gerarOrcamentoDaOrdemServico(data, session.user.id);
    }

    return NextResponse.json(
      { message: 'É necessário informar uma ordem de serviço ou laudo técnico' },
      { status: 400 }
    );

  } catch (error) {
    console.error('Erro ao gerar orçamento automático:', error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { 
          message: 'Dados inválidos',
          errors: error.errors 
        },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { message: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}

// Função para gerar orçamento a partir de ordem de serviço
async function gerarOrcamentoDaOrdemServico(data: any, userId: string) {
  // Buscar a ordem de serviço com seus itens
  const ordemServico = await db.ordemServico.findUnique({
    where: { id: data.ordemServicoId },
    include: {
      cliente: true,
      itens: true,
      laudosTecnicos: true,
    }
  });

  if (!ordemServico) {
    return NextResponse.json(
      { message: 'Ordem de serviço não encontrada' },
      { status: 404 }
    );
  }

  // Verificar se o cliente da OS corresponde ao cliente selecionado (se fornecido)
  if (data.clienteId && ordemServico.clienteId !== data.clienteId) {
    return NextResponse.json(
      { message: 'Cliente não corresponde à ordem de serviço' },
      { status: 400 }
    );
  }

  // Calcular valores dos itens com margem de lucro
  const margemLucro = data.margemLucro || 20;
  const itensOrcamento = ordemServico.itens.map(item => {
    const valorUnitarioComMargem = item.valorUnitario * (1 + margemLucro / 100);
    const valorTotal = valorUnitarioComMargem * item.quantidade;

    return {
      tipo: item.tipo || 'MATERIAL',
      descricao: item.descricao,
      quantidade: item.quantidade,
      unidade: item.unidade,
      valorUnitario: valorUnitarioComMargem,
      valorTotal: valorTotal,
      observacoes: item.observacoes,
    };
  });

  const valorTotalOrcamento = itensOrcamento.reduce(
    (total, item) => total + item.valorTotal,
    0
  );

  // Se for apenas preview, retornar os dados calculados
  if (data.preview) {
    return NextResponse.json({
      itens: itensOrcamento,
      valorTotal: valorTotalOrcamento,
      margemAplicada: margemLucro,
      ordemServico: {
        numero: ordemServico.numero,
        titulo: ordemServico.titulo,
        status: ordemServico.status,
      }
    });
  }

  // Gerar número do orçamento
  const hoje = new Date();
  const ano = hoje.getFullYear();
  const mes = String(hoje.getMonth() + 1).padStart(2, '0');
  
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

  // Definir data de validade
  const dataValidade = data.dataValidade || (() => {
    const data = new Date();
    data.setDate(data.getDate() + 30);
    return data;
  })();

  // Criar o orçamento
  const orcamento = await db.orcamento.create({
    data: {
      numero: numeroOrcamento,
      titulo: data.titulo || `Orçamento para ${ordemServico.titulo}`,
      descricao: data.descricao,
      observacoes: data.observacoes,
      status: 'RASCUNHO',
      dataValidade: dataValidade,
      valorTotal: valorTotalOrcamento,
      geradoAutomaticamente: true,
      clienteId: ordemServico.clienteId,
      ordemServicoId: data.ordemServicoId,
      laudoTecnicoId: data.laudoTecnicoId,
      criadoPorId: userId,
      itens: {
        create: itensOrcamento
      },
      historico: {
        create: {
          acao: 'criado',
          descricao: `Orçamento gerado automaticamente a partir da OS ${ordemServico.numero} com margem de ${margemLucro}%`,
          colaboradorId: userId,
        }
      }
    },
    include: {
      cliente: true,
      ordemServico: true,
      laudoTecnico: true,
      itens: true,
      historico: {
        include: {
          colaborador: {
            select: {
              nome: true,
              email: true
            }
          }
        }
      },
      criadoPor: {
        select: {
          name: true,
          email: true
        }
      }
    }
  });

  return NextResponse.json({
    message: 'Orçamento gerado automaticamente com sucesso',
    orcamento: orcamento
  }, { status: 201 });
}

// Função para gerar orçamento a partir de laudo técnico (compatibilidade)
async function gerarOrcamentoDoLaudo(data: any, userId: string) {
  // Validar dados obrigatórios para compatibilidade
  if (!data.laudoTecnicoId) {
    return NextResponse.json(
      { error: 'ID do laudo técnico é obrigatório' },
      { status: 400 }
    );
  }

  // Buscar laudo técnico com todos os dados necessários
  const laudoTecnico = await db.laudoTecnico.findUnique({
    where: { id: data.laudoTecnicoId },
      include: {
        ordemServico: {
          include: {
            cliente: true
          }
        },
        itens: {
          orderBy: {
            createdAt: 'asc'
          }
        }
      }
    });

    if (!laudoTecnico) {
      return NextResponse.json(
        { error: 'Laudo técnico não encontrado' },
        { status: 404 }
      );
    }

    // Verificar se o laudo está configurado para gerar orçamento
    if (!laudoTecnico.gerarOrcamento) {
      return NextResponse.json(
        { error: 'Laudo técnico não está configurado para gerar orçamento automaticamente' },
        { status: 400 }
      );
    }

    // Verificar se já existe um orçamento para este laudo
    const orcamentoExistente = await db.orcamento.findFirst({
      where: {
        laudoTecnicoId: data.laudoTecnicoId,
        geradoAutomaticamente: true
      }
    });

    if (orcamentoExistente && !data.forcarRecriacao) {
      return NextResponse.json(
        { 
          error: 'Já existe um orçamento gerado automaticamente para este laudo técnico',
          orcamentoExistente: orcamentoExistente
        },
        { status: 409 }
      );
    }

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
    dataValidade.setDate(dataValidade.getDate() + 30);
    
    // Preparar itens do orçamento baseados nos itens do laudo
    const itensOrcamento = laudoTecnico.itens.map(item => ({
      tipo: item.tipo === 'SERVICO' ? 'SERVICO' : 'MATERIAL',
      descricao: item.descricao,
      quantidade: item.quantidade,
      valorUnitario: item.valorUnitario || 0,
      valorTotal: (item.quantidade * (item.valorUnitario || 0)),
      observacoes: item.observacoes
    }));

    // Calcular valor total
    const valorTotal = laudoTecnico.valorOrcamento || itensOrcamento.reduce((total, item) => total + item.valorTotal, 0);

    // Criar título baseado no laudo
    const titulo = `Orçamento - ${laudoTecnico.titulo}`;
    
    // Criar descrição baseada no diagnóstico e solução recomendada
    let descricao = '';
    if (laudoTecnico.diagnostico) {
      descricao += `Diagnóstico: ${laudoTecnico.diagnostico}\n\n`;
    }
    if (laudoTecnico.solucaoRecomendada) {
      descricao += `Solução Recomendada: ${laudoTecnico.solucaoRecomendada}`;
    }
    if (laudoTecnico.justificativaValor) {
      descricao += `\n\nJustificativa do Valor: ${laudoTecnico.justificativaValor}`;
    }

    // Se forçar recriação, excluir orçamento existente
    if (data.forcarRecriacao && orcamentoExistente) {
      await db.orcamento.delete({
        where: { id: orcamentoExistente.id }
      });
    }

    // Criar orçamento
    const orcamento = await db.orcamento.create({
      data: {
        numero: numeroOrcamento,
        titulo: titulo,
        descricao: descricao || null,
        valorTotal: valorTotal,
        dataValidade: dataValidade,
        observacoes: laudoTecnico.observacoesTecnicas || null,
        status: 'RASCUNHO',
        geradoAutomaticamente: true,
        clienteId: laudoTecnico.ordemServico.clienteId,
        ordemServicoId: laudoTecnico.ordemServicoId,
        laudoTecnicoId: laudoTecnico.id,
        criadoPorId: userId,
        itens: {
          create: itensOrcamento
        },
        historico: {
          create: {
            acao: 'criado',
            descricao: `Orçamento gerado automaticamente a partir do laudo técnico ${laudoTecnico.numero}`,
            colaboradorId: userId
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

    return NextResponse.json({
      message: 'Orçamento gerado automaticamente com sucesso',
      orcamento: orcamento
    }, { status: 201 });
}
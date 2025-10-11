import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';

const laudoTecnicoSchema = z.object({
  titulo: z.string().min(1, 'Título é obrigatório'),
  descricao: z.string().min(1, 'Descrição é obrigatória'),
  tecnicoId: z.string().min(1, 'Técnico é obrigatório'),
  clienteId: z.string().optional(),
  ordemServicoId: z.string().optional(),
  status: z.enum(['RASCUNHO', 'EM_ANDAMENTO', 'CONCLUIDO', 'APROVADO', 'REJEITADO']).default('RASCUNHO'),
  observacoes: z.string().optional(),
  valorTotal: z.number().optional(),
  gerarOrcamentoAutomatico: z.boolean().default(false),
  itens: z.array(z.object({
    descricao: z.string().min(1, 'Descrição do item é obrigatória'),
    quantidade: z.number().min(0.01, 'Quantidade deve ser maior que zero'),
    valorUnitario: z.number().min(0, 'Valor unitário deve ser maior ou igual a zero'),
    observacoes: z.string().optional()
  })).optional()
});

// GET - Listar laudos técnicos
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    // Verificar permissão
    const userPermissions = await prisma.usuarioPermissao.findMany({
      where: { usuarioId: session.user.id },
      include: { permissao: true }
    });

    const hasPermission = userPermissions.some(up => 
      up.permissao.recurso === 'laudos-tecnicos' && up.permissao.acao === 'read'
    );

    if (!hasPermission) {
      return NextResponse.json(
        { error: 'Sem permissão para visualizar laudos técnicos' },
        { status: 403 }
      );
    }

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const pageSize = parseInt(searchParams.get('pageSize') || '10');
    const search = searchParams.get('search') || '';
    const status = searchParams.get('status') || '';
    const tecnicoId = searchParams.get('tecnicoId') || '';

    // Construir filtros
    const where: any = {};

    if (search) {
      where.OR = [
        { numero: { contains: search, mode: 'insensitive' } },
        { titulo: { contains: search, mode: 'insensitive' } },
        { tecnico: { nome: { contains: search, mode: 'insensitive' } } },
        { ordemServico: { numero: { contains: search, mode: 'insensitive' } } }
      ];
    }

    if (status) {
      where.status = status;
    }

    if (tecnicoId) {
      where.tecnicoId = tecnicoId;
    }

    // Contar total de registros
    const totalCount = await prisma.laudoTecnico.count({ where });

    // Buscar laudos com paginação
    const laudos = await prisma.laudoTecnico.findMany({
      where,
      include: {
        tecnico: {
          select: {
            id: true,
            nome: true,
            email: true
          }
        },
        ordemServico: {
          select: {
            id: true,
            numero: true,
            titulo: true
          }
        }
      },
      orderBy: { createdAt: 'desc' },
      skip: (page - 1) * pageSize,
      take: pageSize
    });

    const totalPages = Math.ceil(totalCount / pageSize);

    return NextResponse.json({
      laudos,
      totalCount,
      totalPages,
      currentPage: page,
      pageSize
    });
  } catch (error) {
    console.error('Erro ao buscar laudos técnicos:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      return NextResponse.json(
        { error: 'Não autorizado' },
        { status: 401 }
      );
    }

    // Verificar permissão
    const userPermissions = await prisma.usuarioPermissao.findMany({
      where: { usuarioId: session.user.id },
      include: { permissao: true }
    });

    const hasPermission = userPermissions.some(up => 
      up.permissao.recurso === 'laudos-tecnicos' && up.permissao.acao === 'create'
    );

    if (!hasPermission) {
      return NextResponse.json(
        { error: 'Sem permissão para criar laudos técnicos' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const validatedData = laudoTecnicoSchema.parse(body);

    // Verificar se o técnico existe
    const tecnico = await prisma.usuario.findUnique({
      where: { id: validatedData.tecnicoId }
    });

    if (!tecnico) {
      return NextResponse.json(
        { error: 'Técnico não encontrado' },
        { status: 404 }
      );
    }

    // Verificar se o cliente existe (se fornecido)
    if (validatedData.clienteId) {
      const cliente = await prisma.cliente.findUnique({
        where: { id: validatedData.clienteId }
      });

      if (!cliente) {
        return NextResponse.json(
          { error: 'Cliente não encontrado' },
          { status: 404 }
        );
      }
    }

    // Verificar se a ordem de serviço existe (se fornecida)
    if (validatedData.ordemServicoId) {
      const ordemServico = await prisma.ordemServico.findUnique({
        where: { id: validatedData.ordemServicoId }
      });

      if (!ordemServico) {
        return NextResponse.json(
          { error: 'Ordem de serviço não encontrada' },
          { status: 404 }
        );
      }
    }

    // Calcular valor total se há itens
    let valorTotal = validatedData.valorTotal || 0;
    if (validatedData.itens && validatedData.itens.length > 0) {
      valorTotal = validatedData.itens.reduce((total, item) => {
        return total + (item.quantidade * item.valorUnitario);
      }, 0);
    }

    // Gerar número sequencial do laudo
    const hoje = new Date();
    const ano = hoje.getFullYear();
    const mes = String(hoje.getMonth() + 1).padStart(2, '0');
    
    // Buscar o último número do mês atual
    const ultimoLaudo = await prisma.laudoTecnico.findFirst({
      where: {
        numero: {
          startsWith: `LT${ano}${mes}`
        }
      },
      orderBy: {
        numero: 'desc'
      }
    });
    
    let proximoNumero = 1;
    if (ultimoLaudo) {
      const ultimoNumero = parseInt(ultimoLaudo.numero.slice(-4));
      proximoNumero = ultimoNumero + 1;
    }
    
    const numeroLaudo = `LT${ano}${mes}${String(proximoNumero).padStart(4, '0')}`;

    // Criar laudo técnico
    const laudo = await prisma.laudoTecnico.create({
      data: {
        numero: numeroLaudo,
        titulo: validatedData.titulo,
        descricao: validatedData.descricao,
        tecnicoId: validatedData.tecnicoId,
        clienteId: validatedData.clienteId,
        ordemServicoId: validatedData.ordemServicoId,
        status: validatedData.status,
        observacoes: validatedData.observacoes,
        valorTotal: valorTotal,
        gerarOrcamentoAutomatico: validatedData.gerarOrcamentoAutomatico,
        itens: validatedData.itens ? {
          create: validatedData.itens.map(item => ({
            descricao: item.descricao,
            quantidade: item.quantidade,
            valorUnitario: item.valorUnitario,
            valorTotal: item.quantidade * item.valorUnitario,
            observacoes: item.observacoes
          }))
        } : undefined,
        historico: {
          create: {
            acao: 'criado',
            descricao: 'Laudo técnico criado',
            usuarioId: session.user.id
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
        cliente: {
          select: {
            id: true,
            nome: true,
            email: true
          }
        },
        ordemServico: {
          select: {
            id: true,
            numero: true,
            titulo: true
          }
        },
        itens: true,
        historico: {
          include: {
            usuario: {
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

    return NextResponse.json(laudo, { status: 201 });

  } catch (error) {
    console.error('Erro ao criar laudo técnico:', error);
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { 
          error: 'Dados inválidos',
          details: error.errors.map(e => ({
            field: e.path.join('.'),
            message: e.message
          }))
        },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}
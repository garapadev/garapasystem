import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';

const itemTombamentoSchema = z.object({
  numeroTombamento: z.string().min(1, 'Número de tombamento é obrigatório'),
  descricao: z.string().min(1, 'Descrição é obrigatória'),
  categoria: z.string().min(1, 'Categoria é obrigatória'),
  marca: z.string().optional(),
  modelo: z.string().optional(),
  numeroSerie: z.string().optional(),
  valorAquisicao: z.number().min(0, 'Valor de aquisição deve ser positivo'),
  dataAquisicao: z.string().min(1, 'Data de aquisição é obrigatória'),
  fornecedorId: z.string().optional(),
  centroCustoId: z.string().min(1, 'Centro de custo é obrigatório'),
  localizacao: z.string().min(1, 'Localização é obrigatória'),
  responsavel: z.string().optional(),
  observacoes: z.string().optional(),
  garantiaMeses: z.number().min(0).optional(),
  vidaUtilAnos: z.number().min(0).optional()
});

const movimentacaoTombamentoSchema = z.object({
  itemTombamentoId: z.string().min(1, 'Item de tombamento é obrigatório'),
  tipo: z.enum(['TRANSFERENCIA', 'MANUTENCAO', 'BAIXA', 'INVENTARIO']),
  localizacaoOrigem: z.string().optional(),
  localizacaoDestino: z.string().optional(),
  responsavelOrigem: z.string().optional(),
  responsavelDestino: z.string().optional(),
  observacoes: z.string().optional(),
  documentoReferencia: z.string().optional()
});

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const status = searchParams.get('status');
    const categoria = searchParams.get('categoria');
    const centroCustoId = searchParams.get('centroCustoId');
    const search = searchParams.get('search');

    const where: any = {};
    if (status) where.status = status;
    if (categoria) where.categoria = categoria;
    if (centroCustoId) where.centroCustoId = centroCustoId;
    if (search) {
      where.OR = [
        { numeroTombamento: { contains: search, mode: 'insensitive' } },
        { descricao: { contains: search, mode: 'insensitive' } },
        { marca: { contains: search, mode: 'insensitive' } },
        { modelo: { contains: search, mode: 'insensitive' } },
        { numeroSerie: { contains: search, mode: 'insensitive' } }
      ];
    }

    const [itens, total] = await Promise.all([
      prisma.itemTombamento.findMany({
        where,
        include: {
          fornecedor: {
            select: { id: true, nome: true, documento: true }
          },
          centroCusto: {
            select: { id: true, nome: true, codigo: true }
          },
          movimentacoes: {
            orderBy: { createdAt: 'desc' },
            take: 1,
            include: {
              responsavel: {
                select: { id: true, nome: true }
              }
            }
          }
        },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit
      }),
      prisma.itemTombamento.count({ where })
    ]);

    return NextResponse.json({
      itens,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('Erro ao buscar itens de tombamento:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    const body = await request.json();
    
    // Verificar se é uma movimentação ou um novo item
    if (body.itemTombamentoId) {
      // É uma movimentação
      const validatedData = movimentacaoTombamentoSchema.parse(body);
      
      // Buscar o colaborador do usuário logado
      const colaborador = await prisma.colaborador.findFirst({
        where: { usuarioId: session.user.id }
      });

      if (!colaborador) {
        return NextResponse.json(
          { error: 'Colaborador não encontrado' },
          { status: 404 }
        );
      }

      // Verificar se o item existe
      const item = await prisma.itemTombamento.findUnique({
        where: { id: validatedData.itemTombamentoId }
      });

      if (!item) {
        return NextResponse.json(
          { error: 'Item de tombamento não encontrado' },
          { status: 404 }
        );
      }

      // Criar a movimentação
      const movimentacao = await prisma.movimentacaoTombamento.create({
        data: {
          itemTombamentoId: validatedData.itemTombamentoId,
          tipo: validatedData.tipo,
          localizacaoOrigem: validatedData.localizacaoOrigem || item.localizacao,
          localizacaoDestino: validatedData.localizacaoDestino,
          responsavelOrigem: validatedData.responsavelOrigem || item.responsavel,
          responsavelDestino: validatedData.responsavelDestino,
          observacoes: validatedData.observacoes,
          documentoReferencia: validatedData.documentoReferencia,
          responsavelId: colaborador.id
        },
        include: {
          itemTombamento: {
            select: { id: true, numeroTombamento: true, descricao: true }
          },
          responsavel: {
            select: { id: true, nome: true, email: true }
          }
        }
      });

      // Atualizar o item se necessário
      const updateData: any = {};
      if (validatedData.localizacaoDestino) {
        updateData.localizacao = validatedData.localizacaoDestino;
      }
      if (validatedData.responsavelDestino) {
        updateData.responsavel = validatedData.responsavelDestino;
      }
      if (validatedData.tipo === 'BAIXA') {
        updateData.status = 'BAIXADO';
        updateData.dataBaixa = new Date();
      }

      if (Object.keys(updateData).length > 0) {
        await prisma.itemTombamento.update({
          where: { id: validatedData.itemTombamentoId },
          data: updateData
        });
      }

      return NextResponse.json(movimentacao, { status: 201 });
    } else {
      // É um novo item
      const validatedData = itemTombamentoSchema.parse(body);

      // Verificar se o número de tombamento já existe
      const existingItem = await prisma.itemTombamento.findUnique({
        where: { numeroTombamento: validatedData.numeroTombamento }
      });

      if (existingItem) {
        return NextResponse.json(
          { error: 'Número de tombamento já existe' },
          { status: 400 }
        );
      }

      // Verificar se o centro de custo existe
      const centroCusto = await prisma.centroCusto.findUnique({
        where: { id: validatedData.centroCustoId }
      });

      if (!centroCusto) {
        return NextResponse.json(
          { error: 'Centro de custo não encontrado' },
          { status: 404 }
        );
      }

      // Verificar se o fornecedor existe (se informado)
      if (validatedData.fornecedorId) {
        const fornecedor = await prisma.fornecedor.findUnique({
          where: { id: validatedData.fornecedorId }
        });

        if (!fornecedor) {
          return NextResponse.json(
            { error: 'Fornecedor não encontrado' },
            { status: 404 }
          );
        }
      }

      // Criar o item de tombamento
      const item = await prisma.itemTombamento.create({
        data: {
          numeroTombamento: validatedData.numeroTombamento,
          descricao: validatedData.descricao,
          categoria: validatedData.categoria,
          marca: validatedData.marca,
          modelo: validatedData.modelo,
          numeroSerie: validatedData.numeroSerie,
          valorAquisicao: validatedData.valorAquisicao,
          dataAquisicao: new Date(validatedData.dataAquisicao),
          fornecedorId: validatedData.fornecedorId,
          centroCustoId: validatedData.centroCustoId,
          localizacao: validatedData.localizacao,
          responsavel: validatedData.responsavel,
          observacoes: validatedData.observacoes,
          garantiaMeses: validatedData.garantiaMeses,
          vidaUtilAnos: validatedData.vidaUtilAnos,
          status: 'ATIVO'
        },
        include: {
          fornecedor: {
            select: { id: true, nome: true, documento: true }
          },
          centroCusto: {
            select: { id: true, nome: true, codigo: true }
          }
        }
      });

      return NextResponse.json(item, { status: 201 });
    }
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Dados inválidos', details: error.errors },
        { status: 400 }
      );
    }

    console.error('Erro ao processar tombamento:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}
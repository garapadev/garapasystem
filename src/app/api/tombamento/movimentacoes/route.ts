import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';

const movimentacaoSchema = z.object({
  itemId: z.string().min(1, 'Item é obrigatório'),
  tipo: z.enum(['TRANSFERENCIA', 'MANUTENCAO', 'BAIXA'], {
    errorMap: () => ({ message: 'Tipo deve ser TRANSFERENCIA, MANUTENCAO ou BAIXA' })
  }),
  localizacaoOrigem: z.string().min(1, 'Localização de origem é obrigatória'),
  localizacaoDestino: z.string().optional(),
  observacoes: z.string().optional(),
  responsavelId: z.string().min(1, 'Responsável é obrigatório')
});

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
      up.permissao.recurso === 'tombamento' && up.permissao.acao === 'create'
    );

    if (!hasPermission) {
      return NextResponse.json(
        { error: 'Sem permissão para criar movimentações' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const validatedData = movimentacaoSchema.parse(body);

    // Verificar se o item existe
    const item = await prisma.itemTombamento.findUnique({
      where: { id: validatedData.itemId }
    });

    if (!item) {
      return NextResponse.json(
        { error: 'Item não encontrado' },
        { status: 404 }
      );
    }

    // Verificar se o responsável existe
    const responsavel = await prisma.usuario.findUnique({
      where: { id: validatedData.responsavelId }
    });

    if (!responsavel) {
      return NextResponse.json(
        { error: 'Responsável não encontrado' },
        { status: 404 }
      );
    }

    // Validar localização de destino para transferência
    if (validatedData.tipo === 'TRANSFERENCIA' && !validatedData.localizacaoDestino) {
      return NextResponse.json(
        { error: 'Localização de destino é obrigatória para transferência' },
        { status: 400 }
      );
    }

    // Criar a movimentação
    const movimentacao = await prisma.movimentacaoTombamento.create({
      data: {
        itemId: validatedData.itemId,
        tipo: validatedData.tipo,
        localizacaoOrigem: validatedData.localizacaoOrigem,
        localizacaoDestino: validatedData.localizacaoDestino,
        observacoes: validatedData.observacoes,
        responsavelId: validatedData.responsavelId,
        dataMovimentacao: new Date()
      },
      include: {
        item: {
          select: {
            numeroTombamento: true,
            descricao: true
          }
        },
        responsavel: {
          select: {
            nome: true,
            email: true
          }
        }
      }
    });

    // Atualizar a localização do item se for transferência
    if (validatedData.tipo === 'TRANSFERENCIA' && validatedData.localizacaoDestino) {
      await prisma.itemTombamento.update({
        where: { id: validatedData.itemId },
        data: { localizacao: validatedData.localizacaoDestino }
      });
    }

    // Atualizar status do item se for baixa
    if (validatedData.tipo === 'BAIXA') {
      await prisma.itemTombamento.update({
        where: { id: validatedData.itemId },
        data: { status: 'BAIXADO' }
      });
    }

    return NextResponse.json(movimentacao, { status: 201 });

  } catch (error) {
    console.error('Erro ao criar movimentação:', error);
    
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

export async function GET(request: NextRequest) {
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
      up.permissao.recurso === 'tombamento' && up.permissao.acao === 'read'
    );

    if (!hasPermission) {
      return NextResponse.json(
        { error: 'Sem permissão para visualizar movimentações' },
        { status: 403 }
      );
    }

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const search = searchParams.get('search') || '';
    const tipo = searchParams.get('tipo') || '';
    const itemId = searchParams.get('itemId') || '';

    const skip = (page - 1) * limit;

    // Construir filtros
    const where: any = {};

    if (search) {
      where.OR = [
        {
          item: {
            numeroTombamento: {
              contains: search,
              mode: 'insensitive'
            }
          }
        },
        {
          item: {
            descricao: {
              contains: search,
              mode: 'insensitive'
            }
          }
        },
        {
          observacoes: {
            contains: search,
            mode: 'insensitive'
          }
        }
      ];
    }

    if (tipo) {
      where.tipo = tipo;
    }

    if (itemId) {
      where.itemId = itemId;
    }

    // Buscar movimentações
    const [movimentacoes, total] = await Promise.all([
      prisma.movimentacaoTombamento.findMany({
        where,
        include: {
          item: {
            select: {
              numeroTombamento: true,
              descricao: true
            }
          },
          responsavel: {
            select: {
              nome: true,
              email: true
            }
          }
        },
        orderBy: { dataMovimentacao: 'desc' },
        skip,
        take: limit
      }),
      prisma.movimentacaoTombamento.count({ where })
    ]);

    return NextResponse.json({
      movimentacoes,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit)
      }
    });

  } catch (error) {
    console.error('Erro ao buscar movimentações:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}
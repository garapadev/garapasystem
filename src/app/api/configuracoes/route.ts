import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const chave = searchParams.get('chave');

    if (chave) {
      // Buscar configuração específica por chave
      const configuracao = await db.configuracao.findUnique({
        where: { chave }
      });

      if (!configuracao) {
        return NextResponse.json(
          { error: 'Configuração não encontrada' },
          { status: 404 }
        );
      }

      return NextResponse.json(configuracao);
    }

    // Buscar todas as configurações
    const configuracoes = await db.configuracao.findMany({
      orderBy: {
        chave: 'asc'
      }
    });

    return NextResponse.json(configuracoes);
  } catch (error) {
    console.error('Erro ao buscar configurações:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { chave, valor, descricao } = body;

    if (!chave || !valor) {
      return NextResponse.json(
        { error: 'Chave e valor são obrigatórios' },
        { status: 400 }
      );
    }

    const configuracao = await db.configuracao.create({
      data: {
        chave,
        valor,
        descricao
      }
    });

    return NextResponse.json(configuracao, { status: 201 });
  } catch (error: any) {
    console.error('Erro ao criar configuração:', error);
    
    if (error.code === 'P2002') {
      return NextResponse.json(
        { error: 'Configuração com esta chave já existe' },
        { status: 409 }
      );
    }

    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { chave, valor, descricao } = body;

    if (!chave || !valor) {
      return NextResponse.json(
        { error: 'Chave e valor são obrigatórios' },
        { status: 400 }
      );
    }

    // Verificar se a configuração existe
    const configuracaoExistente = await db.configuracao.findUnique({
      where: { chave }
    });

    if (!configuracaoExistente) {
      // Se não existe, criar nova
      const novaConfiguracao = await db.configuracao.create({
        data: {
          chave,
          valor,
          descricao
        }
      });
      return NextResponse.json(novaConfiguracao, { status: 201 });
    }

    // Se existe, atualizar
    const configuracaoAtualizada = await db.configuracao.update({
      where: { chave },
      data: {
        valor,
        descricao
      }
    });

    return NextResponse.json(configuracaoAtualizada);
  } catch (error) {
    console.error('Erro ao atualizar configuração:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}
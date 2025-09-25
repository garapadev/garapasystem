import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session) {
      return NextResponse.json(
        { error: 'Não autorizado' },
        { status: 401 }
      );
    }

    // Buscar dados da empresa (deve haver apenas um registro)
    const empresa = await db.empresa.findFirst({
      where: { ativo: true }
    });

    if (!empresa) {
      return NextResponse.json(
        { error: 'Dados da empresa não encontrados' },
        { status: 404 }
      );
    }

    return NextResponse.json(empresa);
  } catch (error) {
    console.error('Erro ao buscar dados da empresa:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session) {
      return NextResponse.json(
        { error: 'Não autorizado' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const {
      razaoSocial,
      nomeFantasia,
      cnpj,
      inscricaoEstadual,
      inscricaoMunicipal,
      email,
      telefone,
      celular,
      website,
      cep,
      logradouro,
      numero,
      complemento,
      bairro,
      cidade,
      estado,
      pais,
      banco,
      agencia,
      conta,
      tipoConta,
      pix,
      logo,
      cor_primaria,
      cor_secundaria,
      observacoes
    } = body;

    if (!razaoSocial) {
      return NextResponse.json(
        { error: 'Razão social é obrigatória' },
        { status: 400 }
      );
    }

    // Verificar se já existe uma empresa ativa
    const empresaExistente = await db.empresa.findFirst({
      where: { ativo: true }
    });

    let empresa;

    if (empresaExistente) {
      // Atualizar empresa existente
      empresa = await db.empresa.update({
        where: { id: empresaExistente.id },
        data: {
          razaoSocial,
          nomeFantasia,
          cnpj,
          inscricaoEstadual,
          inscricaoMunicipal,
          email,
          telefone,
          celular,
          website,
          cep,
          logradouro,
          numero,
          complemento,
          bairro,
          cidade,
          estado,
          pais,
          banco,
          agencia,
          conta,
          tipoConta,
          pix,
          logo,
          cor_primaria,
          cor_secundaria,
          observacoes,
          updatedAt: new Date()
        }
      });
    } else {
      // Criar nova empresa
      empresa = await db.empresa.create({
        data: {
          razaoSocial,
          nomeFantasia,
          cnpj,
          inscricaoEstadual,
          inscricaoMunicipal,
          email,
          telefone,
          celular,
          website,
          cep,
          logradouro,
          numero,
          complemento,
          bairro,
          cidade,
          estado,
          pais: pais || 'Brasil',
          banco,
          agencia,
          conta,
          tipoConta,
          pix,
          logo,
          cor_primaria,
          cor_secundaria,
          observacoes,
          ativo: true
        }
      });
    }

    return NextResponse.json(empresa, { status: empresaExistente ? 200 : 201 });
  } catch (error) {
    console.error('Erro ao salvar dados da empresa:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session) {
      return NextResponse.json(
        { error: 'Não autorizado' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { id, ...dadosAtualizacao } = body;

    if (!id) {
      return NextResponse.json(
        { error: 'ID da empresa é obrigatório' },
        { status: 400 }
      );
    }

    const empresa = await db.empresa.update({
      where: { id },
      data: {
        ...dadosAtualizacao,
        updatedAt: new Date()
      }
    });

    return NextResponse.json(empresa);
  } catch (error) {
    console.error('Erro ao atualizar dados da empresa:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}
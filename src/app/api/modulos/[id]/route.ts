import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

interface RouteParams {
  params: {
    id: string;
  };
}

export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      return NextResponse.json(
        { error: 'Não autorizado' },
        { status: 401 }
      );
    }

    const modulo = await db.moduloSistema.findUnique({
      where: { id: params.id },
      include: {
        logs: {
          orderBy: {
            createdAt: 'desc'
          },
          include: {
            autor: {
              select: {
                id: true,
                nome: true
              }
            }
          }
        }
      }
    });

    if (!modulo) {
      return NextResponse.json(
        { error: 'Módulo não encontrado' },
        { status: 404 }
      );
    }

    return NextResponse.json(modulo);
  } catch (error) {
    console.error('Erro ao buscar módulo:', error);
    return NextResponse.json(
      { error: 'Erro ao buscar módulo' },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest, { params }: RouteParams) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      return NextResponse.json(
        { error: 'Não autorizado' },
        { status: 401 }
      );
    }

    const usuario = await db.usuario.findUnique({
      where: { email: session.user.email! },
      include: {
        colaborador: true
      }
    });

    if (!usuario) {
      return NextResponse.json(
        { error: 'Usuário não encontrado' },
        { status: 404 }
      );
    }

    const body = await request.json();
    const { id } = await params;

    // Buscar módulo atual
    const moduloAtual = await db.moduloSistema.findUnique({
      where: { id }
    });

    if (!moduloAtual) {
      return NextResponse.json(
        { error: 'Módulo não encontrado' },
        { status: 404 }
      );
    }

    // Verificar se é um módulo core e se está tentando desativar
    if (moduloAtual.core && body.ativo === false) {
      return NextResponse.json(
        { error: 'Módulos core não podem ser desativados' },
        { status: 400 }
      );
    }

    // Se mudando o nome, verificar se já existe
    if (body.nome && body.nome !== moduloAtual.nome) {
      const existingModulo = await db.moduloSistema.findUnique({
        where: { nome: body.nome }
      });

      if (existingModulo) {
        return NextResponse.json(
          { error: 'Nome do módulo já existe' },
          { status: 400 }
        );
      }
    }

    // Preparar dados para atualização
    const updateData: any = {};
    const changes: string[] = [];

    if (body.titulo && body.titulo !== moduloAtual.titulo) {
      updateData.titulo = body.titulo;
      changes.push(`Título alterado de '${moduloAtual.titulo}' para '${body.titulo}'`);
    }

    if (body.nome && body.nome !== moduloAtual.nome) {
      updateData.nome = body.nome;
      changes.push(`Nome alterado de '${moduloAtual.nome}' para '${body.nome}'`);
    }

    if (typeof body.ativo === 'boolean' && body.ativo !== moduloAtual.ativo) {
      updateData.ativo = body.ativo;
      changes.push(`Status alterado para ${body.ativo ? 'ativo' : 'inativo'}`);
    }

    if (body.icone && body.icone !== moduloAtual.icone) {
      updateData.icone = body.icone;
      changes.push(`Ícone alterado`);
    }

    if (typeof body.ordem === 'number' && body.ordem !== moduloAtual.ordem) {
      updateData.ordem = body.ordem;
      changes.push(`Ordem alterada de ${moduloAtual.ordem} para ${body.ordem}`);
    }

    if (body.permissao !== moduloAtual.permissao) {
      updateData.permissao = body.permissao;
      changes.push(`Permissão alterada`);
    }

    if (body.rota && body.rota !== moduloAtual.rota) {
      updateData.rota = body.rota;
      changes.push(`Rota alterada de '${moduloAtual.rota}' para '${body.rota}'`);
    }

    if (body.categoria !== moduloAtual.categoria) {
      updateData.categoria = body.categoria;
      changes.push(`Categoria alterada`);
    }

    // Se não há mudanças, retornar o módulo atual
    if (Object.keys(updateData).length === 0) {
      return NextResponse.json(moduloAtual);
    }

    // Atualizar o módulo
    const modulo = await db.moduloSistema.update({
      where: { id },
      data: updateData,
      include: {
        logs: {
          orderBy: {
            createdAt: 'desc'
          },
          include: {
            autor: {
              select: {
                id: true,
                nome: true
              }
            }
          }
        }
      }
    });

    // Registrar log de alteração
    if (changes.length > 0) {
      await db.moduloSistemaLog.create({
        data: {
          moduloId: modulo.id,
          acao: 'ATUALIZADO',
          valorAnterior: JSON.stringify(moduloAtual),
          valorNovo: JSON.stringify(modulo),
          observacoes: changes.join('; '),
          autorId: usuario?.colaborador?.id,
          autorNome: usuario?.colaborador?.nome || usuario?.nome || 'Sistema',
          autorEmail: usuario?.email || 'sistema@garapasystem.com'
        }
      });
    }

    return NextResponse.json(modulo);
  } catch (error) {
    console.error('Erro ao atualizar módulo:', error);
    return NextResponse.json(
      { error: 'Erro ao atualizar módulo' },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      return NextResponse.json(
        { error: 'Não autorizado' },
        { status: 401 }
      );
    }

    // Verificar se o usuário tem permissão de administrador
    const usuario = await db.usuario.findUnique({
      where: { id: session.user.id },
      include: {
        colaborador: {
          include: {
            perfil: {
              include: {
                permissoes: {
                  include: {
                    permissao: true
                  }
                }
              }
            }
          }
        }
      }
    });

    const isAdmin = usuario?.admin || 
      usuario?.colaborador?.perfil?.permissoes.some(
        p => p.permissao.nome === 'admin.modules'
      );

    if (!isAdmin) {
      return NextResponse.json(
        { error: 'Permissão insuficiente' },
        { status: 403 }
      );
    }

    // Buscar módulo
    const modulo = await db.moduloSistema.findUnique({
      where: { id: params.id }
    });

    if (!modulo) {
      return NextResponse.json(
        { error: 'Módulo não encontrado' },
        { status: 404 }
      );
    }

    // Verificar se é um módulo core
    if (modulo.core) {
      return NextResponse.json(
        { error: 'Módulos core não podem ser excluídos' },
        { status: 400 }
      );
    }

    // Registrar log de exclusão antes de deletar
    await db.moduloSistemaLog.create({
      data: {
        moduloId: modulo.id,
        acao: 'EXCLUIDO',
        detalhes: `Módulo '${modulo.titulo}' excluído`,
        autorId: usuario?.colaborador?.id,
      }
    });

    // Deletar o módulo (os logs serão deletados em cascata)
    await db.moduloSistema.delete({
      where: { id: params.id }
    });

    return NextResponse.json({ message: 'Módulo excluído com sucesso' });
  } catch (error) {
    console.error('Erro ao excluir módulo:', error);
    return NextResponse.json(
      { error: 'Erro ao excluir módulo' },
      { status: 500 }
    );
  }
}
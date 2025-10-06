import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

export async function POST(request: NextRequest) {
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

    const body = await request.json();
    const { action, moduleIds } = body;

    if (!action || !moduleIds || !Array.isArray(moduleIds)) {
      return NextResponse.json(
        { error: 'Ação e IDs dos módulos são obrigatórios' },
        { status: 400 }
      );
    }

    if (!['activate', 'deactivate', 'delete'].includes(action)) {
      return NextResponse.json(
        { error: 'Ação inválida' },
        { status: 400 }
      );
    }

    // Buscar módulos selecionados
    const modulos = await db.moduloSistema.findMany({
      where: {
        id: {
          in: moduleIds
        }
      }
    });

    if (modulos.length === 0) {
      return NextResponse.json(
        { error: 'Nenhum módulo encontrado' },
        { status: 404 }
      );
    }

    // Verificar se há módulos core na seleção para operações que não são permitidas
    const coreModules = modulos.filter(m => m.core);
    
    if ((action === 'deactivate' || action === 'delete') && coreModules.length > 0) {
      return NextResponse.json(
        { 
          error: `Módulos core não podem ser ${action === 'deactivate' ? 'desativados' : 'excluídos'}: ${coreModules.map(m => m.titulo).join(', ')}` 
        },
        { status: 400 }
      );
    }

    const results = [];
    const logs = [];

    for (const modulo of modulos) {
      try {
        let result;
        let logAction;
        let logDetails;

        switch (action) {
          case 'activate':
            if (!modulo.ativo) {
              result = await db.moduloSistema.update({
                where: { id: modulo.id },
                data: { ativo: true }
              });
              logAction = 'ATIVADO';
              logDetails = `Módulo '${modulo.titulo}' ativado em lote`;
            } else {
              result = modulo;
            }
            break;

          case 'deactivate':
            if (modulo.ativo && !modulo.core) {
              result = await db.moduloSistema.update({
                where: { id: modulo.id },
                data: { ativo: false }
              });
              logAction = 'DESATIVADO';
              logDetails = `Módulo '${modulo.titulo}' desativado em lote`;
            } else {
              result = modulo;
            }
            break;

          case 'delete':
            if (!modulo.core) {
              logAction = 'EXCLUIDO';
              logDetails = `Módulo '${modulo.titulo}' excluído em lote`;
              
              // Criar log antes de deletar
              logs.push({
                moduloId: modulo.id,
                acao: logAction,
                detalhes: logDetails,
                autorId: usuario?.colaborador?.id,
              });

              await db.moduloSistema.delete({
                where: { id: modulo.id }
              });
              
              result = { id: modulo.id, deleted: true };
            } else {
              result = modulo;
            }
            break;
        }

        results.push(result);

        // Adicionar log para ações que não são delete (delete já foi adicionado acima)
        if (logAction && action !== 'delete') {
          logs.push({
            moduloId: modulo.id,
            acao: logAction,
            detalhes: logDetails,
            autorId: usuario?.colaborador?.id,
          });
        }
      } catch (error) {
        console.error(`Erro ao processar módulo ${modulo.id}:`, error);
        results.push({
          id: modulo.id,
          error: 'Erro ao processar módulo'
        });
      }
    }

    // Criar logs em lote
    if (logs.length > 0) {
      await db.moduloSistemaLog.createMany({
        data: logs
      });
    }

    return NextResponse.json({
      message: `Operação ${action} executada com sucesso`,
      results,
      processed: results.length,
      errors: results.filter(r => r.error).length
    });

  } catch (error) {
    console.error('Erro na operação em lote:', error);
    return NextResponse.json(
      { error: 'Erro na operação em lote' },
      { status: 500 }
    );
  }
}
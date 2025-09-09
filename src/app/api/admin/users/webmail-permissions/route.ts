import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { db } from '@/lib/db';
import { WebmailSecurity } from '@/lib/webmail-security';
import { WEBMAIL_PERMISSIONS } from '@/lib/permissions/webmail-permissions';

// GET /api/admin/users/webmail-permissions
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Não autorizado' },
        { status: 401 }
      );
    }

    // Verificar se o usuário tem permissão para visualizar permissões
    const accessValidation = await WebmailSecurity.validateEndpointAccess(
      request,
      '/api/admin/users/webmail-permissions'
    );
    const hasPermission = accessValidation.allowed;

    if (!hasPermission) {
      return NextResponse.json(
        { error: 'Permissão insuficiente' },
        { status: 403 }
      );
    }

    // Buscar colaboradores com suas permissões do webmail
    const colaboradores = await db.colaborador.findMany({
      include: {
        usuarios: {
          select: {
            id: true,
            nome: true,
            email: true
          }
        },
        perfil: {
          include: {
            permissoes: {
              include: {
                permissao: true
              },
              where: {
                permissao: {
                  nome: {
                    in: Object.values(WEBMAIL_PERMISSIONS)
                  }
                }
              }
            }
          }
        }
      },
      orderBy: {
        id: 'asc'
      }
    });

    // Mapear dados dos colaboradores com suas permissões
    const filteredUsers = colaboradores
      .filter(colaborador => colaborador.usuarios.length > 0)
      .map(colaborador => {
        const user = colaborador.usuarios[0];
        const webmailPermissions = colaborador.perfil?.permissoes.map(pp => pp.permissao.nome) || [];
        
        return {
          id: colaborador.id,
          nome: user.nome,
          email: user.email,
          perfil: colaborador.perfil ? {
            id: colaborador.perfil.id,
            nome: colaborador.perfil.nome,
            permissoes: colaborador.perfil.permissoes
          } : null,
          webmailPermissions,
          hasWebmailAccess: webmailPermissions.length > 0
        };
      })
      .filter(user => user.hasWebmailAccess || user.perfil?.nome === 'Administrador');

    // Log da operação seria implementado aqui

    return NextResponse.json({
      users: filteredUsers,
      total: filteredUsers.length
    });

  } catch (error) {
    console.error('Erro ao buscar usuários com permissões do webmail:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}

// POST /api/admin/users/webmail-permissions
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Não autorizado' },
        { status: 401 }
      );
    }

    // Verificar se o usuário tem permissão para gerenciar usuários
    const accessValidation = await WebmailSecurity.validateEndpointAccess(
      request,
      '/api/admin/users/webmail-permissions'
    );
    const hasPermission = accessValidation.allowed;

    if (!hasPermission) {
      return NextResponse.json(
        { error: 'Permissão insuficiente' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { userId, permissions } = body;

    if (!userId || !Array.isArray(permissions)) {
      return NextResponse.json(
        { error: 'Dados inválidos' },
        { status: 400 }
      );
    }

    // Validar se as permissões são válidas
    const validPermissions = permissions.filter(permission => 
      Object.values(WEBMAIL_PERMISSIONS).includes(permission)
    );

    if (validPermissions.length !== permissions.length) {
      return NextResponse.json(
        { error: 'Permissões inválidas detectadas' },
        { status: 400 }
      );
    }

    // Verificar se o colaborador existe
    const targetColaborador = await db.colaborador.findUnique({
      where: { id: userId },
      include: {
        usuarios: {
          select: {
            id: true,
            nome: true,
            email: true
          }
        },
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
    });

    if (!targetColaborador || targetColaborador.usuarios.length === 0) {
      return NextResponse.json(
        { error: 'Colaborador não encontrado' },
        { status: 404 }
      );
    }

    const targetUser = targetColaborador.usuarios[0];

    // Buscar IDs das permissões do webmail
    const webmailPermissionRecords = await db.permissao.findMany({
      where: {
        nome: {
          in: Object.values(WEBMAIL_PERMISSIONS)
        }
      }
    });

    const webmailPermissionIds = webmailPermissionRecords
      .filter(p => validPermissions.includes(p.nome))
      .map(p => p.id);

    if (!targetColaborador.perfil) {
      return NextResponse.json(
        { error: 'Colaborador sem perfil definido' },
        { status: 400 }
      );
    }

    // Remover permissões antigas do webmail
    const currentWebmailPermissions = targetColaborador.perfil.permissoes
      .filter(pp => Object.values(WEBMAIL_PERMISSIONS).includes(pp.permissao.nome as any))
      .map(pp => pp.permissao.id);

    if (currentWebmailPermissions.length > 0) {
      await db.perfilPermissao.deleteMany({
        where: {
          perfilId: targetColaborador.perfil.id,
          permissaoId: {
            in: currentWebmailPermissions
          }
        }
      });
    }

    // Adicionar novas permissões
    if (webmailPermissionIds.length > 0) {
      await db.perfilPermissao.createMany({
        data: webmailPermissionIds.map(permissaoId => ({
          perfilId: targetColaborador.perfil!.id,
          permissaoId
        }))
      });
    }

    // Log da operação seria implementado aqui

    return NextResponse.json({
      message: 'Permissões atualizadas com sucesso',
      userId,
      permissions: validPermissions
    });

  } catch (error) {
    console.error('Erro ao atualizar permissões do webmail:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}
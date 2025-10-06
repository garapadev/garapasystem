import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { db } from '@/lib/db';
import { WebmailSecurity } from '@/lib/webmail-security';
import { WEBMAIL_PERMISSIONS, WEBMAIL_ACCESS_LEVELS } from '@/lib/permissions/webmail-permissions';

// Usar métodos estáticos da classe WebmailSecurity

interface RouteParams {
  params: Promise<{
    userId: string;
  }>;
}

// GET /api/admin/users/[userId]/webmail-permissions
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Não autorizado' },
        { status: 401 }
      );
    }

    const { userId } = await params;
    
    if (!userId) {
      return NextResponse.json(
        { error: 'ID do usuário é obrigatório' },
        { status: 400 }
      );
    }

    // Verificar se o usuário tem permissão para visualizar permissões
    const accessValidation = await WebmailSecurity.validateEndpointAccess(
      request,
      `/api/admin/users/${userId}/webmail-permissions`
    );
    const hasPermission = accessValidation.allowed;

    if (!hasPermission) {
      return NextResponse.json(
        { error: 'Permissão insuficiente' },
        { status: 403 }
      );
    }

    // Buscar usuário através do colaborador
    const colaborador = await db.colaborador.findUnique({
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
                permissao: {
                  select: {
                    id: true,
                    nome: true,
                    recurso: true,
                    acao: true
                  }
                }
              }
            }
          }
        }
      }
    });

    if (!colaborador || !colaborador.usuarios[0]) {
      return NextResponse.json(
        { error: 'Usuário não encontrado' },
        { status: 404 }
      );
    }

    const user = colaborador.usuarios[0];

    // Filtrar apenas permissões do webmail
    const webmailPermissions = colaborador.perfil?.permissoes
      ?.filter(p => Object.values(WEBMAIL_PERMISSIONS).includes(p.permissao.nome as any))
      ?.map(p => p.permissao.nome) || [];

    return NextResponse.json({
      user: {
        id: user.id,
        nome: user.nome,
        email: user.email,
        perfil: colaborador.perfil?.nome
      },
      permissions: webmailPermissions,
      availablePermissions: Object.values(WEBMAIL_PERMISSIONS),
      accessLevels: WEBMAIL_ACCESS_LEVELS
    });

  } catch (error) {
    console.error('Erro ao buscar permissões do usuário:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}

// PUT /api/admin/users/[userId]/webmail-permissions
export async function PUT(request: NextRequest, { params }: RouteParams) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Não autorizado' },
        { status: 401 }
      );
    }

    const { userId } = await params;
    
    if (!userId) {
      return NextResponse.json(
        { error: 'ID do usuário é obrigatório' },
        { status: 400 }
      );
    }

    // Verificar se o usuário tem permissão para gerenciar permissões
    const accessValidation = await WebmailSecurity.validateEndpointAccess(
      request,
      `/api/admin/users/${userId}/webmail-permissions`
    );
    const hasPermission = accessValidation.allowed;

    if (!hasPermission) {
      return NextResponse.json(
        { error: 'Permissão insuficiente' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { permissions, accessLevel } = body;

    // Validar entrada
    if (!permissions && !accessLevel) {
      return NextResponse.json(
        { error: 'Permissões ou nível de acesso deve ser fornecido' },
        { status: 400 }
      );
    }

    let finalPermissions: string[] = [];

    if (accessLevel && Object.keys(WEBMAIL_ACCESS_LEVELS).includes(accessLevel)) {
      // Aplicar nível de acesso predefinido
      finalPermissions = WEBMAIL_ACCESS_LEVELS[accessLevel as keyof typeof WEBMAIL_ACCESS_LEVELS];
    } else if (Array.isArray(permissions)) {
      // Usar permissões específicas
      finalPermissions = permissions.filter(permission => 
        Object.values(WEBMAIL_PERMISSIONS).includes(permission)
      );
    } else {
      return NextResponse.json(
        { error: 'Formato de permissões inválido' },
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

    if (!targetColaborador || !targetColaborador.usuarios[0]) {
      return NextResponse.json(
        { error: 'Usuário não encontrado' },
        { status: 404 }
      );
    }

    if (!targetColaborador.perfil) {
      return NextResponse.json(
        { error: 'Usuário sem perfil definido' },
        { status: 400 }
      );
    }

    const targetUser = targetColaborador.usuarios[0];

    // Buscar permissões atuais do webmail
    const currentWebmailPermissions = targetColaborador.perfil.permissoes
      .filter(pp => Object.values(WEBMAIL_PERMISSIONS).includes(pp.permissao.nome as any))
      .map(pp => ({ id: pp.permissao.id, nome: pp.permissao.nome }));

    // Buscar registros das novas permissões
    const newPermissionRecords = await db.permissao.findMany({
      where: {
        nome: {
          in: finalPermissions
        }
      }
    });

    // Usar transação para garantir consistência
    await db.$transaction(async (tx) => {
      // Remover permissões antigas do webmail
      if (currentWebmailPermissions.length > 0) {
        await tx.perfilPermissao.deleteMany({
          where: {
            perfilId: targetColaborador.perfil!.id,
            permissaoId: {
              in: currentWebmailPermissions.map(p => p.id)
            }
          }
        });
      }

      // Adicionar novas permissões
      if (newPermissionRecords.length > 0) {
        await tx.perfilPermissao.createMany({
          data: newPermissionRecords.map(permissao => ({
            perfilId: targetColaborador.perfil!.id,
            permissaoId: permissao.id
          }))
        });
      }
    });

    // Log da operação seria implementado aqui

    return NextResponse.json({
      message: 'Permissões atualizadas com sucesso',
      user: {
        id: targetUser.id,
        nome: targetUser.nome,
        email: targetUser.email
      },
      permissions: finalPermissions,
      accessLevel: accessLevel || 'custom'
    });

  } catch (error) {
    console.error('Erro ao atualizar permissões do usuário:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}

// DELETE /api/admin/users/[userId]/webmail-permissions
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Não autorizado' },
        { status: 401 }
      );
    }

    const { userId } = params;

    // Verificar se o usuário tem permissão para remover permissões
    const accessValidation = await WebmailSecurity.validateEndpointAccess(
      request,
      `/api/admin/users/${userId}/webmail-permissions`
    );
    const hasPermission = accessValidation.allowed;

    if (!hasPermission) {
      return NextResponse.json(
        { error: 'Permissão insuficiente' },
        { status: 403 }
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

    if (!targetColaborador || !targetColaborador.usuarios[0]) {
      return NextResponse.json(
        { error: 'Usuário não encontrado' },
        { status: 404 }
      );
    }

    if (!targetColaborador.perfil) {
      return NextResponse.json(
        { error: 'Usuário sem perfil definido' },
        { status: 400 }
      );
    }

    const targetUser = targetColaborador.usuarios[0];

    // Buscar permissões atuais do webmail
    const currentWebmailPermissions = targetColaborador.perfil.permissoes
      .filter(pp => Object.values(WEBMAIL_PERMISSIONS).includes(pp.permissao.nome as any))
      .map(pp => ({ id: pp.permissao.id, nome: pp.permissao.nome }));

    if (currentWebmailPermissions.length === 0) {
      return NextResponse.json({
        message: 'Usuário não possui permissões do webmail para remover'
      });
    }

    // Remover todas as permissões do webmail
    await db.perfilPermissao.deleteMany({
      where: {
        perfilId: targetColaborador.perfil.id,
        permissaoId: {
          in: currentWebmailPermissions.map(p => p.id)
        }
      }
    });

    // Log da operação seria implementado aqui

    return NextResponse.json({
      message: 'Todas as permissões do webmail foram removidas com sucesso',
      user: {
        id: targetUser.id,
        nome: targetUser.nome,
        email: targetUser.email
      },
      removedPermissions: currentWebmailPermissions.map(p => p.nome)
    });

  } catch (error) {
    console.error('Erro ao remover permissões do usuário:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}
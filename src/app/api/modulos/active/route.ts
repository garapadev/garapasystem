import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      return NextResponse.json(
        { error: 'Não autorizado' },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const includePermissions = searchParams.get('includePermissions') === 'true';

    // Buscar módulos ativos ordenados
    const modulos = await db.ModuloSistema.findMany({
      where: {
        ativo: true
      },
      select: {
        id: true,
        nome: true,
        titulo: true,
        icone: true,
        ordem: true,
        rota: true,
        categoria: true,
        permissao: true,
        core: true,
        ativo: true
      },
      orderBy: [
        { ordem: 'asc' },
        { titulo: 'asc' }
      ]
    });

    // Se includePermissions for true, verificar permissões do usuário
    if (includePermissions) {
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

      const userPermissions = new Set(
        usuario?.colaborador?.perfil?.permissoes.map(p => p.permissao.nome) || []
      );

      // Adicionar permissões de admin se for admin
      if (usuario?.admin) {
        userPermissions.add('*'); // Admin tem todas as permissões
      }

      // Filtrar módulos baseado nas permissões
      const modulosComPermissao = modulos.map(modulo => ({
        ...modulo,
        hasPermission: !modulo.permissao || 
                      userPermissions.has('*') || 
                      userPermissions.has(modulo.permissao)
      }));

      return NextResponse.json({
        data: modulosComPermissao,
        userPermissions: Array.from(userPermissions),
        isAdmin: usuario?.admin || false
      });
    }

    return NextResponse.json({
      data: modulos
    });

  } catch (error) {
    console.error('Erro ao buscar módulos ativos:', error);
    return NextResponse.json(
      { error: 'Erro ao buscar módulos ativos' },
      { status: 500 }
    );
  }
}

// Cache para módulos ativos (para performance)
export async function HEAD(request: NextRequest) {
  try {
    // Retorna apenas o count e timestamp para cache
    const count = await db.moduloSistema.count({
      where: { ativo: true }
    });

    const lastUpdate = await db.moduloSistema.findFirst({
      where: { ativo: true },
      select: { updatedAt: true },
      orderBy: { updatedAt: 'desc' }
    });

    return new NextResponse(null, {
      status: 200,
      headers: {
        'X-Module-Count': count.toString(),
        'X-Last-Update': lastUpdate?.updatedAt.toISOString() || new Date().toISOString(),
        'Cache-Control': 'public, max-age=300' // Cache por 5 minutos
      }
    });

  } catch (error) {
    console.error('Erro ao verificar módulos ativos:', error);
    return new NextResponse(null, { status: 500 });
  }
}
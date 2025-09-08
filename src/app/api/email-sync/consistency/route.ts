import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { db } from '@/lib/db';
import { FolderConsistencyService, maintainAllFoldersConsistency } from '@/lib/email/folder-consistency';

// POST - Verificar e corrigir consistência para um usuário específico
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json(
        { error: 'Não autorizado' },
        { status: 401 }
      );
    }

    // Buscar colaborador e configuração de email
    const colaborador = await db.colaborador.findUnique({
      where: { email: session.user.email }
    });

    if (!colaborador) {
      return NextResponse.json(
        { error: 'Colaborador não encontrado' },
        { status: 404 }
      );
    }

    const emailConfig = await db.emailConfig.findUnique({
      where: { colaboradorId: colaborador.id }
    });

    if (!emailConfig) {
      return NextResponse.json(
        { error: 'Configuração de email não encontrada' },
        { status: 404 }
      );
    }

    if (!emailConfig.ativo || !emailConfig.syncEnabled) {
      return NextResponse.json(
        { error: 'Sincronização não está ativa' },
        { status: 400 }
      );
    }

    // Executar verificação e correção de consistência
    const consistencyService = new FolderConsistencyService(emailConfig.id);
    const result = await consistencyService.maintainConsistency();

    if (!result.success) {
      return NextResponse.json(
        { 
          error: 'Falha na verificação de consistência',
          details: result.error
        },
        { status: 500 }
      );
    }

    // Atualizar timestamp da última verificação
    await db.emailConfig.update({
      where: { id: emailConfig.id },
      data: { lastSync: new Date() }
    });

    return NextResponse.json({
      success: true,
      message: 'Verificação de consistência concluída',
      report: {
        totalFolders: result.report.localFolders.length,
        inconsistenciesFound: result.report.inconsistentCounts.length,
        foldersFixed: result.fixes?.foldersFixed || 0,
        emailsResynced: result.fixes?.emailsResynced || 0,
        errors: result.fixes?.errors || []
      },
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Erro na verificação de consistência:', error);
    return NextResponse.json(
      { 
        error: 'Erro interno do servidor',
        details: error instanceof Error ? error.message : 'Erro desconhecido'
      },
      { status: 500 }
    );
  }
}

// GET - Verificar status de consistência sem correções
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json(
        { error: 'Não autorizado' },
        { status: 401 }
      );
    }

    // Buscar colaborador e configuração de email
    const colaborador = await db.colaborador.findUnique({
      where: { email: session.user.email }
    });

    if (!colaborador) {
      return NextResponse.json(
        { error: 'Colaborador não encontrado' },
        { status: 404 }
      );
    }

    const emailConfig = await db.emailConfig.findUnique({
      where: { colaboradorId: colaborador.id }
    });

    if (!emailConfig) {
      return NextResponse.json(
        { error: 'Configuração de email não encontrada' },
        { status: 404 }
      );
    }

    if (!emailConfig.ativo) {
      return NextResponse.json(
        { error: 'Configuração de email não está ativa' },
        { status: 400 }
      );
    }

    // Apenas verificar consistência, sem correções
    const consistencyService = new FolderConsistencyService(emailConfig.id);
    const report = await consistencyService.checkConsistency();

    return NextResponse.json({
      success: true,
      report: {
        totalFolders: report.localFolders.length,
        folders: report.localFolders.map(folder => ({
          id: folder.id,
          name: folder.name,
          path: folder.path,
          totalMessages: folder.totalMessages,
          unreadMessages: folder.unreadMessages,
          lastSync: folder.updatedAt
        })),
        inconsistencies: report.inconsistentCounts.map(inc => ({
          folderPath: inc.folderPath,
          localCount: inc.localCount,
          remoteCount: inc.remoteCount,
          difference: Math.abs(inc.localCount - inc.remoteCount)
        })),
        hasInconsistencies: report.inconsistentCounts.length > 0
      },
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Erro ao verificar status de consistência:', error);
    return NextResponse.json(
      { 
        error: 'Erro interno do servidor',
        details: error instanceof Error ? error.message : 'Erro desconhecido'
      },
      { status: 500 }
    );
  }
}

// PUT - Executar manutenção global (admin apenas)
export async function PUT(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json(
        { error: 'Não autorizado' },
        { status: 401 }
      );
    }

    // Verificar se é admin (você pode ajustar esta lógica conforme necessário)
    const colaborador = await db.colaborador.findUnique({
      where: { email: session.user.email },
      include: { perfil: true }
    });

    if (!colaborador || colaborador.perfil?.nome !== 'Admin') {
      return NextResponse.json(
        { error: 'Acesso negado - apenas administradores' },
        { status: 403 }
      );
    }

    // Executar manutenção global
    const result = await maintainAllFoldersConsistency();

    return NextResponse.json({
      success: true,
      message: 'Manutenção global de consistência concluída',
      summary: {
        totalConfigs: result.totalConfigs,
        successfulConfigs: result.successfulConfigs,
        failedConfigs: result.totalConfigs - result.successfulConfigs,
        errors: result.errors
      },
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Erro na manutenção global:', error);
    return NextResponse.json(
      { 
        error: 'Erro interno do servidor',
        details: error instanceof Error ? error.message : 'Erro desconhecido'
      },
      { status: 500 }
    );
  }
}
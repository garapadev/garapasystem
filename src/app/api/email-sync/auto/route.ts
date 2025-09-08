import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { db as prisma } from '@/lib/db';
import { emailSyncScheduler } from '@/lib/email/sync-scheduler';

// Iniciar sincronização automática
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    // Buscar colaborador pelo email da sessão
    const colaborador = await prisma.colaborador.findFirst({
      where: {
        usuarios: {
          some: {
            email: session.user.email
          }
        }
      }
    });

    if (!colaborador) {
      return NextResponse.json({ error: 'Colaborador não encontrado' }, { status: 404 });
    }

    // Buscar configuração de email do colaborador
    const emailConfig = await prisma.emailConfig.findUnique({
      where: {
        colaboradorId: colaborador.id
      }
    });

    if (!emailConfig) {
      return NextResponse.json({ error: 'Configuração de email não encontrada' }, { status: 404 });
    }

    if (!emailConfig.ativo) {
      return NextResponse.json({ error: 'Configuração de email desativada' }, { status: 400 });
    }

    // Iniciar sincronização automática
    const success = await emailSyncScheduler.startSyncForUser(colaborador.id);
    
    if (success) {
      return NextResponse.json({ 
        success: true, 
        message: 'Sincronização automática iniciada',
        syncInterval: emailConfig.syncInterval || 180
      });
    } else {
      return NextResponse.json({ 
        error: 'Falha ao iniciar sincronização automática' 
      }, { status: 500 });
    }
  } catch (error) {
    console.error('Erro ao iniciar sincronização automática:', error);
    return NextResponse.json(
      { 
        error: 'Erro interno do servidor', 
        details: error instanceof Error ? error.message : 'Erro desconhecido'
      },
      { status: 500 }
    );
  }
}

// Parar sincronização automática
export async function DELETE(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    // Buscar colaborador pelo email da sessão
    const colaborador = await prisma.colaborador.findFirst({
      where: {
        usuarios: {
          some: {
            email: session.user.email
          }
        }
      }
    });

    if (!colaborador) {
      return NextResponse.json({ error: 'Colaborador não encontrado' }, { status: 404 });
    }

    // Buscar configuração de email do colaborador
    const emailConfig = await prisma.emailConfig.findUnique({
      where: {
        colaboradorId: colaborador.id
      }
    });

    if (!emailConfig) {
      return NextResponse.json({ error: 'Configuração de email não encontrada' }, { status: 404 });
    }

    // Parar sincronização automática
    const success = emailSyncScheduler.stopSyncForUser(colaborador.id);
    
    return NextResponse.json({ 
      success: true, 
      message: success ? 'Sincronização automática parada' : 'Nenhuma sincronização ativa encontrada'
    });
  } catch (error) {
    console.error('Erro ao parar sincronização automática:', error);
    return NextResponse.json(
      { 
        error: 'Erro interno do servidor', 
        details: error instanceof Error ? error.message : 'Erro desconhecido'
      },
      { status: 500 }
    );
  }
}

// Verificar status da sincronização automática
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    // Buscar colaborador pelo email da sessão
    const colaborador = await prisma.colaborador.findFirst({
      where: {
        usuarios: {
          some: {
            email: session.user.email
          }
        }
      }
    });

    if (!colaborador) {
      return NextResponse.json({ error: 'Colaborador não encontrado' }, { status: 404 });
    }

    // Buscar configuração de email do colaborador
    const emailConfig = await prisma.emailConfig.findUnique({
      where: {
        colaboradorId: colaborador.id
      }
    });

    if (!emailConfig) {
      return NextResponse.json({ error: 'Configuração de email não encontrada' }, { status: 404 });
    }

    // Verificar status da sincronização
    const status = emailSyncScheduler.getSyncStatus(emailConfig.id);
    const activeSyncs = emailSyncScheduler.getActiveSyncs();
    
    return NextResponse.json({ 
      isActive: status?.isActive || false,
      isRunning: status?.isRunning || false,
      syncInterval: emailConfig.syncInterval || 180,
      lastSync: emailConfig.lastSync,
      totalActiveSyncs: activeSyncs.length
    });
  } catch (error) {
    console.error('Erro ao verificar status da sincronização:', error);
    return NextResponse.json(
      { 
        error: 'Erro interno do servidor', 
        details: error instanceof Error ? error.message : 'Erro desconhecido'
      },
      { status: 500 }
    );
  }
}
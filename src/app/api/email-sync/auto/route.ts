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

    // Ler o body da requisição
    const body = await request.json();
    const { enabled } = body;

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

    let success = false;
    let message = '';

    if (enabled) {
      // Iniciar sincronização automática
      success = await emailSyncScheduler.startSyncForUser(colaborador.id);
      message = success ? 'Sincronização automática iniciada' : 'Falha ao iniciar sincronização automática';
    } else {
      // Parar sincronização automática
      success = await emailSyncScheduler.stopSyncForUser(colaborador.id);
      message = success ? 'Sincronização automática parada' : 'Falha ao parar sincronização automática';
    }
    
    if (success) {
      return NextResponse.json({ 
        success: true, 
        message,
        enabled,
        syncInterval: emailConfig.syncInterval || 180
      });
    } else {
      return NextResponse.json({ 
        error: message 
      }, { status: 500 });
    }
  } catch (error) {
    console.error('Erro ao controlar sincronização automática:', error);
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
    let status = emailSyncScheduler.getSyncStatus(emailConfig.id);
    
    // Se não há job registrado mas syncEnabled está ativo, recriar o job
    if (!status && emailConfig.syncEnabled) {
      console.log(`Recriando job de sincronização para emailConfig ${emailConfig.id}`);
      try {
        await emailSyncScheduler.startSyncForConfig(
          emailConfig.id,
          emailConfig.syncInterval || 180
        );
        status = emailSyncScheduler.getSyncStatus(emailConfig.id);
      } catch (error) {
        console.error('Erro ao recriar job de sincronização:', error);
      }
    }
    
    const activeSyncs = emailSyncScheduler.getActiveSyncs();
    
    return NextResponse.json({ 
      isActive: status?.isActive || emailConfig.syncEnabled || false,
      isRunning: status?.isRunning || false,
      syncInterval: emailConfig.syncInterval || 180,
      lastSync: emailConfig.lastSync,
      totalActiveSyncs: activeSyncs.length,
      syncEnabled: emailConfig.syncEnabled
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
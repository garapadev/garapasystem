import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function GET(request: NextRequest) {
  try {
    // Buscar atividades recentes baseadas em registros reais
    // Vamos buscar os últimos registros criados/atualizados de diferentes entidades
    
    const recentActivities: Array<{
      id: string;
      action: string;
      user: string;
      time: string;
      createdAt: string;
    }> = [];
    
    // Últimos clientes criados
    const recentClientes = await db.cliente.findMany({
      take: 2,
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        nome: true,
        createdAt: true
      }
    });
    
    recentClientes.forEach((cliente, index) => {
      recentActivities.push({
        id: `cliente_${cliente.id}`,
        action: 'Novo cliente cadastrado',
        user: cliente.nome,
        time: formatTimeAgo(cliente.createdAt),
        createdAt: cliente.createdAt.toISOString()
      });
    });
    
    // Últimos colaboradores criados
    const recentColaboradores = await db.colaborador.findMany({
      take: 2,
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        nome: true,
        createdAt: true
      }
    });
    
    recentColaboradores.forEach((colaborador) => {
      recentActivities.push({
        id: `colaborador_${colaborador.id}`,
        action: 'Novo colaborador cadastrado',
        user: colaborador.nome,
        time: formatTimeAgo(colaborador.createdAt),
        createdAt: colaborador.createdAt.toISOString()
      });
    });
    
    // Últimos usuários criados
    const recentUsuarios = await db.usuario.findMany({
      take: 2,
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        email: true,
        createdAt: true
      }
    });
    
    recentUsuarios.forEach((usuario) => {
      recentActivities.push({
        id: `usuario_${usuario.id}`,
        action: 'Novo usuário cadastrado',
        user: usuario.email,
        time: formatTimeAgo(usuario.createdAt),
        createdAt: usuario.createdAt.toISOString()
      });
    });
    
    // Ordenar por data de criação (mais recente primeiro) e limitar a 10
    const sortedActivities = recentActivities
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .slice(0, 10)
      .map((activity, index) => ({
        ...activity,
        id: index + 1
      }));
    
    return NextResponse.json(sortedActivities);
  } catch (error) {
    console.error('Erro ao buscar atividades do dashboard:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}

function formatTimeAgo(date: Date): string {
  const now = new Date();
  const diffInMs = now.getTime() - date.getTime();
  const diffInMinutes = Math.floor(diffInMs / (1000 * 60));
  const diffInHours = Math.floor(diffInMs / (1000 * 60 * 60));
  const diffInDays = Math.floor(diffInMs / (1000 * 60 * 60 * 24));
  
  if (diffInMinutes < 60) {
    return `${diffInMinutes} minuto${diffInMinutes !== 1 ? 's' : ''} atrás`;
  } else if (diffInHours < 24) {
    return `${diffInHours} hora${diffInHours !== 1 ? 's' : ''} atrás`;
  } else {
    return `${diffInDays} dia${diffInDays !== 1 ? 's' : ''} atrás`;
  }
}
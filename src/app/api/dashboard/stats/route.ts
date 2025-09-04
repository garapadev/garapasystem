import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function GET(request: NextRequest) {
  try {
    // Buscar contagens reais do banco de dados
    const [totalClientes, totalColaboradores, totalGruposHierarquicos, totalPermissoes, totalUsuarios] = await Promise.all([
      db.cliente.count(),
      db.colaborador.count(),
      db.grupoHierarquico.count(),
      db.permissao.count(),
      db.usuario.count()
    ]);

    const stats = {
      totalClientes,
      totalColaboradores,
      totalGruposHierarquicos,
      totalPermissoes,
      totalUsuarios
    };

    return NextResponse.json(stats);
  } catch (error) {
    console.error('Erro ao buscar estatísticas do dashboard:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    const { ruleId, enabled } = await request.json();

    if (!ruleId || typeof enabled !== 'boolean') {
      return NextResponse.json(
        { error: 'Parâmetros inválidos' },
        { status: 400 }
      );
    }

    // Por enquanto, apenas logamos a ação
    // Em uma implementação real, isso seria salvo no banco de dados
    console.log(`Regra ${ruleId} ${enabled ? 'ativada' : 'desativada'} pelo usuário ${session.user.id}`);

    return NextResponse.json({
      success: true,
      message: `Regra ${enabled ? 'ativada' : 'desativada'} com sucesso`,
      ruleId,
      enabled
    });
  } catch (error) {
    console.error('Erro ao alternar regra de automação:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}
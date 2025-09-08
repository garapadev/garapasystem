import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { db } from '@/lib/db';

export async function GET(request: NextRequest) {
  try {
    console.log('=== DEBUG SESSION START ===');
    
    // Verificar headers
    const cookies = request.headers.get('cookie');
    console.log('Cookies:', cookies);
    
    // Verificar sessão
    const session = await getServerSession(authOptions);
    console.log('Session:', JSON.stringify(session, null, 2));
    
    if (!session) {
      console.log('No session found');
      return NextResponse.json(
        { error: 'Sessão não encontrada', debug: { cookies, session } },
        { status: 401 }
      );
    }
    
    if (!session.user?.id) {
      console.log('No user ID in session');
      return NextResponse.json(
        { error: 'ID do usuário não encontrado na sessão', debug: { session } },
        { status: 401 }
      );
    }
    
    // Buscar usuário no banco
    const usuario = await db.usuario.findUnique({
      where: { id: session.user.id },
      include: {
        colaborador: true
      }
    });
    
    console.log('Usuario from DB:', JSON.stringify(usuario, null, 2));
    
    if (!usuario) {
      console.log('User not found in database');
      return NextResponse.json(
        { error: 'Usuário não encontrado', debug: { userId: session.user.id } },
        { status: 401 }
      );
    }
    
    if (!usuario.colaborador) {
      console.log('No colaborador found for user');
      return NextResponse.json(
        { error: 'Colaborador não encontrado', debug: { usuario } },
        { status: 401 }
      );
    }
    
    console.log('=== DEBUG SESSION SUCCESS ===');
    
    return NextResponse.json({
      success: true,
      session,
      usuario,
      debug: {
        cookies: !!cookies,
        sessionExists: !!session,
        userIdExists: !!session.user?.id,
        usuarioExists: !!usuario,
        colaboradorExists: !!usuario.colaborador
      }
    });
    
  } catch (error) {
    console.error('Debug session error:', error);
    return NextResponse.json(
      { error: 'Erro interno', debug: { error: error.message } },
      { status: 500 }
    );
  }
}
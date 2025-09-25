import { NextRequest, NextResponse } from 'next/server';
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { module } = body;

    if (!module) {
      return NextResponse.json(
        { success: false, error: 'Módulo não especificado' },
        { status: 400 }
      );
    }

    // Reiniciar módulo via PM2
    await execAsync(`pm2 restart ${module}`);

    return NextResponse.json({
      success: true,
      message: `Módulo ${module} reiniciado com sucesso`
    });

  } catch (error) {
    console.error('Erro ao reiniciar módulo:', error);
    return NextResponse.json(
      { success: false, error: `Erro ao reiniciar módulo: ${error}` },
      { status: 500 }
    );
  }
}
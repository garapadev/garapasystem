import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { whatsappService } from '@/lib/whatsapp/whatsapp-service';

// DELETE /api/whatsapp/sessions/:id - Excluir uma sessão WhatsApp
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.email) {
      return NextResponse.json(
        { error: 'Não autorizado' },
        { status: 401 }
      );
    }
    
    const sessionId = params.id;
    
    if (!sessionId) {
      return NextResponse.json(
        { error: 'ID da sessão não fornecido' },
        { status: 400 }
      );
    }

    // Buscar a sessão para obter o colaboradorId
    const whatsappSession = await prisma.whatsAppSession.findUnique({
      where: { id: sessionId }
    });

    if (!whatsappSession) {
      return NextResponse.json(
        { error: 'Sessão não encontrada' },
        { status: 404 }
      );
    }

    // Tentar parar a sessão no serviço WhatsApp
    try {
      await whatsappService.destroySession(whatsappSession.colaboradorId);
    } catch (error) {
      console.error('Erro ao parar sessão no serviço WhatsApp:', error);
      // Continuar mesmo com erro, pois queremos excluir a sessão do banco
    }

    // Excluir a sessão do banco
    await prisma.whatsAppSession.delete({
      where: { id: sessionId }
    });

    return NextResponse.json({
      success: true,
      message: 'Sessão excluída com sucesso'
    });

  } catch (error) {
    console.error('Erro ao excluir sessão WhatsApp:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}
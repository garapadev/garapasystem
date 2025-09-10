import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { db } from '@/lib/db';

// GET - Buscar email específico por ID
export async function GET(
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

    const emailId = params.id;

    // Buscar colaborador pelo email da sessão
    const colaborador = await db.colaborador.findFirst({
      where: {
        usuarios: {
          some: {
            email: session.user.email
          }
        }
      },
      include: {
        emailConfig: true
      }
    });

    if (!colaborador || !colaborador.emailConfig) {
      return NextResponse.json(
        { error: 'Configuração de email não encontrada' },
        { status: 404 }
      );
    }

    // Buscar email específico
    const email = await db.email.findFirst({
      where: {
        id: emailId,
        emailConfigId: colaborador.emailConfig.id
      },
      include: {
        folder: {
          select: {
            id: true,
            name: true,
            path: true
          }
        },
        attachments: {
          select: {
            id: true,
            filename: true,
            contentType: true,
            size: true,
            contentId: true
          }
        }
      }
    });

    if (!email) {
      return NextResponse.json(
        { error: 'Email não encontrado' },
        { status: 404 }
      );
    }

    // Converter campos de array se necessário e fazer parse de JSON strings
    const parseEmailField = (field: any) => {
      if (Array.isArray(field)) {
        return field.map(item => {
          if (typeof item === 'string') {
            try {
              return JSON.parse(item);
            } catch {
              return item;
            }
          }
          return item;
        }).flat();
      }
      if (typeof field === 'string') {
        try {
          const parsed = JSON.parse(field);
          return Array.isArray(parsed) ? parsed : [parsed];
        } catch {
          return [field];
        }
      }
      return [];
    };
    
    const fromArray = parseEmailField(email.from);
    const toArray = parseEmailField(email.to);
    const ccArray = parseEmailField(email.cc);
    const bccArray = parseEmailField(email.bcc);

    const emailData = {
      id: email.id,
      messageId: email.messageId,
      subject: email.subject || '(Sem assunto)',
      from: fromArray,
      to: toArray,
      cc: ccArray.length > 0 ? ccArray : undefined,
      bcc: bccArray.length > 0 ? bccArray : undefined,
      date: email.date.toISOString(),
      body: email.textContent || email.htmlContent || '',
      bodyType: email.htmlContent ? 'html' : 'text',
      isRead: email.isRead,
      attachments: email.attachments || [],
      folder: email.folder
    };

    return NextResponse.json(emailData);

  } catch (error) {
    console.error('Erro ao buscar email:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}

// DELETE - Excluir email
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

    const emailId = params.id;

    // Buscar colaborador pelo email da sessão
    const colaborador = await db.colaborador.findFirst({
      where: {
        usuarios: {
          some: {
            email: session.user.email
          }
        }
      },
      include: {
        emailConfig: true
      }
    });

    if (!colaborador || !colaborador.emailConfig) {
      return NextResponse.json(
        { error: 'Configuração de email não encontrada' },
        { status: 404 }
      );
    }

    // Verificar se o email pertence ao usuário
    const email = await db.email.findFirst({
      where: {
        id: emailId,
        emailConfigId: colaborador.emailConfig.id
      }
    });

    if (!email) {
      return NextResponse.json(
        { error: 'Email não encontrado' },
        { status: 404 }
      );
    }

    // Excluir email e anexos relacionados
    await db.$transaction(async (tx) => {
      // Excluir anexos
      await tx.emailAttachment.deleteMany({
        where: { emailId: emailId }
      });

      // Excluir email
      await tx.email.delete({
        where: { id: emailId }
      });
    });

    return NextResponse.json({ success: true });

  } catch (error) {
    console.error('Erro ao excluir email:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}
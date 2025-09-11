import { NextRequest, NextResponse } from 'next/server';
import { createHelpdeskEmailService } from '@/lib/email/helpdesk-email-service';
import { z } from 'zod';

const testEmailSchema = z.object({
  type: z.enum(['imap', 'smtp', 'both'])
});

// POST - Testar configurações de email
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json();
    const { type } = testEmailSchema.parse(body);
    const departamentoId = params.id;

    const emailService = await createHelpdeskEmailService(departamentoId);

    const results: {
      imap?: { success: boolean; error?: string };
      smtp?: { success: boolean; error?: string };
    } = {};

    if (type === 'imap' || type === 'both') {
      try {
        const imapSuccess = await emailService.testImapConnection();
        results.imap = { success: imapSuccess };
        if (!imapSuccess) {
          results.imap.error = 'Falha na conexão IMAP';
        }
      } catch (error) {
        results.imap = {
          success: false,
          error: error instanceof Error ? error.message : 'Erro desconhecido'
        };
      }
    }

    if (type === 'smtp' || type === 'both') {
      try {
        const smtpSuccess = await emailService.testSmtpConnection();
        results.smtp = { success: smtpSuccess };
        if (!smtpSuccess) {
          results.smtp.error = 'Falha na conexão SMTP';
        }
      } catch (error) {
        results.smtp = {
          success: false,
          error: error instanceof Error ? error.message : 'Erro desconhecido'
        };
      }
    }

    return NextResponse.json({
      success: true,
      results
    });
  } catch (error) {
    console.error('Erro ao testar configurações de email:', error);
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Dados inválidos', details: error.issues },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}
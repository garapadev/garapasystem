import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { db as prisma } from '@/lib/db';
import { SmtpService } from '@/lib/email/smtp-service';
import { EmailNotificationService } from '@/lib/email/notification-service';
import { z } from 'zod';
import { writeFile, mkdir } from 'fs/promises';
import { join } from 'path';
import { randomUUID } from 'crypto';

const sendEmailSchema = z.object({
  to: z.string().min(1, 'Destinatário é obrigatório'),
  cc: z.string().optional(),
  bcc: z.string().optional(),
  subject: z.string().min(1, 'Assunto é obrigatório'),
  body: z.string().min(1, 'Corpo do email é obrigatório'),
  isHtml: z.string().transform(val => val === 'true'),
  isDraft: z.string().transform(val => val === 'true')
});

interface EmailAttachment {
  filename: string;
  path: string;
  contentType: string;
  size: number;
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json(
        { error: 'Não autorizado' },
        { status: 401 }
      );
    }

    // Parse form data
    const formData = await request.formData();
    
    // Extrair dados do formulário
    const emailData = {
      to: formData.get('to') as string,
      cc: formData.get('cc') as string || '',
      bcc: formData.get('bcc') as string || '',
      subject: formData.get('subject') as string,
      body: formData.get('body') as string,
      isHtml: formData.get('isHtml') as string,
      isDraft: formData.get('isDraft') as string
    };

    // Validar dados
    const validatedData = sendEmailSchema.parse(emailData);

    // Buscar colaborador e configuração de email
    const user = await db.colaborador.findUnique({
      where: { id: session.user.colaboradorId },
      include: {
        emailConfig: true
      }
    });

    if (!user || !user.emailConfig) {
      return NextResponse.json(
        { error: 'Colaborador não encontrado' },
        { status: 404 }
      );
    }

    // Processar anexos
    const attachments: EmailAttachment[] = [];
    const uploadDir = join(process.cwd(), 'uploads', 'attachments');
    
    // Criar diretório se não existir
    try {
      await mkdir(uploadDir, { recursive: true });
    } catch (error) {
      // Diretório já existe
    }

    // Processar cada anexo
    for (const [key, value] of formData.entries()) {
      if (key.startsWith('attachment_') && value instanceof File) {
        const file = value as File;
        const fileExtension = file.name.split('.').pop() || '';
        const fileName = `${randomUUID()}.${fileExtension}`;
        const filePath = join(uploadDir, fileName);
        
        // Salvar arquivo
        const bytes = await file.arrayBuffer();
        await writeFile(filePath, Buffer.from(bytes));
        
        attachments.push({
          filename: file.name,
          path: filePath,
          contentType: file.type || 'application/octet-stream',
          size: file.size
        });
      }
    }

    // Preparar dados do email
    const emailToSend = {
      to: validatedData.to.split(',').map(email => ({ address: email.trim() })),
      cc: validatedData.cc ? validatedData.cc.split(',').map(email => ({ address: email.trim() })) : [],
      bcc: validatedData.bcc ? validatedData.bcc.split(',').map(email => ({ address: email.trim() })) : [],
      subject: validatedData.subject,
      text: validatedData.isHtml ? undefined : validatedData.body,
      html: validatedData.isHtml ? validatedData.body : undefined,
      attachments: attachments.map(att => ({
        filename: att.filename,
        content: require('fs').readFileSync(att.path),
        contentType: att.contentType
      }))
    };

    if (validatedData.isDraft) {
      // Salvar como rascunho
      const sentFolder = user.emailConfig.folders?.find(f => 
        f.name.toLowerCase() === 'drafts' || f.name.toLowerCase() === 'rascunhos'
      );

      // Salvar email no banco de dados
      const savedEmail = await db.email.create({
        data: {
          messageId: `draft-${randomUUID()}@${session.user.email.split('@')[1]}`,
          from: [session.user.email],
          to: emailToSend.to,
          cc: emailToSend.cc,
          bcc: emailToSend.bcc,
          subject: validatedData.subject,
          body: validatedData.body,
          isHtml: validatedData.isHtml,
          date: new Date(),
          flags: ['\\Draft'],
          isDraft: true,
          folderId: sentFolder?.id,
          emailConfigId: user.emailConfig.id
        }
      });

      // Salvar anexos se houver
      if (attachments.length > 0) {
        await db.emailAttachment.createMany({
          data: attachments.map(att => ({
            emailId: savedEmail.id,
            filename: att.filename,
            contentType: att.contentType,
            size: att.size,
            path: att.path
          }))
        });
      }

      // Notificar sucesso
      await EmailNotificationService.notifyEmailSent({
        id: savedEmail.id,
        subject: savedEmail.subject || '',
        to: savedEmail.to || '',
        date: savedEmail.date,
        emailConfigId: user.emailConfig.id
      });

      return NextResponse.json({
        success: true,
        message: 'Rascunho salvo com sucesso',
        emailId: savedEmail.id
      });
    } else {
      // Enviar email
      const smtpService = new SmtpService(user.emailConfig.id);
      
      try {
        await smtpService.connect();
        const result = await smtpService.sendEmail(emailToSend);
        
        if (!result.success) {
          throw new Error(result.error || 'Erro ao enviar email');
        }
        
        const messageId = result.messageId;
        
        // Salvar na pasta "Enviados"
        const sentFolder = user.emailConfig.folders?.find(f => 
          f.name.toLowerCase() === 'sent' || f.name.toLowerCase() === 'enviados'
        );

        const sentEmail = await db.email.create({
          data: {
            messageId,
            from: [session.user.email],
            to: emailToSend.to,
            cc: emailToSend.cc,
            bcc: emailToSend.bcc,
            subject: validatedData.subject,
            body: validatedData.body,
            isHtml: validatedData.isHtml,
            date: new Date(),
            flags: ['\\Seen'],
            isDraft: false,
            folderId: sentFolder?.id,
            emailConfigId: user.emailConfig.id
          }
        });

        // Salvar anexos se houver
        if (attachments.length > 0) {
          await db.emailAttachment.createMany({
            data: attachments.map(att => ({
              emailId: sentEmail.id,
              filename: att.filename,
              contentType: att.contentType,
              size: att.size,
              path: att.path
            }))
          });
        }

        // Notificar sucesso
        await EmailNotificationService.notifyEmailSent({
          id: sentEmail.id,
          subject: sentEmail.subject || '',
          to: sentEmail.to || '',
          date: sentEmail.date,
          emailConfigId: user.emailConfig.id
        });

        return NextResponse.json({
          success: true,
          message: 'Email enviado com sucesso',
          messageId,
          emailId: sentEmail.id
        });
      } catch (error) {
        console.error('Erro ao enviar email:', error);
        
        // Notificar erro
        if (user && user.emailConfig) {
          await EmailNotificationService.notifyEmailError(
            error instanceof Error ? error.message : 'Erro desconhecido ao enviar email',
            user.emailConfig.id
          );
        }
        
        return NextResponse.json(
          { error: 'Erro ao enviar email. Verifique suas configurações SMTP.' },
          { status: 500 }
        );
      }
    }
  } catch (error) {
    console.error('Erro na API de envio de email:', error);
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { 
          error: 'Dados inválidos',
          details: error.issues.map(issue => ({
            field: issue.path.join('.'),
            message: issue.message
          }))
        },
        { status: 400 }
      );
    }
    
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}
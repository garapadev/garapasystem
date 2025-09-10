import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { db as prisma } from '@/lib/db';
import { SmtpService } from '@/lib/email/smtp-service';
import { EmailNotificationService } from '@/lib/email/notification-service';
import { decryptPassword } from '@/lib/email/password-crypto';
import { z } from 'zod';
import { writeFile, mkdir } from 'fs/promises';
import { join } from 'path';
import { randomUUID } from 'crypto';
import nodemailer from 'nodemailer';

// Configuração de timeout para esta rota
export const maxDuration = 60; // 60 segundos

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

    // Buscar usuário e configuração de email
    const user = await prisma.usuario.findUnique({
      where: { email: session.user.email },
      include: {
        colaborador: {
          include: {
            emailConfig: true
          }
        }
      }
    });

    if (!user || !user.colaborador || !user.colaborador.emailConfig) {
      return NextResponse.json(
        { error: 'Configuração de email não encontrada' },
        { status: 404 }
      );
    }

    const emailConfig = user.colaborador.emailConfig;

    // Processar anexos
    const attachments: EmailAttachment[] = [];
    const files = formData.getAll('attachments') as File[];
    
    for (const file of files) {
      if (file && file.size > 0) {
        const filename = `${randomUUID()}-${file.name}`;
        const uploadDir = join(process.cwd(), 'uploads', 'email-attachments');
        
        try {
          await mkdir(uploadDir, { recursive: true });
        } catch (error) {
          // Diretório já existe
        }
        
        const filepath = join(uploadDir, filename);
        const bytes = await file.arrayBuffer();
        await writeFile(filepath, Buffer.from(bytes));
        
        attachments.push({
          filename: file.name,
          path: filepath,
          contentType: file.type || 'application/octet-stream',
          size: file.size
        });
      }
    }

    // Se for rascunho, salvar e retornar
    if (validatedData.isDraft) {
      // Verificar se a pasta Drafts existe
       let draftsFolder = await prisma.emailFolder.findFirst({
         where: {
           emailConfigId: emailConfig.id,
           path: 'INBOX.Drafts'
         }
       });

      if (!draftsFolder) {
        draftsFolder = await prisma.emailFolder.create({
           data: {
             name: 'Drafts',
             path: 'INBOX.Drafts',
             specialUse: '\\Drafts',
             emailConfigId: emailConfig.id
           }
         });
      }

      const messageId = `<${randomUUID()}@${emailConfig.email.split('@')[1]}>`;
       
       const draftEmail = await prisma.email.create({
         data: {
           messageId,
           uid: Math.floor(Math.random() * 1000000),
           from: JSON.stringify([session.user.email]),
           to: JSON.stringify(validatedData.to.split(',').map(email => email.trim())),
           cc: validatedData.cc ? JSON.stringify(validatedData.cc.split(',').map(email => email.trim())) : null,
           bcc: validatedData.bcc ? JSON.stringify(validatedData.bcc.split(',').map(email => email.trim())) : null,
           subject: validatedData.subject,
           textContent: validatedData.isHtml ? null : validatedData.body,
           htmlContent: validatedData.isHtml ? validatedData.body : null,
           date: new Date(),
           flags: JSON.stringify(['\\Draft']),
           isRead: true,
           folderId: draftsFolder.id,
           emailConfigId: emailConfig.id
         }
       });

      // Salvar anexos se houver
      if (attachments.length > 0) {
        await prisma.emailAttachment.createMany({
          data: attachments.map(att => ({
            emailId: draftEmail.id,
            filename: att.filename,
            contentType: att.contentType,
            size: att.size,
            path: att.path
          }))
        });
      }

      return NextResponse.json({
        success: true,
        message: 'Rascunho salvo com sucesso',
        emailId: draftEmail.id
      });
    }

    // Enviar email
    // Descriptografar senha antes de usar
    const decryptedPassword = decryptPassword(emailConfig.password);
    
    const transporter = nodemailer.createTransport({
      host: emailConfig.smtpHost,
      port: emailConfig.smtpPort,
      secure: emailConfig.smtpPort === 465,
      auth: {
        user: emailConfig.email,
        pass: decryptedPassword
      },
      // Configurações de timeout mais conservadoras
      connectionTimeout: 30000, // 30 segundos para conexão TCP inicial
      greetingTimeout: 15000,   // 15 segundos para greeting do servidor
      socketTimeout: 60000,     // 60 segundos para timeout de socket idle
      dnsTimeout: 15000,        // 15 segundos para lookup DNS
      // Desabilitar pooling para evitar problemas de conexão
      pool: false,
      // Configurações de TLS
      tls: {
        rejectUnauthorized: false // Para evitar problemas com certificados
      }
    } as nodemailer.TransportOptions);

    // Verificar conexão antes de enviar
    try {
      console.log('Verificando conexão SMTP...');
      await transporter.verify();
      console.log('Conexão SMTP verificada com sucesso');
    } catch (verifyError) {
      console.error('Erro na verificação SMTP:', verifyError);
      const errorMessage = verifyError instanceof Error ? verifyError.message : 'Erro desconhecido';
      return NextResponse.json(
        { success: false, error: `Falha na conexão SMTP: ${errorMessage}` },
        { status: 500 }
      );
    }
    
    const emailToSend = {
      from: `"${session.user.name || 'Usuário'}" <${emailConfig.email}>`,
      to: validatedData.to.split(',').map(email => email.trim()).join(', '),
      cc: validatedData.cc ? validatedData.cc.split(',').map(email => email.trim()).join(', ') : undefined,
      bcc: validatedData.bcc ? validatedData.bcc.split(',').map(email => email.trim()).join(', ') : undefined,
      subject: validatedData.subject,
      text: validatedData.isHtml ? undefined : validatedData.body,
      html: validatedData.isHtml ? validatedData.body : undefined,
      attachments: attachments.map(att => ({
        filename: att.filename,
        content: require('fs').readFileSync(att.path),
        contentType: att.contentType
      }))
    };

    try {
      const result = await transporter.sendMail(emailToSend);
      const messageId = result.messageId;

      // Verificar se a pasta Sent existe
       let sentFolder = await prisma.emailFolder.findFirst({
         where: {
           emailConfigId: emailConfig.id,
           path: 'INBOX.Sent'
         }
       });

      if (!sentFolder) {
         sentFolder = await prisma.emailFolder.create({
           data: {
             name: 'Sent',
             path: 'INBOX.Sent',
             specialUse: '\\Sent',
             emailConfigId: emailConfig.id
           }
         });
      }

      // Verificar se o email já existe
       let sentEmail = await prisma.email.findFirst({
         where: {
           messageId,
           emailConfigId: emailConfig.id
         }
       });

      if (!sentEmail) {
        sentEmail = await prisma.email.create({
           data: {
             messageId,
             uid: Math.floor(Math.random() * 1000000),
             from: JSON.stringify([{ address: emailConfig.email, name: session.user.name || 'Usuário' }]),
             to: JSON.stringify(validatedData.to.split(',').map(email => ({ address: email.trim() }))),
             cc: validatedData.cc ? JSON.stringify(validatedData.cc.split(',').map(email => ({ address: email.trim() }))) : null,
             bcc: validatedData.bcc ? JSON.stringify(validatedData.bcc.split(',').map(email => ({ address: email.trim() }))) : null,
             subject: validatedData.subject,
             textContent: validatedData.isHtml ? null : validatedData.body,
             htmlContent: validatedData.isHtml ? validatedData.body : null,
             date: new Date(),
             flags: JSON.stringify(['\\Seen']),
             isRead: true,
             folderId: sentFolder.id,
             emailConfigId: emailConfig.id
           }
         });
      }

      // Salvar anexos se houver
      if (attachments.length > 0) {
        await prisma.emailAttachment.createMany({
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
         emailConfigId: emailConfig.id
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
       if (user && emailConfig) {
         await EmailNotificationService.notifyEmailError(
           error instanceof Error ? error.message : 'Erro desconhecido ao enviar email',
           emailConfig.id
         );
       }
      
      return NextResponse.json(
        { error: 'Erro ao enviar email. Verifique suas configurações SMTP.' },
        { status: 500 }
      );
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
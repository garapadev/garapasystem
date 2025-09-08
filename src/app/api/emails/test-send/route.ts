import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { SmtpService } from '@/lib/email/smtp-service'
import { db } from '@/lib/db'
import { z } from 'zod'

const testSendSchema = z.object({
  to: z.string().email('Email de destino inválido'),
  subject: z.string().min(1, 'Assunto é obrigatório').optional(),
  message: z.string().min(1, 'Mensagem é obrigatória').optional()
})

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.email) {
      return NextResponse.json(
        { error: 'Não autorizado' },
        { status: 401 }
      )
    }

    const body = await request.json()
    const validatedData = testSendSchema.parse(body)
    
    // Buscar configuração de email do usuário
    const colaborador = await db.colaborador.findUnique({
      where: { email: session.user.email }
    })

    if (!colaborador) {
      return NextResponse.json(
        { error: 'Colaborador não encontrado' },
        { status: 404 }
      )
    }

    const emailConfig = await db.emailConfig.findUnique({
      where: { colaboradorId: colaborador.id }
    })

    if (!emailConfig || !emailConfig.ativo) {
      return NextResponse.json(
        { error: 'Configuração de email não encontrada ou inativa. Configure seu email primeiro.' },
        { status: 400 }
      )
    }
    const smtpService = new SmtpService(emailConfig.id)

    try {
      // Conectar ao SMTP
      const connected = await smtpService.connect()
      if (!connected) {
        return NextResponse.json(
          { error: 'Falha ao conectar ao servidor SMTP. Verifique suas configurações.' },
          { status: 500 }
        )
      }

      // Preparar dados do email de teste
      const testSubject = validatedData.subject || 'Teste de Envio - GarapaSystem Webmail'
      const testMessage = validatedData.message || `
        Este é um email de teste enviado pelo sistema GarapaSystem Webmail.
        
        Detalhes do teste:
        - Remetente: ${emailConfig.email}
        - Destinatário: ${validatedData.to}
        - Data/Hora: ${new Date().toLocaleString('pt-BR')}
        - Servidor SMTP: ${emailConfig.smtpHost}:${emailConfig.smtpPort}
        
        Se você recebeu este email, significa que o sistema de envio está funcionando corretamente.
        
        ---
        GarapaSystem Webmail
      `

      const testHtml = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; border-radius: 10px 10px 0 0; text-align: center;">
            <h1 style="margin: 0; font-size: 28px;">✅ Teste de Email</h1>
            <p style="margin: 10px 0 0 0; opacity: 0.9;">GarapaSystem Webmail</p>
          </div>
          
          <div style="background: white; padding: 30px; border: 1px solid #e1e5e9; border-top: none;">
            <h2 style="color: #333; margin-top: 0;">Email de teste enviado com sucesso!</h2>
            <p style="color: #666; line-height: 1.6;">Este é um email de teste enviado pelo sistema GarapaSystem Webmail para verificar a funcionalidade completa do sistema de envio.</p>
            
            <div style="background: #f8f9fa; padding: 20px; border-radius: 8px; margin: 25px 0;">
              <h3 style="color: #495057; margin-top: 0;">📋 Detalhes do Teste</h3>
              <table style="width: 100%; border-collapse: collapse;">
                <tr>
                  <td style="padding: 8px 0; color: #6c757d; font-weight: bold;">Remetente:</td>
                  <td style="padding: 8px 0; color: #495057;">${emailConfig.email}</td>
                </tr>
                <tr>
                  <td style="padding: 8px 0; color: #6c757d; font-weight: bold;">Destinatário:</td>
                  <td style="padding: 8px 0; color: #495057;">${validatedData.to}</td>
                </tr>
                <tr>
                  <td style="padding: 8px 0; color: #6c757d; font-weight: bold;">Data/Hora:</td>
                  <td style="padding: 8px 0; color: #495057;">${new Date().toLocaleString('pt-BR')}</td>
                </tr>
                <tr>
                  <td style="padding: 8px 0; color: #6c757d; font-weight: bold;">Servidor SMTP:</td>
                  <td style="padding: 8px 0; color: #495057;">${emailConfig.smtpHost}:${emailConfig.smtpPort}</td>
                </tr>
              </table>
            </div>
            
            <div style="background: #d4edda; border: 1px solid #c3e6cb; color: #155724; padding: 15px; border-radius: 8px; margin: 25px 0;">
              <strong>✅ Status:</strong> Se você recebeu este email, significa que o sistema de envio está funcionando corretamente!
            </div>
            
            <p style="color: #6c757d; font-size: 14px; margin-bottom: 0;">Este é um email automático gerado pelo sistema GarapaSystem Webmail para fins de teste.</p>
          </div>
          
          <div style="background: #f8f9fa; padding: 20px; border-radius: 0 0 10px 10px; text-align: center; border: 1px solid #e1e5e9; border-top: none;">
            <p style="margin: 0; color: #6c757d; font-size: 12px;">© ${new Date().getFullYear()} GarapaSystem - Sistema de Gestão Empresarial</p>
          </div>
        </div>
      `

      // Enviar email de teste
      const result = await smtpService.sendEmail({
        to: [{ address: validatedData.to }],
        subject: testSubject,
        text: testMessage,
        html: testHtml
      })

      if (!result.success) {
        return NextResponse.json(
          { 
            error: 'Falha no envio do email de teste',
            details: result.error
          },
          { status: 500 }
        )
      }

      // Buscar ou criar pasta de emails enviados
      let sentFolder = await db.emailFolder.findFirst({
        where: {
          emailConfigId: emailConfig.id,
          OR: [
            { specialUse: '\\Sent' },
            { name: 'Sent' },
            { name: 'Enviados' }
          ]
        }
      })

      if (!sentFolder) {
        sentFolder = await db.emailFolder.create({
          data: {
            name: 'Sent',
            path: 'INBOX.Sent',
            specialUse: '\\Sent',
            emailConfigId: emailConfig.id
          }
        })
      }

      // Salvar registro do teste no banco
      await db.email.create({
        data: {
          messageId: result.messageId || `test-${Date.now()}`,
          uid: Math.floor(Math.random() * 1000000), // UID temporário para teste
          subject: testSubject,
          from: JSON.stringify([emailConfig.email]),
          to: JSON.stringify([validatedData.to]),
          htmlContent: testHtml,
          date: new Date(),
          flags: JSON.stringify(['\\Seen']),
          isRead: true,
          emailConfigId: emailConfig.id,
          folderId: sentFolder.id,
          // Marcar como email de teste
          references: JSON.stringify({
            'X-Test-Email': 'true',
            'X-Test-Type': 'manual-send-test'
          })
        }
      })

      return NextResponse.json({
        success: true,
        message: 'Email de teste enviado com sucesso!',
        details: {
          messageId: result.messageId,
          from: emailConfig.email,
          to: validatedData.to,
          subject: testSubject,
          sentAt: new Date().toISOString(),
          smtpServer: `${emailConfig.smtpHost}:${emailConfig.smtpPort}`
        }
      })

    } catch (error) {
      console.error('Erro ao enviar email de teste:', error)
      return NextResponse.json(
        { 
          error: 'Erro ao enviar email de teste',
          details: error instanceof Error ? error.message : 'Erro desconhecido'
        },
        { status: 500 }
      )
    } finally {
      smtpService.disconnect()
    }

  } catch (error: any) {
    console.error('Erro na API de teste de envio:', error)
    
    if (error.name === 'ZodError') {
      return NextResponse.json(
        { 
          error: 'Dados inválidos',
          details: error.errors
        },
        { status: 400 }
      )
    }
    
    return NextResponse.json(
      { 
        error: 'Erro interno do servidor',
        message: error.message
      },
      { status: 500 }
    )
  }
}
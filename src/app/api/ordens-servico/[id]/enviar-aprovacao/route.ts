import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { SmtpService } from '@/lib/email/smtp-service';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import crypto from 'crypto';

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    const ordemServicoId = params.id;

    // Buscar ordem de serviço com cliente
    const ordemServico = await db.ordemServico.findUnique({
      where: { id: ordemServicoId },
      include: {
        cliente: true,
        responsavel: true,
        itens: true
      }
    });

    // Buscar dados da empresa
    const empresa = await db.empresa.findFirst({
      where: { ativa: true }
    });

    if (!ordemServico) {
      return NextResponse.json({ error: 'Ordem de serviço não encontrada' }, { status: 404 });
    }

    if (ordemServico.status !== 'PENDENTE') {
      return NextResponse.json({ error: 'Ordem de serviço não está pendente' }, { status: 400 });
    }

    if (!ordemServico.cliente.email) {
      return NextResponse.json({ error: 'Cliente não possui email cadastrado' }, { status: 400 });
    }

    // Gerar código único de aprovação
    const codigoAprovacao = crypto.randomBytes(32).toString('hex');
    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + 72); // Expira em 72 horas

    // Salvar código de aprovação no banco
    await db.ordemServicoAprovacao.create({
      data: {
        ordemServicoId,
        codigo: codigoAprovacao,
        expiresAt,
        status: 'PENDENTE'
      }
    });

    // Buscar configuração de email do responsável
    const emailConfig = await db.emailConfig.findFirst({
      where: {
        colaboradorId: ordemServico.responsavelId,
        ativo: true
      }
    });

    if (!emailConfig) {
      return NextResponse.json({ error: 'Configuração de email não encontrada' }, { status: 400 });
    }

    // Preparar dados para o template de email
    const valorTotal = ordemServico.itens.reduce((total, item) => total + item.valor, 0);
    const baseUrl = process.env.NEXTAUTH_URL || 'http://localhost:3000';
    const linkAprovacao = `${baseUrl}/aprovacao/${codigoAprovacao}`;

    // Template de email
    const htmlTemplate = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <title>Aprovação de Ordem de Serviço</title>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .empresa-header { background: ${empresa?.corPrimaria || '#f8f9fa'}; color: white; padding: 20px; border-radius: 8px; margin-bottom: 20px; text-align: center; }
          .empresa-logo { max-width: 150px; height: auto; margin-bottom: 10px; }
          .header { background: #f8f9fa; padding: 20px; border-radius: 8px; margin-bottom: 20px; }
          .content { background: white; padding: 20px; border: 1px solid #ddd; border-radius: 8px; }
          .button { display: inline-block; background: ${empresa?.corPrimaria || '#007bff'}; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px; margin: 20px 0; }
          .item { border-bottom: 1px solid #eee; padding: 10px 0; }
          .total { font-weight: bold; font-size: 1.2em; color: ${empresa?.corPrimaria || '#007bff'}; }
          .footer { margin-top: 20px; padding-top: 20px; border-top: 1px solid #eee; font-size: 0.9em; color: #666; }
          .empresa-info { background: #f8f9fa; padding: 15px; border-radius: 8px; margin-top: 20px; }
        </style>
      </head>
      <body>
        <div class="container">
          ${empresa ? `
          <div class="empresa-header">
            ${empresa.logoUrl ? `<img src="${empresa.logoUrl}" alt="${empresa.nomeFantasia || empresa.razaoSocial}" class="empresa-logo">` : ''}
            <h1>${empresa.nomeFantasia || empresa.razaoSocial}</h1>
            ${empresa.email ? `<p>${empresa.email}</p>` : ''}
            ${empresa.telefone ? `<p>${empresa.telefone}</p>` : ''}
          </div>
          ` : ''}
          
          <div class="header">
            <h1>Aprovação de Ordem de Serviço</h1>
            <p>Olá ${ordemServico.cliente.nome},</p>
            <p>Você recebeu uma nova ordem de serviço para aprovação.</p>
          </div>
          
          <div class="content">
            <h2>Detalhes da Ordem de Serviço #${ordemServico.numero}</h2>
            
            <p><strong>Descrição:</strong> ${ordemServico.descricao}</p>
            <p><strong>Prioridade:</strong> ${ordemServico.prioridade}</p>
            <p><strong>Responsável:</strong> ${ordemServico.responsavel?.nome}</p>
            
            <h3>Itens da Ordem de Serviço:</h3>
            ${ordemServico.itens.map(item => `
              <div class="item">
                <strong>${item.descricao}</strong><br>
                Quantidade: ${item.quantidade} | Valor unitário: R$ ${item.valor.toFixed(2)}<br>
                <strong>Total: R$ ${(item.quantidade * item.valor).toFixed(2)}</strong>
              </div>
            `).join('')}
            
            <div class="total">
              <p>Valor Total: R$ ${valorTotal.toFixed(2)}</p>
            </div>
            
            <p>Para aprovar ou rejeitar esta ordem de serviço, clique no botão abaixo:</p>
            
            <a href="${linkAprovacao}" class="button">Visualizar e Aprovar</a>
            
            <p><small>Este link expira em 72 horas.</small></p>
          </div>
          
          <div class="footer">
            <p>Se você não conseguir clicar no botão, copie e cole este link no seu navegador:</p>
            <p>${linkAprovacao}</p>
            <p>Este é um email automático, não responda.</p>
          </div>
          
          ${empresa ? `
          <div class="empresa-info">
            <h4>${empresa.nomeFantasia || empresa.razaoSocial}</h4>
            ${empresa.cnpj ? `<p><strong>CNPJ:</strong> ${empresa.cnpj.replace(/(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})/, '$1.$2.$3/$4-$5')}</p>` : ''}
            ${empresa.endereco ? `<p><strong>Endereço:</strong> ${empresa.endereco}</p>` : ''}
            ${empresa.cidade && empresa.estado ? `<p>${empresa.cidade} - ${empresa.estado} ${empresa.cep ? `- CEP: ${empresa.cep.replace(/(\d{5})(\d{3})/, '$1-$2')}` : ''}</p>` : ''}
            ${empresa.telefone ? `<p><strong>Telefone:</strong> ${empresa.telefone}</p>` : ''}
            ${empresa.email ? `<p><strong>E-mail:</strong> ${empresa.email}</p>` : ''}
            ${empresa.website ? `<p><strong>Website:</strong> ${empresa.website}</p>` : ''}
          </div>
          ` : ''}
        </div>
      </body>
      </html>
    `;

    // Enviar email
    const smtpService = new SmtpService(emailConfig.id);
    const connected = await smtpService.connect();

    if (!connected) {
      return NextResponse.json({ error: 'Erro ao conectar com o servidor de email' }, { status: 500 });
    }

    const emailResult = await smtpService.sendEmail({
      to: [{ address: ordemServico.cliente.email, name: ordemServico.cliente.nome }],
      subject: `Aprovação de Ordem de Serviço #${ordemServico.numero}`,
      html: htmlTemplate
    });

    if (!emailResult.success) {
      return NextResponse.json({ error: 'Erro ao enviar email' }, { status: 500 });
    }

    // Atualizar status da ordem de serviço
    await db.ordemServico.update({
      where: { id: ordemServicoId },
      data: { status: 'AGUARDANDO_APROVACAO' }
    });

    return NextResponse.json({ 
      success: true, 
      message: 'Email de aprovação enviado com sucesso',
      linkAprovacao 
    });

  } catch (error) {
    console.error('Erro ao enviar aprovação:', error);
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 });
  }
}
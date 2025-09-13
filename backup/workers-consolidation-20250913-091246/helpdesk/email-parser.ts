// Enum de prioridade do helpdesk
type HelpdeskPrioridade = 'BAIXA' | 'MEDIA' | 'ALTA' | 'URGENTE';

interface ParsedEmailData {
  assunto: string;
  descricao: string;
  prioridade: HelpdeskPrioridade;
  categoria?: string;
  tags: string[];
  isAutoReply: boolean;
  isSpam: boolean;
  attachmentCount: number;
}

interface EmailHeaders {
  subject?: string;
  from?: Array<{ name?: string; address: string }>;
  to?: Array<{ name?: string; address: string }>;
  cc?: Array<{ name?: string; address: string }>;
  date?: Date;
  messageId?: string;
  inReplyTo?: string;
  references?: string[];
  autoSubmitted?: string;
  precedence?: string;
  xAutoResponseSuppress?: string;
}

interface EmailContent {
  text?: string;
  html?: string;
  attachments?: Array<{
    filename: string;
    contentType: string;
    size: number;
  }>;
}

/**
 * Parser avançado de emails para extração de dados de tickets
 */
export class HelpdeskEmailParser {
  // Palavras-chave para detecção de prioridade
  private static readonly PRIORITY_KEYWORDS = {
    URGENTE: [
      'urgente', 'emergency', 'crítico', 'critical', 'asap', 'imediato',
      'emergência', 'grave', 'serious', 'down', 'parado', 'offline'
    ],
    ALTA: [
      'importante', 'important', 'high', 'alta', 'priority', 'prioridade',
      'problema', 'issue', 'erro', 'error', 'falha', 'failure'
    ],
    MEDIA: [
      'normal', 'medium', 'média', 'regular', 'standard', 'padrão'
    ],
    BAIXA: [
      'baixa', 'low', 'minor', 'pequeno', 'simples', 'simple',
      'dúvida', 'question', 'pergunta', 'info', 'informação'
    ]
  };

  // Palavras-chave para categorização
  private static readonly CATEGORY_KEYWORDS = {
    'Suporte Técnico': [
      'erro', 'error', 'bug', 'problema', 'issue', 'falha', 'failure',
      'não funciona', 'not working', 'broken', 'crash', 'travou'
    ],
    'Solicitação': [
      'solicito', 'request', 'preciso', 'need', 'gostaria', 'would like',
      'poderia', 'could', 'favor', 'please', 'por favor'
    ],
    'Dúvida': [
      'dúvida', 'question', 'como', 'how', 'onde', 'where', 'quando', 'when',
      'por que', 'why', 'o que', 'what', 'ajuda', 'help'
    ],
    'Reclamação': [
      'reclamação', 'complaint', 'insatisfeito', 'unsatisfied', 'ruim', 'bad',
      'péssimo', 'terrible', 'horrível', 'horrible', 'problema sério'
    ],
    'Elogio': [
      'elogio', 'praise', 'parabéns', 'congratulations', 'excelente', 'excellent',
      'ótimo', 'great', 'perfeito', 'perfect', 'obrigado', 'thank you'
    ]
  };

  // Indicadores de auto-resposta
  private static readonly AUTO_REPLY_INDICATORS = [
    'auto-reply', 'automatic reply', 'out of office', 'fora do escritório',
    'resposta automática', 'vacation', 'férias', 'ausente', 'away',
    'do not reply', 'não responder', 'noreply', 'no-reply'
  ];

  // Indicadores de spam
  private static readonly SPAM_INDICATORS = [
    'viagra', 'casino', 'lottery', 'winner', 'congratulations',
    'click here', 'free money', 'urgent business', 'nigerian prince',
    'inheritance', 'million dollars', 'act now', 'limited time'
  ];

  /**
   * Analisa um email e extrai dados estruturados para criação de ticket
   */
  static parseEmail(headers: EmailHeaders, content: EmailContent): ParsedEmailData {
    const subject = headers.subject || 'Sem assunto';
    const textContent = content.text || '';
    const htmlContent = content.html || '';
    const fullContent = `${subject} ${textContent} ${htmlContent}`.toLowerCase();

    return {
      assunto: this.cleanSubject(subject),
      descricao: this.extractDescription(content),
      prioridade: this.detectPriority(fullContent),
      categoria: this.detectCategory(fullContent),
      tags: this.extractTags(fullContent),
      isAutoReply: this.isAutoReply(headers, fullContent),
      isSpam: this.isSpam(headers, fullContent),
      attachmentCount: content.attachments?.length || 0
    };
  }

  /**
   * Limpa o assunto do email removendo prefixos comuns
   */
  private static cleanSubject(subject: string): string {
    return subject
      .replace(/^(re:|fw:|fwd:|enc:|encaminhado:|resposta:)\s*/gi, '')
      .replace(/\[.*?\]/g, '') // Remove tags entre colchetes
      .replace(/\s+/g, ' ') // Normaliza espaços
      .trim();
  }

  /**
   * Extrai e limpa a descrição do email
   */
  private static extractDescription(content: EmailContent): string {
    let description = content.text || content.html || '';

    // Se for HTML, tentar extrair texto
    if (!content.text && content.html) {
      description = this.htmlToText(content.html);
    }

    // Limpar conteúdo
    description = this.cleanEmailContent(description);

    // Limitar tamanho
    if (description.length > 5000) {
      description = description.substring(0, 5000) + '\n\n[Conteúdo truncado...]';
    }

    return description || 'Email sem conteúdo';
  }

  /**
   * Converte HTML básico para texto
   */
  private static htmlToText(html: string): string {
    return html
      .replace(/<br\s*\/?>/gi, '\n')
      .replace(/<\/p>/gi, '\n\n')
      .replace(/<\/div>/gi, '\n')
      .replace(/<[^>]*>/g, '') // Remove todas as tags HTML
      .replace(/&nbsp;/g, ' ')
      .replace(/&amp;/g, '&')
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .replace(/&quot;/g, '"')
      .replace(/&#39;/g, "'");
  }

  /**
   * Limpa o conteúdo do email removendo headers e formatação desnecessária
   */
  private static cleanEmailContent(content: string): string {
    let cleaned = content;

    // Remover headers comuns de email
    cleaned = cleaned
      .replace(/^From:.*$/gm, '')
      .replace(/^To:.*$/gm, '')
      .replace(/^Subject:.*$/gm, '')
      .replace(/^Date:.*$/gm, '')
      .replace(/^Message-ID:.*$/gm, '')
      .replace(/^Content-Type:.*$/gm, '')
      .replace(/^Content-Transfer-Encoding:.*$/gm, '')
      .replace(/^MIME-Version:.*$/gm, '')
      .replace(/^X-.*$/gm, '')
      .replace(/^Received:.*$/gm, '')
      .replace(/^Return-Path:.*$/gm, '')
      .replace(/^Delivered-To:.*$/gm, '');

    // Remover assinaturas comuns
    cleaned = cleaned
      .replace(/--\s*$/gm, '') // Separador de assinatura
      .replace(/^Enviado do meu .*$/gm, '')
      .replace(/^Sent from my .*$/gm, '')
      .replace(/^Get Outlook for .*$/gm, '');

    // Remover disclaimers
    cleaned = cleaned
      .replace(/Este email.*confidencial.*$/gm, '')
      .replace(/This email.*confidential.*$/gm, '')
      .replace(/CONFIDENTIAL.*$/gm, '');

    // Remover linhas vazias excessivas
    cleaned = cleaned
      .replace(/\n\s*\n\s*\n/g, '\n\n')
      .trim();

    return cleaned;
  }

  /**
   * Detecta a prioridade baseada no conteúdo
   */
  private static detectPriority(content: string): HelpdeskPrioridade {
    const contentLower = content.toLowerCase();

    // Verificar urgente primeiro
    if (this.PRIORITY_KEYWORDS.URGENTE.some(keyword => contentLower.includes(keyword))) {
      return 'URGENTE';
    }

    // Verificar alta
    if (this.PRIORITY_KEYWORDS.ALTA.some(keyword => contentLower.includes(keyword))) {
      return 'ALTA';
    }

    // Verificar baixa
    if (this.PRIORITY_KEYWORDS.BAIXA.some(keyword => contentLower.includes(keyword))) {
      return 'BAIXA';
    }

    // Padrão é média
    return 'MEDIA';
  }

  /**
   * Detecta a categoria baseada no conteúdo
   */
  private static detectCategory(content: string): string | undefined {
    const contentLower = content.toLowerCase();

    for (const [category, keywords] of Object.entries(this.CATEGORY_KEYWORDS)) {
      if (keywords.some(keyword => contentLower.includes(keyword))) {
        return category;
      }
    }

    return undefined;
  }

  /**
   * Extrai tags relevantes do conteúdo
   */
  private static extractTags(content: string): string[] {
    const tags: string[] = [];
    const contentLower = content.toLowerCase();

    // Tags baseadas em tecnologias
    const techKeywords = {
      'windows': ['windows', 'win10', 'win11'],
      'mac': ['mac', 'macos', 'apple'],
      'linux': ['linux', 'ubuntu', 'debian'],
      'mobile': ['mobile', 'android', 'ios', 'celular'],
      'email': ['email', 'outlook', 'gmail', 'thunderbird'],
      'internet': ['internet', 'wifi', 'conexão', 'rede'],
      'impressora': ['impressora', 'printer', 'imprimir'],
      'software': ['software', 'programa', 'aplicativo', 'app']
    };

    for (const [tag, keywords] of Object.entries(techKeywords)) {
      if (keywords.some(keyword => contentLower.includes(keyword))) {
        tags.push(tag);
      }
    }

    return tags;
  }

  /**
   * Verifica se é uma resposta automática
   */
  private static isAutoReply(headers: EmailHeaders, content: string): boolean {
    // Verificar headers específicos
    if (headers.autoSubmitted || 
        headers.precedence === 'bulk' || 
        headers.xAutoResponseSuppress) {
      return true;
    }

    // Verificar conteúdo
    const contentLower = content.toLowerCase();
    return this.AUTO_REPLY_INDICATORS.some(indicator => 
      contentLower.includes(indicator)
    );
  }

  /**
   * Verifica se é spam
   */
  private static isSpam(headers: EmailHeaders, content: string): boolean {
    const contentLower = content.toLowerCase();
    
    // Verificar indicadores de spam no conteúdo
    const spamScore = this.SPAM_INDICATORS.reduce((score, indicator) => {
      return contentLower.includes(indicator) ? score + 1 : score;
    }, 0);

    // Se tem 2 ou mais indicadores, provavelmente é spam
    if (spamScore >= 2) {
      return true;
    }

    // Verificar padrões suspeitos
    const suspiciousPatterns = [
      /\$\d+[,.]\d+/g, // Valores monetários
      /click here/gi,
      /act now/gi,
      /limited time/gi,
      /free.*money/gi
    ];

    return suspiciousPatterns.some(pattern => pattern.test(content));
  }

  /**
   * Valida se o email deve gerar um ticket
   */
  static shouldCreateTicket(parsedData: ParsedEmailData): boolean {
    // Não criar ticket para auto-replies
    if (parsedData.isAutoReply) {
      return false;
    }

    // Não criar ticket para spam
    if (parsedData.isSpam) {
      return false;
    }

    // Não criar ticket se o assunto for muito genérico
    const genericSubjects = [
      'test', 'teste', 'hello', 'hi', 'oi', 'olá',
      'sem assunto', 'no subject', ''
    ];
    
    if (genericSubjects.includes(parsedData.assunto.toLowerCase().trim())) {
      return false;
    }

    // Não criar ticket se a descrição for muito curta
    if (parsedData.descricao.length < 10) {
      return false;
    }

    return true;
  }

  /**
   * Gera um resumo do email para logs
   */
  static generateSummary(parsedData: ParsedEmailData): string {
    const parts = [
      `Assunto: ${parsedData.assunto}`,
      `Prioridade: ${parsedData.prioridade}`,
      `Categoria: ${parsedData.categoria || 'Não detectada'}`,
      `Tags: ${parsedData.tags.join(', ') || 'Nenhuma'}`,
      `Anexos: ${parsedData.attachmentCount}`,
      `Auto-reply: ${parsedData.isAutoReply ? 'Sim' : 'Não'}`,
      `Spam: ${parsedData.isSpam ? 'Sim' : 'Não'}`
    ];

    return parts.join(' | ');
  }
}
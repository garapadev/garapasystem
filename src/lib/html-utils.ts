/**
 * Utilitários para processamento de HTML
 */

/**
 * Extrai texto limpo de conteúdo HTML removendo todas as tags
 * @param htmlContent - Conteúdo HTML para processar
 * @returns Texto limpo sem tags HTML
 */
export function extractTextFromHtml(htmlContent: string): string {
  if (!htmlContent || typeof htmlContent !== 'string') {
    return '';
  }

  return htmlContent
    // Remove scripts e styles completamente
    .replace(/<script[^>]*>.*?<\/script>/gi, '')
    .replace(/<style[^>]*>.*?<\/style>/gi, '')
    // Remove comentários HTML
    .replace(/<!--[\s\S]*?-->/g, '')
    // Remove todas as tags HTML
    .replace(/<[^>]*>/g, '')
    // Decodifica entidades HTML comuns
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&apos;/g, "'")
    // Remove espaços extras e quebras de linha
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Gera um preview do conteúdo limitando o número de caracteres
 * @param content - Conteúdo para gerar preview
 * @param maxLength - Número máximo de caracteres (padrão: 150)
 * @returns Preview do conteúdo
 */
export function generatePreview(content: string, maxLength: number = 150): string {
  if (!content) return '';
  
  const cleanContent = content.trim();
  if (cleanContent.length <= maxLength) {
    return cleanContent;
  }
  
  return cleanContent.substring(0, maxLength).trim() + '...';
}

/**
 * Processa conteúdo de email priorizando textContent, mas extraindo de htmlContent se necessário
 * @param textContent - Conteúdo em texto puro
 * @param htmlContent - Conteúdo em HTML
 * @returns Objeto com texto limpo e preview
 */
export function processEmailContent(textContent?: string | null, htmlContent?: string | null) {
  let cleanText = '';
  
  if (textContent && textContent.trim()) {
    cleanText = textContent.trim();
  } else if (htmlContent && htmlContent.trim()) {
    cleanText = extractTextFromHtml(htmlContent);
  }
  
  return {
    text: cleanText,
    preview: generatePreview(cleanText)
  };
}
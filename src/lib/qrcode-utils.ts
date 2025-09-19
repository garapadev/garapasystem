import QRCode from 'qrcode';

/**
 * Converte dados de QR Code para SVG
 * @param data - Dados para gerar o QR Code
 * @param options - Opções de configuração do QR Code
 * @returns Promise<string> - SVG como string
 */
export async function generateQRCodeSVG(
  data: string,
  options?: {
    width?: number;
    margin?: number;
    color?: {
      dark?: string;
      light?: string;
    };
  }
): Promise<string> {
  const defaultOptions = {
    type: 'svg' as const,
    width: 256,
    margin: 2,
    color: {
      dark: '#000000',
      light: '#FFFFFF',
    },
    ...options,
  };

  try {
    const svgString = await QRCode.toString(data, defaultOptions);
    return svgString;
  } catch (error) {
    console.error('Erro ao gerar QR Code SVG:', error);
    throw new Error('Falha ao gerar QR Code SVG');
  }
}

/**
 * Converte uma imagem base64 de QR Code para SVG
 * Esta função é útil quando você já tem um QR Code em base64 e quer convertê-lo para SVG
 * @param base64Data - Dados base64 do QR Code (com ou sem prefixo data:image)
 * @param originalData - Dados originais que foram usados para gerar o QR Code
 * @returns Promise<string> - SVG como string
 */
export async function convertBase64ToQRCodeSVG(
  base64Data: string,
  originalData?: string
): Promise<string> {
  // Se temos os dados originais, é melhor regenerar o SVG
  if (originalData) {
    return generateQRCodeSVG(originalData);
  }

  // Se não temos os dados originais, vamos tentar extrair da imagem base64
  // Nota: Esta é uma abordagem limitada, é melhor ter os dados originais
  throw new Error('Para converter para SVG, é necessário ter os dados originais do QR Code');
}

/**
 * Valida se uma string é um base64 válido
 * @param str - String para validar
 * @returns boolean
 */
export function isValidBase64(str: string): boolean {
  try {
    // Remove o prefixo data:image se existir
    const base64String = str.replace(/^data:image\/[a-z]+;base64,/, '');
    
    // Verifica se é base64 válido
    return btoa(atob(base64String)) === base64String;
  } catch (error) {
    return false;
  }
}

/**
 * Remove o prefixo data:image de uma string base64
 * @param base64String - String base64 com ou sem prefixo
 * @returns string - Base64 limpo
 */
export function cleanBase64(base64String: string): string {
  return base64String.replace(/^data:image\/[a-z]+;base64,/, '');
}
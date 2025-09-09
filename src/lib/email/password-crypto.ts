import crypto from 'crypto';

const ALGORITHM = 'aes-256-cbc';
const SECRET_KEY = process.env.EMAIL_ENCRYPTION_KEY || process.env.NEXTAUTH_SECRET || 'default-secret-key-change-in-production';

/**
 * Criptografa uma senha para armazenamento seguro
 */
export function encryptPassword(password: string): string {
  try {
    // Gerar IV aleatório
    const iv = crypto.randomBytes(16);
    
    // Criar chave de 32 bytes a partir do secret
    const key = crypto.scryptSync(SECRET_KEY, 'salt', 32);
    
    // Criar cipher
    const cipher = crypto.createCipheriv(ALGORITHM, key, iv);
    
    // Criptografar
    let encrypted = cipher.update(password, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    
    // Retornar IV + dados criptografados em base64
    const result = iv.toString('hex') + ':' + encrypted;
    return Buffer.from(result).toString('base64');
    
  } catch (error) {
    console.error('Erro ao criptografar senha:', error);
    throw new Error('Falha na criptografia da senha');
  }
}

/**
 * Descriptografa uma senha para uso em autenticação
 */
export function decryptPassword(encryptedPassword: string): string {
  try {
    // Se não parece estar criptografada, retornar como está
    if (!encryptedPassword || encryptedPassword.length < 20) {
      return encryptedPassword;
    }
    
    // Se começar com $2, é hash bcrypt (não reversível)
    if (encryptedPassword.startsWith('$2')) {
      console.warn('Senha está em formato bcrypt (não reversível). Use a senha original.');
      return encryptedPassword;
    }
    
    // Tentar descriptografar
    const data = Buffer.from(encryptedPassword, 'base64').toString();
    const parts = data.split(':');
    
    if (parts.length !== 2) {
      // Se não está no formato esperado, retornar como está
      return encryptedPassword;
    }
    
    const iv = Buffer.from(parts[0], 'hex');
    const encrypted = parts[1];
    
    // Criar chave de 32 bytes a partir do secret
    const key = crypto.scryptSync(SECRET_KEY, 'salt', 32);
    
    // Criar decipher
    const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);
    
    // Descriptografar
    let decrypted = decipher.update(encrypted, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    
    return decrypted;
    
  } catch (error) {
    console.warn('Erro ao descriptografar senha, usando como está:', error);
    return encryptedPassword;
  }
}

/**
 * Verifica se uma senha está criptografada
 */
export function isPasswordEncrypted(password: string): boolean {
  if (!password || password.length < 20) {
    return false;
  }
  
  // Verificar se é hash bcrypt
  if (password.startsWith('$2')) {
    return true;
  }
  
  // Verificar se está no formato base64 da nossa criptografia
  try {
    const data = Buffer.from(password, 'base64').toString();
    const parts = data.split(':');
    return parts.length === 2 && parts[0].length === 32; // IV tem 16 bytes = 32 chars hex
  } catch {
    return false;
  }
}

/**
 * Migra uma senha de bcrypt para criptografia reversível
 */
export function migrateFromBcrypt(originalPassword: string): string {
  return encryptPassword(originalPassword);
}
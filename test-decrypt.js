const crypto = require('crypto');

const ALGORITHM = 'aes-256-cbc';
const SECRET_KEY = process.env.EMAIL_ENCRYPTION_KEY || process.env.NEXTAUTH_SECRET || 'default-secret-key-change-in-production';

function decryptPassword(encryptedPassword) {
  try {
    // Se for bcrypt, retorna como está
    if (encryptedPassword.startsWith('$2')) {
      return encryptedPassword;
    }
    
    // Separar IV e dados criptografados
    const [ivHex, encrypted] = encryptedPassword.split(':');
    if (!ivHex || !encrypted) {
      return encryptedPassword;
    }
    
    // Criar chave
    const key = crypto.createHash('sha256').update(SECRET_KEY).digest();
    const iv = Buffer.from(ivHex, 'hex');
    
    // Criar decipher
    const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);
    
    // Descriptografar
    let decrypted = decipher.update(encrypted, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    
    return decrypted;
    
  } catch (error) {
    console.warn('Erro ao descriptografar senha:', error);
    return encryptedPassword;
  }
}

const encryptedPassword = '555b1429c0e5bdd291011193e184b3b2:87727c1c85d5dda95f37c5e59922de81';
const decryptedPassword = decryptPassword(encryptedPassword);

console.log('Senha criptografada:', encryptedPassword);
console.log('Senha descriptografada:', decryptedPassword);
console.log('Senha correta esperada: AllTomatos2024');
console.log('Senhas coincidem:', decryptedPassword === 'AllTomatos2024');
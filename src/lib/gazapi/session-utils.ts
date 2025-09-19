interface AuthValidationResult {
  valid: boolean;
  user?: any;
  apiKey?: {
    id: string;
    nome: string;
    permissoes: string[];
  };
  error?: string;
  authType?: 'session' | 'apikey';
}

export interface SessionParams {
  session: string;
  sessionKey: string;
  token: string;
}

export interface GetSessionParamsOptions {
  colaboradorId?: string; // Para uso com API keys
}

/**
 * Obtém os parâmetros de sessão padronizados baseados na autenticação
 */
export function getSessionParams(
  authResult: AuthValidationResult,
  options: GetSessionParamsOptions = {}
): SessionParams {
  let sessionId: string;
  
  if (authResult.authType === 'session' && authResult.user?.colaborador?.id) {
    // Usuário logado - usar ID do colaborador
    sessionId = authResult.user.colaborador.id;
  } else if (authResult.authType === 'apikey' && options.colaboradorId) {
    // API Key - usar colaboradorId fornecido
    sessionId = options.colaboradorId;
  } else {
    throw new Error('Não foi possível determinar o identificador da sessão');
  }

  // Converter para formato válido (letras minúsculas, números e underscore)
  const session = sessionId.toLowerCase().replace(/[^a-z0-9]/g, '_');
  const sessionKey = `key_${session}`;
  
  // Usar token admin do ambiente
  const token = process.env.GAZAPI_ADMIN_TOKEN || 'gazapi_admin_2024';

  return {
    session,
    sessionKey,
    token
  };
}

/**
 * Valida se os parâmetros de sessão estão corretos
 */
export function validateSessionParams(params: Partial<SessionParams>): string | null {
  if (!params.session) {
    return 'Parâmetro session é obrigatório';
  }
  
  if (!params.sessionKey) {
    return 'Parâmetro sessionKey é obrigatório';
  }
  
  if (!params.token) {
    return 'Parâmetro token é obrigatório';
  }
  
  return null;
}
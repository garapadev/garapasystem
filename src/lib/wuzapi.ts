import { db } from '@/lib/db';

interface WuzapiConfig {
  apiUrl: string;
  adminToken: string;
}

export async function getWuzapiConfig(): Promise<WuzapiConfig | null> {
  try {
    const [apiUrlConfig, adminTokenConfig] = await Promise.all([
      db.configuracao.findFirst({
        where: { chave: 'wuzapi_url' }
      }),
      db.configuracao.findFirst({
        where: { chave: 'wuzapi_admin_token' }
      })
    ]);

    if (!apiUrlConfig?.valor || !adminTokenConfig?.valor) {
      return null;
    }

    return {
      apiUrl: apiUrlConfig.valor,
      adminToken: adminTokenConfig.valor
    };
  } catch (error) {
    console.error('Erro ao buscar configurações wuzapi:', error);
    return null;
  }
}

export async function createWuzapiUser(
  name: string, 
  email: string, 
  colaboradorId: number
): Promise<{ success: boolean; token?: string; error?: string }> {
  try {
    const config = await getWuzapiConfig();
    
    if (!config) {
      return { 
        success: false, 
        error: 'Configurações da API Wuzapi não encontradas' 
      };
    }

    // Gera um token único baseado no ID do colaborador
    const userToken = `COL_${colaboradorId}_${Date.now()}`;

    // Cria o usuário na API Wuzapi
    const response = await fetch(`${config.apiUrl}/admin/users`, {
      method: 'POST',
      headers: {
        'Authorization': config.adminToken,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        name: name,
        token: userToken
      }),
    });

    if (response.ok) {
      // Atualiza o colaborador com o token
      await db.colaborador.update({
        where: { id: colaboradorId },
        data: { 
          whatsappToken: userToken,
          whatsappInstanceName: email
        }
      });

      return { 
        success: true, 
        token: userToken 
      };
    } else {
      const errorText = await response.text();
      return { 
        success: false, 
        error: `Falha na API: ${errorText}` 
      };
    }
  } catch (error) {
    console.error('Erro ao criar usuário wuzapi:', error);
    return { 
      success: false, 
      error: 'Erro interno ao criar usuário' 
    };
  }
}

export async function createWuzapiInstance(
  instanceName: string,
  userToken: string,
  events: string[] = ['message', 'qr', 'ready', 'authenticated']
): Promise<{ success: boolean; error?: string }> {
  try {
    const config = await getWuzapiConfig();
    
    if (!config) {
      return { 
        success: false, 
        error: 'Configurações da API Wuzapi não encontradas' 
      };
    }

    // Cria a instância
    const response = await fetch(`${config.apiUrl}/instances`, {
      method: 'POST',
      headers: {
        'Authorization': userToken,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        name: instanceName,
        webhook: {
          url: `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3001'}/api/webhooks/wuzapi`,
          events: events
        }
      }),
    });

    if (response.ok) {
      return { success: true };
    } else {
      const errorText = await response.text();
      return { 
        success: false, 
        error: `Falha ao criar instância: ${errorText}` 
      };
    }
  } catch (error) {
    console.error('Erro ao criar instância wuzapi:', error);
    return { 
      success: false, 
      error: 'Erro interno ao criar instância' 
    };
  }
}
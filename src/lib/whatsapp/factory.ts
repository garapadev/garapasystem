import { WhatsAppApiAdapter, WhatsAppApiConfig } from './types';
import { WuzApiAdapter } from './adapters/wuzapi-adapter';
import { WahaAdapter } from './adapters/waha-adapter';

export class WhatsAppApiFactory {
  private static instance: WhatsAppApiFactory;
  private currentAdapter: WhatsAppApiAdapter | null = null;
  private currentConfig: WhatsAppApiConfig | null = null;

  private constructor() {}

  static getInstance(): WhatsAppApiFactory {
    if (!WhatsAppApiFactory.instance) {
      WhatsAppApiFactory.instance = new WhatsAppApiFactory();
    }
    return WhatsAppApiFactory.instance;
  }

  /**
   * Cria e configura um adaptador baseado no tipo de API
   */
  createAdapter(config: WhatsAppApiConfig): WhatsAppApiAdapter {
    let adapter: WhatsAppApiAdapter;

    switch (config.type) {
      case 'wuzapi':
        adapter = new WuzApiAdapter();
        break;
      case 'waha':
        adapter = new WahaAdapter();
        break;
      default:
        throw new Error(`Tipo de API não suportado: ${config.type}`);
    }

    adapter.configure(config);
    this.currentAdapter = adapter;
    this.currentConfig = config;

    return adapter;
  }

  /**
   * Retorna o adaptador atual ou cria um novo se a configuração mudou
   */
  async getCurrentAdapter(): Promise<WhatsAppApiAdapter> {
    // Buscar configurações atuais do banco
    const currentConfig = await this.loadCurrentConfig();
    
    // Se não há adaptador ou a configuração mudou, criar novo
    if (!this.currentAdapter || !this.configEquals(currentConfig, this.currentConfig)) {
      return this.createAdapter(currentConfig);
    }

    return this.currentAdapter;
  }

  /**
   * Carrega as configurações atuais do banco de dados
   */
  private async loadCurrentConfig(): Promise<WhatsAppApiConfig> {
    try {
      const response = await fetch('/api/configuracoes');
      const configuracoes = await response.json();

      const configMap = new Map(
        configuracoes.map((config: any) => [config.chave, config.valor])
      );

      const type = (configMap.get('whatsapp_api_type') as string) || 'wuzapi';
      
      if (type === 'wuzapi') {
        return {
          type: 'wuzapi',
          url: (configMap.get('wuzapi_url') as string) || 'http://localhost:8080',
          adminToken: configMap.get('wuzapi_admin_token') as string | undefined,
        };
      } else {
        return {
          type: 'waha',
          url: (configMap.get('waha_url') as string) || 'https://waha.devlike.pro',
          apiKey: configMap.get('waha_api_key') as string | undefined,
        };
      }
    } catch (error) {
      console.error('Erro ao carregar configurações:', error);
      // Fallback para WuzAPI
      return {
        type: 'wuzapi',
        url: 'http://localhost:8080',
      };
    }
  }

  /**
   * Compara duas configurações para verificar se são iguais
   */
  private configEquals(config1: WhatsAppApiConfig | null, config2: WhatsAppApiConfig | null): boolean {
    if (!config1 || !config2) return false;
    
    return (
      config1.type === config2.type &&
      config1.url === config2.url &&
      config1.adminToken === config2.adminToken &&
      config1.apiKey === config2.apiKey
    );
  }

  /**
   * Força a recriação do adaptador na próxima chamada
   */
  invalidateAdapter(): void {
    this.currentAdapter = null;
    this.currentConfig = null;
  }
}

// Função de conveniência para obter o adaptador atual
export async function getWhatsAppAdapter(): Promise<WhatsAppApiAdapter> {
  const factory = WhatsAppApiFactory.getInstance();
  return factory.getCurrentAdapter();
}
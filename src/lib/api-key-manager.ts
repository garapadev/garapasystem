import { db } from '@/lib/db';
import crypto from 'crypto';

interface CreateApiKeyOptions {
  nome: string;
  permissoes: string[];
  expiresAt?: Date;
  limiteTaxa?: number;
  descricao?: string;
}

interface ApiKeyInfo {
  id: string;
  nome: string;
  chave: string; // Chave original (apenas na criação)
  chaveHash: string; // Hash da chave para armazenamento
  permissoes: string[];
  ativo: boolean;
  expiresAt?: Date;
  limiteTaxa?: number;
  descricao?: string;
  createdAt: Date;
  updatedAt: Date;
  ultimoUso?: Date;
}

export class ApiKeyManager {
  /**
   * Gera uma nova chave de API
   */
  static generateApiKey(): string {
    // Gera uma chave de 32 bytes (256 bits) em base64url
    const buffer = crypto.randomBytes(32);
    return buffer.toString('base64url');
  }

  /**
   * Cria um hash da chave para armazenamento seguro
   */
  static hashApiKey(key: string): string {
    return crypto.createHash('sha256').update(key).digest('hex');
  }

  /**
   * Cria uma nova chave de API
   */
  static async createApiKey(options: CreateApiKeyOptions): Promise<ApiKeyInfo> {
    try {
      // Gera a chave
      const chave = this.generateApiKey();
      const chaveHash = this.hashApiKey(chave);

      // Cria no banco de dados
      const apiKey = await db.apiKey.create({
        data: {
          nome: options.nome,
          chave: chaveHash,
          permissoes: options.permissoes ? JSON.stringify(options.permissoes) : null,
          expiresAt: options.expiresAt,
          limiteTaxa: options.limiteTaxa,
          descricao: options.descricao,
          ativo: true
        }
      });

      return {
        id: apiKey.id,
        nome: apiKey.nome,
        chave, // Retorna a chave original apenas na criação
        chaveHash: apiKey.chave,
        permissoes: apiKey.permissoes ? JSON.parse(apiKey.permissoes) : [],
        ativo: apiKey.ativo,
        expiresAt: apiKey.expiresAt,
        limiteTaxa: apiKey.limiteTaxa,
        descricao: apiKey.descricao,
        createdAt: apiKey.createdAt,
        updatedAt: apiKey.updatedAt,
        ultimoUso: apiKey.ultimoUso
      };
    } catch (error) {
      console.error('Erro ao criar chave de API:', error);
      throw new Error('Erro ao criar chave de API');
    }
  }

  /**
   * Lista todas as chaves de API
   */
  static async listApiKeys(): Promise<Omit<ApiKeyInfo, 'chave' | 'chaveHash'>[]> {
    try {
      const apiKeys = await db.apiKey.findMany({
        orderBy: { createdAt: 'desc' }
      });

      return apiKeys.map(key => ({
        id: key.id,
        nome: key.nome,
        permissoes: key.permissoes ? JSON.parse(key.permissoes) : [],
        ativo: key.ativo,
        expiresAt: key.expiresAt,
        limiteTaxa: key.limiteTaxa,
        descricao: key.descricao,
        createdAt: key.createdAt,
        updatedAt: key.updatedAt,
        ultimoUso: key.ultimoUso
      }));
    } catch (error) {
      console.error('Erro ao listar chaves de API:', error);
      throw new Error('Erro ao listar chaves de API');
    }
  }

  /**
   * Busca uma chave de API por ID
   */
  static async getApiKey(id: string): Promise<Omit<ApiKeyInfo, 'chave' | 'chaveHash'> | null> {
    try {
      const apiKey = await db.apiKey.findUnique({
        where: { id }
      });

      if (!apiKey) {
        return null;
      }

      return {
        id: apiKey.id,
        nome: apiKey.nome,
        permissoes: apiKey.permissoes ? JSON.parse(apiKey.permissoes) : [],
        ativo: apiKey.ativo,
        expiresAt: apiKey.expiresAt,
        limiteTaxa: apiKey.limiteTaxa,
        descricao: apiKey.descricao,
        createdAt: apiKey.createdAt,
        updatedAt: apiKey.updatedAt,
        ultimoUso: apiKey.ultimoUso
      };
    } catch (error) {
      console.error('Erro ao buscar chave de API:', error);
      throw new Error('Erro ao buscar chave de API');
    }
  }

  /**
   * Atualiza uma chave de API
   */
  static async updateApiKey(
    id: string,
    updates: Partial<Pick<CreateApiKeyOptions, 'nome' | 'permissoes' | 'expiresAt' | 'limiteTaxa' | 'descricao'>>
  ): Promise<Omit<ApiKeyInfo, 'chave' | 'chaveHash'>> {
    try {
      // Converte permissoes para JSON string se fornecido
      const dataToUpdate = {
        ...updates,
        ...(updates.permissoes && { permissoes: JSON.stringify(updates.permissoes) })
      };

      const apiKey = await db.apiKey.update({
        where: { id },
        data: dataToUpdate
      });

      return {
        id: apiKey.id,
        nome: apiKey.nome,
        permissoes: apiKey.permissoes ? JSON.parse(apiKey.permissoes) : [],
        ativo: apiKey.ativo,
        expiresAt: apiKey.expiresAt,
        limiteTaxa: apiKey.limiteTaxa,
        descricao: apiKey.descricao,
        createdAt: apiKey.createdAt,
        updatedAt: apiKey.updatedAt,
        ultimoUso: apiKey.ultimoUso
      };
    } catch (error) {
      console.error('Erro ao atualizar chave de API:', error);
      throw new Error('Erro ao atualizar chave de API');
    }
  }

  /**
   * Ativa ou desativa uma chave de API
   */
  static async toggleApiKey(id: string): Promise<boolean> {
    try {
      const apiKey = await db.apiKey.findUnique({
        where: { id },
        select: { ativo: true }
      });

      if (!apiKey) {
        throw new Error('Chave de API não encontrada');
      }

      const updatedKey = await db.apiKey.update({
        where: { id },
        data: { ativo: !apiKey.ativo }
      });

      return updatedKey.ativo;
    } catch (error) {
      console.error('Erro ao alternar status da chave de API:', error);
      throw new Error('Erro ao alternar status da chave de API');
    }
  }

  /**
   * Exclui uma chave de API
   */
  static async deleteApiKey(id: string): Promise<void> {
    try {
      await db.apiKey.delete({
        where: { id }
      });
    } catch (error) {
      console.error('Erro ao excluir chave de API:', error);
      throw new Error('Erro ao excluir chave de API');
    }
  }

  /**
   * Valida se uma chave de API é válida
   */
  static async validateApiKey(key: string): Promise<{
    valid: boolean;
    apiKey?: Omit<ApiKeyInfo, 'chave' | 'chaveHash'>;
    reason?: string;
  }> {
    try {
      const keyHash = this.hashApiKey(key);
      
      const apiKey = await db.apiKey.findFirst({
        where: {
          chave: keyHash
        }
      });

      if (!apiKey) {
        return {
          valid: false,
          reason: 'Chave de API não encontrada'
        };
      }

      if (!apiKey.ativo) {
        return {
          valid: false,
          reason: 'Chave de API desativada'
        };
      }

      if (apiKey.expiresAt && apiKey.expiresAt < new Date()) {
        return {
          valid: false,
          reason: 'Chave de API expirada'
        };
      }

      // Atualiza o último uso
      await db.apiKey.update({
        where: { id: apiKey.id },
        data: { ultimoUso: new Date() }
      });

      return {
        valid: true,
        apiKey: {
          id: apiKey.id,
          nome: apiKey.nome,
          permissoes: apiKey.permissoes ? JSON.parse(apiKey.permissoes) : [],
          ativo: apiKey.ativo,
          expiresAt: apiKey.expiresAt,
          limiteTaxa: apiKey.limiteTaxa,
          descricao: apiKey.descricao,
          createdAt: apiKey.createdAt,
          updatedAt: apiKey.updatedAt,
          ultimoUso: new Date()
        }
      };
    } catch (error) {
      console.error('Erro ao validar chave de API:', error);
      return {
        valid: false,
        reason: 'Erro interno do servidor'
      };
    }
  }

  /**
   * Regenera uma chave de API (cria uma nova chave mantendo as configurações)
   */
  static async regenerateApiKey(id: string): Promise<ApiKeyInfo> {
    try {
      const existingKey = await db.apiKey.findUnique({
        where: { id }
      });

      if (!existingKey) {
        throw new Error('Chave de API não encontrada');
      }

      // Gera nova chave
      const novaChave = this.generateApiKey();
      const novaChaveHash = this.hashApiKey(novaChave);

      // Atualiza no banco
      const apiKey = await db.apiKey.update({
        where: { id },
        data: {
          chave: novaChaveHash,
          updatedAt: new Date()
        }
      });

      return {
        id: apiKey.id,
        nome: apiKey.nome,
        chave: novaChave, // Retorna a nova chave
        chaveHash: apiKey.chave,
        permissoes: apiKey.permissoes ? JSON.parse(apiKey.permissoes) : [],
        ativo: apiKey.ativo,
        expiresAt: apiKey.expiresAt,
        limiteTaxa: apiKey.limiteTaxa,
        descricao: apiKey.descricao,
        createdAt: apiKey.createdAt,
        updatedAt: apiKey.updatedAt,
        ultimoUso: apiKey.ultimoUso
      };
    } catch (error) {
      console.error('Erro ao regenerar chave de API:', error);
      throw new Error('Erro ao regenerar chave de API');
    }
  }

  /**
   * Obtém estatísticas de uso de uma chave de API
   */
  static async getApiKeyStats(id: string, days: number = 30): Promise<{
    totalRequests: number;
    successfulRequests: number;
    failedRequests: number;
    averageResponseTime: number;
    requestsByDay: Array<{ date: string; count: number }>;
    requestsByEndpoint: Array<{ endpoint: string; count: number }>;
    requestsByStatus: Array<{ status: number; count: number }>;
  }> {
    try {
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - days);

      // Busca logs da API para esta chave
      const logs = await db.apiLog.findMany({
        where: {
          apiKeyId: id,
          createdAt: {
            gte: startDate
          }
        },
        select: {
          endpoint: true,
          status: true,
          responseTime: true,
          createdAt: true
        }
      });

      const totalRequests = logs.length;
      const successfulRequests = logs.filter(log => log.status >= 200 && log.status < 400).length;
      const failedRequests = totalRequests - successfulRequests;
      const averageResponseTime = logs.length > 0 
        ? logs.reduce((sum, log) => sum + log.responseTime, 0) / logs.length 
        : 0;

      // Agrupa por dia
      const requestsByDay = logs.reduce((acc, log) => {
        const date = log.createdAt.toISOString().split('T')[0];
        const existing = acc.find(item => item.date === date);
        if (existing) {
          existing.count++;
        } else {
          acc.push({ date, count: 1 });
        }
        return acc;
      }, [] as Array<{ date: string; count: number }>);

      // Agrupa por endpoint
      const requestsByEndpoint = logs.reduce((acc, log) => {
        const existing = acc.find(item => item.endpoint === log.endpoint);
        if (existing) {
          existing.count++;
        } else {
          acc.push({ endpoint: log.endpoint, count: 1 });
        }
        return acc;
      }, [] as Array<{ endpoint: string; count: number }>);

      // Agrupa por status
      const requestsByStatus = logs.reduce((acc, log) => {
        const existing = acc.find(item => item.status === log.status);
        if (existing) {
          existing.count++;
        } else {
          acc.push({ status: log.status, count: 1 });
        }
        return acc;
      }, [] as Array<{ status: number; count: number }>);

      return {
        totalRequests,
        successfulRequests,
        failedRequests,
        averageResponseTime: Math.round(averageResponseTime),
        requestsByDay: requestsByDay.sort((a, b) => a.date.localeCompare(b.date)),
        requestsByEndpoint: requestsByEndpoint.sort((a, b) => b.count - a.count),
        requestsByStatus: requestsByStatus.sort((a, b) => a.status - b.status)
      };
    } catch (error) {
      console.error('Erro ao obter estatísticas da chave de API:', error);
      throw new Error('Erro ao obter estatísticas da chave de API');
    }
  }
}

// Permissões disponíveis para chaves de API
export const AVAILABLE_PERMISSIONS = [
  { value: 'admin', label: 'Administrador (Acesso Total)', description: 'Acesso completo a todos os recursos' },
  { value: 'clientes.read', label: 'Clientes - Leitura', description: 'Visualizar informações de clientes' },
  { value: 'clientes.write', label: 'Clientes - Escrita', description: 'Criar e editar clientes' },
  { value: 'clientes.delete', label: 'Clientes - Exclusão', description: 'Excluir clientes' },
  { value: 'oportunidades.read', label: 'Oportunidades - Leitura', description: 'Visualizar oportunidades' },
  { value: 'oportunidades.write', label: 'Oportunidades - Escrita', description: 'Criar e editar oportunidades' },
  { value: 'oportunidades.delete', label: 'Oportunidades - Exclusão', description: 'Excluir oportunidades' },
  { value: 'colaboradores.read', label: 'Colaboradores - Leitura', description: 'Visualizar colaboradores' },
  { value: 'colaboradores.write', label: 'Colaboradores - Escrita', description: 'Criar e editar colaboradores' },
  { value: 'colaboradores.delete', label: 'Colaboradores - Exclusão', description: 'Excluir colaboradores' },
  { value: 'usuarios.read', label: 'Usuários - Leitura', description: 'Visualizar usuários' },
  { value: 'usuarios.write', label: 'Usuários - Escrita', description: 'Criar e editar usuários' },
  { value: 'usuarios.delete', label: 'Usuários - Exclusão', description: 'Excluir usuários' },
  { value: 'configuracoes.read', label: 'Configurações - Leitura', description: 'Visualizar configurações' },
  { value: 'configuracoes.write', label: 'Configurações - Escrita', description: 'Alterar configurações' },
  { value: 'logs.read', label: 'Logs - Leitura', description: 'Visualizar logs do sistema' }
];
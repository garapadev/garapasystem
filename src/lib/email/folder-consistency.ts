import { db } from '@/lib/db';
import { ImapService } from './imap-service';
import type { EmailConfig, EmailFolder } from '@prisma/client';

interface FolderConsistencyReport {
  localFolders: EmailFolder[];
  remoteFolders: string[];
  missingLocal: string[];
  missingRemote: string[];
  inconsistentCounts: {
    folderId: string;
    folderPath: string;
    localCount: number;
    remoteCount: number;
  }[];
}

export class FolderConsistencyService {
  constructor(private emailConfigId: string) {}

  /**
   * Verifica a consistência entre pastas locais e remotas
   */
  async checkConsistency(): Promise<FolderConsistencyReport> {
    const imapService = new ImapService(this.emailConfigId);
    
    try {
      // Conectar ao IMAP
      const connected = await imapService.connect();
      if (!connected) {
        throw new Error('Falha ao conectar ao servidor IMAP');
      }

      // Buscar pastas locais
      const localFolders = await db.emailFolder.findMany({
        where: { emailConfigId: this.emailConfigId },
        orderBy: { path: 'asc' }
      });

      // Buscar pastas remotas
      await imapService.syncFolders();
      const updatedLocalFolders = await db.emailFolder.findMany({
        where: { emailConfigId: this.emailConfigId },
        orderBy: { path: 'asc' }
      });

      // Comparar contadores de mensagens
      const inconsistentCounts = [];
      for (const folder of updatedLocalFolders) {
        try {
          // Verificar contadores no servidor
          const client = (imapService as any).client;
          if (client) {
            const status = await client.status(folder.path, { 
              messages: true, 
              unseen: true 
            });
            
            const remoteTotal = status.messages || 0;
            const remoteUnseen = status.unseen || 0;
            
            if (folder.totalMessages !== remoteTotal || 
                folder.unreadMessages !== remoteUnseen) {
              inconsistentCounts.push({
                folderId: folder.id,
                folderPath: folder.path,
                localCount: folder.totalMessages,
                remoteCount: remoteTotal
              });
              
              // Atualizar contadores locais
              await db.emailFolder.update({
                where: { id: folder.id },
                data: {
                  totalMessages: remoteTotal,
                  unreadMessages: remoteUnseen,
                  updatedAt: new Date()
                }
              });
            }
          }
        } catch (error) {
          console.warn(`Erro ao verificar pasta ${folder.path}:`, error);
        }
      }

      return {
        localFolders: updatedLocalFolders,
        remoteFolders: updatedLocalFolders.map(f => f.path),
        missingLocal: [],
        missingRemote: [],
        inconsistentCounts
      };

    } catch (error) {
      console.error('Erro ao verificar consistência:', error);
      throw error;
    } finally {
      await imapService.disconnect();
    }
  }

  /**
   * Corrige inconsistências encontradas
   */
  async fixInconsistencies(): Promise<{
    foldersFixed: number;
    emailsResynced: number;
    errors: string[];
  }> {
    const imapService = new ImapService(this.emailConfigId);
    const errors: string[] = [];
    let foldersFixed = 0;
    let emailsResynced = 0;

    try {
      const connected = await imapService.connect();
      if (!connected) {
        throw new Error('Falha ao conectar ao servidor IMAP');
      }

      // Verificar consistência primeiro
      const report = await this.checkConsistency();
      
      // Corrigir pastas com contadores inconsistentes
      for (const inconsistency of report.inconsistentCounts) {
        try {
          console.log(`Corrigindo pasta: ${inconsistency.folderPath}`);
          
          // Re-sincronizar emails da pasta
          await imapService.syncEmails(inconsistency.folderPath, 100);
          
          // Contar emails locais após sincronização
          const localEmailCount = await db.email.count({
            where: {
              emailConfigId: this.emailConfigId,
              folder: {
                path: inconsistency.folderPath
              },
              isDeleted: false
            }
          });

          const unreadCount = await db.email.count({
            where: {
              emailConfigId: this.emailConfigId,
              folder: {
                path: inconsistency.folderPath
              },
              isDeleted: false,
              isRead: false
            }
          });

          // Atualizar contadores finais
          await db.emailFolder.update({
            where: { id: inconsistency.folderId },
            data: {
              totalMessages: localEmailCount,
              unreadMessages: unreadCount,
              updatedAt: new Date()
            }
          });

          foldersFixed++;
          emailsResynced += localEmailCount;
          
        } catch (error) {
          const errorMsg = `Erro ao corrigir pasta ${inconsistency.folderPath}: ${error}`;
          console.error(errorMsg);
          errors.push(errorMsg);
        }
      }

      // Limpar emails órfãos (sem pasta correspondente)
      const orphanedEmails = await db.email.findMany({
        where: {
          emailConfigId: this.emailConfigId,
          folder: null
        }
      });

      if (orphanedEmails.length > 0) {
        await db.email.deleteMany({
          where: {
            emailConfigId: this.emailConfigId,
            folder: null
          }
        });
        console.log(`Removidos ${orphanedEmails.length} emails órfãos`);
      }

      return {
        foldersFixed,
        emailsResynced,
        errors
      };

    } catch (error) {
      console.error('Erro ao corrigir inconsistências:', error);
      throw error;
    } finally {
      await imapService.disconnect();
    }
  }

  /**
   * Executa uma verificação completa e correção automática
   */
  async maintainConsistency(): Promise<{
    success: boolean;
    report: FolderConsistencyReport;
    fixes?: {
      foldersFixed: number;
      emailsResynced: number;
      errors: string[];
    };
    error?: string;
  }> {
    try {
      console.log(`Iniciando manutenção de consistência para config ${this.emailConfigId}`);
      
      // Verificar consistência
      const report = await this.checkConsistency();
      
      // Se há inconsistências, tentar corrigir
      if (report.inconsistentCounts.length > 0) {
        console.log(`Encontradas ${report.inconsistentCounts.length} inconsistências`);
        const fixes = await this.fixInconsistencies();
        
        return {
          success: true,
          report,
          fixes
        };
      }

      console.log('Nenhuma inconsistência encontrada');
      return {
        success: true,
        report
      };

    } catch (error) {
      console.error('Erro na manutenção de consistência:', error);
      return {
        success: false,
        report: {
          localFolders: [],
          remoteFolders: [],
          missingLocal: [],
          missingRemote: [],
          inconsistentCounts: []
        },
        error: error instanceof Error ? error.message : 'Erro desconhecido'
      };
    }
  }
}

/**
 * Executa manutenção de consistência para todas as configurações ativas
 */
export async function maintainAllFoldersConsistency(): Promise<{
  totalConfigs: number;
  successfulConfigs: number;
  errors: string[];
}> {
  const errors: string[] = [];
  let successfulConfigs = 0;

  try {
    // Buscar todas as configurações ativas
    const activeConfigs = await db.emailConfig.findMany({
      where: {
        ativo: true,
        syncEnabled: true
      },
      select: { id: true, email: true }
    });

    console.log(`Iniciando manutenção para ${activeConfigs.length} configurações`);

    for (const config of activeConfigs) {
      try {
        const consistencyService = new FolderConsistencyService(config.id);
        const result = await consistencyService.maintainConsistency();
        
        if (result.success) {
          successfulConfigs++;
          console.log(`Consistência mantida para ${config.email}`);
        } else {
          errors.push(`${config.email}: ${result.error}`);
        }
        
      } catch (error) {
        const errorMsg = `${config.email}: ${error}`;
        console.error(errorMsg);
        errors.push(errorMsg);
      }
    }

    return {
      totalConfigs: activeConfigs.length,
      successfulConfigs,
      errors
    };

  } catch (error) {
    console.error('Erro ao buscar configurações:', error);
    return {
      totalConfigs: 0,
      successfulConfigs: 0,
      errors: [error instanceof Error ? error.message : 'Erro desconhecido']
    };
  }
}
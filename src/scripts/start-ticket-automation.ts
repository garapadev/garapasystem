#!/usr/bin/env tsx

import { ticketAutomationService } from '../lib/helpdesk/ticket-automation-service';
import { db } from '../lib/db';

/**
 * Script para inicializar o serviço de automação de tickets
 * Pode ser executado como: npx tsx src/scripts/start-ticket-automation.ts
 */
async function main() {
  console.log('🚀 Iniciando serviço de automação de tickets...');
  
  try {
    // Verificar conexão com banco de dados
    await db.$connect();
    console.log('✅ Conexão com banco de dados estabelecida');
    
    // Verificar se existem departamentos configurados
    const departamentos = await db.helpdeskDepartamento.count({
      where: {
        syncEnabled: true,
        AND: [
          { imapHost: { not: null } },
          { imapPort: { not: null } },
          { imapEmail: { not: null } },
          { imapPassword: { not: null } }
        ]
      }
    });
    
    if (departamentos === 0) {
      console.log('⚠️ Nenhum departamento com IMAP configurado encontrado');
      console.log('Configure pelo menos um departamento antes de iniciar o serviço');
      process.exit(1);
    }
    
    console.log(`📂 Encontrados ${departamentos} departamentos com IMAP configurado`);
    
    // Iniciar serviço de automação
    await ticketAutomationService.start();
    
    // Configurar handlers para encerramento gracioso
    process.on('SIGINT', async () => {
      console.log('\n🛑 Recebido SIGINT, encerrando serviço...');
      await shutdown();
    });
    
    process.on('SIGTERM', async () => {
      console.log('\n🛑 Recebido SIGTERM, encerrando serviço...');
      await shutdown();
    });
    
    // Manter o processo ativo
    console.log('✅ Serviço de automação iniciado com sucesso');
    console.log('Pressione Ctrl+C para parar o serviço');
    
    // Log de status a cada 5 minutos
    setInterval(() => {
      const status = ticketAutomationService.getStatus();
      const stats = ticketAutomationService.getStats();
      
      console.log('📊 Status do serviço:');
      console.log(`   - Executando: ${status.isRunning}`);
      console.log(`   - Departamentos: ${status.departmentCount}`);
      console.log(`   - Intervalo: ${status.config.checkInterval} minutos`);
      
      if (stats.length > 0) {
        console.log('📈 Estatísticas por departamento:');
        stats.forEach(stat => {
          console.log(`   - ${stat.departmentName}: ${stat.ticketsCreated} tickets, ${stat.emailsProcessed} emails processados`);
        });
      }
    }, 5 * 60 * 1000); // 5 minutos
    
  } catch (error) {
    console.error('❌ Erro ao iniciar serviço:', error);
    process.exit(1);
  }
}

/**
 * Encerramento gracioso do serviço
 */
async function shutdown() {
  try {
    console.log('🛑 Parando serviço de automação...');
    await ticketAutomationService.stop();
    
    console.log('🔌 Desconectando do banco de dados...');
    await db.$disconnect();
    
    console.log('✅ Serviço encerrado com sucesso');
    process.exit(0);
  } catch (error) {
    console.error('❌ Erro durante encerramento:', error);
    process.exit(1);
  }
}

// Executar se chamado diretamente
if (require.main === module) {
  main().catch(error => {
    console.error('❌ Erro fatal:', error);
    process.exit(1);
  });
}

export { main as startTicketAutomation };
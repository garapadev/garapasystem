#!/usr/bin/env node

import { ConsolidatedHelpdeskWorker } from '../lib/helpdesk/consolidated-helpdesk-worker';
import { db } from '../lib/db';

let worker: ConsolidatedHelpdeskWorker | null = null;
let isShuttingDown = false;

async function main() {
  console.log('Iniciando Consolidated Helpdesk Worker...');
  
  try {
    // Verificar conexão com o banco de dados
    await db.$connect();
    console.log('Conexão com banco de dados estabelecida');
    
    // Verificar se existem departamentos configurados
    const departmentCount = await db.helpdeskDepartamento.count({
      where: {
        ativo: true,
        imapHost: { not: null },
        imapEmail: { not: null },
        imapPassword: { not: null }
      }
    });
    
    if (departmentCount === 0) {
      console.error('Nenhum departamento com configuração IMAP encontrado');
      process.exit(1);
    }
    
    console.log(`Encontrados ${departmentCount} departamentos configurados`);
    
    // Inicializar worker
    worker = new ConsolidatedHelpdeskWorker();
    
    // Configurar listeners de eventos
    worker.on('started', () => {
      console.log('Worker iniciado com sucesso');
    });
    
    worker.on('stopped', () => {
      console.log('Worker parado');
    });
    
    worker.on('ticketCreated', ({ emailData, department }) => {
      console.log(`Novo ticket criado: ${emailData.subject} (Departamento: ${department.nome})`);
    });
    
    worker.on('departmentError', ({ departmentId, error }) => {
      console.error(`Erro no departamento ${departmentId}:`, error.message);
    });
    
    worker.on('error', (error) => {
      console.error('Erro geral do worker:', error);
    });
    
    // Iniciar worker
    await worker.start();
    
    // Configurar handlers para encerramento gracioso
    process.on('SIGINT', shutdown);
    process.on('SIGTERM', shutdown);
    process.on('uncaughtException', (error) => {
      console.error('Uncaught Exception:', error);
      shutdown();
    });
    process.on('unhandledRejection', (reason, promise) => {
      console.error('Unhandled Rejection at:', promise, 'reason:', reason);
      shutdown();
    });
    
    console.log('Worker em execução. Pressione Ctrl+C para parar.');
    
    // Manter o processo vivo
    setInterval(() => {
      if (worker && !isShuttingDown) {
        const status = worker.getStatus();
        console.log(`Status do worker: ${JSON.stringify(status, null, 2)}`);
      }
    }, 300000); // Log de status a cada 5 minutos
    
  } catch (error) {
    console.error('Erro ao inicializar worker:', error);
    process.exit(1);
  }
}

async function shutdown() {
  if (isShuttingDown) {
    console.log('Encerramento já em andamento...');
    return;
  }
  
  isShuttingDown = true;
  console.log('Iniciando encerramento gracioso...');
  
  try {
    if (worker) {
      await worker.stop();
    }
    
    await db.$disconnect();
    console.log('Worker encerrado com sucesso');
    process.exit(0);
  } catch (error) {
    console.error('Erro durante encerramento:', error);
    process.exit(1);
  }
}

// Iniciar se executado diretamente
if (require.main === module) {
  main().catch((error) => {
    console.error('Erro fatal:', error);
    process.exit(1);
  });
}

export { main };
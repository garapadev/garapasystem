import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Tipos para integração com negócios
interface BusinessTaskRule {
  id: string;
  nome: string;
  etapaOrigemId: string;
  etapaDestinoId: string;
  acaoTarefa: 'CRIAR' | 'ATUALIZAR_STATUS' | 'ATRIBUIR' | 'NOTIFICAR';
  templateTarefa?: {
    titulo: string;
    descricao: string;
    prioridade: 'BAIXA' | 'MEDIA' | 'ALTA' | 'URGENTE';
    diasVencimento: number;
    responsavelPadrao?: string;
  };
  ativo: boolean;
}

interface OportunidadeMovimento {
  oportunidadeId: string;
  etapaAnteriorId: string;
  etapaAtualId: string;
  responsavelId?: string;
  clienteId: string;
}

export class BusinessIntegrationService {
  private static rules: BusinessTaskRule[] = [];

  /**
   * Inicializar regras de automação
   */
  static async initializeRules() {
    try {
      // Por enquanto, vamos usar regras hardcoded
      // No futuro, isso pode vir do banco de dados
      this.rules = [
        {
          id: 'rule_001',
          nome: 'Criar tarefa de follow-up na qualificação',
          etapaOrigemId: 'etapa_001', // Prospecção
          etapaDestinoId: 'etapa_002', // Qualificação
          acaoTarefa: 'CRIAR',
          templateTarefa: {
            titulo: 'Follow-up de qualificação - {oportunidade}',
            descricao: 'Realizar follow-up com o cliente para qualificar a oportunidade e entender suas necessidades.',
            prioridade: 'MEDIA',
            diasVencimento: 3
          },
          ativo: true
        },
        {
          id: 'rule_002',
          nome: 'Criar tarefa de elaboração de proposta',
          etapaOrigemId: 'etapa_002', // Qualificação
          etapaDestinoId: 'etapa_003', // Proposta
          acaoTarefa: 'CRIAR',
          templateTarefa: {
            titulo: 'Elaborar proposta comercial - {oportunidade}',
            descricao: 'Elaborar proposta comercial detalhada com base nas necessidades identificadas na qualificação.',
            prioridade: 'ALTA',
            diasVencimento: 5
          },
          ativo: true
        },
        {
          id: 'rule_003',
          nome: 'Criar tarefa de acompanhamento de negociação',
          etapaOrigemId: 'etapa_003', // Proposta
          etapaDestinoId: 'etapa_004', // Negociação
          acaoTarefa: 'CRIAR',
          templateTarefa: {
            titulo: 'Acompanhar negociação - {oportunidade}',
            descricao: 'Acompanhar o processo de negociação e ajustar termos conforme necessário.',
            prioridade: 'ALTA',
            diasVencimento: 7
          },
          ativo: true
        },
        {
          id: 'rule_004',
          nome: 'Criar tarefa de onboarding do cliente',
          etapaOrigemId: 'etapa_004', // Negociação
          etapaDestinoId: 'etapa_005', // Fechamento
          acaoTarefa: 'CRIAR',
          templateTarefa: {
            titulo: 'Onboarding do cliente - {oportunidade}',
            descricao: 'Realizar processo de onboarding do novo cliente e configurar serviços.',
            prioridade: 'URGENTE',
            diasVencimento: 2
          },
          ativo: true
        }
      ];

      console.log(`Regras de automação de negócios inicializadas: ${this.rules.length} regras`);
    } catch (error) {
      console.error('Erro ao inicializar regras de automação:', error);
    }
  }

  /**
   * Processar movimento de oportunidade no pipeline
   */
  static async processOportunidadeMovement(movimento: OportunidadeMovimento) {
    try {
      console.log('Processando movimento de oportunidade:', movimento);

      // Buscar regras aplicáveis
      const regrasAplicaveis = this.rules.filter(rule => 
        rule.ativo && 
        rule.etapaOrigemId === movimento.etapaAnteriorId &&
        rule.etapaDestinoId === movimento.etapaAtualId
      );

      if (regrasAplicaveis.length === 0) {
        console.log('Nenhuma regra aplicável encontrada para este movimento');
        return;
      }

      // Buscar dados da oportunidade
      const oportunidade = await prisma.oportunidade.findUnique({
        where: { id: movimento.oportunidadeId },
        include: {
          cliente: true,
          responsavel: true,
          etapa: true
        }
      });

      if (!oportunidade) {
        console.error('Oportunidade não encontrada:', movimento.oportunidadeId);
        return;
      }

      // Processar cada regra aplicável
      for (const regra of regrasAplicaveis) {
        await this.executeRule(regra, oportunidade, movimento);
      }

    } catch (error) {
      console.error('Erro ao processar movimento de oportunidade:', error);
    }
  }

  /**
   * Executar regra específica
   */
  private static async executeRule(regra: BusinessTaskRule, oportunidade: any, movimento: OportunidadeMovimento) {
    try {
      console.log(`Executando regra: ${regra.nome}`);

      switch (regra.acaoTarefa) {
        case 'CRIAR':
          await this.createTaskFromRule(regra, oportunidade, movimento);
          break;
        case 'ATUALIZAR_STATUS':
          await this.updateTaskStatusFromRule(regra, oportunidade, movimento);
          break;
        case 'ATRIBUIR':
          await this.assignTaskFromRule(regra, oportunidade, movimento);
          break;
        case 'NOTIFICAR':
          await this.notifyFromRule(regra, oportunidade, movimento);
          break;
      }

    } catch (error) {
      console.error(`Erro ao executar regra ${regra.nome}:`, error);
    }
  }

  /**
   * Criar tarefa baseada na regra
   */
  private static async createTaskFromRule(regra: BusinessTaskRule, oportunidade: any, movimento: OportunidadeMovimento) {
    if (!regra.templateTarefa) {
      console.error('Template de tarefa não definido para a regra:', regra.nome);
      return;
    }

    const template = regra.templateTarefa;
    const dataVencimento = new Date();
    dataVencimento.setDate(dataVencimento.getDate() + template.diasVencimento);

    // Substituir placeholders no template
    const titulo = template.titulo.replace('{oportunidade}', oportunidade.titulo);
    const descricao = template.descricao
      .replace('{oportunidade}', oportunidade.titulo)
      .replace('{cliente}', oportunidade.cliente?.nome || 'Cliente não informado')
      .replace('{valor}', oportunidade.valor ? `R$ ${oportunidade.valor.toLocaleString('pt-BR')}` : 'Valor não informado');

    // Determinar responsável
    let responsavelId = movimento.responsavelId;
    if (!responsavelId && template.responsavelPadrao) {
      responsavelId = template.responsavelPadrao;
    }
    if (!responsavelId && oportunidade.responsavel) {
      responsavelId = oportunidade.responsavel.id;
    }

    // Criar tarefa
    const novaTarefa = await prisma.tasks.create({
      data: {
        titulo,
        descricao,
        status: 'PENDENTE',
        prioridade: template.prioridade,
        dataVencimento,
        dataInicio: new Date(),
        clienteId: movimento.clienteId,
        negocioId: movimento.oportunidadeId,
        responsavelId,
        criadoPor: 'SISTEMA_AUTOMACAO',
        tags: JSON.stringify(['automacao', 'pipeline', regra.etapaDestinoId])
      }
    });

    console.log(`Tarefa criada automaticamente: ${novaTarefa.titulo} (ID: ${novaTarefa.id})`);

    // Log da notificação (implementar notificação real no servidor)
    if (responsavelId) {
      console.log(`Notificação: Tarefa ${novaTarefa.id} atribuída ao usuário ${responsavelId}`);
    }

    // Registrar log da automação
    await this.logAutomationAction({
      regraId: regra.id,
      oportunidadeId: movimento.oportunidadeId,
      tarefaId: novaTarefa.id,
      acao: 'TAREFA_CRIADA',
      detalhes: `Tarefa "${titulo}" criada automaticamente pela regra "${regra.nome}"`
    });
  }

  /**
   * Atualizar status de tarefas relacionadas
   */
  private static async updateTaskStatusFromRule(regra: BusinessTaskRule, oportunidade: any, movimento: OportunidadeMovimento) {
    // Buscar tarefas relacionadas à oportunidade
    const tarefasRelacionadas = await prisma.tasks.findMany({
      where: {
        negocioId: movimento.oportunidadeId,
        status: {
          in: ['PENDENTE', 'EM_ANDAMENTO']
        }
      }
    });

    for (const tarefa of tarefasRelacionadas) {
      // Lógica para determinar novo status baseado na etapa
      let novoStatus = tarefa.status;
      
      if (movimento.etapaAtualId === 'etapa_005') { // Fechamento
        novoStatus = 'CONCLUIDA';
      }

      if (novoStatus !== tarefa.status) {
        await prisma.tasks.update({
          where: { id: tarefa.id },
          data: { 
            status: novoStatus,
            dataConclusao: novoStatus === 'CONCLUIDA' ? new Date() : null
          }
        });

        console.log(`Status da tarefa ${tarefa.id} atualizado para ${novoStatus}`);
      }
    }
  }

  /**
   * Atribuir tarefas baseado na regra
   */
  private static async assignTaskFromRule(regra: BusinessTaskRule, oportunidade: any, movimento: OportunidadeMovimento) {
    // Implementar lógica de atribuição automática
    console.log('Atribuição automática de tarefas não implementada ainda');
  }

  /**
   * Enviar notificações baseado na regra
   */
  private static async notifyFromRule(regra: BusinessTaskRule, oportunidade: any, movimento: OportunidadeMovimento) {
    if (movimento.responsavelId) {
      console.log(`Notificação: Oportunidade ${movimento.oportunidadeId} movida para ${oportunidade.etapa.nome} - Responsável: ${movimento.responsavelId}`);
    }
  }

  /**
   * Registrar log de ação de automação
   */
  private static async logAutomationAction(logData: {
    regraId: string;
    oportunidadeId: string;
    tarefaId?: string;
    acao: string;
    detalhes: string;
  }) {
    try {
      // Por enquanto, apenas log no console
      // No futuro, pode ser salvo em uma tabela específica
      console.log('Log de automação:', {
        timestamp: new Date().toISOString(),
        ...logData
      });
    } catch (error) {
      console.error('Erro ao registrar log de automação:', error);
    }
  }

  /**
   * Obter estatísticas de automação
   */
  static async getAutomationStats() {
    try {
      // Buscar tarefas criadas por automação
      const tarefasAutomaticas = await prisma.tasks.count({
        where: {
          criadoPor: 'SISTEMA_AUTOMACAO'
        }
      });

      // Buscar tarefas criadas por automação nos últimos 30 dias
      const dataLimite = new Date();
      dataLimite.setDate(dataLimite.getDate() - 30);
      
      const tarefasRecentes = await prisma.tasks.count({
        where: {
          criadoPor: 'SISTEMA_AUTOMACAO',
          criadoEm: {
            gte: dataLimite
          }
        }
      });

      return {
        totalTarefasAutomaticas: tarefasAutomaticas,
        tarefasUltimos30Dias: tarefasRecentes,
        regrasAtivas: this.rules.filter(r => r.ativo).length,
        totalRegras: this.rules.length
      };
    } catch (error) {
      console.error('Erro ao obter estatísticas de automação:', error);
      return {
        totalTarefasAutomaticas: 0,
        tarefasUltimos30Dias: 0,
        regrasAtivas: 0,
        totalRegras: 0
      };
    }
  }

  /**
   * Obter regras de automação
   */
  static getRules(): BusinessTaskRule[] {
    return this.rules;
  }

  /**
   * Ativar/desativar regra
   */
  static toggleRule(ruleId: string, ativo: boolean) {
    const regra = this.rules.find(r => r.id === ruleId);
    if (regra) {
      regra.ativo = ativo;
      console.log(`Regra ${regra.nome} ${ativo ? 'ativada' : 'desativada'}`);
    }
  }
}

// Inicializar regras ao carregar o módulo
BusinessIntegrationService.initializeRules();

export default BusinessIntegrationService;
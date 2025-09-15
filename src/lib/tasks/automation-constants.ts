/**
 * Constantes para automação de tarefas
 * Define valores válidos para condições e ações em regras de automação
 */

// Condições disponíveis para regras de automação
export const AUTOMATION_CONDITIONS = {
  // Condições de status
  TASK_CREATED: 'tarefa_criada',
  TASK_STARTED: 'tarefa_iniciada',
  TASK_COMPLETED: 'tarefa_concluida',
  TASK_CANCELLED: 'tarefa_cancelada',
  TASK_OVERDUE: 'tarefa_atrasada',
  
  // Condições de prioridade
  PRIORITY_HIGH: 'prioridade_alta',
  PRIORITY_MEDIUM: 'prioridade_media',
  PRIORITY_LOW: 'prioridade_baixa',
  
  // Condições de tempo
  DUE_TODAY: 'vence_hoje',
  DUE_TOMORROW: 'vence_amanha',
  DUE_THIS_WEEK: 'vence_esta_semana',
  
  // Condições de negócio
  OPPORTUNITY_MOVED: 'oportunidade_movida',
  CLIENT_CONTACTED: 'cliente_contatado',
  PROPOSAL_SENT: 'proposta_enviada',
  CONTRACT_SIGNED: 'contrato_assinado',
  
  // Condições de aprovação
  APPROVAL_PENDING: 'aprovacao_pendente',
  APPROVAL_APPROVED: 'aprovacao_aprovada',
  APPROVAL_REJECTED: 'aprovacao_rejeitada'
} as const;

// Ações disponíveis para regras de automação
export const AUTOMATION_ACTIONS = {
  // Ações de tarefa
  CREATE_TASK: 'criar_tarefa',
  UPDATE_TASK: 'atualizar_tarefa',
  COMPLETE_TASK: 'concluir_tarefa',
  CANCEL_TASK: 'cancelar_tarefa',
  ASSIGN_TASK: 'atribuir_tarefa',
  
  // Ações de notificação
  SEND_EMAIL: 'enviar_email',
  SEND_NOTIFICATION: 'enviar_notificacao',
  SEND_SMS: 'enviar_sms',
  
  // Ações de workflow
  MOVE_TO_NEXT_STEP: 'mover_proxima_etapa',
  MOVE_TO_PREVIOUS_STEP: 'mover_etapa_anterior',
  RESTART_WORKFLOW: 'reiniciar_workflow',
  
  // Ações de integração
  UPDATE_CRM: 'atualizar_crm',
  CREATE_INVOICE: 'criar_fatura',
  SCHEDULE_MEETING: 'agendar_reuniao',
  
  // Ações de aprovação
  REQUEST_APPROVAL: 'solicitar_aprovacao',
  AUTO_APPROVE: 'aprovar_automaticamente',
  ESCALATE: 'escalar_aprovacao'
} as const;

// Tipos derivados das constantes
export type AutomationCondition = typeof AUTOMATION_CONDITIONS[keyof typeof AUTOMATION_CONDITIONS];
export type AutomationAction = typeof AUTOMATION_ACTIONS[keyof typeof AUTOMATION_ACTIONS];

// Arrays para uso em dropdowns
export const CONDITION_OPTIONS = Object.entries(AUTOMATION_CONDITIONS).map(([key, value]) => ({
  value,
  label: formatConditionLabel(key),
  category: getConditionCategory(key)
}));

export const ACTION_OPTIONS = Object.entries(AUTOMATION_ACTIONS).map(([key, value]) => ({
  value,
  label: formatActionLabel(key),
  category: getActionCategory(key)
}));

// Funções auxiliares para formatação de labels
export function getConditionLabel(value: string): string {
  // Encontrar a chave correspondente ao valor
  const entry = Object.entries(AUTOMATION_CONDITIONS).find(([_, v]) => v === value);
  if (entry) {
    return formatConditionLabel(entry[0]);
  }
  return value.replace(/_/g, ' ').toLowerCase();
}

export function getActionLabel(value: string): string {
  // Encontrar a chave correspondente ao valor
  const entry = Object.entries(AUTOMATION_ACTIONS).find(([_, v]) => v === value);
  if (entry) {
    return formatActionLabel(entry[0]);
  }
  return value.replace(/_/g, ' ').toLowerCase();
}

function formatConditionLabel(key: string): string {
  const labels: Record<string, string> = {
    TASK_CREATED: 'Tarefa Criada',
    TASK_STARTED: 'Tarefa Iniciada',
    TASK_COMPLETED: 'Tarefa Concluída',
    TASK_CANCELLED: 'Tarefa Cancelada',
    TASK_OVERDUE: 'Tarefa Atrasada',
    PRIORITY_HIGH: 'Prioridade Alta',
    PRIORITY_MEDIUM: 'Prioridade Média',
    PRIORITY_LOW: 'Prioridade Baixa',
    DUE_TODAY: 'Vence Hoje',
    DUE_TOMORROW: 'Vence Amanhã',
    DUE_THIS_WEEK: 'Vence Esta Semana',
    OPPORTUNITY_MOVED: 'Oportunidade Movida',
    CLIENT_CONTACTED: 'Cliente Contatado',
    PROPOSAL_SENT: 'Proposta Enviada',
    CONTRACT_SIGNED: 'Contrato Assinado',
    APPROVAL_PENDING: 'Aprovação Pendente',
    APPROVAL_APPROVED: 'Aprovação Aprovada',
    APPROVAL_REJECTED: 'Aprovação Rejeitada'
  };
  return labels[key] || key.replace(/_/g, ' ').toLowerCase();
}

function formatActionLabel(key: string): string {
  const labels: Record<string, string> = {
    CREATE_TASK: 'Criar Tarefa',
    UPDATE_TASK: 'Atualizar Tarefa',
    COMPLETE_TASK: 'Concluir Tarefa',
    CANCEL_TASK: 'Cancelar Tarefa',
    ASSIGN_TASK: 'Atribuir Tarefa',
    SEND_EMAIL: 'Enviar E-mail',
    SEND_NOTIFICATION: 'Enviar Notificação',
    SEND_SMS: 'Enviar SMS',
    MOVE_TO_NEXT_STEP: 'Mover para Próxima Etapa',
    MOVE_TO_PREVIOUS_STEP: 'Mover para Etapa Anterior',
    RESTART_WORKFLOW: 'Reiniciar Workflow',
    UPDATE_CRM: 'Atualizar CRM',
    CREATE_INVOICE: 'Criar Fatura',
    SCHEDULE_MEETING: 'Agendar Reunião',
    REQUEST_APPROVAL: 'Solicitar Aprovação',
    AUTO_APPROVE: 'Aprovar Automaticamente',
    ESCALATE: 'Escalar Aprovação'
  };
  return labels[key] || key.replace(/_/g, ' ').toLowerCase();
}

// Funções para categorização
function getConditionCategory(key: string): string {
  if (key.startsWith('TASK_')) return 'Tarefa';
  if (key.startsWith('PRIORITY_')) return 'Prioridade';
  if (key.startsWith('DUE_')) return 'Prazo';
  if (key.includes('OPPORTUNITY') || key.includes('CLIENT') || key.includes('PROPOSAL') || key.includes('CONTRACT')) return 'Negócio';
  if (key.startsWith('APPROVAL_')) return 'Aprovação';
  return 'Geral';
}

function getActionCategory(key: string): string {
  if (key.includes('TASK')) return 'Tarefa';
  if (key.includes('SEND')) return 'Notificação';
  if (key.includes('MOVE') || key.includes('WORKFLOW')) return 'Workflow';
  if (key.includes('CRM') || key.includes('INVOICE') || key.includes('MEETING')) return 'Integração';
  if (key.includes('APPROVAL') || key.includes('APPROVE') || key.includes('ESCALATE')) return 'Aprovação';
  return 'Geral';
}

// Validadores
export function isValidCondition(condition: string): condition is AutomationCondition {
  return Object.values(AUTOMATION_CONDITIONS).includes(condition as AutomationCondition);
}

export function isValidAction(action: string): action is AutomationAction {
  return Object.values(AUTOMATION_ACTIONS).includes(action as AutomationAction);
}

// Função para validar regra completa
export function validateAutomationRule(rule: {
  condition: string;
  action: string;
  fromStep?: string;
  toStep?: string;
}): { valid: boolean; errors: string[] } {
  const errors: string[] = [];
  
  if (!isValidCondition(rule.condition)) {
    errors.push(`Condição inválida: ${rule.condition}`);
  }
  
  if (!isValidAction(rule.action)) {
    errors.push(`Ação inválida: ${rule.action}`);
  }
  
  if (rule.fromStep && rule.toStep && rule.fromStep === rule.toStep) {
    errors.push('Etapa de origem e destino não podem ser iguais');
  }
  
  return {
    valid: errors.length === 0,
    errors
  };
}
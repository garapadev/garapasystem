import { z } from "zod";

// Enums para Task
export const TaskPrioridadeEnum = z.enum([
  "BAIXA",
  "MEDIA", 
  "ALTA",
  "URGENTE"
]);

export const TaskStatusEnum = z.enum([
  "PENDENTE",
  "EM_ANDAMENTO",
  "AGUARDANDO", 
  "CONCLUIDA",
  "CANCELADA"
]);

export const TaskRecurrenceTypeEnum = z.enum([
  "DIARIA",
  "SEMANAL",
  "MENSAL",
  "ANUAL"
]);

export const TaskLogTypeEnum = z.enum([
  "CRIACAO",
  "STATUS_ALTERADO",
  "PRIORIDADE_ALTERADA",
  "RESPONSAVEL_ALTERADO",
  "VENCIMENTO_ALTERADO",
  "TITULO_ALTERADO",
  "DESCRICAO_ALTERADA",
  "COMENTARIO_ADICIONADO",
  "ANEXO_ADICIONADO",
  "CONCLUSAO"
]);

export const TaskNotificationTypeEnum = z.enum([
  "LEMBRETE_VENCIMENTO",
  "TAREFA_ATRASADA",
  "TAREFA_ATRIBUIDA",
  "STATUS_ALTERADO",
  "COMENTARIO_ADICIONADO",
  "LEMBRETE_SEM_ATUALIZACAO",
  "ALERTA_GESTOR"
]);

// Schema principal para Task
export const taskSchema = z.object({
  id: z.string().cuid().optional(),
  titulo: z.string()
    .min(1, "Título é obrigatório")
    .max(255, "Título deve ter no máximo 255 caracteres"),
  descricao: z.string()
    .max(5000, "Descrição deve ter no máximo 5000 caracteres")
    .optional()
    .nullable(),
  prioridade: TaskPrioridadeEnum.default("MEDIA"),
  status: TaskStatusEnum.default("PENDENTE"),
  
  // Datas
  dataVencimento: z.coerce.date(),
  dataInicio: z.coerce.date().optional().nullable(),
  dataConclusao: z.coerce.date().optional().nullable(),
  
  // Configurações
  isRecorrente: z.boolean().default(false),
  tempoEstimado: z.number()
    .int("Tempo estimado deve ser um número inteiro")
    .min(1, "Tempo estimado deve ser maior que 0")
    .max(99999, "Tempo estimado deve ser menor que 99999 minutos")
    .optional()
    .nullable(),
  tempoGasto: z.number()
    .int("Tempo gasto deve ser um número inteiro")
    .min(0, "Tempo gasto não pode ser negativo")
    .max(99999, "Tempo gasto deve ser menor que 99999 minutos")
    .optional()
    .nullable(),
  
  // Relacionamentos obrigatórios
  responsavelId: z.string()
    .cuid("ID do responsável deve ser um CUID válido")
    .min(1, "Responsável é obrigatório"),
  criadoPorId: z.string()
    .cuid("ID do criador deve ser um CUID válido")
    .min(1, "Criador é obrigatório"),
  
  // Relacionamentos opcionais
  clienteId: z.string()
    .cuid("ID do cliente deve ser um CUID válido")
    .optional()
    .nullable(),
  oportunidadeId: z.string()
    .cuid("ID da oportunidade deve ser um CUID válido")
    .optional()
    .nullable(),
  emailId: z.string()
    .cuid("ID do email deve ser um CUID válido")
    .optional()
    .nullable(),
  helpdeskTicketId: z.string()
    .cuid("ID do ticket deve ser um CUID válido")
    .optional()
    .nullable(),
  ordemServicoId: z.string()
    .cuid("ID da ordem de serviço deve ser um CUID válido")
    .optional()
    .nullable(),
  recorrenciaId: z.string()
    .cuid("ID da recorrência deve ser um CUID válido")
    .optional()
    .nullable(),
  
  // Metadados
  createdAt: z.coerce.date().optional(),
  updatedAt: z.coerce.date().optional()
});

// Schema para criação de Task (sem campos auto-gerados)
export const createTaskSchema = taskSchema.omit({
  id: true,
  createdAt: true,
  updatedAt: true
});

// Schema para atualização de Task (todos os campos opcionais exceto ID)
export const updateTaskSchema = taskSchema.partial().extend({
  id: z.string().cuid("ID deve ser um CUID válido")
});

// Schema para Task Comment
export const taskCommentSchema = z.object({
  id: z.string().cuid().optional(),
  conteudo: z.string()
    .min(1, "Conteúdo do comentário é obrigatório")
    .max(2000, "Comentário deve ter no máximo 2000 caracteres"),
  taskId: z.string()
    .cuid("ID da task deve ser um CUID válido")
    .min(1, "Task é obrigatória"),
  autorId: z.string()
    .cuid("ID do autor deve ser um CUID válido")
    .min(1, "Autor é obrigatório"),
  createdAt: z.coerce.date().optional(),
  updatedAt: z.coerce.date().optional()
});

// Schema para Task Attachment
export const taskAttachmentSchema = z.object({
  id: z.string().cuid().optional(),
  nomeOriginal: z.string()
    .min(1, "Nome do arquivo é obrigatório")
    .max(255, "Nome do arquivo deve ter no máximo 255 caracteres"),
  nomeArquivo: z.string()
    .min(1, "Nome do arquivo no sistema é obrigatório")
    .max(255, "Nome do arquivo no sistema deve ter no máximo 255 caracteres"),
  tamanho: z.number()
    .int("Tamanho deve ser um número inteiro")
    .min(1, "Tamanho deve ser maior que 0"),
  tipoMime: z.string()
    .min(1, "Tipo MIME é obrigatório")
    .max(100, "Tipo MIME deve ter no máximo 100 caracteres"),
  taskId: z.string()
    .cuid("ID da task deve ser um CUID válido")
    .min(1, "Task é obrigatória"),
  uploadPorId: z.string()
    .cuid("ID do usuário que fez upload deve ser um CUID válido")
    .min(1, "Usuário que fez upload é obrigatório"),
  createdAt: z.coerce.date().optional()
});

// Schema para Task Recurrence
export const taskRecurrenceSchema = z.object({
  id: z.string().cuid().optional(),
  tipo: TaskRecurrenceTypeEnum,
  intervalo: z.number()
    .int("Intervalo deve ser um número inteiro")
    .min(1, "Intervalo deve ser maior que 0")
    .max(365, "Intervalo deve ser menor que 365"),
  diasSemana: z.string()
    .max(20, "Dias da semana deve ter no máximo 20 caracteres")
    .optional()
    .nullable(),
  diaDoMes: z.number()
    .int("Dia do mês deve ser um número inteiro")
    .min(1, "Dia do mês deve ser entre 1 e 31")
    .max(31, "Dia do mês deve ser entre 1 e 31")
    .optional()
    .nullable(),
  dataFim: z.coerce.date().optional().nullable(),
  ativo: z.boolean().default(true),
  createdAt: z.coerce.date().optional(),
  updatedAt: z.coerce.date().optional()
});

// Schema para Task Log
export const taskLogSchema = z.object({
  id: z.string().cuid().optional(),
  tipo: TaskLogTypeEnum,
  descricao: z.string()
    .min(1, "Descrição é obrigatória")
    .max(1000, "Descrição deve ter no máximo 1000 caracteres"),
  valorAnterior: z.string()
    .max(500, "Valor anterior deve ter no máximo 500 caracteres")
    .optional()
    .nullable(),
  valorNovo: z.string()
    .max(500, "Valor novo deve ter no máximo 500 caracteres")
    .optional()
    .nullable(),
  taskId: z.string()
    .cuid("ID da task deve ser um CUID válido")
    .min(1, "Task é obrigatória"),
  colaboradorId: z.string()
    .cuid("ID do colaborador deve ser um CUID válido")
    .min(1, "Colaborador é obrigatório"),
  createdAt: z.coerce.date().optional()
});

// Schema para Task Notification
export const taskNotificationSchema = z.object({
  id: z.string().cuid().optional(),
  tipo: TaskNotificationTypeEnum,
  titulo: z.string()
    .min(1, "Título é obrigatório")
    .max(255, "Título deve ter no máximo 255 caracteres"),
  mensagem: z.string()
    .min(1, "Mensagem é obrigatória")
    .max(1000, "Mensagem deve ter no máximo 1000 caracteres"),
  lida: z.boolean().default(false),
  dataEnvio: z.coerce.date().optional().nullable(),
  taskId: z.string()
    .cuid("ID da task deve ser um CUID válido")
    .min(1, "Task é obrigatória"),
  colaboradorId: z.string()
    .cuid("ID do colaborador deve ser um CUID válido")
    .min(1, "Colaborador é obrigatório"),
  createdAt: z.coerce.date().optional()
});

// Schemas para filtros e consultas
export const taskFilterSchema = z.object({
  search: z.string().optional(),
  status: TaskStatusEnum.optional(),
  prioridade: TaskPrioridadeEnum.optional(),
  responsavelId: z.string().cuid().optional(),
  clienteId: z.string().cuid().optional(),
  oportunidadeId: z.string().cuid().optional(),
  emailId: z.string().cuid().optional(),
  helpdeskTicketId: z.string().cuid().optional(),
  atrasadas: z.boolean().optional(),
  dataVencimentoInicio: z.coerce.date().optional(),
  dataVencimentoFim: z.coerce.date().optional(),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(10)
});

// Tipos TypeScript derivados dos schemas
export type Task = z.infer<typeof taskSchema>;
export type CreateTask = z.infer<typeof createTaskSchema>;
export type UpdateTask = z.infer<typeof updateTaskSchema>;
export type TaskComment = z.infer<typeof taskCommentSchema>;
export type TaskAttachment = z.infer<typeof taskAttachmentSchema>;
export type TaskRecurrence = z.infer<typeof taskRecurrenceSchema>;
export type TaskLog = z.infer<typeof taskLogSchema>;
export type TaskNotification = z.infer<typeof taskNotificationSchema>;
export type TaskFilter = z.infer<typeof taskFilterSchema>;
export type TaskPrioridade = z.infer<typeof TaskPrioridadeEnum>;
export type TaskStatus = z.infer<typeof TaskStatusEnum>;
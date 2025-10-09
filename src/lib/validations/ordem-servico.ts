import { z } from "zod";

// Enums para Ordem de Serviço
export const StatusOrdemServicoEnum = z.enum([
  "RASCUNHO",
  "AGUARDANDO_APROVACAO",
  "AGUARDANDO_APROVACAO_CLIENTE",
  "ORCAMENTO_ENVIADO",
  "APROVADA",
  "REJEITADA",
  "EM_ANDAMENTO",
  "PAUSADA",
  "CONCLUIDA",
  "CANCELADA"
]);

export const PrioridadeOSEnum = z.enum([
  "BAIXA",
  "MEDIA",
  "ALTA",
  "URGENTE"
]);

export const StatusAprovacaoEnum = z.enum([
  "PENDENTE",
  "APROVADA",
  "REJEITADA",
  "EXPIRADA"
]);

// Schema principal para Ordem de Serviço
export const ordemServicoSchema = z.object({
  id: z.string().cuid().optional(),
  numero: z.string()
    .min(1, "Número da ordem de serviço é obrigatório")
    .max(50, "Número da ordem de serviço deve ter no máximo 50 caracteres"),
  titulo: z.string()
    .min(1, "Título é obrigatório")
    .max(255, "Título deve ter no máximo 255 caracteres"),
  descricao: z.string()
    .min(1, "Descrição é obrigatória")
    .max(5000, "Descrição deve ter no máximo 5000 caracteres"),
  observacoes: z.string()
    .max(2000, "Observações devem ter no máximo 2000 caracteres")
    .optional()
    .nullable(),
  
  // Dados do serviço
  localExecucao: z.string()
    .max(500, "Local de execução deve ter no máximo 500 caracteres")
    .optional()
    .nullable(),
  dataInicio: z.coerce.date().optional().nullable(),
  dataFim: z.coerce.date().optional().nullable(),
  prazoEstimado: z.coerce.date().optional().nullable(),
  
  // Valores
  valorOrcamento: z.number()
    .min(0, "Valor do orçamento não pode ser negativo")
    .max(999999999, "Valor do orçamento deve ser menor que 999999999")
    .optional()
    .nullable(),
  valorFinal: z.number()
    .min(0, "Valor final não pode ser negativo")
    .max(999999999, "Valor final deve ser menor que 999999999")
    .optional()
    .nullable(),
  
  // Status e controle
  status: StatusOrdemServicoEnum.default("RASCUNHO"),
  prioridade: PrioridadeOSEnum.default("MEDIA"),
  
  // Aprovação do cliente
  codigoAprovacao: z.string()
    .max(100, "Código de aprovação deve ter no máximo 100 caracteres")
    .optional()
    .nullable(),
  dataAprovacao: z.coerce.date().optional().nullable(),
  aprovadoPor: z.string()
    .max(255, "Nome de quem aprovou deve ter no máximo 255 caracteres")
    .optional()
    .nullable(),
  comentariosCliente: z.string()
    .max(1000, "Comentários do cliente devem ter no máximo 1000 caracteres")
    .optional()
    .nullable(),
  
  // Relacionamentos obrigatórios
  clienteId: z.string()
    .cuid("ID do cliente deve ser um CUID válido")
    .min(1, "Cliente é obrigatório"),
  criadoPorId: z.string()
    .cuid("ID do criador deve ser um CUID válido")
    .min(1, "Criador é obrigatório"),
  
  // Relacionamentos opcionais
  responsavelId: z.string()
    .cuid("ID do responsável deve ser um CUID válido")
    .optional()
    .nullable(),
  oportunidadeId: z.string()
    .cuid("ID da oportunidade deve ser um CUID válido")
    .optional()
    .nullable(),
  
  // Metadados
  createdAt: z.coerce.date().optional(),
  updatedAt: z.coerce.date().optional()
});

// Schema para criação de Ordem de Serviço (sem campos auto-gerados)
export const createOrdemServicoSchema = ordemServicoSchema.omit({
  id: true,
  numero: true, // Gerado automaticamente
  createdAt: true,
  updatedAt: true
});

// Schema para atualização de Ordem de Serviço (todos os campos opcionais exceto ID)
export const updateOrdemServicoSchema = ordemServicoSchema.partial().extend({
  id: z.string().cuid("ID deve ser um CUID válido")
});

// Schema para Aprovação de Ordem de Serviço
export const aprovacaoOrdemServicoSchema = z.object({
  id: z.string().cuid().optional(),
  codigo: z.string()
    .min(1, "Código é obrigatório")
    .max(100, "Código deve ter no máximo 100 caracteres"),
  status: StatusAprovacaoEnum.default("PENDENTE"),
  aprovadoPor: z.string()
    .max(255, "Nome de quem aprovou deve ter no máximo 255 caracteres")
    .optional()
    .nullable(),
  dataAprovacao: z.coerce.date().optional().nullable(),
  comentariosCliente: z.string()
    .max(1000, "Comentários do cliente devem ter no máximo 1000 caracteres")
    .optional()
    .nullable(),
  observacoes: z.string()
    .max(1000, "Observações devem ter no máximo 1000 caracteres")
    .optional()
    .nullable(),
  dataExpiracao: z.coerce.date(),
  
  // Relacionamentos
  ordemServicoId: z.string()
    .cuid("ID da ordem de serviço deve ser um CUID válido")
    .min(1, "Ordem de serviço é obrigatória"),
  
  // Metadados
  createdAt: z.coerce.date().optional(),
  updatedAt: z.coerce.date().optional()
});

// Schema para Item da Ordem de Serviço
export const itemOrdemServicoSchema = z.object({
  id: z.string().cuid().optional(),
  descricao: z.string()
    .min(1, "Descrição é obrigatória")
    .max(500, "Descrição deve ter no máximo 500 caracteres"),
  quantidade: z.number()
    .min(0.01, "Quantidade deve ser maior que 0")
    .max(999999, "Quantidade deve ser menor que 999999")
    .default(1),
  unidade: z.string()
    .max(10, "Unidade deve ter no máximo 10 caracteres")
    .optional()
    .nullable(),
  valorUnitario: z.number()
    .min(0, "Valor unitário não pode ser negativo")
    .max(999999999, "Valor unitário deve ser menor que 999999999")
    .optional()
    .nullable(),
  valorTotal: z.number()
    .min(0, "Valor total não pode ser negativo")
    .max(999999999, "Valor total deve ser menor que 999999999")
    .optional()
    .nullable(),
  observacoes: z.string()
    .max(1000, "Observações devem ter no máximo 1000 caracteres")
    .optional()
    .nullable(),
  
  // Relacionamentos
  ordemServicoId: z.string()
    .cuid("ID da ordem de serviço deve ser um CUID válido")
    .min(1, "Ordem de serviço é obrigatória"),
  
  // Metadados
  createdAt: z.coerce.date().optional(),
  updatedAt: z.coerce.date().optional()
});

// Schema para Template de Checklist
export const templateChecklistSchema = z.object({
  id: z.string().cuid().optional(),
  nome: z.string()
    .min(1, "Nome é obrigatório")
    .max(255, "Nome deve ter no máximo 255 caracteres"),
  descricao: z.string()
    .max(1000, "Descrição deve ter no máximo 1000 caracteres")
    .optional()
    .nullable(),
  categoria: z.string()
    .max(100, "Categoria deve ter no máximo 100 caracteres")
    .optional()
    .nullable(),
  ativo: z.boolean().default(true),
  
  // Metadados
  createdAt: z.coerce.date().optional(),
  updatedAt: z.coerce.date().optional()
});

// Schema para Item do Template de Checklist
export const itemTemplateChecklistSchema = z.object({
  id: z.string().cuid().optional(),
  descricao: z.string()
    .min(1, "Descrição é obrigatória")
    .max(500, "Descrição deve ter no máximo 500 caracteres"),
  obrigatorio: z.boolean().default(false),
  ordem: z.number()
    .int("Ordem deve ser um número inteiro")
    .min(1, "Ordem deve ser maior que 0"),
  
  // Relacionamentos
  templateId: z.string()
    .cuid("ID do template deve ser um CUID válido")
    .min(1, "Template é obrigatório"),
  
  // Metadados
  createdAt: z.coerce.date().optional(),
  updatedAt: z.coerce.date().optional()
});

// Schema para Checklist da Ordem de Serviço
export const checklistOrdemServicoSchema = z.object({
  id: z.string().cuid().optional(),
  nome: z.string()
    .min(1, "Nome é obrigatório")
    .max(255, "Nome deve ter no máximo 255 caracteres"),
  
  // Relacionamentos
  ordemServicoId: z.string()
    .cuid("ID da ordem de serviço deve ser um CUID válido")
    .min(1, "Ordem de serviço é obrigatória"),
  templateId: z.string()
    .cuid("ID do template deve ser um CUID válido")
    .optional()
    .nullable(),
  
  // Metadados
  createdAt: z.coerce.date().optional(),
  updatedAt: z.coerce.date().optional()
});

// Schema para Item do Checklist da OS
export const itemChecklistOSSchema = z.object({
  id: z.string().cuid().optional(),
  descricao: z.string()
    .min(1, "Descrição é obrigatória")
    .max(500, "Descrição deve ter no máximo 500 caracteres"),
  concluido: z.boolean().default(false),
  obrigatorio: z.boolean().default(false),
  ordem: z.number()
    .int("Ordem deve ser um número inteiro")
    .min(1, "Ordem deve ser maior que 0"),
  observacoes: z.string()
    .max(1000, "Observações devem ter no máximo 1000 caracteres")
    .optional()
    .nullable(),
  concluidoPor: z.string()
    .max(255, "Nome de quem concluiu deve ter no máximo 255 caracteres")
    .optional()
    .nullable(),
  dataConclucao: z.coerce.date().optional().nullable(),
  
  // Relacionamentos
  checklistId: z.string()
    .cuid("ID do checklist deve ser um CUID válido")
    .min(1, "Checklist é obrigatório"),
  
  // Metadados
  createdAt: z.coerce.date().optional(),
  updatedAt: z.coerce.date().optional()
});

// Schema para Histórico da Ordem de Serviço
export const historicoOrdemServicoSchema = z.object({
  id: z.string().cuid().optional(),
  acao: z.string()
    .min(1, "Ação é obrigatória")
    .max(100, "Ação deve ter no máximo 100 caracteres"),
  descricao: z.string()
    .min(1, "Descrição é obrigatória")
    .max(1000, "Descrição deve ter no máximo 1000 caracteres"),
  valorAnterior: z.string()
    .max(5000, "Valor anterior deve ter no máximo 5000 caracteres")
    .optional()
    .nullable(),
  valorNovo: z.string()
    .max(5000, "Valor novo deve ter no máximo 5000 caracteres")
    .optional()
    .nullable(),
  usuario: z.string()
    .max(255, "Nome do usuário deve ter no máximo 255 caracteres")
    .optional()
    .nullable(),
  
  // Relacionamentos
  ordemServicoId: z.string()
    .cuid("ID da ordem de serviço deve ser um CUID válido")
    .min(1, "Ordem de serviço é obrigatória"),
  usuarioId: z.string()
    .cuid("ID do usuário deve ser um CUID válido")
    .optional()
    .nullable(),
  colaboradorId: z.string()
    .cuid("ID do colaborador deve ser um CUID válido")
    .optional()
    .nullable(),
  
  // Metadados
  createdAt: z.coerce.date().optional()
});

// Schema para Comentário da Ordem de Serviço
export const comentarioOrdemServicoSchema = z.object({
  id: z.string().cuid().optional(),
  comentario: z.string()
    .min(1, "Comentário é obrigatório")
    .max(2000, "Comentário deve ter no máximo 2000 caracteres"),
  interno: z.boolean().default(true),
  autor: z.string()
    .min(1, "Autor é obrigatório")
    .max(255, "Nome do autor deve ter no máximo 255 caracteres"),
  autorEmail: z.string()
    .email("Email do autor deve ser válido")
    .max(255, "Email do autor deve ter no máximo 255 caracteres")
    .optional()
    .nullable(),
  
  // Relacionamentos
  ordemServicoId: z.string()
    .cuid("ID da ordem de serviço deve ser um CUID válido")
    .min(1, "Ordem de serviço é obrigatória"),
  autorId: z.string()
    .cuid("ID do autor deve ser um CUID válido")
    .optional()
    .nullable(),
  colaboradorId: z.string()
    .cuid("ID do colaborador deve ser um CUID válido")
    .optional()
    .nullable(),
  
  // Metadados
  createdAt: z.coerce.date().optional(),
  updatedAt: z.coerce.date().optional()
});

// Schema para Anexo da Ordem de Serviço
export const anexoOrdemServicoSchema = z.object({
  id: z.string().cuid().optional(),
  nomeArquivo: z.string()
    .min(1, "Nome do arquivo é obrigatório")
    .max(255, "Nome do arquivo deve ter no máximo 255 caracteres"),
  caminhoArquivo: z.string()
    .min(1, "Caminho do arquivo é obrigatório")
    .max(500, "Caminho do arquivo deve ter no máximo 500 caracteres"),
  tamanho: z.number()
    .int("Tamanho deve ser um número inteiro")
    .min(1, "Tamanho deve ser maior que 0")
    .optional()
    .nullable(),
  tipoMime: z.string()
    .max(100, "Tipo MIME deve ter no máximo 100 caracteres")
    .optional()
    .nullable(),
  descricao: z.string()
    .max(500, "Descrição deve ter no máximo 500 caracteres")
    .optional()
    .nullable(),
  uploadPor: z.string()
    .max(255, "Nome de quem fez upload deve ter no máximo 255 caracteres")
    .optional()
    .nullable(),
  
  // Relacionamentos
  ordemServicoId: z.string()
    .cuid("ID da ordem de serviço deve ser um CUID válido")
    .min(1, "Ordem de serviço é obrigatória"),
  colaboradorId: z.string()
    .cuid("ID do colaborador deve ser um CUID válido")
    .optional()
    .nullable(),
  
  // Metadados
  createdAt: z.coerce.date().optional()
});

// Schema para aprovação do cliente
export const aprovacaoClienteOSSchema = z.object({
  codigo: z.string()
    .min(1, "Código de aprovação é obrigatório"),
  aprovado: z.boolean(),
  comentarios: z.string()
    .max(1000, "Comentários devem ter no máximo 1000 caracteres")
    .optional(),
  aprovadoPor: z.string()
    .max(255, "Nome de quem aprovou deve ter no máximo 255 caracteres")
    .optional()
});

// Schemas para filtros e consultas
export const ordemServicoFilterSchema = z.object({
  search: z.string().optional(),
  status: StatusOrdemServicoEnum.optional(),
  prioridade: PrioridadeOSEnum.optional(),
  clienteId: z.string().cuid().optional(),
  responsavelId: z.string().cuid().optional(),
  oportunidadeId: z.string().cuid().optional(),
  dataInicioInicio: z.coerce.date().optional(),
  dataInicioFim: z.coerce.date().optional(),
  dataFimInicio: z.coerce.date().optional(),
  dataFimFim: z.coerce.date().optional(),
  prazoEstimadoInicio: z.coerce.date().optional(),
  prazoEstimadoFim: z.coerce.date().optional(),
  valorMinimo: z.number().min(0).optional(),
  valorMaximo: z.number().min(0).optional(),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(10)
});

// Tipos TypeScript derivados dos schemas
export type OrdemServico = z.infer<typeof ordemServicoSchema>;
export type CreateOrdemServico = z.infer<typeof createOrdemServicoSchema>;
export type UpdateOrdemServico = z.infer<typeof updateOrdemServicoSchema>;
export type AprovacaoOrdemServico = z.infer<typeof aprovacaoOrdemServicoSchema>;
export type ItemOrdemServico = z.infer<typeof itemOrdemServicoSchema>;
export type TemplateChecklist = z.infer<typeof templateChecklistSchema>;
export type ItemTemplateChecklist = z.infer<typeof itemTemplateChecklistSchema>;
export type ChecklistOrdemServico = z.infer<typeof checklistOrdemServicoSchema>;
export type ItemChecklistOS = z.infer<typeof itemChecklistOSSchema>;
export type HistoricoOrdemServico = z.infer<typeof historicoOrdemServicoSchema>;
export type ComentarioOrdemServico = z.infer<typeof comentarioOrdemServicoSchema>;
export type AnexoOrdemServico = z.infer<typeof anexoOrdemServicoSchema>;
export type AprovacaoClienteOS = z.infer<typeof aprovacaoClienteOSSchema>;
export type OrdemServicoFilter = z.infer<typeof ordemServicoFilterSchema>;
export type StatusOrdemServico = z.infer<typeof StatusOrdemServicoEnum>;
export type PrioridadeOS = z.infer<typeof PrioridadeOSEnum>;
export type StatusAprovacao = z.infer<typeof StatusAprovacaoEnum>;
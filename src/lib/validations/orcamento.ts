import { z } from "zod";

// Enums para Orçamento
export const StatusOrcamentoEnum = z.enum([
  "RASCUNHO",
  "ENVIADO",
  "APROVADO",
  "REJEITADO",
  "EXPIRADO",
  "CANCELADO"
]);

export const TipoItemOrcamentoEnum = z.enum([
  "MATERIAL",
  "SERVICO",
  "MAO_DE_OBRA"
]);

// Schema principal para Orçamento
export const orcamentoSchema = z.object({
  id: z.string().cuid().optional(),
  numero: z.string()
    .min(1, "Número do orçamento é obrigatório")
    .max(50, "Número do orçamento deve ter no máximo 50 caracteres"),
  titulo: z.string()
    .min(1, "Título é obrigatório")
    .max(255, "Título deve ter no máximo 255 caracteres"),
  descricao: z.string()
    .max(5000, "Descrição deve ter no máximo 5000 caracteres")
    .optional()
    .nullable(),
  observacoes: z.string()
    .max(2000, "Observações devem ter no máximo 2000 caracteres")
    .optional()
    .nullable(),
  
  // Valores
  valorSubtotal: z.number()
    .min(0, "Valor subtotal não pode ser negativo")
    .default(0),
  valorDesconto: z.number()
    .min(0, "Valor de desconto não pode ser negativo")
    .default(0),
  percentualDesconto: z.number()
    .min(0, "Percentual de desconto não pode ser negativo")
    .max(100, "Percentual de desconto não pode ser maior que 100%")
    .optional()
    .nullable(),
  valorTotal: z.number()
    .min(0, "Valor total não pode ser negativo")
    .default(0),
  
  // Validade
  dataValidade: z.coerce.date(),
  
  // Status do orçamento
  status: StatusOrcamentoEnum.default("RASCUNHO"),
  
  // Aprovação do cliente
  aprovadoCliente: z.boolean().optional().nullable(),
  dataAprovacao: z.coerce.date().optional().nullable(),
  comentariosCliente: z.string()
    .max(1000, "Comentários do cliente devem ter no máximo 1000 caracteres")
    .optional()
    .nullable(),
  codigoAprovacao: z.string()
    .max(100, "Código de aprovação deve ter no máximo 100 caracteres")
    .optional()
    .nullable(),
  
  // Geração automática
  geradoAutomaticamente: z.boolean().default(false),
  
  // Relacionamentos obrigatórios
  ordemServicoId: z.string()
    .cuid("ID da ordem de serviço deve ser um CUID válido")
    .min(1, "Ordem de serviço é obrigatória"),
  criadoPorId: z.string()
    .cuid("ID do criador deve ser um CUID válido")
    .min(1, "Criador é obrigatório"),
  
  // Relacionamentos opcionais
  laudoTecnicoId: z.string()
    .cuid("ID do laudo técnico deve ser um CUID válido")
    .optional()
    .nullable(),
  
  // Metadados
  createdAt: z.coerce.date().optional(),
  updatedAt: z.coerce.date().optional()
});

// Schema para criação de Orçamento (sem campos auto-gerados)
export const createOrcamentoSchema = orcamentoSchema.omit({
  id: true,
  numero: true, // Gerado automaticamente
  createdAt: true,
  updatedAt: true
});

// Schema para atualização de Orçamento (todos os campos opcionais exceto ID)
export const updateOrcamentoSchema = orcamentoSchema.partial().extend({
  id: z.string().cuid("ID deve ser um CUID válido")
});

// Schema para Item do Orçamento
export const itemOrcamentoSchema = z.object({
  id: z.string().cuid().optional(),
  tipo: TipoItemOrcamentoEnum,
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
    .max(999999999, "Valor unitário deve ser menor que 999999999"),
  valorTotal: z.number()
    .min(0, "Valor total não pode ser negativo")
    .max(999999999, "Valor total deve ser menor que 999999999"),
  observacoes: z.string()
    .max(1000, "Observações devem ter no máximo 1000 caracteres")
    .optional()
    .nullable(),
  
  // Relacionamentos
  orcamentoId: z.string()
    .cuid("ID do orçamento deve ser um CUID válido")
    .min(1, "Orçamento é obrigatório"),
  itemLaudoId: z.string()
    .cuid("ID do item do laudo deve ser um CUID válido")
    .optional()
    .nullable(),
  
  // Metadados
  createdAt: z.coerce.date().optional(),
  updatedAt: z.coerce.date().optional()
});

// Schema para Anexo do Orçamento
export const anexoOrcamentoSchema = z.object({
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
  
  // Relacionamentos
  orcamentoId: z.string()
    .cuid("ID do orçamento deve ser um CUID válido")
    .min(1, "Orçamento é obrigatório"),
  uploadPor: z.string()
    .max(255, "Nome de quem fez upload deve ter no máximo 255 caracteres")
    .optional()
    .nullable(),
  colaboradorId: z.string()
    .cuid("ID do colaborador deve ser um CUID válido")
    .optional()
    .nullable(),
  
  // Metadados
  createdAt: z.coerce.date().optional()
});

// Schema para Histórico do Orçamento
export const historicoOrcamentoSchema = z.object({
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
  
  // Relacionamentos
  orcamentoId: z.string()
    .cuid("ID do orçamento deve ser um CUID válido")
    .min(1, "Orçamento é obrigatório"),
  colaboradorId: z.string()
    .cuid("ID do colaborador deve ser um CUID válido")
    .optional()
    .nullable(),
  
  // Metadados
  createdAt: z.coerce.date().optional()
});

// Schema para aprovação do cliente
export const aprovacaoClienteSchema = z.object({
  codigoAprovacao: z.string()
    .min(1, "Código de aprovação é obrigatório"),
  aprovado: z.boolean(),
  comentarios: z.string()
    .max(1000, "Comentários devem ter no máximo 1000 caracteres")
    .optional()
});

// Schemas para filtros e consultas
export const orcamentoFilterSchema = z.object({
  search: z.string().optional(),
  status: StatusOrcamentoEnum.optional(),
  ordemServicoId: z.string().cuid().optional(),
  laudoTecnicoId: z.string().cuid().optional(),
  geradoAutomaticamente: z.boolean().optional(),
  dataValidadeInicio: z.coerce.date().optional(),
  dataValidadeFim: z.coerce.date().optional(),
  dataAprovacaoInicio: z.coerce.date().optional(),
  dataAprovacaoFim: z.coerce.date().optional(),
  valorMinimo: z.number().min(0).optional(),
  valorMaximo: z.number().min(0).optional(),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(10)
});

// Schema para cálculo de valores
export const calculoOrcamentoSchema = z.object({
  itens: z.array(itemOrcamentoSchema.pick({
    quantidade: true,
    valorUnitario: true
  })),
  percentualDesconto: z.number().min(0).max(100).optional(),
  valorDesconto: z.number().min(0).optional()
});

// Tipos TypeScript derivados dos schemas
export type Orcamento = z.infer<typeof orcamentoSchema>;
export type CreateOrcamento = z.infer<typeof createOrcamentoSchema>;
export type UpdateOrcamento = z.infer<typeof updateOrcamentoSchema>;
export type ItemOrcamento = z.infer<typeof itemOrcamentoSchema>;
export type AnexoOrcamento = z.infer<typeof anexoOrcamentoSchema>;
export type HistoricoOrcamento = z.infer<typeof historicoOrcamentoSchema>;
export type AprovacaoCliente = z.infer<typeof aprovacaoClienteSchema>;
export type OrcamentoFilter = z.infer<typeof orcamentoFilterSchema>;
export type CalculoOrcamento = z.infer<typeof calculoOrcamentoSchema>;
export type StatusOrcamento = z.infer<typeof StatusOrcamentoEnum>;
export type TipoItemOrcamento = z.infer<typeof TipoItemOrcamentoEnum>;
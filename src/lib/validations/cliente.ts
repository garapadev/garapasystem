import { z } from 'zod';

export const clienteSchema = z.object({
  nome: z.string()
    .min(2, 'Nome deve ter pelo menos 2 caracteres')
    .max(100, 'Nome deve ter no máximo 100 caracteres'),
  email: z.string()
    .email('Email inválido')
    .max(255, 'Email deve ter no máximo 255 caracteres'),
  telefone: z.string()
    .optional()
    .refine((val) => !val || /^\(?\d{2}\)?[\s-]?\d{4,5}[\s-]?\d{4}$/.test(val), {
      message: 'Telefone deve estar no formato (XX) XXXXX-XXXX ou (XX) XXXX-XXXX'
    }),
  documento: z.string()
    .optional()
    .refine((val) => !val || /^\d{3}\.\d{3}\.\d{3}-\d{2}$|^\d{2}\.\d{3}\.\d{3}\/\d{4}-\d{2}$/.test(val), {
      message: 'Documento deve ser um CPF (XXX.XXX.XXX-XX) ou CNPJ (XX.XXX.XXX/XXXX-XX) válido'
    }),
  tipo: z.enum(['PESSOA_FISICA', 'PESSOA_JURIDICA'], {
    message: 'Tipo deve ser Pessoa Física ou Pessoa Jurídica'
  }),
  status: z.enum(['LEAD', 'PROSPECT', 'CLIENTE', 'INATIVO'], {
    message: 'Status deve ser Lead, Prospect, Cliente ou Inativo'
  }),
  enderecos: z.array(z.object({
    cep: z.string()
      .optional()
      .refine((val) => !val || /^\d{5}-?\d{3}$/.test(val), {
        message: 'CEP deve estar no formato XXXXX-XXX'
      }),
    logradouro: z.string()
      .max(255, 'Logradouro deve ter no máximo 255 caracteres')
      .optional(),
    numero: z.string()
      .max(20, 'Número deve ter no máximo 20 caracteres')
      .optional(),
    bairro: z.string()
      .max(100, 'Bairro deve ter no máximo 100 caracteres')
      .optional(),
    complemento: z.string()
      .max(100, 'Complemento deve ter no máximo 100 caracteres')
      .optional(),
    cidade: z.string()
      .max(100, 'Cidade deve ter no máximo 100 caracteres')
      .optional(),
    estado: z.string()
      .length(2, 'Estado deve ter 2 caracteres (ex: SP, RJ)')
      .optional(),
    pais: z.string()
      .max(100, 'País deve ter no máximo 100 caracteres')
      .default('Brasil'),
    tipo: z.enum(['RESIDENCIAL', 'COMERCIAL', 'CORRESPONDENCIA', 'ENTREGA', 'COBRANCA'], {
      message: 'Tipo deve ser Residencial, Comercial, Correspondência, Entrega ou Cobrança'
    }).default('RESIDENCIAL'),
    informacoesAdicionais: z.string()
      .max(500, 'Informações adicionais devem ter no máximo 500 caracteres')
      .optional(),
    principal: z.boolean().default(false),
    ativo: z.boolean().default(true)
  })).min(1, 'Pelo menos um endereço é obrigatório').default([{
    cep: '',
    logradouro: '',
    numero: '',
    bairro: '',
    complemento: '',
    cidade: '',
    estado: '',
    pais: 'Brasil',
    tipo: 'RESIDENCIAL' as const,
    informacoesAdicionais: '',
    principal: true,
    ativo: true
   }]),
  valorPotencial: z.string()
    .optional()
    .refine((val) => !val || !isNaN(parseFloat(val)), {
      message: 'Valor potencial deve ser um número válido'
    }),
  observacoes: z.string()
    .max(1000, 'Observações devem ter no máximo 1000 caracteres')
    .optional()
});

export type ClienteFormData = z.infer<typeof clienteSchema>;
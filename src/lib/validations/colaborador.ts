import { z } from 'zod';

export const colaboradorSchema = z.object({
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
  cargo: z.string()
    .min(2, 'Cargo deve ter pelo menos 2 caracteres')
    .max(100, 'Cargo deve ter no máximo 100 caracteres'),
  dataAdmissao: z.string()
    .refine((val) => !isNaN(Date.parse(val)), {
      message: 'Data de admissão deve ser uma data válida'
    }),
  ativo: z.boolean({
    message: 'Status ativo deve ser verdadeiro ou falso'
  }),
  perfilId: z.string()
    .optional(),
  grupoHierarquicoId: z.string()
    .optional()
});

export type ColaboradorFormData = z.infer<typeof colaboradorSchema>;
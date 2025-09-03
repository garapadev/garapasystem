import { z } from 'zod';

export const grupoHierarquicoSchema = z.object({
  nome: z.string()
    .min(2, 'Nome deve ter pelo menos 2 caracteres')
    .max(100, 'Nome deve ter no máximo 100 caracteres'),
  descricao: z.string()
    .max(500, 'Descrição deve ter no máximo 500 caracteres')
    .optional(),
  ativo: z.boolean({
    message: 'Status ativo deve ser verdadeiro ou falso'
  }),
  parentId: z.string()
    .optional()
});

export type GrupoHierarquicoFormData = z.infer<typeof grupoHierarquicoSchema>;
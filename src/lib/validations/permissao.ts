import { z } from 'zod';

export const permissaoSchema = z.object({
  nome: z.string()
    .min(2, 'Nome deve ter pelo menos 2 caracteres')
    .max(100, 'Nome deve ter no máximo 100 caracteres'),
  descricao: z.string()
    .max(500, 'Descrição deve ter no máximo 500 caracteres')
    .optional(),
  recurso: z.string()
    .min(1, 'Recurso é obrigatório')
    .max(50, 'Recurso deve ter no máximo 50 caracteres'),
  acao: z.string()
    .min(1, 'Ação é obrigatória')
    .max(50, 'Ação deve ter no máximo 50 caracteres')
});

export type PermissaoFormData = z.infer<typeof permissaoSchema>;
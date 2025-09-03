import { Permissao } from '../entities/Permissao';

export interface IPermissaoRepository {
  save(permissao: Permissao): Promise<void>;
  findById(id: string): Promise<Permissao | null>;
  findByNome(nome: string): Promise<Permissao | null>;
  findAll(): Promise<Permissao[]>;
  findByRecurso(recurso: string): Promise<Permissao[]>;
  update(permissao: Permissao): Promise<void>;
  delete(id: string): Promise<void>;
}
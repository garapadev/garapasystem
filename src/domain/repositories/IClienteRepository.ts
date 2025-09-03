import { Cliente } from '../entities/Cliente';

export interface IClienteRepository {
  save(cliente: Cliente): Promise<void>;
  findById(id: string): Promise<Cliente | null>;
  findByEmail(email: string): Promise<Cliente | null>;
  findAll(): Promise<Cliente[]>;
  findByStatus(status: string): Promise<Cliente[]>;
  findByGrupoHierarquico(grupoId: string): Promise<Cliente[]>;
  update(cliente: Cliente): Promise<void>;
  delete(id: string): Promise<void>;
}
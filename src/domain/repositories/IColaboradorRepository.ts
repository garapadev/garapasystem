import { Colaborador } from '../entities/Colaborador';

export interface IColaboradorRepository {
  save(colaborador: Colaborador): Promise<void>;
  findById(id: string): Promise<Colaborador | null>;
  findByEmail(email: string): Promise<Colaborador | null>;
  findAll(): Promise<Colaborador[]>;
  findByGrupoHierarquico(grupoId: string): Promise<Colaborador[]>;
  findByPerfil(perfilId: string): Promise<Colaborador[]>;
  update(colaborador: Colaborador): Promise<void>;
  delete(id: string): Promise<void>;
}
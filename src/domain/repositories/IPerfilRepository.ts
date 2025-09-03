import { Perfil } from '../entities/Perfil';

export interface IPerfilRepository {
  save(perfil: Perfil): Promise<void>;
  findById(id: string): Promise<Perfil | null>;
  findByNome(nome: string): Promise<Perfil | null>;
  findAll(): Promise<Perfil[]>;
  update(perfil: Perfil): Promise<void>;
  delete(id: string): Promise<void>;
}
import { Usuario } from '../entities/Usuario';

export interface IUsuarioRepository {
  save(usuario: Usuario): Promise<void>;
  findById(id: string): Promise<Usuario | null>;
  findByEmail(email: string): Promise<Usuario | null>;
  findAll(): Promise<Usuario[]>;
  update(usuario: Usuario): Promise<void>;
  delete(id: string): Promise<void>;
}
import { GrupoHierarquico } from '../entities/GrupoHierarquico';

export interface IGrupoHierarquicoRepository {
  save(grupo: GrupoHierarquico): Promise<void>;
  findById(id: string): Promise<GrupoHierarquico | null>;
  findAll(): Promise<GrupoHierarquico[]>;
  findByParent(parentId: string): Promise<GrupoHierarquico[]>;
  findRootNodes(): Promise<GrupoHierarquico[]>;
  update(grupo: GrupoHierarquico): Promise<void>;
  delete(id: string): Promise<void>;
}
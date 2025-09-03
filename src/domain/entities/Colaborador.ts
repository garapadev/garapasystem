import { Entity } from '../Entity';
import { GrupoHierarquico } from './GrupoHierarquico';
import { Perfil } from './Perfil';

export interface ColaboradorProps {
  nome: string;
  email: string;
  telefone?: string;
  documento?: string;
  cargo?: string;
  dataAdmissao?: Date;
  ativo: boolean;
  perfil?: Perfil;
  grupoHierarquico?: GrupoHierarquico;
  createdAt: Date;
  updatedAt: Date;
}

export class Colaborador extends Entity<ColaboradorProps> {
  get nome(): string {
    return this.props.nome;
  }

  get email(): string {
    return this.props.email;
  }

  get telefone(): string | undefined {
    return this.props.telefone;
  }

  get documento(): string | undefined {
    return this.props.documento;
  }

  get cargo(): string | undefined {
    return this.props.cargo;
  }

  get dataAdmissao(): Date | undefined {
    return this.props.dataAdmissao;
  }

  get ativo(): boolean {
    return this.props.ativo;
  }

  get perfil(): Perfil | undefined {
    return this.props.perfil;
  }

  get grupoHierarquico(): GrupoHierarquico | undefined {
    return this.props.grupoHierarquico;
  }

  get createdAt(): Date {
    return this.props.createdAt;
  }

  get updatedAt(): Date {
    return this.props.updatedAt;
  }

  // Métodos de negócio
  ativar(): void {
    if (!this.props.ativo) {
      this.props.ativo = true;
      this.props.updatedAt = new Date();
    }
  }

  desativar(): void {
    if (this.props.ativo) {
      this.props.ativo = false;
      this.props.updatedAt = new Date();
    }
  }

  atribuirPerfil(perfil: Perfil): void {
    this.props.perfil = perfil;
    this.props.updatedAt = new Date();
  }

  removerPerfil(): void {
    this.props.perfil = undefined;
    this.props.updatedAt = new Date();
  }

  atribuirGrupo(grupo: GrupoHierarquico): void {
    this.props.grupoHierarquico = grupo;
    this.props.updatedAt = new Date();
  }

  removerGrupo(): void {
    this.props.grupoHierarquico = undefined;
    this.props.updatedAt = new Date();
  }

  temPermissao(recurso: string, acao: string): boolean {
    return this.props.perfil?.temPermissao(recurso, acao) || false;
  }

  atualizarDados(dados: Partial<ColaboradorProps>): void {
    this.props = {
      ...this.props,
      ...dados,
      updatedAt: new Date()
    };
  }

  // Método de fábrica estático
  static criar(dados: Omit<ColaboradorProps, 'createdAt' | 'updatedAt' | 'ativo'>): Colaborador {
    return new Colaborador({
      ...dados,
      ativo: true,
      createdAt: new Date(),
      updatedAt: new Date()
    });
  }

  // Método para reconstruir a entidade a partir do banco de dados
  static reconstruir(dados: ColaboradorProps): Colaborador {
    return new Colaborador(dados);
  }
}
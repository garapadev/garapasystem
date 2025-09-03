import { Entity } from '../Entity';

export interface GrupoHierarquicoProps {
  nome: string;
  descricao?: string;
  ativo: boolean;
  parent?: GrupoHierarquico;
  children?: GrupoHierarquico[];
  createdAt: Date;
  updatedAt: Date;
}

export class GrupoHierarquico extends Entity<GrupoHierarquicoProps> {
  get nome(): string {
    return this.props.nome;
  }

  get descricao(): string | undefined {
    return this.props.descricao;
  }

  get ativo(): boolean {
    return this.props.ativo;
  }

  get parent(): GrupoHierarquico | undefined {
    return this.props.parent;
  }

  get children(): GrupoHierarquico[] | undefined {
    return this.props.children;
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

  atualizarDados(dados: Partial<GrupoHierarquicoProps>): void {
    this.props = {
      ...this.props,
      ...dados,
      updatedAt: new Date()
    };
  }

  // Método de fábrica estático
  static criar(dados: Omit<GrupoHierarquicoProps, 'createdAt' | 'updatedAt' | 'ativo'>): GrupoHierarquico {
    return new GrupoHierarquico({
      ...dados,
      ativo: true,
      createdAt: new Date(),
      updatedAt: new Date()
    });
  }

  // Método para reconstruir a entidade a partir do banco de dados
  static reconstruir(dados: GrupoHierarquicoProps): GrupoHierarquico {
    return new GrupoHierarquico(dados);
  }
}
import { Entity } from '../Entity';

export interface PermissaoProps {
  nome: string;
  descricao?: string;
  recurso: string;
  acao: string;
  createdAt: Date;
  updatedAt: Date;
}

export class Permissao extends Entity<PermissaoProps> {
  get nome(): string {
    return this.props.nome;
  }

  get descricao(): string | undefined {
    return this.props.descricao;
  }

  get recurso(): string {
    return this.props.recurso;
  }

  get acao(): string {
    return this.props.acao;
  }

  get createdAt(): Date {
    return this.props.createdAt;
  }

  get updatedAt(): Date {
    return this.props.updatedAt;
  }

  // Métodos de negócio
  atualizarDados(dados: Partial<PermissaoProps>): void {
    this.props = {
      ...this.props,
      ...dados,
      updatedAt: new Date()
    };
  }

  // Método de fábrica estático
  static criar(dados: Omit<PermissaoProps, 'createdAt' | 'updatedAt'>): Permissao {
    return new Permissao({
      ...dados,
      createdAt: new Date(),
      updatedAt: new Date()
    });
  }

  // Método para reconstruir a entidade a partir do banco de dados
  static reconstruir(dados: PermissaoProps): Permissao {
    return new Permissao(dados);
  }
}
import { Entity } from '../Entity';
import { Permissao } from './Permissao';

export interface PerfilProps {
  nome: string;
  descricao?: string;
  ativo: boolean;
  permissoes: Permissao[];
  createdAt: Date;
  updatedAt: Date;
}

export class Perfil extends Entity<PerfilProps> {
  get nome(): string {
    return this.props.nome;
  }

  get descricao(): string | undefined {
    return this.props.descricao;
  }

  get ativo(): boolean {
    return this.props.ativo;
  }

  get permissoes(): Permissao[] {
    return this.props.permissoes;
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

  adicionarPermissao(permissao: Permissao): void {
    if (!this.props.permissoes.some(p => p === permissao)) {
      this.props.permissoes.push(permissao);
      this.props.updatedAt = new Date();
    }
  }

  removerPermissao(permissao: Permissao): void {
    this.props.permissoes = this.props.permissoes.filter(p => p !== permissao);
    this.props.updatedAt = new Date();
  }

  temPermissao(recurso: string, acao: string): boolean {
    return this.props.permissoes.some(p => 
      p.recurso === recurso && p.acao === acao
    );
  }

  atualizarDados(dados: Partial<PerfilProps>): void {
    this.props = {
      ...this.props,
      ...dados,
      updatedAt: new Date()
    };
  }

  // Método de fábrica estático
  static criar(dados: Omit<PerfilProps, 'createdAt' | 'updatedAt' | 'ativo' | 'permissoes'>): Perfil {
    return new Perfil({
      ...dados,
      ativo: true,
      permissoes: [],
      createdAt: new Date(),
      updatedAt: new Date()
    });
  }

  // Método para reconstruir a entidade a partir do banco de dados
  static reconstruir(dados: PerfilProps): Perfil {
    return new Perfil(dados);
  }
}
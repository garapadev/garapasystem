import { Entity } from '../Entity';
import { Colaborador } from './Colaborador';

export interface UsuarioProps {
  email: string;
  senha: string;
  nome: string;
  ativo: boolean;
  colaborador?: Colaborador;
  createdAt: Date;
  updatedAt: Date;
}

export class Usuario extends Entity<UsuarioProps> {
  get email(): string {
    return this.props.email;
  }

  get senha(): string {
    return this.props.senha;
  }

  get nome(): string {
    return this.props.nome;
  }

  get ativo(): boolean {
    return this.props.ativo;
  }

  get colaborador(): Colaborador | undefined {
    return this.props.colaborador;
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

  alterarSenha(novaSenha: string): void {
    this.props.senha = novaSenha;
    this.props.updatedAt = new Date();
  }

  vincularColaborador(colaborador: Colaborador): void {
    this.props.colaborador = colaborador;
    this.props.updatedAt = new Date();
  }

  desvincularColaborador(): void {
    this.props.colaborador = undefined;
    this.props.updatedAt = new Date();
  }

  atualizarDados(dados: Partial<UsuarioProps>): void {
    this.props = {
      ...this.props,
      ...dados,
      updatedAt: new Date()
    };
  }

  // Método de fábrica estático
  static criar(dados: Omit<UsuarioProps, 'createdAt' | 'updatedAt' | 'ativo'>): Usuario {
    return new Usuario({
      ...dados,
      ativo: true,
      createdAt: new Date(),
      updatedAt: new Date()
    });
  }

  // Método para reconstruir a entidade a partir do banco de dados
  static reconstruir(dados: UsuarioProps): Usuario {
    return new Usuario(dados);
  }
}
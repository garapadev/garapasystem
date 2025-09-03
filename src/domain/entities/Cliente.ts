import { Entity } from '../Entity';
import { TipoCliente, StatusCliente } from '../value-objects/ClienteEnums';
import { GrupoHierarquico } from './GrupoHierarquico';

export interface ClienteProps {
  nome: string;
  email?: string;
  telefone?: string;
  documento?: string;
  tipo: TipoCliente;
  status: StatusCliente;
  endereco?: string;
  cidade?: string;
  estado?: string;
  cep?: string;
  observacoes?: string;
  valorPotencial?: number;
  grupoHierarquico?: GrupoHierarquico;
  createdAt: Date;
  updatedAt: Date;
}

export class Cliente extends Entity<ClienteProps> {
  get nome(): string {
    return this.props.nome;
  }

  get email(): string | undefined {
    return this.props.email;
  }

  get telefone(): string | undefined {
    return this.props.telefone;
  }

  get documento(): string | undefined {
    return this.props.documento;
  }

  get tipo(): TipoCliente {
    return this.props.tipo;
  }

  get status(): StatusCliente {
    return this.props.status;
  }

  get endereco(): string | undefined {
    return this.props.endereco;
  }

  get cidade(): string | undefined {
    return this.props.cidade;
  }

  get estado(): string | undefined {
    return this.props.estado;
  }

  get cep(): string | undefined {
    return this.props.cep;
  }

  get observacoes(): string | undefined {
    return this.props.observacoes;
  }

  get valorPotencial(): number | undefined {
    return this.props.valorPotencial;
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
  converterParaCliente(): void {
    if (this.props.status === StatusCliente.LEAD) {
      this.props.status = StatusCliente.CLIENTE;
      this.props.updatedAt = new Date();
    }
  }

  converterParaProspect(): void {
    if (this.props.status === StatusCliente.LEAD) {
      this.props.status = StatusCliente.PROSPECT;
      this.props.updatedAt = new Date();
    }
  }

  inativar(): void {
    if (this.props.status !== StatusCliente.INATIVO) {
      this.props.status = StatusCliente.INATIVO;
      this.props.updatedAt = new Date();
    }
  }

  atualizarDados(dados: Partial<ClienteProps>): void {
    this.props = {
      ...this.props,
      ...dados,
      updatedAt: new Date()
    };
  }

  // Método de fábrica estático
  static criar(dados: Omit<ClienteProps, 'createdAt' | 'updatedAt' | 'status'>): Cliente {
    return new Cliente({
      ...dados,
      status: StatusCliente.LEAD,
      createdAt: new Date(),
      updatedAt: new Date()
    });
  }

  // Método para reconstruir a entidade a partir do banco de dados
  static reconstruir(dados: ClienteProps): Cliente {
    return new Cliente(dados);
  }
}
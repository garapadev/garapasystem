import { Entity } from '../Entity';
import { StatusOrdemServico, PrioridadeOS } from '../value-objects/OrdemServicoEnums';
import { Cliente } from './Cliente';
import { Colaborador } from './Colaborador';

export interface ItemOrdemServicoProps {
  id?: string;
  descricao: string;
  quantidade: number;
  valorUnitario: number;
  valorTotal: number;
  observacoes?: string;
}

export interface ComentarioOrdemServicoProps {
  id?: string;
  conteudo: string;
  interno: boolean;
  colaborador?: Colaborador;
  createdAt: Date;
}

export interface AnexoOrdemServicoProps {
  id?: string;
  nomeArquivo: string;
  caminhoArquivo: string;
  tamanho: number;
  tipoMime: string;
  descricao?: string;
  colaborador?: Colaborador;
  createdAt: Date;
}

export interface HistoricoOrdemServicoProps {
  id?: string;
  acao: string;
  descricao?: string;
  valorAnterior?: string;
  valorNovo?: string;
  colaborador?: Colaborador;
  createdAt: Date;
}

export interface OrdemServicoProps {
  titulo: string;
  descricao: string;
  localExecucao?: string;
  dataInicio?: Date;
  dataFim?: Date;
  valorOrcamento?: number;
  valorFinal?: number;
  status: StatusOrdemServico;
  prioridade: PrioridadeOS;
  codigoAprovacao?: string;
  observacoesInternas?: string;
  cliente: Cliente;
  responsavel?: Colaborador;
  criadoPor: Colaborador;
  oportunidade?: any; // TODO: Criar entidade Oportunidade
  itens: ItemOrdemServicoProps[];
  comentarios: ComentarioOrdemServicoProps[];
  anexos: AnexoOrdemServicoProps[];
  historico: HistoricoOrdemServicoProps[];
  createdAt: Date;
  updatedAt: Date;
}

export class OrdemServico extends Entity<OrdemServicoProps> {
  get titulo(): string {
    return this.props.titulo;
  }

  get descricao(): string {
    return this.props.descricao;
  }

  get localExecucao(): string | undefined {
    return this.props.localExecucao;
  }

  get dataInicio(): Date | undefined {
    return this.props.dataInicio;
  }

  get dataFim(): Date | undefined {
    return this.props.dataFim;
  }

  get valorOrcamento(): number | undefined {
    return this.props.valorOrcamento;
  }

  get valorFinal(): number | undefined {
    return this.props.valorFinal;
  }

  get status(): StatusOrdemServico {
    return this.props.status;
  }

  get prioridade(): PrioridadeOS {
    return this.props.prioridade;
  }

  get codigoAprovacao(): string | undefined {
    return this.props.codigoAprovacao;
  }

  get observacoesInternas(): string | undefined {
    return this.props.observacoesInternas;
  }

  get cliente(): Cliente {
    return this.props.cliente;
  }

  get responsavel(): Colaborador | undefined {
    return this.props.responsavel;
  }

  get criadoPor(): Colaborador {
    return this.props.criadoPor;
  }

  get oportunidade(): any | undefined {
    return this.props.oportunidade;
  }

  get itens(): ItemOrdemServicoProps[] {
    return this.props.itens;
  }

  get comentarios(): ComentarioOrdemServicoProps[] {
    return this.props.comentarios;
  }

  get anexos(): AnexoOrdemServicoProps[] {
    return this.props.anexos;
  }

  get historico(): HistoricoOrdemServicoProps[] {
    return this.props.historico;
  }

  get createdAt(): Date {
    return this.props.createdAt;
  }

  get updatedAt(): Date {
    return this.props.updatedAt;
  }

  get valorTotalItens(): number {
    return this.props.itens.reduce((total, item) => total + item.valorTotal, 0);
  }

  get podeSerAprovada(): boolean {
    return this.props.status === StatusOrdemServico.AGUARDANDO_APROVACAO;
  }

  get podeSerExecutada(): boolean {
    return this.props.status === StatusOrdemServico.APROVADA;
  }

  get podeSerCancelada(): boolean {
    return [
      StatusOrdemServico.RASCUNHO,
      StatusOrdemServico.AGUARDANDO_APROVACAO,
      StatusOrdemServico.APROVADA,
      StatusOrdemServico.PAUSADA
    ].includes(this.props.status);
  }

  // Métodos de negócio
  enviarParaAprovacao(): void {
    if (this.props.status === StatusOrdemServico.RASCUNHO) {
      this.props.status = StatusOrdemServico.AGUARDANDO_APROVACAO;
      this.props.codigoAprovacao = this.gerarCodigoAprovacao();
      this.adicionarHistorico('Enviada para aprovação', 'RASCUNHO', 'AGUARDANDO_APROVACAO');
      this.props.updatedAt = new Date();
    }
  }

  aprovar(colaborador?: Colaborador): void {
    if (this.podeSerAprovada) {
      this.props.status = StatusOrdemServico.APROVADA;
      this.adicionarHistorico('Ordem de serviço aprovada', 'AGUARDANDO_APROVACAO', 'APROVADA', colaborador);
      this.props.updatedAt = new Date();
    }
  }

  rejeitar(motivo: string, colaborador?: Colaborador): void {
    if (this.podeSerAprovada) {
      this.props.status = StatusOrdemServico.REJEITADA;
      this.adicionarHistorico(`Ordem de serviço rejeitada: ${motivo}`, 'AGUARDANDO_APROVACAO', 'REJEITADA', colaborador);
      this.props.updatedAt = new Date();
    }
  }

  iniciarExecucao(colaborador?: Colaborador): void {
    if (this.podeSerExecutada) {
      this.props.status = StatusOrdemServico.EM_EXECUCAO;
      if (!this.props.dataInicio) {
        this.props.dataInicio = new Date();
      }
      this.adicionarHistorico('Execução iniciada', 'APROVADA', 'EM_EXECUCAO', colaborador);
      this.props.updatedAt = new Date();
    }
  }

  pausar(motivo: string, colaborador?: Colaborador): void {
    if (this.props.status === StatusOrdemServico.EM_EXECUCAO) {
      this.props.status = StatusOrdemServico.PAUSADA;
      this.adicionarHistorico(`Execução pausada: ${motivo}`, 'EM_EXECUCAO', 'PAUSADA', colaborador);
      this.props.updatedAt = new Date();
    }
  }

  retomar(colaborador?: Colaborador): void {
    if (this.props.status === StatusOrdemServico.PAUSADA) {
      this.props.status = StatusOrdemServico.EM_EXECUCAO;
      this.adicionarHistorico('Execução retomada', 'PAUSADA', 'EM_EXECUCAO', colaborador);
      this.props.updatedAt = new Date();
    }
  }

  concluir(valorFinal?: number, colaborador?: Colaborador): void {
    if (this.props.status === StatusOrdemServico.EM_EXECUCAO) {
      this.props.status = StatusOrdemServico.CONCLUIDA;
      this.props.dataFim = new Date();
      if (valorFinal !== undefined) {
        this.props.valorFinal = valorFinal;
      }
      this.adicionarHistorico('Ordem de serviço concluída', 'EM_EXECUCAO', 'CONCLUIDA', colaborador);
      this.props.updatedAt = new Date();
    }
  }

  cancelar(motivo: string, colaborador?: Colaborador): void {
    if (this.podeSerCancelada) {
      const statusAnterior = this.props.status;
      this.props.status = StatusOrdemServico.CANCELADA;
      this.adicionarHistorico(`Ordem de serviço cancelada: ${motivo}`, statusAnterior, 'CANCELADA', colaborador);
      this.props.updatedAt = new Date();
    }
  }

  adicionarItem(item: Omit<ItemOrdemServicoProps, 'id'>): void {
    const novoItem: ItemOrdemServicoProps = {
      ...item,
      id: this.gerarId()
    };
    this.props.itens.push(novoItem);
    this.adicionarHistorico(`Item adicionado: ${item.descricao}`);
    this.props.updatedAt = new Date();
  }

  removerItem(itemId: string): void {
    const itemIndex = this.props.itens.findIndex(item => item.id === itemId);
    if (itemIndex !== -1) {
      const item = this.props.itens[itemIndex];
      this.props.itens.splice(itemIndex, 1);
      this.adicionarHistorico(`Item removido: ${item.descricao}`);
      this.props.updatedAt = new Date();
    }
  }

  adicionarComentario(conteudo: string, interno: boolean = false, colaborador?: Colaborador): void {
    const comentario: ComentarioOrdemServicoProps = {
      id: this.gerarId(),
      conteudo,
      interno,
      colaborador,
      createdAt: new Date()
    };
    this.props.comentarios.push(comentario);
    this.adicionarHistorico(`Comentário ${interno ? 'interno' : 'público'} adicionado`, undefined, undefined, colaborador);
    this.props.updatedAt = new Date();
  }

  adicionarAnexo(anexo: Omit<AnexoOrdemServicoProps, 'id' | 'createdAt'>, colaborador?: Colaborador): void {
    const novoAnexo: AnexoOrdemServicoProps = {
      ...anexo,
      id: this.gerarId(),
      colaborador,
      createdAt: new Date()
    };
    this.props.anexos.push(novoAnexo);
    this.adicionarHistorico(`Anexo adicionado: ${anexo.nomeArquivo}`, undefined, undefined, colaborador);
    this.props.updatedAt = new Date();
  }

  atribuirResponsavel(responsavel: Colaborador, colaborador?: Colaborador): void {
    const responsavelAnterior = this.props.responsavel?.nome || 'Nenhum';
    this.props.responsavel = responsavel;
    this.adicionarHistorico('Responsável alterado', responsavelAnterior, responsavel.nome, colaborador);
    this.props.updatedAt = new Date();
  }

  atualizarDados(dados: Partial<OrdemServicoProps>, colaborador?: Colaborador): void {
    const dadosAnteriores = { ...this.props };
    this.props = {
      ...this.props,
      ...dados,
      updatedAt: new Date()
    };

    // Registrar mudanças significativas no histórico
    if (dados.titulo && dados.titulo !== dadosAnteriores.titulo) {
      this.adicionarHistorico('Título alterado', dadosAnteriores.titulo, dados.titulo, colaborador);
    }
    if (dados.prioridade && dados.prioridade !== dadosAnteriores.prioridade) {
      this.adicionarHistorico('Prioridade alterada', dadosAnteriores.prioridade, dados.prioridade, colaborador);
    }
  }

  private adicionarHistorico(acao: string, valorAnterior?: string, valorNovo?: string, colaborador?: Colaborador): void {
    const historico: HistoricoOrdemServicoProps = {
      id: this.gerarId(),
      acao,
      valorAnterior,
      valorNovo,
      colaborador,
      createdAt: new Date()
    };
    this.props.historico.push(historico);
  }

  private gerarCodigoAprovacao(): string {
    return Math.random().toString(36).substring(2, 15).toUpperCase();
  }

  private gerarId(): string {
    return Math.random().toString(36).substring(2, 15);
  }

  // Método de fábrica estático
  static criar(dados: Omit<OrdemServicoProps, 'createdAt' | 'updatedAt' | 'status' | 'itens' | 'comentarios' | 'anexos' | 'historico'>): OrdemServico {
    const ordemServico = new OrdemServico({
      ...dados,
      status: StatusOrdemServico.RASCUNHO,
      itens: [],
      comentarios: [],
      anexos: [],
      historico: [],
      createdAt: new Date(),
      updatedAt: new Date()
    });

    // Adicionar histórico de criação
    ordemServico.adicionarHistorico('Ordem de serviço criada', undefined, undefined, dados.criadoPor);

    return ordemServico;
  }

  // Método para reconstruir a entidade a partir do banco de dados
  static reconstruir(dados: OrdemServicoProps): OrdemServico {
    return new OrdemServico(dados);
  }
}
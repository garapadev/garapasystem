import { Entity } from '../Entity';
import { Colaborador } from './Colaborador';
import { TemplateChecklist } from './TemplateChecklist';

export interface ItemChecklistOSProps {
  id?: string;
  descricao: string;
  obrigatorio: boolean;
  ordem: number;
  concluido: boolean;
  observacoes?: string;
  concluidoPor?: Colaborador;
  concluidoEm?: Date;
}

export interface ChecklistOrdemServicoProps {
  nome: string;
  descricao?: string;
  template?: TemplateChecklist;
  itens: ItemChecklistOSProps[];
  createdAt: Date;
  updatedAt: Date;
}

export class ChecklistOrdemServico extends Entity<ChecklistOrdemServicoProps> {
  get nome(): string {
    return this.props.nome;
  }

  get descricao(): string | undefined {
    return this.props.descricao;
  }

  get template(): TemplateChecklist | undefined {
    return this.props.template;
  }

  get itens(): ItemChecklistOSProps[] {
    return this.props.itens.sort((a, b) => a.ordem - b.ordem);
  }

  get createdAt(): Date {
    return this.props.createdAt;
  }

  get updatedAt(): Date {
    return this.props.updatedAt;
  }

  get totalItens(): number {
    return this.props.itens.length;
  }

  get itensConcluidos(): number {
    return this.props.itens.filter(item => item.concluido).length;
  }

  get itensObrigatorios(): number {
    return this.props.itens.filter(item => item.obrigatorio).length;
  }

  get itensObrigatoriosConcluidos(): number {
    return this.props.itens.filter(item => item.obrigatorio && item.concluido).length;
  }

  get percentualConclusao(): number {
    if (this.totalItens === 0) return 0;
    return Math.round((this.itensConcluidos / this.totalItens) * 100);
  }

  get percentualConclusaoObrigatorios(): number {
    if (this.itensObrigatorios === 0) return 100;
    return Math.round((this.itensObrigatoriosConcluidos / this.itensObrigatorios) * 100);
  }

  get estaConcluido(): boolean {
    return this.itensObrigatoriosConcluidos === this.itensObrigatorios;
  }

  get podeSerConcluido(): boolean {
    return this.itensObrigatoriosConcluidos === this.itensObrigatorios;
  }

  // Métodos de negócio
  marcarItemConcluido(itemId: string, colaborador: Colaborador, observacoes?: string): void {
    const item = this.props.itens.find(item => item.id === itemId);
    if (item && !item.concluido) {
      item.concluido = true;
      item.concluidoPor = colaborador;
      item.concluidoEm = new Date();
      if (observacoes) {
        item.observacoes = observacoes;
      }
      this.props.updatedAt = new Date();
    }
  }

  desmarcarItemConcluido(itemId: string): void {
    const item = this.props.itens.find(item => item.id === itemId);
    if (item && item.concluido) {
      item.concluido = false;
      item.concluidoPor = undefined;
      item.concluidoEm = undefined;
      this.props.updatedAt = new Date();
    }
  }

  adicionarItem(item: Omit<ItemChecklistOSProps, 'id' | 'ordem' | 'concluido' | 'concluidoPor' | 'concluidoEm'>): void {
    const proximaOrdem = Math.max(...this.props.itens.map(i => i.ordem), 0) + 1;
    const novoItem: ItemChecklistOSProps = {
      ...item,
      id: this.gerarId(),
      ordem: proximaOrdem,
      concluido: false
    };
    this.props.itens.push(novoItem);
    this.props.updatedAt = new Date();
  }

  removerItem(itemId: string): void {
    const itemIndex = this.props.itens.findIndex(item => item.id === itemId);
    if (itemIndex !== -1) {
      this.props.itens.splice(itemIndex, 1);
      this.reordenarItens();
      this.props.updatedAt = new Date();
    }
  }

  atualizarItem(itemId: string, dadosAtualizados: Partial<ItemChecklistOSProps>): void {
    const item = this.props.itens.find(item => item.id === itemId);
    if (item) {
      Object.assign(item, dadosAtualizados);
      if (dadosAtualizados.ordem !== undefined) {
        this.reordenarItens();
      }
      this.props.updatedAt = new Date();
    }
  }

  reordenarItem(itemId: string, novaOrdem: number): void {
    const item = this.props.itens.find(item => item.id === itemId);
    if (item) {
      item.ordem = novaOrdem;
      this.reordenarItens();
      this.props.updatedAt = new Date();
    }
  }

  resetarChecklist(): void {
    this.props.itens.forEach(item => {
      item.concluido = false;
      item.concluidoPor = undefined;
      item.concluidoEm = undefined;
    });
    this.props.updatedAt = new Date();
  }

  private reordenarItens(): void {
    this.props.itens.sort((a, b) => a.ordem - b.ordem);
    this.props.itens.forEach((item, index) => {
      item.ordem = index + 1;
    });
  }

  private gerarId(): string {
    return Math.random().toString(36).substring(2, 15);
  }

  // Método de fábrica estático
  static criar(dados: Omit<ChecklistOrdemServicoProps, 'createdAt' | 'updatedAt'>): ChecklistOrdemServico {
    return new ChecklistOrdemServico({
      ...dados,
      createdAt: new Date(),
      updatedAt: new Date()
    });
  }

  // Método para criar a partir de um template
  static criarDoTemplate(template: TemplateChecklist, nome?: string): ChecklistOrdemServico {
    const itens: ItemChecklistOSProps[] = template.itens.map(itemTemplate => ({
      id: Math.random().toString(36).substring(2, 15),
      descricao: itemTemplate.descricao,
      obrigatorio: itemTemplate.obrigatorio,
      ordem: itemTemplate.ordem,
      concluido: false,
      observacoes: itemTemplate.observacoes
    }));

    return new ChecklistOrdemServico({
      nome: nome || template.nome,
      descricao: template.descricao,
      template,
      itens,
      createdAt: new Date(),
      updatedAt: new Date()
    });
  }

  // Método para reconstruir a entidade a partir do banco de dados
  static reconstruir(dados: ChecklistOrdemServicoProps): ChecklistOrdemServico {
    return new ChecklistOrdemServico(dados);
  }
}
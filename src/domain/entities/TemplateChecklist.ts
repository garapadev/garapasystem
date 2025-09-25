import { Entity } from '../Entity';
import { Colaborador } from './Colaborador';

export interface ItemTemplateChecklistProps {
  id?: string;
  descricao: string;
  obrigatorio: boolean;
  ordem: number;
  observacoes?: string;
}

export interface TemplateChecklistProps {
  nome: string;
  descricao?: string;
  ativo: boolean;
  itens: ItemTemplateChecklistProps[];
  criadoPor: Colaborador;
  createdAt: Date;
  updatedAt: Date;
}

export class TemplateChecklist extends Entity<TemplateChecklistProps> {
  get nome(): string {
    return this.props.nome;
  }

  get descricao(): string | undefined {
    return this.props.descricao;
  }

  get ativo(): boolean {
    return this.props.ativo;
  }

  get itens(): ItemTemplateChecklistProps[] {
    return this.props.itens.sort((a, b) => a.ordem - b.ordem);
  }

  get criadoPor(): Colaborador {
    return this.props.criadoPor;
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

  get itensObrigatorios(): number {
    return this.props.itens.filter(item => item.obrigatorio).length;
  }

  // Métodos de negócio
  ativar(): void {
    this.props.ativo = true;
    this.props.updatedAt = new Date();
  }

  desativar(): void {
    this.props.ativo = false;
    this.props.updatedAt = new Date();
  }

  adicionarItem(item: Omit<ItemTemplateChecklistProps, 'id' | 'ordem'>): void {
    const proximaOrdem = Math.max(...this.props.itens.map(i => i.ordem), 0) + 1;
    const novoItem: ItemTemplateChecklistProps = {
      ...item,
      id: this.gerarId(),
      ordem: proximaOrdem
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

  atualizarItem(itemId: string, dadosAtualizados: Partial<ItemTemplateChecklistProps>): void {
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

  duplicar(novoNome: string, criadoPor: Colaborador): TemplateChecklist {
    const itensCopiados = this.props.itens.map(item => ({
      ...item,
      id: this.gerarId()
    }));

    return TemplateChecklist.criar({
      nome: novoNome,
      descricao: `Cópia de: ${this.props.descricao || this.props.nome}`,
      itens: itensCopiados,
      criadoPor
    });
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
  static criar(dados: Omit<TemplateChecklistProps, 'createdAt' | 'updatedAt' | 'ativo'>): TemplateChecklist {
    return new TemplateChecklist({
      ...dados,
      ativo: true,
      createdAt: new Date(),
      updatedAt: new Date()
    });
  }

  // Método para reconstruir a entidade a partir do banco de dados
  static reconstruir(dados: TemplateChecklistProps): TemplateChecklist {
    return new TemplateChecklist(dados);
  }
}
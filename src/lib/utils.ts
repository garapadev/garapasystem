import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// Função para formatar moeda
export function formatCurrency(value: number | null | undefined): string {
  // Verifica se o valor é válido
  if (value === null || value === undefined || isNaN(value)) {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(0)
  }
  
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL'
  }).format(value)
}

// Função para formatar data
export function formatDate(date: string | Date): string {
  const dateObj = typeof date === 'string' ? new Date(date) : date
  return new Intl.DateTimeFormat('pt-BR').format(dateObj)
}

// Função para formatar data e hora
export function formatDateTime(date: string | Date): string {
  const dateObj = typeof date === 'string' ? new Date(date) : date
  return new Intl.DateTimeFormat('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  }).format(dateObj)
}

// Função para obter variante do status de ordem de serviço
export function getStatusVariant(status: string): "default" | "secondary" | "destructive" | "outline" {
  switch (status) {
    case 'RASCUNHO':
      return 'outline'
    case 'AGUARDANDO_APROVACAO':
      return 'secondary'
    case 'APROVADA':
      return 'default'
    case 'EM_ANDAMENTO':
      return 'default'
    case 'PAUSADA':
      return 'secondary'
    case 'CONCLUIDA':
      return 'default'
    case 'CANCELADA':
      return 'destructive'
    default:
      return 'outline'
  }
}

// Função para obter variante da prioridade
export function getPriorityVariant(prioridade: string): "default" | "secondary" | "destructive" | "outline" {
  switch (prioridade) {
    case 'BAIXA':
      return 'outline'
    case 'MEDIA':
      return 'secondary'
    case 'ALTA':
      return 'default'
    case 'URGENTE':
      return 'destructive'
    default:
      return 'outline'
  }
}

// Função para obter texto do status
export function getStatusText(status: string): string {
  switch (status) {
    case 'RASCUNHO':
      return 'Rascunho'
    case 'AGUARDANDO_APROVACAO':
      return 'Aguardando Aprovação'
    case 'APROVADA':
      return 'Aprovada'
    case 'EM_ANDAMENTO':
      return 'Em Andamento'
    case 'PAUSADA':
      return 'Pausada'
    case 'CONCLUIDA':
      return 'Concluída'
    case 'CANCELADA':
      return 'Cancelada'
    default:
      return status
  }
}

// Função para obter texto da prioridade
export function getPriorityText(prioridade: string): string {
  switch (prioridade) {
    case 'BAIXA':
      return 'Baixa'
    case 'MEDIA':
      return 'Média'
    case 'ALTA':
      return 'Alta'
    case 'URGENTE':
      return 'Urgente'
    default:
      return prioridade
  }
}

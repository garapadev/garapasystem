'use client'

import Link from 'next/link'
import { Wallet, Banknote, Landmark, ListOrdered, TrendingUp, ArrowDownUp, Receipt, Layers } from 'lucide-react'

export default function FinanceiroHomePage() {
  const cards = [
    { href: '/financeiro/contas-bancarias', title: 'Contas Bancárias', icon: Landmark, desc: 'Cadastro e saldos iniciais' },
    { href: '/financeiro/plano-de-contas', title: 'Plano de Contas', icon: ListOrdered, desc: 'Estrutura contábil' },
    { href: '/financeiro/categorias', title: 'Categorias', icon: Layers, desc: 'Classificação financeira' },
    { href: '/financeiro/lancamentos', title: 'Lançamentos', icon: ArrowDownUp, desc: 'Entradas e saídas' },
    { href: '/financeiro/contas-a-pagar', title: 'Contas a Pagar', icon: Banknote, desc: 'Títulos e parcelas' },
    { href: '/financeiro/contas-a-receber', title: 'Contas a Receber', icon: Receipt, desc: 'Títulos e parcelas' },
    { href: '/financeiro/fluxo-de-caixa', title: 'Fluxo de Caixa', icon: TrendingUp, desc: 'Visão por período' },
    { href: '/financeiro/relatorios', title: 'Relatórios', icon: Wallet, desc: 'Análises e exportações' },
  ]

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Financeiro</h1>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {cards.map((card) => (
          <Link key={card.href} href={card.href} className="border rounded-lg p-4 hover:bg-muted transition-colors">
            <div className="flex items-center gap-3">
              <card.icon className="w-5 h-5" />
              <div>
                <div className="font-medium">{card.title}</div>
                <div className="text-sm text-muted-foreground">{card.desc}</div>
              </div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  )
}
'use client';

import { MainLayout } from '@/components/layout/MainLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Users, Building2, Shield, UserCircle, TrendingUp } from 'lucide-react';

export default function Home() {
  // Dados mockados para o dashboard
  const stats = [
    {
      title: 'Total de Clientes',
      value: '1,234',
      description: '+12% em relação ao mês anterior',
      icon: Users,
      trend: 'up'
    },
    {
      title: 'Grupos Hierárquicos',
      value: '15',
      description: '+2 novos grupos este mês',
      icon: Building2,
      trend: 'up'
    },
    {
      title: 'Colaboradores',
      value: '89',
      description: '+5 novos colaboradores',
      icon: UserCircle,
      trend: 'up'
    },
    {
      title: 'Permissões Ativas',
      value: '45',
      description: 'Sistema de segurança',
      icon: Shield,
      trend: 'stable'
    }
  ];

  const recentActivities = [
    { id: 1, action: 'Novo cliente cadastrado', user: 'João Silva', time: '2 horas atrás' },
    { id: 2, action: 'Grupo atualizado', user: 'Maria Santos', time: '4 horas atrás' },
    { id: 3, action: 'Permissão concedida', user: 'Carlos Oliveira', time: '6 horas atrás' },
    { id: 4, action: 'Colaborador desativado', user: 'Ana Costa', time: '1 dia atrás' },
  ];

  return (
    <MainLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
          <p className="text-muted-foreground">
            Visão geral do seu CRM/ERP
          </p>
        </div>

        {/* Cards de estatísticas */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {stats.map((stat) => (
            <Card key={stat.title}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  {stat.title}
                </CardTitle>
                <stat.icon className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stat.value}</div>
                <p className="text-xs text-muted-foreground">
                  {stat.description}
                </p>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
          {/* Atividades Recentes */}
          <Card className="col-span-4">
            <CardHeader>
              <CardTitle>Atividades Recentes</CardTitle>
              <CardDescription>
                Últimas atividades no sistema
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {recentActivities.map((activity) => (
                  <div key={activity.id} className="flex items-center">
                    <div className="ml-4 space-y-1">
                      <p className="text-sm font-medium leading-none">
                        {activity.action}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {activity.user} • {activity.time}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Status do Sistema */}
          <Card className="col-span-3">
            <CardHeader>
              <CardTitle>Status do Sistema</CardTitle>
              <CardDescription>
                Informações sobre o sistema
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center space-x-2">
                  <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                  <span className="text-sm">Sistema Online</span>
                </div>
                <div className="flex items-center space-x-2">
                  <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                  <span className="text-sm">Banco de Dados Conectado</span>
                </div>
                <div className="flex items-center space-x-2">
                  <div className="w-2 h-2 bg-yellow-500 rounded-full"></div>
                  <span className="text-sm">Última atualização: 5 min atrás</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </MainLayout>
  );
}
'use client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Users, Building2, Shield, UserCircle, TrendingUp, Loader2 } from 'lucide-react';
import { useDashboard } from '@/hooks/useDashboard';

export default function Home() {
  const { stats, recentActivities, loading, error } = useDashboard();

  // Configuração dos cards de estatísticas
  const statsConfig = [
    {
      title: 'Total de Clientes',
      value: stats?.totalClientes || 0,
      description: 'Clientes cadastrados no sistema',
      icon: Users,
      trend: 'stable'
    },
    {
      title: 'Grupos Hierárquicos',
      value: stats?.totalGruposHierarquicos || 0,
      description: 'Grupos organizacionais',
      icon: Building2,
      trend: 'stable'
    },
    {
      title: 'Colaboradores',
      value: stats?.totalColaboradores || 0,
      description: 'Colaboradores ativos',
      icon: UserCircle,
      trend: 'stable'
    },
    {
      title: 'Permissões Ativas',
      value: stats?.totalPermissoes || 0,
      description: 'Sistema de segurança',
      icon: Shield,
      trend: 'stable'
    }
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin" />
        <span className="ml-2">Carregando dashboard...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <p className="text-red-500 mb-2">Erro ao carregar dashboard</p>
          <p className="text-sm text-muted-foreground">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4 sm:space-y-6">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">Dashboard</h1>
          <p className="text-muted-foreground text-sm sm:text-base">
            Visão geral do seu CRM/ERP
          </p>
        </div>

        {/* Cards de estatísticas */}
        <div className="grid gap-3 sm:gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
          {statsConfig.map((stat) => (
            <Card key={stat.title} className="hover:shadow-md transition-shadow">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  {stat.title}
                </CardTitle>
                <stat.icon className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-xl sm:text-2xl font-bold">{stat.value}</div>
                <p className="text-xs text-muted-foreground">
                  {stat.description}
                </p>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="grid gap-3 sm:gap-4 grid-cols-1 lg:grid-cols-7">
          {/* Atividades Recentes */}
          <Card className="lg:col-span-4 hover:shadow-md transition-shadow">
            <CardHeader>
              <CardTitle className="text-lg">Atividades Recentes</CardTitle>
              <CardDescription>
                Últimas atividades no sistema
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {recentActivities && recentActivities.length > 0 ? (
                  recentActivities.map((activity) => (
                    <div key={activity.id} className="flex items-start space-x-3 p-2 rounded-lg hover:bg-gray-50 transition-colors">
                      <div className="w-2 h-2 bg-blue-500 rounded-full mt-2 flex-shrink-0"></div>
                      <div className="space-y-1 min-w-0 flex-1">
                        <p className="text-sm font-medium leading-none">
                          {activity.action}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {activity.user} • {activity.time}
                        </p>
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="text-sm text-muted-foreground text-center py-4">
                    Nenhuma atividade recente encontrada
                  </p>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Status do Sistema */}
          <Card className="lg:col-span-3 hover:shadow-md transition-shadow">
            <CardHeader>
              <CardTitle className="text-lg">Status do Sistema</CardTitle>
              <CardDescription>
                Informações sobre o sistema
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex items-center space-x-3 p-2 rounded-lg">
                  <div className="w-3 h-3 bg-green-500 rounded-full flex-shrink-0"></div>
                  <span className="text-sm font-medium">Sistema Online</span>
                </div>
                <div className="flex items-center space-x-3 p-2 rounded-lg">
                  <div className="w-3 h-3 bg-green-500 rounded-full flex-shrink-0"></div>
                  <span className="text-sm font-medium">Banco de Dados Conectado</span>
                </div>
                <div className="flex items-center space-x-3 p-2 rounded-lg">
                  <div className="w-3 h-3 bg-yellow-500 rounded-full flex-shrink-0"></div>
                  <span className="text-sm font-medium">Última atualização: 5 min atrás</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
    </div>
  );
}
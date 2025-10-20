'use client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Users, Building2, Shield, UserCircle, Loader2, Database, Server } from 'lucide-react';
import { useDashboard } from '@/hooks/useDashboard';
import { useSystemStatus } from '@/hooks/useSystemStatus';

export default function Home() {
  const { stats, recentActivities, loading, error } = useDashboard();
  const { health, version } = useSystemStatus();

  // Configuração dos cards de estatísticas
  const statsConfig = [
    {
      title: 'Total de Clientes',
      value: stats?.totalClientes || 0,
      description: 'Clientes cadastrados no sistema',
      icon: Users,
    },
    {
      title: 'Grupos Hierárquicos',
      value: stats?.totalGruposHierarquicos || 0,
      description: 'Grupos organizacionais',
      icon: Building2,
    },
    {
      title: 'Colaboradores',
      value: stats?.totalColaboradores || 0,
      description: 'Colaboradores ativos',
      icon: UserCircle,
    },
    {
      title: 'Permissões Ativas',
      value: stats?.totalPermissoes || 0,
      description: 'Sistema de segurança',
      icon: Shield,
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
                  <div className={`w-3 h-3 rounded-full flex-shrink-0 ${health?.status === 'healthy' ? 'bg-green-500' : 'bg-red-500'}`}></div>
                  <span className="text-sm font-medium">{health?.status === 'healthy' ? 'Sistema Online' : 'Sistema com problemas'}</span>
                </div>
                <div className="flex items-center space-x-3 p-2 rounded-lg">
                  <Database className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm font-medium">Banco de Dados: {health?.database === 'connected' ? 'Conectado' : 'Desconectado'}</span>
                </div>
                <div className="flex items-center space-x-3 p-2 rounded-lg">
                  <Server className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm font-medium">PM2: {version?.system?.pm2?.active ? 'Ativo' : 'Inativo'}</span>
                </div>
                <div className="flex items-center space-x-3 p-2 rounded-lg">
                  <div className="w-3 h-3 bg-blue-500 rounded-full flex-shrink-0"></div>
                  <span className="text-sm font-medium">Versão {version?.app?.version || 'N/D'}</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
    </div>
  );
}
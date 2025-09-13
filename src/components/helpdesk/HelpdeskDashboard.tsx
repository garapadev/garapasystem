'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  MessageSquare, 
  Building, 
  TrendingUp,
  Clock,
  Settings,
  BarChart3,
  CheckCircle,
  Mail
} from 'lucide-react';
import { TicketManager } from './TicketManager';

interface HelpdeskDashboardProps {
  className?: string;
}

export function HelpdeskDashboard({ className }: HelpdeskDashboardProps) {
  const [lastCheck, setLastCheck] = useState<string>('');

  useEffect(() => {
    setLastCheck(new Date().toLocaleString('pt-BR'));
  }, []);

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Helpdesk</h1>
          <p className="text-muted-foreground">
            Gerencie tickets de suporte e departamentos
          </p>
        </div>
        
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="flex items-center gap-1">
            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
            Sistema Online
          </Badge>
        </div>
      </div>

      {/* Estatísticas rápidas */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Tickets Ativos</CardTitle>
            <MessageSquare className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">-</div>
            <p className="text-xs text-muted-foreground">
              Aguardando carregamento
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Departamentos</CardTitle>
            <Building className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">-</div>
            <p className="text-xs text-muted-foreground">
              Aguardando carregamento
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Tempo Médio</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">-</div>
            <p className="text-xs text-muted-foreground">
              Tempo de resolução
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Taxa de Resolução</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">-</div>
            <p className="text-xs text-muted-foreground">
              Últimos 30 dias
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Conteúdo principal - apenas Tickets */}
      <div className="space-y-4">
        <TicketManager />
      </div>
      
      {/* Seção de Analytics removida - deve estar nas configurações */}
      <div className="hidden">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Gráfico de tickets por status */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BarChart3 className="h-5 w-5" />
                  Tickets por Status
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 bg-yellow-500 rounded-full" />
                      <span className="text-sm">Aberto</span>
                    </div>
                    <span className="text-sm font-medium">-</span>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 bg-blue-500 rounded-full" />
                      <span className="text-sm">Em Andamento</span>
                    </div>
                    <span className="text-sm font-medium">-</span>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 bg-orange-500 rounded-full" />
                      <span className="text-sm">Aguardando</span>
                    </div>
                    <span className="text-sm font-medium">-</span>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 bg-green-500 rounded-full" />
                      <span className="text-sm">Resolvido</span>
                    </div>
                    <span className="text-sm font-medium">-</span>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 bg-gray-500 rounded-full" />
                      <span className="text-sm">Fechado</span>
                    </div>
                    <span className="text-sm font-medium">-</span>
                  </div>
                </div>
                
                <div className="mt-4 pt-4 border-t">
                  <p className="text-xs text-muted-foreground">
                    Dados serão carregados automaticamente quando houver tickets
                  </p>
                </div>
              </CardContent>
            </Card>
            
            {/* Tickets por departamento */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Building className="h-5 w-5" />
                  Tickets por Departamento
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="text-center py-8 text-muted-foreground">
                    <Building className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>Dados serão exibidos quando houver tickets</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            {/* Métricas de performance */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="h-5 w-5" />
                  Métricas de Performance
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Tempo médio de primeira resposta</span>
                    <span className="text-sm font-medium">-</span>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Tempo médio de resolução</span>
                    <span className="text-sm font-medium">-</span>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Taxa de resolução no primeiro contato</span>
                    <span className="text-sm font-medium">-</span>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Satisfação do cliente</span>
                    <span className="text-sm font-medium">-</span>
                  </div>
                </div>
                
                <div className="mt-4 pt-4 border-t">
                  <p className="text-xs text-muted-foreground">
                    Métricas calculadas automaticamente com base nos tickets
                  </p>
                </div>
              </CardContent>
            </Card>
            
            {/* Atividade recente */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Clock className="h-5 w-5" />
                  Atividade Recente
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="text-center py-8 text-muted-foreground">
                    <Clock className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>Nenhuma atividade recente</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      
      {/* Status do sistema */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5" />
            Status do Sistema
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-green-500" />
                <span className="text-sm font-medium">Worker Consolidado</span>
              </div>
              <Badge variant="outline" className="text-green-600">
                Ativo
              </Badge>
            </div>
            
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2">
                <Mail className="h-4 w-4 text-blue-500" />
                <span className="text-sm font-medium">Sincronização Email</span>
              </div>
              <Badge variant="outline" className="text-blue-600">
                Funcionando
              </Badge>
            </div>
            
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2">
                <BarChart3 className="h-4 w-4 text-purple-500" />
                <span className="text-sm font-medium">API</span>
              </div>
              <Badge variant="outline" className="text-purple-600">
                Online
              </Badge>
            </div>
          </div>
          
          <div className="mt-4 pt-4 border-t">
            <p className="text-xs text-muted-foreground">
              Última verificação: {lastCheck || 'Carregando...'}
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
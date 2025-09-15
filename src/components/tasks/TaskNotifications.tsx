'use client';

import React, { useState, useEffect } from 'react';
import { Bell, X, Clock, AlertTriangle, CheckCircle, Info } from 'lucide-react';
import { useTaskNotifications } from '@/hooks/useTaskNotifications';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';

interface TaskNotification {
  id: string;
  tipo: string;
  titulo: string;
  mensagem: string;
  lida: boolean;
  criadoEm: Date;
  taskId?: string;
}

const TaskNotifications: React.FC = () => {
  const {
    notifications,
    unreadCount,
    notificationsEnabled,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    toggleNotifications,
    requestPermission
  } = useTaskNotifications();

  const [isOpen, setIsOpen] = useState(false);
  const [filter, setFilter] = useState<'all' | 'unread'>('all');

  const filteredNotifications = notifications.filter(notification => 
    filter === 'all' || !notification.lida
  );

  const getNotificationIcon = (tipo: string) => {
    switch (tipo) {
      case 'VENCIMENTO_PROXIMO':
        return <Clock className="h-4 w-4 text-yellow-500" />;
      case 'TAREFA_ATRASADA':
        return <AlertTriangle className="h-4 w-4 text-red-500" />;
      case 'TAREFA_ATRIBUIDA':
        return <Info className="h-4 w-4 text-blue-500" />;
      case 'STATUS_ALTERADO':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      default:
        return <Bell className="h-4 w-4 text-gray-500" />;
    }
  };

  const getNotificationColor = (tipo: string) => {
    switch (tipo) {
      case 'VENCIMENTO_PROXIMO':
        return 'bg-yellow-50 border-yellow-200';
      case 'TAREFA_ATRASADA':
        return 'bg-red-50 border-red-200';
      case 'TAREFA_ATRIBUIDA':
        return 'bg-blue-50 border-blue-200';
      case 'STATUS_ALTERADO':
        return 'bg-green-50 border-green-200';
      default:
        return 'bg-gray-50 border-gray-200';
    }
  };

  const formatDate = (date: Date) => {
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (minutes < 1) return 'Agora';
    if (minutes < 60) return `${minutes}m atrás`;
    if (hours < 24) return `${hours}h atrás`;
    if (days < 7) return `${days}d atrás`;
    return date.toLocaleDateString();
  };

  const handleNotificationClick = (notification: TaskNotification) => {
    if (!notification.lida) {
      markAsRead(notification.id);
    }
    // Navegar para a tarefa se tiver taskId
    if (notification.taskId) {
      window.location.href = `/tasks?id=${notification.taskId}`;
    }
  };

  return (
    <div className="relative">
      {/* Botão de notificações */}
      <Button
        variant="ghost"
        size="sm"
        className="relative"
        onClick={() => setIsOpen(!isOpen)}
      >
        <Bell className="h-5 w-5" />
        {unreadCount > 0 && (
          <Badge 
            variant="destructive" 
            className="absolute -top-2 -right-2 h-5 w-5 rounded-full p-0 flex items-center justify-center text-xs"
          >
            {unreadCount > 99 ? '99+' : unreadCount}
          </Badge>
        )}
      </Button>

      {/* Painel de notificações */}
      {isOpen && (
        <Card className="absolute right-0 top-full mt-2 w-96 max-h-96 shadow-lg z-50">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg">Notificações</CardTitle>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsOpen(false)}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
            
            {/* Configurações */}
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Switch
                  id="notifications-enabled"
                  checked={notificationsEnabled}
                  onCheckedChange={toggleNotifications}
                />
                <Label htmlFor="notifications-enabled" className="text-sm">
                  Ativar notificações
                </Label>
              </div>
              
              {!notificationsEnabled && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={requestPermission}
                >
                  Permitir
                </Button>
              )}
            </div>

            {/* Filtros */}
            <div className="flex space-x-2">
              <Button
                variant={filter === 'all' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setFilter('all')}
              >
                Todas ({notifications.length})
              </Button>
              <Button
                variant={filter === 'unread' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setFilter('unread')}
              >
                Não lidas ({unreadCount})
              </Button>
              {unreadCount > 0 && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={markAllAsRead}
                >
                  Marcar todas como lidas
                </Button>
              )}
            </div>
          </CardHeader>

          <Separator />

          <CardContent className="p-0">
            <ScrollArea className="h-64">
              {filteredNotifications.length === 0 ? (
                <div className="p-4 text-center text-gray-500">
                  {filter === 'unread' ? 'Nenhuma notificação não lida' : 'Nenhuma notificação'}
                </div>
              ) : (
                <div className="space-y-1">
                  {filteredNotifications.map((notification) => (
                    <div
                      key={notification.id}
                      className={`p-3 cursor-pointer hover:bg-gray-50 border-l-4 ${
                        notification.lida ? 'opacity-60' : ''
                      } ${getNotificationColor(notification.tipo)}`}
                      onClick={() => handleNotificationClick(notification)}
                    >
                      <div className="flex items-start space-x-3">
                        <div className="flex-shrink-0 mt-1">
                          {getNotificationIcon(notification.tipo)}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between">
                            <p className={`text-sm font-medium ${
                              notification.lida ? 'text-gray-600' : 'text-gray-900'
                            }`}>
                              {notification.titulo}
                            </p>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-6 w-6 p-0"
                              onClick={(e) => {
                                e.stopPropagation();
                                deleteNotification(notification.id);
                              }}
                            >
                              <X className="h-3 w-3" />
                            </Button>
                          </div>
                          <p className={`text-sm ${
                            notification.lida ? 'text-gray-500' : 'text-gray-700'
                          }`}>
                            {notification.mensagem}
                          </p>
                          <p className="text-xs text-gray-400 mt-1">
                            {formatDate(notification.criadoEm)}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </ScrollArea>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default TaskNotifications;
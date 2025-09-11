'use client';

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { X, Plus, Mail, User } from 'lucide-react';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import { TicketNotificationService } from '@/lib/helpdesk/notification-service';

interface Observer {
  id: string;
  email: string;
  name?: string;
  type: 'manual' | 'colaborador';
}

interface Colaborador {
  id: string;
  nome: string;
  email: string;
  cargo?: string;
}

interface ObserversModuleProps {
  observers: Observer[];
  onChange: (observers: Observer[]) => void;
  colaboradores: Colaborador[];
  className?: string;
  disabled?: boolean;
  ticketId?: string;
}

export function ObserversModule({
  observers,
  onChange,
  colaboradores,
  className,
  disabled = false,
  ticketId
}: ObserversModuleProps) {
  const [manualEmail, setManualEmail] = useState('');
  const [selectedColaborador, setSelectedColaborador] = useState('');
  const [emailError, setEmailError] = useState('');

  // Validar email
  const isValidEmail = (email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  // Adicionar email manual
  const addManualEmail = async () => {
    if (!manualEmail.trim()) {
      setEmailError('Email é obrigatório');
      return;
    }

    if (!isValidEmail(manualEmail)) {
      setEmailError('Email inválido');
      return;
    }

    // Verificar se email já existe
    const emailExists = observers.some(obs => obs.email.toLowerCase() === manualEmail.toLowerCase());
    if (emailExists) {
      setEmailError('Este email já está na lista de observadores');
      return;
    }

    const newObserver: Observer = {
      id: `manual_${Date.now()}`,
      email: manualEmail.trim(),
      type: 'manual'
    };

    onChange([...observers, newObserver]);
    
    // Enviar notificação de boas-vindas para o novo observador
    if (ticketId) {
      try {
        await TicketNotificationService.notifyObservers(
          ticketId,
          [newObserver],
          {
            ticketId,
            type: 'observer_added',
            authorName: 'Usuário Atual', // Em produção, pegar do contexto de autenticação
            authorEmail: 'usuario@exemplo.com' // Em produção, pegar do contexto de autenticação
          }
        );
      } catch (error) {
        console.error('Erro ao enviar notificação de boas-vindas:', error);
        // Não interromper o fluxo por erro de notificação
      }
    }
    
    setManualEmail('');
    setEmailError('');
    toast.success('Observador adicionado com sucesso!');
  };

  // Adicionar colaborador
  const addColaborador = async () => {
    if (!selectedColaborador) return;

    const colaborador = colaboradores.find(c => c.id === selectedColaborador);
    if (!colaborador) return;

    // Verificar se colaborador já está na lista
    const colaboradorExists = observers.some(obs => obs.email.toLowerCase() === colaborador.email.toLowerCase());
    if (colaboradorExists) {
      return;
    }

    const newObserver: Observer = {
      id: `colaborador_${colaborador.id}`,
      email: colaborador.email,
      name: colaborador.nome,
      type: 'colaborador'
    };

    onChange([...observers, newObserver]);
    
    // Enviar notificação de boas-vindas para o novo observador
    if (ticketId) {
      try {
        await TicketNotificationService.notifyObservers(
          ticketId,
          [newObserver],
          {
            ticketId,
            type: 'observer_added',
            authorName: 'Usuário Atual', // Em produção, pegar do contexto de autenticação
            authorEmail: 'usuario@exemplo.com' // Em produção, pegar do contexto de autenticação
          }
        );
      } catch (error) {
        console.error('Erro ao enviar notificação de boas-vindas:', error);
        // Não interromper o fluxo por erro de notificação
      }
    }
    
    setSelectedColaborador('');
    toast.success(`${colaborador.nome} adicionado como observador!`);
  };

  // Remover observador
  const removeObserver = (observerId: string) => {
    onChange(observers.filter(obs => obs.id !== observerId));
  };

  // Colaboradores disponíveis (não incluídos ainda)
  const availableColaboradores = colaboradores.filter(
    colaborador => !observers.some(obs => obs.email.toLowerCase() === colaborador.email.toLowerCase())
  );

  return (
    <Card className={cn('w-full', className)}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <User className="h-5 w-5" />
          Observadores
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Lista de observadores atuais */}
        {observers.length > 0 && (
          <div className="space-y-2">
            <Label className="text-sm font-medium">Observadores atuais:</Label>
            <div className="flex flex-wrap gap-2">
              {observers.map((observer) => (
                <Badge
                  key={observer.id}
                  variant="secondary"
                  className="flex items-center gap-2 px-3 py-1"
                >
                  {observer.type === 'manual' ? (
                    <Mail className="h-3 w-3" />
                  ) : (
                    <User className="h-3 w-3" />
                  )}
                  <span className="text-xs">
                    {observer.name ? `${observer.name} (${observer.email})` : observer.email}
                  </span>
                  {!disabled && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => removeObserver(observer.id)}
                      className="h-4 w-4 p-0 hover:bg-destructive hover:text-destructive-foreground"
                    >
                      <X className="h-3 w-3" />
                    </Button>
                  )}
                </Badge>
              ))}
            </div>
          </div>
        )}

        {!disabled && (
          <>
            {/* Adicionar email manual */}
            <div className="space-y-2">
              <Label htmlFor="manual-email" className="text-sm font-medium">
                Adicionar email manualmente:
              </Label>
              <div className="flex gap-2">
                <div className="flex-1">
                  <Input
                    id="manual-email"
                    type="email"
                    placeholder="email@exemplo.com"
                    value={manualEmail}
                    onChange={(e) => {
                      setManualEmail(e.target.value);
                      setEmailError('');
                    }}
                    onKeyPress={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        addManualEmail();
                      }
                    }}
                    className={cn(emailError && 'border-destructive')}
                  />
                  {emailError && (
                    <p className="text-xs text-destructive mt-1">{emailError}</p>
                  )}
                </div>
                <Button
                  onClick={addManualEmail}
                  disabled={!manualEmail.trim()}
                  size="sm"
                >
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
            </div>

            {/* Adicionar colaborador */}
            {availableColaboradores.length > 0 && (
              <div className="space-y-2">
                <Label htmlFor="colaborador-select" className="text-sm font-medium">
                  Adicionar colaborador:
                </Label>
                <div className="flex gap-2">
                  <Select
                    value={selectedColaborador}
                    onValueChange={setSelectedColaborador}
                  >
                    <SelectTrigger className="flex-1">
                      <SelectValue placeholder="Selecione um colaborador" />
                    </SelectTrigger>
                    <SelectContent>
                      {availableColaboradores.map((colaborador) => (
                        <SelectItem key={colaborador.id} value={colaborador.id}>
                          <div className="flex flex-col">
                            <span className="font-medium">{colaborador.nome}</span>
                            <span className="text-xs text-muted-foreground">{colaborador.email}</span>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Button
                    onClick={addColaborador}
                    disabled={!selectedColaborador}
                    size="sm"
                  >
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            )}
          </>
        )}

        {/* Informação sobre notificações */}
        <div className="text-xs text-muted-foreground p-3 bg-muted rounded-lg">
          <p className="font-medium mb-1">ℹ️ Sobre as notificações:</p>
          <p>Todos os observadores receberão notificações por email quando houver atualizações neste chamado, incluindo:</p>
          <ul className="list-disc list-inside mt-1 space-y-1">
            <li>Novas respostas</li>
            <li>Mudanças de status</li>
            <li>Alterações de prioridade</li>
            <li>Atribuição de responsável</li>
          </ul>
        </div>
      </CardContent>
    </Card>
  );
}

export default ObserversModule;
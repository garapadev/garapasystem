'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Trash2, MessageCircle, Plus, RefreshCw } from 'lucide-react';
import { toast } from 'sonner';

interface GazapiSession {
  id: string;
  sessionKey: string;
  phoneNumber?: string;
  status: 'disconnected' | 'connecting' | 'qr_required' | 'connected' | 'inChat';
  lastActivity?: Date;
  createdAt: Date;
}

export default function GazapiPage() {
  const router = useRouter();
  const [sessions, setSessions] = useState<GazapiSession[]>([]);
  const [loading, setLoading] = useState(false);
  const [newSessionName, setNewSessionName] = useState('');
  const [adminToken, setAdminToken] = useState('');

  useEffect(() => {
    loadSessions();
  }, []);

  const loadSessions = async () => {
    try {
      setLoading(true);
      // Simular carregamento de sessões
      const mockSessions: GazapiSession[] = [
        {
          id: 'session_1',
          sessionKey: 'key_1',
          phoneNumber: '+5511999999999',
          status: 'connected',
          lastActivity: new Date(),
          createdAt: new Date()
        }
      ];
      setSessions(mockSessions);
    } catch (error) {
      toast.error('Erro ao carregar sessões');
    } finally {
      setLoading(false);
    }
  };

  const createSession = async () => {
    if (!newSessionName.trim() || !adminToken.trim()) {
      toast.error('Preencha o nome da sessão e o token administrativo');
      return;
    }

    try {
      setLoading(true);
      
      const response = await fetch('/api/gazapi/start', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          session: newSessionName,
          sessionKey: `key_${Date.now()}`,
          token: adminToken,
          webhookUrl: window.location.origin + '/api/gazapi/webhook'
        }),
      });

      const result = await response.json();

      if (result.success) {
        toast.success('Sessão criada com sucesso');
        setNewSessionName('');
        loadSessions();
        
        // Redirecionar para a interface da sessão
        router.push(`/gazapi/${newSessionName}/interface`);
      } else {
        toast.error(result.message || 'Erro ao criar sessão');
      }
    } catch (error) {
      toast.error('Erro ao criar sessão');
    } finally {
      setLoading(false);
    }
  };

  const deleteSession = async (sessionId: string) => {
    if (!adminToken.trim()) {
      toast.error('Token administrativo necessário');
      return;
    }

    try {
      setLoading(true);
      
      const response = await fetch('/api/gazapi/close', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          session: sessionId,
          sessionKey: 'temp_key',
          token: adminToken
        }),
      });

      const result = await response.json();

      if (result.success) {
        toast.success('Sessão removida com sucesso');
        loadSessions();
      } else {
        toast.error(result.message || 'Erro ao remover sessão');
      }
    } catch (error) {
      toast.error('Erro ao remover sessão');
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'connected':
        return 'bg-green-500';
      case 'connecting':
        return 'bg-yellow-500';
      case 'qr_required':
        return 'bg-blue-500';
      case 'disconnected':
        return 'bg-red-500';
      default:
        return 'bg-gray-500';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'connected':
        return 'Conectado';
      case 'connecting':
        return 'Conectando';
      case 'qr_required':
        return 'QR Necessário';
      case 'disconnected':
        return 'Desconectado';
      default:
        return 'Desconhecido';
    }
  };

  return (
    <div className="container mx-auto p-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold">Gazapi - Gerenciador de Sessões</h1>
          <p className="text-muted-foreground">
            Gerencie suas sessões WhatsApp com a API Gazapi
          </p>
        </div>
        <Button onClick={loadSessions} disabled={loading}>
          <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
          Atualizar
        </Button>
      </div>

      {/* Formulário para criar nova sessão */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Nova Sessão</CardTitle>
          <CardDescription>
            Crie uma nova sessão WhatsApp
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex gap-4">
            <Input
              placeholder="Nome da sessão"
              value={newSessionName}
              onChange={(e) => setNewSessionName(e.target.value)}
              className="flex-1"
            />
            <Input
              placeholder="Token administrativo"
              type="password"
              value={adminToken}
              onChange={(e) => setAdminToken(e.target.value)}
              className="flex-1"
            />
            <Button onClick={createSession} disabled={loading}>
              <Plus className="w-4 h-4 mr-2" />
              Criar
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Lista de sessões */}
      <div className="grid gap-4">
        {sessions.length === 0 ? (
          <Card>
            <CardContent className="p-6 text-center">
              <p className="text-muted-foreground">
                Nenhuma sessão encontrada. Crie uma nova sessão para começar.
              </p>
            </CardContent>
          </Card>
        ) : (
          sessions.map((session) => (
            <Card key={session.id}>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div>
                      <h3 className="font-semibold">{session.id}</h3>
                      <p className="text-sm text-muted-foreground">
                        {session.phoneNumber || 'Número não conectado'}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        Criado em: {session.createdAt.toLocaleString()}
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-4">
                    <Badge className={getStatusColor(session.status)}>
                      {getStatusText(session.status)}
                    </Badge>
                    
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => router.push(`/gazapi/${session.id}/interface`)}
                      >
                        <MessageCircle className="w-4 h-4 mr-2" />
                        Abrir Chat
                      </Button>
                      
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => deleteSession(session.id)}
                        disabled={loading}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}
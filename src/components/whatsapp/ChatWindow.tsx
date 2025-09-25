'use client';

import { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Send, Paperclip, Smile, Phone, Video, MoreVertical, Loader2 } from 'lucide-react';
import { useConfiguracoes } from '@/hooks/useConfiguracoes';

interface Contact {
  jid: string;
  pushName: string;
  fullName: string;
  firstName: string;
  businessName: string;
  found: boolean;
}

interface Message {
  id: string;
  body: string;
  timestamp: string;
  fromMe: boolean;
  type: string;
}

interface ChatWindowProps {
  userId: string;
  selectedContact: Contact | null;
}

export function ChatWindow({ userId, selectedContact }: ChatWindowProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [apiConfig, setApiConfig] = useState<{ apiUrl: string; adminToken: string } | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { getConfiguracao } = useConfiguracoes();

  useEffect(() => {
    const loadApiConfig = async () => {
      try {
        const apiUrl = await getConfiguracao('whatsapp_api_url');
        const adminToken = await getConfiguracao('whatsapp_admin_token');
        
        if (apiUrl && adminToken) {
          // Normalizar URL removendo barra final se existir
          const normalizedApiUrl = apiUrl.endsWith('/') ? apiUrl.slice(0, -1) : apiUrl;
          setApiConfig({ apiUrl: normalizedApiUrl, adminToken });
        } else {
          setError('Configurações da API WhatsApp não encontradas');
        }
      } catch (err) {
        console.error('Erro ao carregar configurações:', err);
        setError('Erro ao carregar configurações da API WhatsApp');
      }
    };

    loadApiConfig();
  }, [getConfiguracao]);

  useEffect(() => {
    if (selectedContact && apiConfig) {
      fetchMessages();
    }
  }, [selectedContact, apiConfig]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const fetchMessages = async () => {
    if (!selectedContact) return;

    setIsLoading(true);
    try {
      // Por enquanto, vamos simular mensagens já que a API wuzapi não tem endpoint específico para histórico
      // Em uma implementação real, você precisaria de um endpoint para buscar mensagens
      setMessages([]);
    } catch (err) {
      console.error('Erro ao buscar mensagens:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const sendMessage = async () => {
    if (!newMessage.trim() || !selectedContact || isSending || !apiConfig) return;

    setIsSending(true);
    const messageText = newMessage.trim();
    setNewMessage('');

    try {
      const response = await fetch(`/api/wuzapi/chat/send/text`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          Phone: selectedContact.jid.split('@')[0],
          Body: messageText
        })
      });

      if (!response.ok) {
        throw new Error('Falha ao enviar mensagem');
      }

      const data = await response.json();
      console.log('Mensagem enviada:', data);

      if (data.success) {
        // Adicionar mensagem à lista local
        const newMsg: Message = {
          id: data.data.Id || Date.now().toString(),
          body: messageText,
          timestamp: data.data.Timestamp || new Date().toISOString(),
          fromMe: true,
          type: 'text'
        };

        setMessages(prev => [...prev, newMsg]);
      }

    } catch (err) {
      console.error('Erro ao enviar mensagem:', err);
      // Restaurar mensagem no input em caso de erro
      setNewMessage(messageText);
    } finally {
      setIsSending(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const getContactDisplayName = (contact: Contact) => {
    return contact.pushName || contact.fullName || contact.firstName || contact.businessName || contact.jid.split('@')[0];
  };

  const getContactInitials = (contact: Contact) => {
    const name = getContactDisplayName(contact);
    const words = name.split(' ');
    if (words.length >= 2) {
      return (words[0][0] + words[1][0]).toUpperCase();
    }
    return name.substring(0, 2).toUpperCase();
  };

  const formatTime = (timestamp: string) => {
    return new Date(timestamp).toLocaleTimeString('pt-BR', {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (!selectedContact) {
    return (
      <Card className="h-full">
        <CardContent className="flex items-center justify-center h-full">
          <div className="text-center">
            <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Send className="h-12 w-12 text-gray-400" />
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              Selecione um contato
            </h3>
            <p className="text-gray-500">
              Escolha um contato da lista para iniciar uma conversa
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="h-full flex flex-col">
      {/* Header do Chat */}
      <CardHeader className="border-b">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <Avatar className="h-10 w-10">
              <AvatarImage src="" alt={getContactDisplayName(selectedContact)} />
              <AvatarFallback className="bg-blue-100 text-blue-600">
                {getContactInitials(selectedContact)}
              </AvatarFallback>
            </Avatar>
            <div>
              <CardTitle className="text-lg">
                {getContactDisplayName(selectedContact)}
              </CardTitle>
              <p className="text-sm text-gray-500">
                {selectedContact.jid.split('@')[0]}
              </p>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <Button variant="ghost" size="sm">
              <Phone className="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="sm">
              <Video className="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="sm">
              <MoreVertical className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardHeader>

      {/* Área de Mensagens */}
      <CardContent className="flex-1 p-0 overflow-hidden">
        <div className="h-full flex flex-col">
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {isLoading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
              </div>
            ) : messages.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-gray-500">
                  Nenhuma mensagem ainda. Inicie a conversa!
                </p>
              </div>
            ) : (
              messages.map((message) => (
                <div
                  key={message.id}
                  className={`flex ${message.fromMe ? 'justify-end' : 'justify-start'}`}
                >
                  <div
                    className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
                      message.fromMe
                        ? 'bg-blue-500 text-white'
                        : 'bg-gray-100 text-gray-900'
                    }`}
                  >
                    <p className="text-sm">{message.body}</p>
                    <p
                      className={`text-xs mt-1 ${
                        message.fromMe ? 'text-blue-100' : 'text-gray-500'
                      }`}
                    >
                      {formatTime(message.timestamp)}
                    </p>
                  </div>
                </div>
              ))
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input de Mensagem */}
          <div className="border-t p-4">
            <div className="flex items-center space-x-2">
              <Button variant="ghost" size="sm">
                <Paperclip className="h-4 w-4" />
              </Button>
              <div className="flex-1 relative">
                <Input
                  placeholder="Digite uma mensagem..."
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  onKeyPress={handleKeyPress}
                  disabled={isSending}
                  className="pr-10"
                />
                <Button
                  variant="ghost"
                  size="sm"
                  className="absolute right-1 top-1/2 transform -translate-y-1/2"
                >
                  <Smile className="h-4 w-4" />
                </Button>
              </div>
              <Button
                onClick={sendMessage}
                disabled={!newMessage.trim() || isSending}
                size="sm"
              >
                {isSending ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Send className="h-4 w-4" />
                )}
              </Button>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
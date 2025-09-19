'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { 
  Send, 
  Image, 
  ArrowLeft, 
  QrCode, 
  Phone, 
  Users,
  MoreVertical,
  Search
} from 'lucide-react';
import { toast } from 'sonner';

interface Contact {
  id: string;
  name: string;
  phone: string;
  avatar?: string;
  isGroup: boolean;
  lastMessage?: string;
  lastMessageTime?: Date;
  unreadCount: number;
}

interface Message {
  id: string;
  chatId: string;
  fromMe: boolean;
  content?: string;
  mediaUrl?: string;
  messageType: 'text' | 'image' | 'audio' | 'video' | 'document';
  timestamp: Date;
  status: 'sent' | 'delivered' | 'read';
}

interface SessionStatus {
  session: string;
  status: 'disconnected' | 'connecting' | 'qr_required' | 'connected' | 'inChat';
  qrCode?: string;
  phoneNumber?: string;
  lastActivity?: Date;
}

export default function GazapiInterfacePage() {
  const params = useParams();
  const router = useRouter();
  const sessionId = params.id as string;
  
  const [sessionStatus, setSessionStatus] = useState<SessionStatus | null>(null);
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [messages, setMessages] = useState<Message[]>([]);
  const [selectedContact, setSelectedContact] = useState<Contact | null>(null);
  const [messageText, setMessageText] = useState('');
  const [adminToken, setAdminToken] = useState('');
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (sessionId) {
      loadSessionStatus();
      loadContacts();
    }
  }, [sessionId]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const loadSessionStatus = async () => {
    if (!adminToken) return;
    
    try {
      const response = await fetch('/api/gazapi/getSessionStatus', {
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
      if (result.success && result.data) {
        setSessionStatus(result.data);
      }
    } catch (error) {
      console.error('Erro ao carregar status da sessão:', error);
    }
  };

  const loadContacts = async () => {
    // Simular carregamento de contatos
    const mockContacts: Contact[] = [
      {
        id: '5511999999999@c.us',
        name: 'João Silva',
        phone: '+55 11 99999-9999',
        isGroup: false,
        lastMessage: 'Olá, como você está?',
        lastMessageTime: new Date(),
        unreadCount: 2
      },
      {
        id: '5511888888888@c.us',
        name: 'Maria Santos',
        phone: '+55 11 88888-8888',
        isGroup: false,
        lastMessage: 'Obrigada pela ajuda!',
        lastMessageTime: new Date(Date.now() - 3600000),
        unreadCount: 0
      },
      {
        id: '120363043211234567@g.us',
        name: 'Grupo de Trabalho',
        phone: '',
        isGroup: true,
        lastMessage: 'Reunião às 14h',
        lastMessageTime: new Date(Date.now() - 7200000),
        unreadCount: 5
      }
    ];
    setContacts(mockContacts);
  };

  const loadMessages = async (contactId: string) => {
    // Simular carregamento de mensagens
    const mockMessages: Message[] = [
      {
        id: '1',
        chatId: contactId,
        fromMe: false,
        content: 'Olá! Como você está?',
        messageType: 'text',
        timestamp: new Date(Date.now() - 3600000),
        status: 'read'
      },
      {
        id: '2',
        chatId: contactId,
        fromMe: true,
        content: 'Oi! Estou bem, obrigado. E você?',
        messageType: 'text',
        timestamp: new Date(Date.now() - 3000000),
        status: 'read'
      },
      {
        id: '3',
        chatId: contactId,
        fromMe: false,
        content: 'Também estou bem! Preciso falar com você sobre o projeto.',
        messageType: 'text',
        timestamp: new Date(Date.now() - 1800000),
        status: 'read'
      }
    ];
    setMessages(mockMessages);
  };

  const sendMessage = async () => {
    if (!messageText.trim() || !selectedContact || !adminToken) {
      toast.error('Preencha a mensagem e o token administrativo');
      return;
    }

    try {
      setLoading(true);
      
      const response = await fetch('/api/gazapi/sendText', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          session: sessionId,
          sessionKey: 'temp_key',
          token: adminToken,
          chatId: selectedContact.id,
          message: messageText
        }),
      });

      const result = await response.json();

      if (result.success) {
        // Adicionar mensagem à lista local
        const newMessage: Message = {
          id: result.data.messageId,
          chatId: selectedContact.id,
          fromMe: true,
          content: messageText,
          messageType: 'text',
          timestamp: new Date(),
          status: 'sent'
        };
        
        setMessages(prev => [...prev, newMessage]);
        setMessageText('');
        toast.success('Mensagem enviada');
      } else {
        toast.error(result.message || 'Erro ao enviar mensagem');
      }
    } catch (error) {
      toast.error('Erro ao enviar mensagem');
    } finally {
      setLoading(false);
    }
  };

  const getQrCode = async () => {
    if (!adminToken) {
      toast.error('Token administrativo necessário');
      return;
    }

    try {
      const response = await fetch('/api/gazapi/getQrCode', {
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
      if (result.success && result.data?.qrCode) {
        // Mostrar QR Code em modal ou nova janela
        window.open(result.data.qrCode, '_blank');
      } else {
        toast.error(result.message || 'QR Code não disponível');
      }
    } catch (error) {
      toast.error('Erro ao obter QR Code');
    }
  };

  const filteredContacts = contacts.filter(contact =>
    contact.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    contact.phone.includes(searchTerm)
  );

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
    <div className="flex h-screen bg-background">
      {/* Sidebar - Lista de Contatos */}
      <div className="w-80 border-r flex flex-col">
        {/* Header */}
        <div className="p-4 border-b">
          <div className="flex items-center gap-2 mb-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => router.push('/gazapi')}
            >
              <ArrowLeft className="w-4 h-4" />
            </Button>
            <div className="flex-1">
              <h2 className="font-semibold">Gazapi - {sessionId}</h2>
              {sessionStatus && (
                <Badge className={`text-xs ${getStatusColor(sessionStatus.status)}`}>
                  {getStatusText(sessionStatus.status)}
                </Badge>
              )}
            </div>
          </div>

          {/* Token Input */}
          <Input
            placeholder="Token administrativo"
            type="password"
            value={adminToken}
            onChange={(e) => setAdminToken(e.target.value)}
            className="mb-2"
          />

          {/* Actions */}
          <div className="flex gap-2">
            <Button size="sm" variant="outline" onClick={getQrCode}>
              <QrCode className="w-4 h-4" />
            </Button>
            <Button size="sm" variant="outline" onClick={loadSessionStatus}>
              <Phone className="w-4 h-4" />
            </Button>
          </div>
        </div>

        {/* Search */}
        <div className="p-4 border-b">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Buscar contatos..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>

        {/* Contacts List */}
        <ScrollArea className="flex-1">
          <div className="p-2">
            {filteredContacts.map((contact) => (
              <div
                key={contact.id}
                className={`p-3 rounded-lg cursor-pointer hover:bg-accent transition-colors ${
                  selectedContact?.id === contact.id ? 'bg-accent' : ''
                }`}
                onClick={() => {
                  setSelectedContact(contact);
                  loadMessages(contact.id);
                }}
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                    {contact.isGroup ? (
                      <Users className="w-5 h-5" />
                    ) : (
                      <span className="font-semibold">
                        {contact.name.charAt(0).toUpperCase()}
                      </span>
                    )}
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <h3 className="font-medium truncate">{contact.name}</h3>
                      {contact.unreadCount > 0 && (
                        <Badge variant="destructive" className="text-xs">
                          {contact.unreadCount}
                        </Badge>
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground truncate">
                      {contact.lastMessage}
                    </p>
                    {contact.lastMessageTime && (
                      <p className="text-xs text-muted-foreground">
                        {contact.lastMessageTime.toLocaleTimeString()}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </ScrollArea>
      </div>

      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col">
        {selectedContact ? (
          <>
            {/* Chat Header */}
            <div className="p-4 border-b flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                  {selectedContact.isGroup ? (
                    <Users className="w-5 h-5" />
                  ) : (
                    <span className="font-semibold">
                      {selectedContact.name.charAt(0).toUpperCase()}
                    </span>
                  )}
                </div>
                <div>
                  <h3 className="font-semibold">{selectedContact.name}</h3>
                  <p className="text-sm text-muted-foreground">
                    {selectedContact.phone}
                  </p>
                </div>
              </div>
              
              <Button variant="ghost" size="sm">
                <MoreVertical className="w-4 h-4" />
              </Button>
            </div>

            {/* Messages */}
            <ScrollArea className="flex-1 p-4">
              <div className="space-y-4">
                {messages.map((message) => (
                  <div
                    key={message.id}
                    className={`flex ${message.fromMe ? 'justify-end' : 'justify-start'}`}
                  >
                    <div
                      className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
                        message.fromMe
                          ? 'bg-primary text-primary-foreground'
                          : 'bg-muted'
                      }`}
                    >
                      <p className="text-sm">{message.content}</p>
                      <p className="text-xs opacity-70 mt-1">
                        {message.timestamp.toLocaleTimeString()}
                      </p>
                    </div>
                  </div>
                ))}
                <div ref={messagesEndRef} />
              </div>
            </ScrollArea>

            {/* Message Input */}
            <div className="p-4 border-t">
              <div className="flex gap-2">
                <Button variant="outline" size="sm">
                  <Image className="w-4 h-4" />
                </Button>
                <Input
                  placeholder="Digite sua mensagem..."
                  value={messageText}
                  onChange={(e) => setMessageText(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
                  className="flex-1"
                />
                <Button onClick={sendMessage} disabled={loading}>
                  <Send className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center">
              <h3 className="text-lg font-semibold mb-2">
                Selecione um contato
              </h3>
              <p className="text-muted-foreground">
                Escolha um contato da lista para iniciar uma conversa
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
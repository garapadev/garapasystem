'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  MessageSquare,
  Search,
  Phone,
  Video,
  MoreVertical,
  Send,
  Paperclip,
  Smile,
  Mic,
  ArrowLeft,
  Wifi,
  WifiOff,
  Settings,
  Loader2
} from 'lucide-react';

interface Conversation {
  id: string;
  contactName: string;
  contactPhone: string;
  contactId?: string;
  lastMessage?: string;
  lastMessageAt?: Date;
  unreadCount: number;
  status: string;
  isGroup: boolean;
}

interface Message {
  id: string;
  conversationId: string;
  messageId: string;
  content: string;
  messageType: string;
  isFromMe: boolean;
  timestamp: Date;
  status: 'sent' | 'delivered' | 'read' | 'received';
  mediaUrl?: string;
  mediaType?: string;
  createdAt: Date;
}

interface ChatInterfaceProps {
  conversations: Conversation[];
  messages: Message[];
  onDisconnect: () => void;
  onSendMessage: (conversationId: string, content: string, messageType?: string) => Promise<void>;
  onLoadMessages: (conversationId: string) => void;
  session: any;
  sessionStatus?: {
    status: string;
    message?: string;
  };
}

export function ChatInterface({ 
  conversations, 
  messages, 
  onDisconnect, 
  onSendMessage, 
  onLoadMessages,
  session,
  sessionStatus
}: ChatInterfaceProps) {
  const router = useRouter();
  const messagesEndRef = useRef<HTMLDivElement>(null);
  
  // Estados da interface
  const [selectedConversation, setSelectedConversation] = useState<string | null>(null);
  const [messageText, setMessageText] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [sendingMessage, setSendingMessage] = useState(false);
  
  // Filtrar conversas por termo de pesquisa
  const filteredConversations = conversations.filter(conversation => 
    conversation.contactName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    conversation.contactPhone.includes(searchTerm)
  );

  // Carregar mensagens quando conversa selecionada
  useEffect(() => {
    if (selectedConversation) {
      onLoadMessages(selectedConversation);
    }
  }, [selectedConversation, onLoadMessages]);
  
  // Auto scroll para última mensagem
  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const sendMessage = async () => {
    if (!messageText.trim() || !selectedConversation || sendingMessage) return;

    setSendingMessage(true);
    
    try {
      await onSendMessage(selectedConversation, messageText, 'text');
      setMessageText('');
    } catch (error) {
      console.error('Erro ao enviar mensagem:', error);
    } finally {
      setSendingMessage(false);
    }
  };

  const formatTime = (timestamp: Date) => {
    return new Date(timestamp).toLocaleTimeString('pt-BR', {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getInitials = (name: string) => {
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  };

  return (
    <div className="h-[calc(100vh-8rem)] bg-white flex rounded-lg shadow-sm overflow-hidden">
      {/* Sidebar de Conversas */}
      <div className="w-80 border-r bg-white flex flex-col">
        {/* Header da Sidebar */}
        <div className="p-3 border-b bg-gray-50">
          <div className="flex items-center justify-between mb-3">
            <Button variant="ghost" size="sm" onClick={() => router.push('/whatsapp')}>
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <div className="flex items-center gap-2">
              {sessionStatus?.status === 'connected' ? (
                <>
                  <Wifi className="h-4 w-4 text-green-500" />
                  <span className="text-xs text-green-600">Conectado</span>
                </>
              ) : (
                <>
                  <WifiOff className="h-4 w-4 text-yellow-500" />
                  <span className="text-xs text-yellow-600">Reconectando...</span>
                </>
              )}
            </div>
            <Button variant="ghost" size="sm" onClick={onDisconnect}>
              <Settings className="h-4 w-4" />
            </Button>
          </div>
          
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Buscar conversas..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 h-8"
            />
          </div>
        </div>

        {/* Lista de Conversas */}
        <ScrollArea className="flex-1">
          <div className="p-2">
            {filteredConversations.length === 0 ? (
              <div className="text-center py-8">
                <MessageSquare className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                <p className="text-sm text-gray-500">Nenhuma conversa encontrada</p>
              </div>
            ) : (
              filteredConversations.map((conversation) => (
                <div
                  key={conversation.id}
                  onClick={() => setSelectedConversation(conversation.id)}
                  className={`p-3 rounded-lg cursor-pointer transition-colors ${
                    selectedConversation === conversation.id
                      ? 'bg-green-50 border border-green-200'
                      : 'hover:bg-gray-50'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <Avatar className="h-10 w-10">
                      <AvatarFallback className="bg-green-100 text-green-700 text-xs">
                        {getInitials(conversation.contactName)}
                      </AvatarFallback>
                    </Avatar>
                    
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <h4 className="font-medium text-sm truncate">{conversation.contactName}</h4>
                        <span className="text-xs text-gray-500">
                          {conversation.lastMessageAt ? formatTime(conversation.lastMessageAt) : ''}
                        </span>
                      </div>
                      
                      <div className="flex items-center justify-between mt-1">
                        <p className="text-xs text-gray-600 truncate">
                          {conversation.lastMessage || 'Sem mensagens'}
                        </p>
                        {conversation.unreadCount > 0 && (
                          <Badge className="bg-green-500 text-white text-xs h-5 w-5 rounded-full flex items-center justify-center p-0">
                            {conversation.unreadCount}
                          </Badge>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </ScrollArea>
      </div>

      {/* Área Principal do Chat */}
      <div className="flex-1 flex flex-col">
        {selectedConversation ? (
          <>
            {/* Header do Chat */}
            <div className="p-3 border-b bg-white">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Avatar className="h-8 w-8">
                    <AvatarFallback className="bg-green-100 text-green-700 text-xs">
                      {getInitials(conversations.find(c => c.id === selectedConversation)?.contactName || '')}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <h3 className="font-medium text-sm">
                      {conversations.find(c => c.id === selectedConversation)?.contactName}
                    </h3>
                    <p className="text-xs text-gray-500">
                      {conversations.find(c => c.id === selectedConversation)?.contactPhone}
                    </p>
                  </div>
                </div>
                
                <div className="flex items-center gap-2">
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
            </div>

            {/* Área de Mensagens */}
            <ScrollArea className="flex-1 p-4">
              <div className="space-y-2">
                {messages.map((message) => (
                  <div
                    key={message.id}
                    className={`flex ${message.isFromMe ? 'justify-end' : 'justify-start'}`}
                  >
                    <div
                      className={`max-w-xs lg:max-w-md px-3 py-2 rounded-lg text-sm ${
                        message.isFromMe
                          ? 'bg-green-500 text-white'
                          : 'bg-gray-100 text-gray-900'
                      }`}
                    >
                      <p>{message.content}</p>
                      <p className={`text-xs mt-1 ${
                        message.isFromMe ? 'text-green-100' : 'text-gray-500'
                      }`}>
                        {formatTime(message.timestamp)}
                      </p>
                    </div>
                  </div>
                ))}
                <div ref={messagesEndRef} />
              </div>
            </ScrollArea>

            {/* Input de Mensagem */}
            <div className="p-3 border-t bg-white">
              <div className="flex items-center gap-2">
                <Button variant="ghost" size="sm">
                  <Paperclip className="h-4 w-4" />
                </Button>
                
                <div className="flex-1 flex items-center gap-2">
                  <Input
                    placeholder="Digite uma mensagem..."
                    value={messageText}
                    onChange={(e) => setMessageText(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && sendMessage()}
                    className="h-10"
                  />
                  <Button variant="ghost" size="sm">
                    <Smile className="h-4 w-4" />
                  </Button>
                  <Button variant="ghost" size="sm">
                    <Mic className="h-4 w-4" />
                  </Button>
                </div>
                
                <Button 
                  variant="default" 
                  size="sm" 
                  onClick={sendMessage}
                  disabled={!messageText.trim() || sendingMessage}
                  className="bg-green-500 hover:bg-green-600"
                >
                  {sendingMessage ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Send className="h-4 w-4" />
                  )}
                </Button>
              </div>
            </div>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center">
              <MessageSquare className="h-16 w-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-700 mb-2">WhatsApp Web</h3>
              <p className="text-gray-500 max-w-md">
                Selecione uma conversa para começar a enviar mensagens.
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
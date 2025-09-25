'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { MessageSquare, Search, User, Loader2 } from 'lucide-react';
import { useConfiguracoes } from '@/hooks/useConfiguracoes';

interface Contact {
  jid: string;
  pushName: string;
  fullName: string;
  firstName: string;
  businessName: string;
  found: boolean;
}

interface ContactsListProps {
  userId: string;
  onContactSelect: (contact: Contact) => void;
  selectedContact?: Contact | null;
}

export function ContactsList({ userId, onContactSelect, selectedContact }: ContactsListProps) {
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string>('');
  const [searchTerm, setSearchTerm] = useState('');
  const [apiConfig, setApiConfig] = useState<{ apiUrl: string; adminToken: string } | null>(null);
  const [userToken, setUserToken] = useState<string>('');
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
        setError('Erro ao carregar configurações da API');
      }
    };

    loadApiConfig();
  }, [getConfiguracao]);

  useEffect(() => {
    const loadUserToken = async () => {
      try {
        const response = await fetch('/api/colaboradores/me');
        if (response.ok) {
          const result = await response.json();
          if (result.data?.whatsappToken) {
            setUserToken(result.data.whatsappToken);
          }
        }
      } catch (err) {
        console.error('Erro ao carregar token do usuário:', err);
      }
    };

    loadUserToken();
  }, []);

  useEffect(() => {
    if (userId && apiConfig) {
      fetchContacts();
    }
  }, [userId, apiConfig]);

  const fetchContacts = async () => {
    if (!userId) return;
    
    try {
      setIsLoading(true);
      const response = await fetch(`/api/wuzapi/user/contacts`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        }
      });

      if (!response.ok) {
        throw new Error('Falha ao buscar contatos');
      }

      const data = await response.json();
      console.log('Contatos recebidos:', data);

      if (data.success && data.data) {
        // Converter o objeto de contatos em array
        const contactsArray: Contact[] = Object.entries(data.data).map(([jid, contactData]: [string, any]) => ({
          jid,
          pushName: contactData.PushName || '',
          fullName: contactData.FullName || '',
          firstName: contactData.FirstName || '',
          businessName: contactData.BusinessName || '',
          found: contactData.Found || false
        }));

        // Filtrar apenas contatos encontrados e ordenar por nome
        const validContacts = contactsArray
          .filter(contact => contact.found)
          .sort((a, b) => {
            const nameA = a.pushName || a.fullName || a.firstName || a.jid;
            const nameB = b.pushName || b.fullName || b.firstName || b.jid;
            return nameA.localeCompare(nameB);
          });

        setContacts(validContacts);
      }

    } catch (err) {
      console.error('Erro ao buscar contatos:', err);
      setError(err instanceof Error ? err.message : 'Erro ao buscar contatos');
    } finally {
      setIsLoading(false);
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

  const filteredContacts = contacts.filter(contact => {
    const displayName = getContactDisplayName(contact).toLowerCase();
    return displayName.includes(searchTerm.toLowerCase());
  });

  if (isLoading) {
    return (
      <Card className="h-full">
        <CardHeader>
          <CardTitle className="text-lg">Contatos</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className="h-full">
        <CardHeader>
          <CardTitle className="text-lg">Contatos</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-12">
            <MessageSquare className="h-8 w-8 text-red-400 mx-auto mb-4" />
            <p className="text-red-600 text-sm mb-4">{error}</p>
            <Button onClick={fetchContacts} variant="outline" size="sm">
              Tentar novamente
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="h-full">
      <CardHeader>
        <CardTitle className="text-lg">Contatos ({contacts.length})</CardTitle>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
          <Input
            placeholder="Buscar contatos..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
      </CardHeader>
      <CardContent className="p-0">
        <div className="max-h-[calc(100vh-300px)] overflow-y-auto">
          {filteredContacts.length === 0 ? (
            <div className="text-center py-12">
              <User className="h-8 w-8 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500 text-sm">
                {searchTerm ? 'Nenhum contato encontrado' : 'Nenhum contato disponível'}
              </p>
            </div>
          ) : (
            <div className="space-y-1">
              {filteredContacts.map((contact) => (
                <div
                  key={contact.jid}
                  onClick={() => onContactSelect(contact)}
                  className={`flex items-center space-x-3 p-3 hover:bg-gray-50 cursor-pointer transition-colors ${
                    selectedContact?.jid === contact.jid ? 'bg-blue-50 border-r-2 border-blue-500' : ''
                  }`}
                >
                  <Avatar className="h-10 w-10">
                    <AvatarImage src="" alt={getContactDisplayName(contact)} />
                    <AvatarFallback className="bg-blue-100 text-blue-600">
                      {getContactInitials(contact)}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 truncate">
                      {getContactDisplayName(contact)}
                    </p>
                    <p className="text-xs text-gray-500 truncate">
                      {contact.jid.split('@')[0]}
                    </p>
                  </div>
                  <MessageSquare className="h-4 w-4 text-gray-400" />
                </div>
              ))}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
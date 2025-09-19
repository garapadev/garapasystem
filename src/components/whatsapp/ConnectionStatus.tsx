'use client';

import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { MessageSquare, WifiOff, ArrowLeft, Loader2, CheckCircle } from 'lucide-react';
import { useRouter } from 'next/navigation';

interface ConnectionStatusProps {
  status: 'disconnected' | 'connecting' | 'qr_required' | 'connected' | 'inChat' | 'error' | 'not_connected';
  message?: string;
  onConnect: () => void;
  onBack?: () => void;
  isLoading?: boolean;
  error?: string;
}

export function ConnectionStatus({ 
  status, 
  message, 
  onConnect, 
  onBack, 
  isLoading = false,
  error 
}: ConnectionStatusProps) {
  const router = useRouter();

  const renderContent = () => {
    switch (status) {
      case 'connected':
      case 'inChat':
        return (
          <>
            <CheckCircle className="h-12 w-12 text-green-500 mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2 text-green-700">WhatsApp Conectado</h3>
            <p className="text-gray-600 mb-4">{message || 'Sua conta do WhatsApp está conectada e pronta para uso.'}</p>
          </>
        );

      case 'connecting':
      case 'qr_required':
        return (
          <>
            <Loader2 className="h-12 w-12 text-blue-500 animate-spin mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">Conectando WhatsApp</h3>
            <p className="text-gray-600 mb-4">{message || 'Estabelecendo conexão com o WhatsApp...'}</p>
          </>
        );

      case 'error':
        return (
          <>
            <WifiOff className="h-12 w-12 text-red-500 mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">Erro de Conexão</h3>
            <p className="text-gray-600 mb-4">{message || 'Ocorreu um erro ao conectar com o WhatsApp.'}</p>
            {error && (
              <p className="text-sm text-red-600 mb-4">{error}</p>
            )}
          </>
        );

      default: // 'not_connected'
        return (
          <>
            <MessageSquare className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">WhatsApp não conectado</h3>
            <p className="text-gray-600 mb-4">{message || 'Conecte sua conta do WhatsApp para começar a usar o chat.'}</p>
          </>
        );
    }
  };

  return (
    <div className="w-full max-w-md mx-auto">
      <Card className="shadow-md">
        <CardContent className="p-6 text-center">
          {renderContent()}
          
          <div className="space-y-2">
            {status !== 'connected' && status !== 'inChat' && status !== 'connecting' && status !== 'qr_required' && (
              <Button 
                onClick={onConnect} 
                className="w-full"
                disabled={isLoading}
              >
                {isLoading ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Conectando...
                  </>
                ) : (
                  'Conectar WhatsApp'
                )}
              </Button>
            )}
            
            <Button 
              variant="outline" 
              onClick={onBack || (() => router.push('/whatsapp'))} 
              className="w-full"
              disabled={isLoading}
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Voltar
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
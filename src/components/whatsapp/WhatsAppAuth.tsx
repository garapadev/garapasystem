'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Loader2, RefreshCw, Smartphone, Monitor } from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';

interface WhatsAppAuthProps {
  onConnectionSuccess: () => void;
  colaboradorId: string;
}

type ConnectionStatus = 'initializing' | 'generating_qr' | 'qr_ready' | 'connecting' | 'connected' | 'error';

export function WhatsAppAuth({ onConnectionSuccess, colaboradorId }: WhatsAppAuthProps) {
  const [status, setStatus] = useState<ConnectionStatus>('initializing');
  const [qrCode, setQrCode] = useState<string>('');
  const [error, setError] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    startConnectionProcess();
  }, [colaboradorId]);

  useEffect(() => {
    if (status === 'qr_ready' || status === 'connecting') {
      const interval = setInterval(checkConnectionStatus, 2000);
      return () => clearInterval(interval);
    }
  }, [status]);

  const startConnectionProcess = async () => {
    setIsLoading(true);
    setError('');
    setStatus('initializing');

    try {
      setStatus('generating_qr');
      
      const startResponse = await fetch('/api/gazapi/start', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          colaboradorId: colaboradorId
        })
      });

      if (!startResponse.ok) {
        throw new Error('Falha ao iniciar sessão');
      }

      await new Promise(resolve => setTimeout(resolve, 1000));
      await fetchQRCode();

    } catch (err) {
      console.error('Erro ao iniciar conexão:', err);
      setError(err instanceof Error ? err.message : 'Erro desconhecido');
      setStatus('error');
    } finally {
      setIsLoading(false);
    }
  };

  const fetchQRCode = async () => {
    try {
      console.log('[WhatsAppAuth] Buscando QR code para colaborador:', colaboradorId);
      
      const response = await fetch('/api/gazapi/getQrCode', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          colaboradorId: colaboradorId
        }),
      });

      if (!response.ok) {
        throw new Error('Falha ao buscar QR code');
      }

      const data = await response.json();
      console.log('[WhatsAppAuth] Resposta do QR code:', data);

      if (data.success && data.data?.qrCode) {
        setQrCode(data.data.qrCode);
        setStatus('qr_ready');
      } else {
        throw new Error(data.message || 'QR code não disponível');
      }
    } catch (err) {
      console.error('[WhatsAppAuth] Erro ao buscar QR code:', err);
      setError(err instanceof Error ? err.message : 'Erro ao buscar QR code');
      setStatus('error');
    }
  };

  const checkConnectionStatus = async () => {
    try {
      const response = await fetch('/api/gazapi/getSessionStatus', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          colaboradorId: colaboradorId
        }),
      });

      if (!response.ok) {
        throw new Error('Falha ao verificar status');
      }

      const data = await response.json();
      console.log('[WhatsAppAuth] Status da conexão:', data);

      if (data.success && data.data) {
        const sessionStatus = data.data.status;
        
        if (sessionStatus === 'connected' || sessionStatus === 'inChat') {
          setStatus('connected');
          onConnectionSuccess?.();
          return true;
        } else if (sessionStatus === 'qr_required') {
          // QR code ainda é necessário
          return false;
        }
      }
      
      return false;
    } catch (err) {
      console.error('[WhatsAppAuth] Erro ao verificar status:', err);
      return false;
    }
  };

  const handleRefresh = () => {
    setQrCode('');
    startConnectionProcess();
  };

  const renderContent = () => {
    if (status === 'connected') {
      return (
        <div className="text-center py-12">
          <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <Smartphone className="w-10 h-10 text-green-600" />
          </div>
          <h2 className="text-2xl font-light text-gray-800 mb-2">
            WhatsApp conectado
          </h2>
          <p className="text-gray-600 mb-6">
            Redirecionando para o chat...
          </p>
          <Loader2 className="w-6 h-6 animate-spin mx-auto text-green-600" />
        </div>
      );
    }

    if (status === 'error') {
      return (
        <div className="text-center py-12">
          <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <Monitor className="w-10 h-10 text-red-600" />
          </div>
          <h2 className="text-2xl font-light text-gray-800 mb-2">
            Erro na conexão
          </h2>
          <p className="text-gray-600 mb-6">
            {error || 'Não foi possível conectar ao WhatsApp'}
          </p>
          <Button onClick={handleRefresh} variant="outline" className="px-8">
            <RefreshCw className="w-4 h-4 mr-2" />
            Tentar novamente
          </Button>
        </div>
      );
    }

    if (status === 'connecting') {
      return (
        <div className="text-center py-12">
          <div className="w-20 h-20 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <Loader2 className="w-10 h-10 animate-spin text-blue-600" />
          </div>
          <h2 className="text-2xl font-light text-gray-800 mb-2">
            Conectando...
          </h2>
          <p className="text-gray-600">
            Aguarde enquanto estabelecemos a conexão
          </p>
        </div>
      );
    }

    return (
      <div className="text-center">
        <div className="mb-8">
          <h1 className="text-3xl font-light text-gray-800 mb-2">
            Use o WhatsApp no seu computador
          </h1>
          <p className="text-gray-600">
            Escaneie o código com o seu telefone para conectar
          </p>
        </div>

        <div className="flex justify-center mb-8">
          <Card className="p-8 bg-white shadow-sm border">
            <CardContent className="p-0">
              {qrCode && status === 'qr_ready' ? (
                <QRCodeSVG 
                  value={qrCode}
                  size={264}
                  level="H"
                  includeMargin={true}
                  style={{
                    maxWidth: '100%',
                    height: 'auto'
                  }}
                />
              ) : (
                <div className="w-64 h-64 flex items-center justify-center">
                  <Loader2 className="w-12 h-12 animate-spin text-gray-400" />
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        <div className="max-w-md mx-auto">
          <div className="flex items-start space-x-4 text-left mb-6">
            <div className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center flex-shrink-0 mt-1">
              <span className="text-sm font-medium text-gray-600">1</span>
            </div>
            <div>
              <p className="text-gray-800 font-medium">Abra o WhatsApp no seu telefone</p>
            </div>
          </div>

          <div className="flex items-start space-x-4 text-left mb-6">
            <div className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center flex-shrink-0 mt-1">
              <span className="text-sm font-medium text-gray-600">2</span>
            </div>
            <div>
              <p className="text-gray-800 font-medium">
                Toque em <strong>Menu</strong> ou <strong>Configurações</strong> e selecione <strong>Dispositivos conectados</strong>
              </p>
            </div>
          </div>

          <div className="flex items-start space-x-4 text-left mb-8">
            <div className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center flex-shrink-0 mt-1">
              <span className="text-sm font-medium text-gray-600">3</span>
            </div>
            <div>
              <p className="text-gray-800 font-medium">
                Toque em <strong>Conectar um dispositivo</strong> e escaneie este código QR
              </p>
            </div>
          </div>

          {qrCode && (
            <Button 
              onClick={handleRefresh} 
              variant="outline" 
              disabled={isLoading}
              className="w-full"
            >
              <RefreshCw className="w-4 h-4 mr-2" />
              {isLoading ? 'Atualizando...' : 'Atualizar código QR'}
            </Button>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="w-full max-w-2xl">
        {renderContent()}
      </div>
    </div>
  );
}
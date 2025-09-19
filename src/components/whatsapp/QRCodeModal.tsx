'use client';

import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { QrCode, RefreshCw, X, CheckCircle, Loader2 } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { QRCodeSVG } from 'qrcode.react';

interface QRCodeModalProps {
  isOpen: boolean;
  onClose: () => void;
  colaboradorId: string;
  onConnectionSuccess?: () => void;
}

export function QRCodeModal({ isOpen, onClose, colaboradorId, onConnectionSuccess }: QRCodeModalProps) {
  const [qrCode, setQrCode] = useState<string>('');
  const [status, setStatus] = useState<string>('initializing');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string>('');
  const [isConnected, setIsConnected] = useState(false);
  const [connectionPhase, setConnectionPhase] = useState<'pairing' | 'creating' | 'waiting_qr' | 'qr_ready' | 'connected' | 'error'>('pairing');
  const router = useRouter();

  // Função para iniciar o processo de conexão
  const startConnectionProcess = async () => {
    console.log('[QRCodeModal] Iniciando processo de conexão');
    setIsLoading(true);
    setError('');
    setConnectionPhase('creating');
    
    // Chamar a API de conexão imediatamente
    await fetchQRCode();
    setIsLoading(false);
  };

  const fetchQRCode = async () => {
    if (!colaboradorId || colaboradorId.trim() === '') {
      console.error('[QRCodeModal] ColaboradorId não fornecido');
      setError('ID do colaborador não encontrado');
      setConnectionPhase('error');
      return;
    }

    console.log('[QRCodeModal] Fazendo requisição para conectar colaborador:', colaboradorId);
    
    try {
      // Primeiro, iniciar a sessão
      const startResponse = await fetch(`/api/gazapi/start`, {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          session: colaboradorId,
          webhookUrl: `${window.location.origin}/api/gazapi/webhook`
        })
      });

      if (!startResponse.ok) {
        const errorData = await startResponse.json();
        console.error('[QRCodeModal] Erro ao iniciar sessão:', errorData);
        setError(errorData.message || 'Erro ao iniciar sessão');
        setConnectionPhase('error');
        return;
      }

      // Depois, buscar o QR Code
      const response = await fetch(`/api/gazapi/getQrCode`, {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          session: colaboradorId
        })
      });

      console.log('[QRCodeModal] Resposta da API getQrCode:', response.status);
      
      if (!response.ok) {
        const errorData = await response.json();
        console.error('[QRCodeModal] Erro na resposta da API:', errorData);
        setError(errorData.message || 'Erro ao buscar QR Code');
        setConnectionPhase('error');
        return;
      }

      const data = await response.json();
      console.log('[QRCodeModal] Dados recebidos da API getQrCode:', data);

      if (!data.success) {
        setError(data.message || 'Erro ao buscar QR Code');
        setConnectionPhase('error');
        return;
      }

      // Atualizar o status baseado na resposta
      if (data.data?.status) {
        setStatus(data.data.status);
        console.log('[QRCodeModal] Status atualizado para:', data.data.status);
      }

      // Se recebeu QR code, mostrar
      if (data.data?.qrCode) {
        console.log('[QRCodeModal] QR Code recebido, exibindo');
        setQrCode(data.data.qrCode);
        setConnectionPhase('qr_ready');
      } else {
        console.log('[QRCodeModal] QR Code não recebido ainda, status:', data.data?.status);
        // Definir fase baseada no status
        if (data.data?.status === 'qr_required' || data.data?.status === 'connecting') {
          setConnectionPhase('waiting_qr');
        } else if (data.data?.status === 'connected' || data.data?.status === 'inChat') {
          setConnectionPhase('connected');
          setIsConnected(true);
        } else {
          setConnectionPhase('creating');
        }
      }

      setError('');
    } catch (err) {
      console.error('[QRCodeModal] Erro ao buscar QR Code:', err);
      setError('Erro de conexão');
      setConnectionPhase('error');
    }
  };

  // useEffect para iniciar o processo quando o modal abrir
  useEffect(() => {
    if (isOpen) {
      if (!colaboradorId || colaboradorId.trim() === '') {
        console.error('[QRCodeModal] Modal aberto mas colaboradorId não fornecido');
        setError('ID do colaborador não encontrado');
        setConnectionPhase('error');
        return;
      }
      
      console.log('[QRCodeModal] Modal aberto, iniciando processo de conexão para:', colaboradorId);
      
      // Resetar estados
      setQrCode('');
      setStatus('initializing');
      setError('');
      setIsConnected(false);
      setConnectionPhase('creating');
      
      // Iniciar processo imediatamente
      startConnectionProcess();
    }
  }, [isOpen, colaboradorId]);

  // useEffect para polling do status
  useEffect(() => {
    if (isOpen && colaboradorId && (connectionPhase === 'waiting_qr' || connectionPhase === 'creating')) {
      console.log('[QRCodeModal] Iniciando polling do status');
      
      const interval = setInterval(async () => {
        console.log('[QRCodeModal] Polling status...');
        
        try {
          // Usar a API Gazapi para verificar status
          const response = await fetch(`/api/gazapi/getSessionStatus`, {
            method: 'POST',
            credentials: 'include',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              session: colaboradorId
            })
          });
          
          if (response.ok) {
            const data = await response.json();
            console.log('[QRCodeModal] Status polling response:', data);
            
            if (data.success && data.data) {
              if (data.data.status) {
                setStatus(data.data.status);
              }
              
              // Se precisar de QR Code e não temos ainda, buscar
              if (data.data.status === 'qr_required' && !qrCode) {
                console.log('[QRCodeModal] Status indica QR necessário, buscando...');
                await fetchQRCode();
              } else if (data.data.status === 'connected' || data.data.status === 'inChat') {
                console.log('[QRCodeModal] Conexão estabelecida!');
                setConnectionPhase('connected');
                setIsConnected(true);
                onConnectionSuccess?.();
              }
            }
          } else {
            console.error('[QRCodeModal] Erro no polling:', response.status);
          }
        } catch (error) {
          console.error('[QRCodeModal] Erro no polling:', error);
        }
      }, 2000); // Polling a cada 2 segundos
      
      return () => {
        console.log('[QRCodeModal] Parando polling do status');
        clearInterval(interval);
      };
    }
  }, [isOpen, colaboradorId, connectionPhase, qrCode]);

  const handleRefresh = () => {
    setConnectionPhase('pairing');
    setError('');
    startConnectionProcess();
  };

  const handleClose = () => {
    setIsConnected(false);
    setQrCode('');
    setStatus('initializing');
    setError('');
    setConnectionPhase('pairing');
    onClose();
  };

  const getStatusMessage = () => {
    switch (connectionPhase) {
      case 'pairing':
        return 'Pareando...';
      case 'creating':
        return 'Requisitando conexão...';
      case 'waiting_qr':
        return 'Aguardando QR Code...';
      case 'qr_ready':
        return 'Escaneie o QR Code com seu WhatsApp';
      case 'connected':
        return 'WhatsApp conectado com sucesso!';
      case 'error':
        return error || 'Erro na conexão';
      default:
        return 'Inicializando conexão...';
    }
  };

  const renderContent = () => {
    if (isConnected || status === 'connected') {
      return (
        <div className="text-center py-8">
          <CheckCircle className="h-16 w-16 text-green-500 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-green-700 mb-2">
            Conectado com Sucesso!
          </h3>
          <p className="text-gray-600 mb-4">
            Redirecionando para o chat...
          </p>
          <Loader2 className="h-6 w-6 animate-spin mx-auto text-blue-500" />
        </div>
      );
    }

    if (error) {
      return (
        <div className="text-center py-8">
          <div className="text-red-500 mb-4">
            <X className="h-16 w-16 mx-auto" />
          </div>
          <h3 className="text-lg font-semibold text-red-700 mb-2">Erro</h3>
          <p className="text-gray-600 mb-4">{error}</p>
          <Button onClick={handleRefresh} disabled={isLoading}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Tentar Novamente
          </Button>
        </div>
      );
    }

    if (connectionPhase === 'pairing' || connectionPhase === 'creating' || connectionPhase === 'waiting_qr') {
      return (
        <div className="text-center py-8">
          <Loader2 className="h-16 w-16 animate-spin mx-auto mb-4 text-blue-500" />
          <h3 className="text-lg font-semibold mb-2">{getStatusMessage()}</h3>
          <p className="text-gray-600">
            {connectionPhase === 'pairing' && 'Estabelecendo comunicação com o servidor...'}
            {connectionPhase === 'creating' && 'Configurando sua sessão do WhatsApp...'}
            {connectionPhase === 'waiting_qr' && 'Preparando QR Code para conexão...'}
          </p>
        </div>
      );
    }

    return (
      <div className="text-center">
        <div className="mb-4">
          <QrCode className="h-8 w-8 mx-auto mb-2 text-blue-600" />
          <h3 className="text-lg font-semibold mb-2">Conectar WhatsApp</h3>
          <p className="text-gray-600 text-sm mb-4">{getStatusMessage()}</p>
        </div>

        <Card className="mb-4">
          <CardContent className="p-4">
            {qrCode ? (
              <div className="flex justify-center">
                <QRCodeSVG 
                  value={qrCode}
                  size={256}
                  level="H"
                  includeMargin={true}
                  style={{
                    maxWidth: '100%',
                    height: 'auto'
                  }}
                />
              </div>
            ) : (
              <div className="h-64 flex items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
              </div>
            )}
          </CardContent>
        </Card>

        <div className="text-xs text-gray-500 mb-4">
          <p>1. Abra o WhatsApp no seu celular</p>
          <p>2. Toque em Menu ou Configurações</p>
          <p>3. Toque em WhatsApp Web</p>
          <p>4. Escaneie este código</p>
        </div>

        <Button 
          onClick={handleRefresh} 
          variant="outline" 
          size="sm"
          disabled={isLoading}
          className="w-full"
        >
          <RefreshCw className="h-4 w-4 mr-2" />
          {isLoading ? 'Atualizando...' : 'Atualizar QR Code'}
        </Button>
      </div>
    );
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center justify-between">
            <span>WhatsApp QR Code</span>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleClose}
              className="h-6 w-6 p-0"
            >
              <X className="h-4 w-4" />
            </Button>
          </DialogTitle>
        </DialogHeader>
        
        {renderContent()}
      </DialogContent>
    </Dialog>
  );
}
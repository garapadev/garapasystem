'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { QrCode, Loader2, ArrowLeft } from 'lucide-react';
import { useRouter } from 'next/navigation';
import QRCodeGenerator from 'qrcode';

interface QRCodeDisplayProps {
  qrCodeData?: string;
  status: 'qr_code' | 'connecting';
  onBack?: () => void;
  message?: string;
}

export function QRCodeDisplay({ qrCodeData, status, onBack, message }: QRCodeDisplayProps) {
  const router = useRouter();
  const [qrCodeImage, setQrCodeImage] = useState<string>('');

  useEffect(() => {
    if (qrCodeData) {
      generateQRCodeImage(qrCodeData);
    } else {
      // Se não tiver QR Code, limpar a imagem
      setQrCodeImage('');
    }
  }, [qrCodeData]);

  const generateQRCodeImage = async (qrData: string) => {
    try {
      const qrCodeDataURL = await QRCodeGenerator.toDataURL(qrData, {
        width: 256,
        margin: 2,
        color: {
          dark: '#000000',
          light: '#FFFFFF'
        }
      });
      setQrCodeImage(qrCodeDataURL);
    } catch (error) {
      console.error('Erro ao gerar QR Code:', error);
    }
  };

  return (
    <div className="w-full max-w-md mx-auto">
      <Card className="shadow-md">
        <CardContent className="p-6 text-center">
          {status === 'qr_code' ? (
            <>
              <QrCode className="h-12 w-12 text-green-600 mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">Escaneie o QR Code</h3>
              <p className="text-gray-600 mb-4">Abra o WhatsApp no seu celular e escaneie o código abaixo:</p>
              {qrCodeImage ? (
                <div className="mb-4 p-4 bg-white rounded-lg border inline-block">
                  <img src={qrCodeImage} alt="QR Code" className="mx-auto" />
                </div>
              ) : (
                <div className="mb-4 p-4 bg-gray-100 rounded-lg border inline-block">
                  <p className="text-gray-600">Aguardando QR Code...</p>
                </div>
              )}
              <div className="text-sm text-gray-500 mb-4">
                <p>1. Abra o WhatsApp no seu celular</p>
                <p>2. Toque em Menu ou Configurações</p>
                <p>3. Toque em Dispositivos conectados</p>
                <p>4. Toque em Conectar um dispositivo</p>
                <p>5. Escaneie este código QR</p>
              </div>
            </>
          ) : (
            <>
              <Loader2 className="h-12 w-12 animate-spin text-green-600 mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">Conectando...</h3>
              <p className="text-gray-600 mb-4">{message || 'Aguarde enquanto estabelecemos a conexão com o WhatsApp.'}</p>
            </>
          )}
          <Button variant="outline" onClick={onBack || (() => router.push('/whatsapp'))} className="w-full">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Voltar
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
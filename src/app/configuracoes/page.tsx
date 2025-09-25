'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function ConfiguracoesPage() {
  const router = useRouter();

  useEffect(() => {
    // Redireciona para a seção geral por padrão
    router.replace('/configuracoes/geral');
  }, [router]);

  return null;
}
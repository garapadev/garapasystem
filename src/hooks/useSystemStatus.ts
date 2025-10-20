'use client';
import { useState, useEffect } from 'react';

export interface HealthResponse {
  status: 'healthy' | 'unhealthy';
  message: string;
  timestamp: string;
  database: 'connected' | 'disconnected';
}

export interface VersionResponse {
  app: {
    name: string;
    version: string;
  };
  api: {
    version: string;
    status: 'healthy' | 'unhealthy';
    endpoints?: { total: number };
    database: 'connected' | 'disconnected';
  };
  system: {
    node: string;
    platform: string;
    arch: string;
    uptime: number;
    environment: string;
    memory?: { used: number; total: number; percentage: number };
    pm2?: { active: boolean; pm_id?: string };
  };
  timestamp: string;
}

export interface UseSystemStatusReturn {
  health: HealthResponse | null;
  version: VersionResponse | null;
  loading: boolean;
  error: string | null;
  refetch: () => void;
}

export function useSystemStatus(): UseSystemStatusReturn {
  const [health, setHealth] = useState<HealthResponse | null>(null);
  const [version, setVersion] = useState<VersionResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchStatus = async () => {
    try {
      setLoading(true);
      setError(null);

      const [healthRes, versionRes] = await Promise.all([
        fetch('/api/health'),
        fetch('/api/system/version')
      ]);

      if (healthRes.ok) {
        const healthData = await healthRes.json();
        setHealth(healthData);
      } else {
        setError('Falha ao obter status de saúde');
      }

      if (versionRes.ok) {
        const versionData = await versionRes.json();
        setVersion(versionData);
      } else {
        setError(prev => prev ? prev + ' | Falha ao obter versão' : 'Falha ao obter versão');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro desconhecido');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStatus();
  }, []);

  const refetch = () => fetchStatus();

  return { health, version, loading, error, refetch };
}
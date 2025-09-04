'use client';
import { useState, useEffect } from 'react';

export interface DashboardStats {
  totalClientes: number;
  totalColaboradores: number;
  totalGruposHierarquicos: number;
  totalPermissoes: number;
  totalUsuarios: number;
}

export interface RecentActivity {
  id: number;
  action: string;
  user: string;
  time: string;
  createdAt: string;
}

export interface UseDashboardReturn {
  stats: DashboardStats | null;
  recentActivities: RecentActivity[];
  loading: boolean;
  error: string | null;
  refetch: () => void;
}

export function useDashboard(): UseDashboardReturn {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [recentActivities, setRecentActivities] = useState<RecentActivity[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      setError(null);

      // Buscar estatísticas
      const statsResponse = await fetch('/api/dashboard/stats');
      if (!statsResponse.ok) {
        throw new Error('Erro ao buscar estatísticas');
      }
      const statsData = await statsResponse.json();
      setStats(statsData);

      // Buscar atividades recentes
      const activitiesResponse = await fetch('/api/dashboard/activities');
      if (!activitiesResponse.ok) {
        throw new Error('Erro ao buscar atividades');
      }
      const activitiesData = await activitiesResponse.json();
      setRecentActivities(activitiesData);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro desconhecido');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const refetch = () => {
    fetchDashboardData();
  };

  return {
    stats,
    recentActivities,
    loading,
    error,
    refetch
  };
}
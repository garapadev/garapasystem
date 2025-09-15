import { Metadata } from 'next';
import { TaskDashboard } from '@/components/tasks/TaskDashboard';

export const metadata: Metadata = {
  title: 'Dashboard de Tarefas | GarapaSystem',
  description: 'Dashboard com métricas e relatórios das tarefas do sistema',
};

export default function TaskDashboardPage() {
  return (
    <div className="container mx-auto py-6">
      <TaskDashboard />
    </div>
  );
}
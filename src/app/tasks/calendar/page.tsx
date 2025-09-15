import { Metadata } from 'next';
import TaskCalendar from '@/components/tasks/TaskCalendar';

export const metadata: Metadata = {
  title: 'Calendário de Tarefas',
  description: 'Visualize e gerencie suas tarefas em formato de calendário',
};

export default function CalendarPage() {
  return (
    <div className="container mx-auto py-6">
      <TaskCalendar />
    </div>
  );
}
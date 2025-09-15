'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Plus, Search, Filter, Calendar, User, Building, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { useTasks, Task, TaskFilters } from '@/hooks/useTasks';
import { useClientes } from '@/hooks/useClientes';
import { useColaboradores } from '@/hooks/useColaboradores';
import { useNegocios } from '@/hooks/useNegocios';
import { TaskDetails } from '@/components/tasks/TaskDetails';
import { TaskFilters as TaskFiltersPanel } from '@/components/tasks/TaskFilters';
import BusinessAutomationPanel from '@/components/tasks/BusinessAutomationPanel';

const statusColors = {
  PENDENTE: 'bg-yellow-100 text-yellow-800',
  EM_ANDAMENTO: 'bg-blue-100 text-blue-800',
  AGUARDANDO: 'bg-purple-100 text-purple-800',
  CONCLUIDA: 'bg-green-100 text-green-800',
  CANCELADA: 'bg-red-100 text-red-800'
};

const priorityColors = {
  BAIXA: 'bg-gray-100 text-gray-800',
  MEDIA: 'bg-yellow-100 text-yellow-800',
  ALTA: 'bg-orange-100 text-orange-800',
  URGENTE: 'bg-red-100 text-red-800'
};

export default function TasksPage() {
  const {
    tasks,
    loading,
    error,
    pagination,
    fetchTasks,
    createTask,
    updateTask,
    deleteTask
  } = useTasks();

  const { clientes, refetch: refetchClientes } = useClientes();
  const { colaboradores, refetch: refetchColaboradores } = useColaboradores();
  const { negocios } = useNegocios();

  const [filters, setFilters] = useState<TaskFilters>({});
  const [activeTab, setActiveTab] = useState<'tasks' | 'automation'>('tasks');
  const [searchTerm, setSearchTerm] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [showTaskDialog, setShowTaskDialog] = useState(false);

  useEffect(() => {
    fetchTasks(filters, pagination.page, pagination.limit);
    refetchClientes();
    refetchColaboradores();
    // negociosData.refetch?.();
  }, []);

  const handleSearch = () => {
    const newFilters = { ...filters, search: searchTerm };
    setFilters(newFilters);
    fetchTasks(newFilters, 1, pagination.limit);
  };

  const handleFilterChange = (newFilters: TaskFilters) => {
    setFilters(newFilters);
    fetchTasks(newFilters, 1, pagination.limit);
  };

  const handlePageChange = (page: number) => {
    fetchTasks(filters, page, pagination.limit);
  };

  const handleTaskClick = (task: Task) => {
    setSelectedTask(task);
    setShowTaskDialog(true);
  };

  const router = useRouter();

  const handleEditTask = (task: Task) => {
    router.push(`/tasks/${task.id}/edit`);
  };

  const handleCreateTask = () => {
    router.push('/tasks/new');
  };

  const handleUpdateTask = async (id: number, data: any) => {
    const success = await updateTask(id, data);
    if (success) {
      setShowTaskDialog(false);
      fetchTasks(filters, pagination.page, pagination.limit);
    }
  };

  const handleDeleteTask = async (id: number) => {
    const success = await deleteTask(id);
    if (success) {
      setShowTaskDialog(false);
      fetchTasks(filters, pagination.page, pagination.limit);
    }
  };

  const getStatusBadge = (status: string) => {
    const colorClass = statusColors[status as keyof typeof statusColors] || 'bg-gray-100 text-gray-800';
    return (
      <Badge className={colorClass}>
        {status.replace('_', ' ')}
      </Badge>
    );
  };

  const getPriorityBadge = (priority: string) => {
    const colorClass = priorityColors[priority as keyof typeof priorityColors] || 'bg-gray-100 text-gray-800';
    return (
      <Badge className={colorClass}>
        {priority}
      </Badge>
    );
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('pt-BR');
  };

  const isOverdue = (task: Task) => {
    if (!task.dataVencimento || task.status === 'CONCLUIDA' || task.status === 'CANCELADA') {
      return false;
    }
    return new Date(task.dataVencimento) < new Date();
  };

  if (error) {
    return (
      <div className="container mx-auto p-6">
        <Card>
          <CardContent className="flex items-center justify-center p-6">
            <div className="text-center">
              <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Erro ao carregar tarefas</h3>
              <p className="text-gray-600 mb-4">{error}</p>
              <Button onClick={() => fetchTasks(filters, pagination.page, pagination.limit)}>
                Tentar novamente
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Tarefas</h1>
          <p className="text-gray-600 mt-1">
            Gerencie suas tarefas e acompanhe o progresso
          </p>
        </div>
        <Button onClick={handleCreateTask}>
          <Plus className="h-4 w-4 mr-2" />
          Nova Tarefa
        </Button>
      </div>

      {/* Navigation Tabs */}
      <div className="mb-6">
        <div className="border-b border-gray-200">
          <nav className="-mb-px flex space-x-8">
            <button
              onClick={() => setActiveTab('tasks')}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'tasks'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Gerenciar Tarefas
            </button>
            <button
              onClick={() => setActiveTab('automation')}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'automation'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Automação de Negócios
            </button>
          </nav>
        </div>
      </div>

      {/* Tab Content */}
      {activeTab === 'tasks' && (
        <>
          {/* Search and Filters */}
      <Card className="mb-6">
        <CardContent className="p-4">
          <div className="flex gap-4 items-center">
            <div className="flex-1 flex gap-2">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <Input
                  placeholder="Buscar tarefas..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                  className="pl-10"
                />
              </div>
              <Button onClick={handleSearch} variant="outline">
                Buscar
              </Button>
            </div>
            <Button
              variant="outline"
              onClick={() => setShowFilters(!showFilters)}
            >
              <Filter className="h-4 w-4 mr-2" />
              Filtros
            </Button>
          </div>

          {showFilters && (
            <div className="mt-4 pt-4 border-t">
              <TaskFiltersPanel
                filters={filters}
                onFiltersChange={handleFilterChange}
                clientes={clientes}
                colaboradores={colaboradores}
                negocios={negocios}
                onClearFilters={() => setFilters({})}
              />
            </div>
          )}
        </CardContent>
      </Card>

      {/* Tasks Grid */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[...Array(6)].map((_, i) => (
            <Card key={i} className="animate-pulse">
              <CardHeader>
                <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                <div className="h-3 bg-gray-200 rounded w-1/2"></div>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="h-3 bg-gray-200 rounded"></div>
                  <div className="h-3 bg-gray-200 rounded w-2/3"></div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (tasks && tasks.length === 0) ? (
        <Card>
          <CardContent className="flex items-center justify-center p-12">
            <div className="text-center">
              <Calendar className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Nenhuma tarefa encontrada</h3>
              <p className="text-gray-600 mb-4">
                {Object.keys(filters).length > 0 || searchTerm
                  ? 'Tente ajustar os filtros ou termo de busca'
                  : 'Comece criando sua primeira tarefa'}
              </p>
              <Button onClick={handleCreateTask}>
                <Plus className="h-4 w-4 mr-2" />
                Criar Primeira Tarefa
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {tasks && tasks.map((task) => (
              <Card
                key={task.id}
                className={`cursor-pointer hover:shadow-lg transition-shadow ${
                  isOverdue(task) ? 'border-red-200 bg-red-50' : ''
                }`}
                onClick={() => handleTaskClick(task)}
              >
                <CardHeader className="pb-3">
                  <div className="flex justify-between items-start">
                    <CardTitle className="text-lg line-clamp-2">
                      {task.titulo}
                    </CardTitle>
                    {isOverdue(task) && (
                      <AlertCircle className="h-5 w-5 text-red-500 flex-shrink-0 ml-2" />
                    )}
                  </div>
                  <div className="flex gap-2">
                    {getStatusBadge(task.status)}
                    {getPriorityBadge(task.prioridade)}
                  </div>
                </CardHeader>
                <CardContent>
                  {task.descricao && (
                    <p className="text-gray-600 text-sm mb-3 line-clamp-2">
                      {task.descricao}
                    </p>
                  )}
                  
                  <div className="space-y-2 text-sm">
                    {task.dataVencimento && (
                      <div className="flex items-center gap-2">
                        <Calendar className="h-4 w-4 text-gray-400" />
                        <span className={isOverdue(task) ? 'text-red-600 font-medium' : 'text-gray-600'}>
                          Vence em {formatDate(task.dataVencimento)}
                        </span>
                      </div>
                    )}
                    
                    {task.responsavel && (
                      <div className="flex items-center gap-2">
                        <User className="h-4 w-4 text-gray-400" />
                        <span className="text-gray-600">
                          {task.responsavel.nome}
                        </span>
                      </div>
                    )}
                    
                    {task.cliente && (
                      <div className="flex items-center gap-2">
                        <Building className="h-4 w-4 text-gray-400" />
                        <span className="text-gray-600">
                          {task.cliente.nome}
                        </span>
                      </div>
                    )}
                  </div>
                  
                  <div className="flex justify-between items-center mt-4 pt-3 border-t">
                    <span className="text-xs text-gray-500">
                      Criada em {formatDate(task.createdAt)}
                    </span>
                    <div className="flex gap-1">
                      {task.comentarios && task.comentarios.length > 0 && (
                        <Badge variant="outline" className="text-xs">
                          {task.comentarios.length} comentário{task.comentarios.length !== 1 ? 's' : ''}
                        </Badge>
                      )}
                      {task.anexos && task.anexos.length > 0 && (
                        <Badge variant="outline" className="text-xs">
                          {task.anexos.length} anexo{task.anexos.length !== 1 ? 's' : ''}
                        </Badge>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Pagination */}
          {pagination.totalPages > 1 && (
            <div className="flex justify-center items-center gap-2 mt-8">
              <Button
                variant="outline"
                onClick={() => handlePageChange(pagination.page - 1)}
                disabled={pagination.page === 1}
              >
                Anterior
              </Button>
              
              <div className="flex gap-1">
                {pagination.totalPages && [...Array(pagination.totalPages)].map((_, i) => {
                  const page = i + 1;
                  return (
                    <Button
                      key={page}
                      variant={pagination.page === page ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => handlePageChange(page)}
                    >
                      {page}
                    </Button>
                  );
                })}
              </div>
              
              <Button
                variant="outline"
                onClick={() => handlePageChange(pagination.page + 1)}
                disabled={pagination.page === pagination.totalPages}
              >
                Próxima
              </Button>
            </div>
          )}
        </>
      )}
        </>
      )}

      {/* Business Automation Tab */}
      {activeTab === 'automation' && (
        <BusinessAutomationPanel />
      )}

      {/* Task Details Dialog */}
      <Dialog open={showTaskDialog} onOpenChange={setShowTaskDialog}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          {selectedTask && (
            <TaskDetails
                task={selectedTask}
                onAddComment={() => {}}
                onUploadAttachment={() => {}}
                onDownloadAttachment={() => {}}
                onDeleteAttachment={() => {}}
                onEdit={() => handleEditTask(selectedTask)}
                onDelete={() => handleDeleteTask(parseInt(selectedTask.id))}
              />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
import { useState, useEffect } from 'react'

interface Usuario {
  id: string
  email: string
  nome: string
  ativo: boolean
  ultimoLogin?: string
  colaboradorId?: string
  colaborador?: {
    id: string
    nome: string
    email: string
    cargo?: string
  }
  createdAt: string
  updatedAt: string
}

interface UseUsuariosParams {
  page?: number
  limit?: number
  search?: string
}

interface UseUsuariosReturn {
  usuarios: Usuario[]
  loading: boolean
  error: string | null
  meta: {
    total: number
    page: number
    totalPages: number
  } | null
  refetch: () => void
  deleteUsuario: (id: string) => Promise<void>
}

export function useUsuarios(params: UseUsuariosParams = {}): UseUsuariosReturn {
  const [usuarios, setUsuarios] = useState<Usuario[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [meta, setMeta] = useState<{
    total: number
    page: number
    totalPages: number
  } | null>(null)

  const fetchUsuarios = async () => {
    try {
      setLoading(true)
      setError(null)

      const searchParams = new URLSearchParams()
      if (params.page) searchParams.append('page', params.page.toString())
      if (params.limit) searchParams.append('limit', params.limit.toString())
      if (params.search) searchParams.append('search', params.search)

      const response = await fetch(`/api/usuarios?${searchParams.toString()}`, {
        method: 'GET',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
      })
      
      if (!response.ok) {
        throw new Error(`Erro ${response.status}: ${response.statusText}`)
      }

      const data = await response.json()
      setUsuarios(data.data || [])
      setMeta(data.meta || null)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro desconhecido')
      setUsuarios([])
      setMeta(null)
    } finally {
      setLoading(false)
    }
  }

  const deleteUsuario = async (id: string) => {
    const response = await fetch(`/api/usuarios/${id}`, {
      method: 'DELETE',
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json',
      },
    })

    if (!response.ok) {
      const errorData = await response.json()
      throw new Error(errorData.error || 'Erro ao excluir usuário')
    }

    // Remove o usuário da lista local
    setUsuarios(prev => prev.filter(usuario => usuario.id !== id))
    
    // Atualiza o meta se existir
    if (meta) {
      setMeta(prev => prev ? {
        ...prev,
        total: prev.total - 1
      } : null)
    }
  }

  const refetch = () => {
    fetchUsuarios()
  }

  useEffect(() => {
    fetchUsuarios()
  }, [params.page, params.limit, params.search])

  return {
    usuarios,
    loading,
    error,
    meta,
    refetch,
    deleteUsuario
  }
}

// Função para atualizar um usuário
export async function updateUsuario(id: string, data: {
  email: string;
  nome?: string | null;
  ativo: boolean;
  colaboradorId?: string | null;
}) {
  const response = await fetch(`/api/usuarios/${id}`, {
    method: 'PUT',
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.error || 'Erro ao atualizar usuário');
  }

  return response.json();
}

// Hook para buscar um usuário específico
export function useUsuario(id: string) {
  const [usuario, setUsuario] = useState<Usuario | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchUsuario = async () => {
    try {
      setLoading(true)
      setError(null)

      const response = await fetch(`/api/usuarios/${id}`, {
        method: 'GET',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
      })
      
      if (!response.ok) {
        if (response.status === 404) {
          throw new Error('Usuário não encontrado')
        }
        throw new Error('Erro ao buscar usuário')
      }

      const data: Usuario = await response.json()
      setUsuario(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro desconhecido')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (id) {
      fetchUsuario()
    }
  }, [id])

  const refetch = () => {
    if (id) {
      fetchUsuario()
    }
  }

  return {
    usuario,
    loading,
    error,
    refetch
  }
}
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

      const response = await fetch(`/api/usuarios?${searchParams.toString()}`)
      
      if (!response.ok) {
        throw new Error(`Erro ${response.status}: ${response.statusText}`)
      }

      const data = await response.json()
      setUsuarios(data.usuarios || [])
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
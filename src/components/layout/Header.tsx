'use client'

import { useAuth } from '@/hooks/useAuth'
import { useConfiguracoes } from '@/hooks/useConfiguracoes'
import { signOut } from 'next-auth/react'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { LogOut, Settings, User } from 'lucide-react'
import { NotificationCenter } from '@/components/realtime/NotificationCenter'
import { useRouter } from 'next/navigation'

export function Header() {
  const { user, colaborador, isAuthenticated } = useAuth()
  const { getConfiguracao } = useConfiguracoes()
  const router = useRouter()

  if (!isAuthenticated || !user) {
    return null
  }

  const handleSignOut = async () => {
    await signOut({ callbackUrl: '/auth/login' })
  }

  const handleProfileClick = () => {
    if (colaborador?.id) {
      router.push(`/colaboradores/${colaborador.id}`)
    }
  }

  const getUserInitials = () => {
    if (colaborador?.nome) {
      return colaborador.nome
        .split(' ')
        .map(name => name.charAt(0))
        .join('')
        .toUpperCase()
        .slice(0, 2)
    }
    if (user.name) {
      return user.name
        .split(' ')
        .map(name => name.charAt(0))
        .join('')
        .toUpperCase()
        .slice(0, 2)
    }
    return user.email?.charAt(0).toUpperCase() || 'U'
  }

  return (
    <header className="bg-white border-b border-gray-200 px-6 py-4">
      <div className="flex items-center justify-between">
        <div className="flex-1">
          <h1 className="text-xl font-semibold text-gray-900">
            {getConfiguracao('sistema_nome')?.valor || 'Sistema de Gestão'}
          </h1>
        </div>
        
        <div className="flex items-center space-x-4">
          {colaborador && (
            <div className="text-right">
              <p className="text-sm font-medium text-gray-900">
                {colaborador.nome}
              </p>
              <p className="text-xs text-gray-500">
                {colaborador.cargo || 'Colaborador'}
              </p>
              {colaborador.perfil && (
                <p className="text-xs text-blue-600">
                  {colaborador.perfil.nome}
                </p>
              )}
            </div>
          )}
          
          <NotificationCenter />
          
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="relative h-10 w-10 rounded-full">
                <Avatar className="h-10 w-10">
                  <AvatarFallback>
                    {getUserInitials()}
                  </AvatarFallback>
                </Avatar>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-56" align="end" forceMount>
              <DropdownMenuLabel className="font-normal">
                <div className="flex flex-col space-y-1">
                  <p className="text-sm font-medium leading-none">
                    {colaborador?.nome || user.name}
                  </p>
                  <p className="text-xs leading-none text-muted-foreground">
                    {user.email}
                  </p>
                </div>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={handleProfileClick}>
                <User className="mr-2 h-4 w-4" />
                <span>Perfil</span>
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => router.push('/configuracoes')}>
                <Settings className="mr-2 h-4 w-4" />
                <span>Configurações</span>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={handleSignOut}>
                <LogOut className="mr-2 h-4 w-4" />
                <span>Sair</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  )
}
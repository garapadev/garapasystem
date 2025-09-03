import { Usuario } from '../entities/Usuario';
import { IUsuarioRepository } from '../repositories/IUsuarioRepository';

export class AuthService {
  constructor(private usuarioRepository: IUsuarioRepository) {}

  async autenticar(email: string, senha: string): Promise<Usuario | null> {
    const usuario = await this.usuarioRepository.findByEmail(email);
    
    if (!usuario || !usuario.ativo) {
      return null;
    }

    // Em uma implementação real, usaríamos bcrypt para comparar senhas
    if (usuario.senha !== senha) {
      return null;
    }

    return usuario;
  }

  async verificarPermissao(usuarioId: string, recurso: string, acao: string): Promise<boolean> {
    const usuario = await this.usuarioRepository.findById(usuarioId);
    
    if (!usuario || !usuario.ativo) {
      return false;
    }

    return usuario.colaborador?.temPermissao(recurso, acao) || false;
  }
}
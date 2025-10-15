import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import bcrypt from 'bcryptjs';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    
    if (!id) {
      return NextResponse.json(
        { error: 'ID do colaborador é obrigatório' },
        { status: 400 }
      );
    }

    const colaborador = await db.colaborador.findUnique({
      where: { id },
      include: {
        perfil: {
          select: {
            id: true,
            nome: true,
            descricao: true
          }
        },
        grupoHierarquico: {
          select: {
            id: true,
            nome: true,
            descricao: true
          }
        },
        usuarios: {
          select: {
            id: true,
            email: true,
            ativo: true
          }
        }
      }
    });

    if (!colaborador) {
      return NextResponse.json(
        { error: 'Colaborador não encontrado' },
        { status: 404 }
      );
    }

    return NextResponse.json(colaborador);
  } catch (error) {
    console.error('Erro ao buscar colaborador:', error);
    return NextResponse.json(
      { error: 'Erro ao buscar colaborador' },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    
    if (!id) {
      return NextResponse.json(
        { error: 'ID do colaborador é obrigatório' },
        { status: 400 }
      );
    }

    const body = await request.json();

    // Validar dados obrigatórios
    if (!body.nome || !body.email) {
      return NextResponse.json(
        { error: 'Nome e email são obrigatórios' },
        { status: 400 }
      );
    }

    // Validar senha se alterarSenha for true
    if (body.alterarSenha) {
      if (!body.novaSenha || body.novaSenha.length < 6) {
        return NextResponse.json(
          { error: 'Nova senha deve ter pelo menos 6 caracteres' },
          { status: 400 }
        );
      }

      if (body.novaSenha !== body.confirmarSenha) {
        return NextResponse.json(
          { error: 'Confirmação de senha não confere' },
          { status: 400 }
        );
      }
    }

    // Verificar se colaborador existe
    const existingColaborador = await db.colaborador.findUnique({
      where: { id }
    });

    if (!existingColaborador) {
      return NextResponse.json(
        { error: 'Colaborador não encontrado' },
        { status: 404 }
      );
    }

    // Verificar se email já existe (se for diferente do atual)
    if (body.email !== existingColaborador.email) {
      const emailExists = await db.colaborador.findUnique({
        where: { email: body.email }
      });

      if (emailExists) {
        return NextResponse.json(
          { error: 'Email já cadastrado' },
          { status: 400 }
        );
      }
    }

    // Verificar se documento já existe (se fornecido e for diferente do atual)
    if (body.documento && body.documento !== existingColaborador.documento) {
      const documentoExists = await db.colaborador.findFirst({
        where: { documento: body.documento }
      });

      if (documentoExists) {
        return NextResponse.json(
          { error: 'Documento já cadastrado' },
          { status: 400 }
        );
      }
    }

    // Validar perfil e grupo se fornecidos
    if (body.perfilId) {
      const perfil = await db.perfil.findUnique({
        where: { id: body.perfilId }
      });

      if (!perfil) {
        return NextResponse.json(
          { error: 'Perfil não encontrado' },
          { status: 400 }
        );
      }
    }

    if (body.grupoHierarquicoId) {
      const grupo = await db.grupoHierarquico.findUnique({
        where: { id: body.grupoHierarquicoId }
      });

      if (!grupo) {
        return NextResponse.json(
          { error: 'Grupo hierárquico não encontrado' },
          { status: 400 }
        );
      }
    }

    // Atualizar colaborador
    const colaborador = await db.colaborador.update({
      where: { id },
      data: {
        nome: body.nome,
        email: body.email,
        telefone: body.telefone,
        documento: body.documento,
        cargo: body.cargo,
        dataAdmissao: body.dataAdmissao ? new Date(body.dataAdmissao) : null,
        ativo: body.ativo,
        perfilId: body.perfilId,
        grupoHierarquicoId: body.grupoHierarquicoId
      },
      include: {
        perfil: {
          select: {
            id: true,
            nome: true,
            descricao: true
          }
        },
        grupoHierarquico: {
          select: {
            id: true,
            nome: true,
            descricao: true
          }
        },
        usuarios: {
          select: {
            id: true,
            email: true,
            ativo: true
          }
        }
      }
    });

    // Determinar se estamos em modo DEMO e se o colaborador é admin
    const demoEnabled = process.env.DEMO_VERSION === 'true';
    const adminEmails = new Set(['admin@garapasystem.com', 'admin@local.test']);
    const usuarioAssoc: any = Array.isArray(colaborador.usuarios)
      ? (colaborador.usuarios[0] ?? null)
      : (colaborador.usuarios ?? null);
    const usuarioEmail = usuarioAssoc?.email
      ? String(usuarioAssoc.email).toLowerCase()
      : String(body.email || existingColaborador.email || '').toLowerCase();
    const isAdminByEmail = adminEmails.has(usuarioEmail);
    const isAdminByPerfil = (colaborador.perfil?.nome || '').toLowerCase() === 'administrador';
    const isAdminInDemo = demoEnabled && (isAdminByEmail || isAdminByPerfil);

    // Sincronizar email do usuário se o email do colaborador foi alterado
    if (body.email !== existingColaborador.email && usuarioAssoc?.id) {
      try {
        await db.usuario.update({
          where: { id: usuarioAssoc.id },
          data: {
            email: body.email,
            nome: body.nome // Também sincronizar o nome
          }
        });
      } catch (userUpdateError) {
        console.error('Erro ao sincronizar dados do usuário:', userUpdateError);
        // Continua mesmo se houver erro na sincronização do usuário
      }
    }

    // Se o colaborador não tem usuário associado e foi solicitada a criação
    const hasUsuario = Boolean(usuarioAssoc?.id);
    if (!hasUsuario && body.criarUsuario && body.senhaNovoUsuario) {
      if (isAdminInDemo) {
        return NextResponse.json(
          { error: 'Em modo demo, não é permitido criar usuário/alterar senha para administrador' },
          { status: 403 }
        );
      }
      try {
        const hashedPassword = await bcrypt.hash(body.senhaNovoUsuario, 10);
        
        await db.usuario.create({
          data: {
            email: body.email,
            senha: hashedPassword,
            nome: body.nome,
            ativo: true,
            colaboradorId: colaborador.id
          }
        });
      } catch (userCreateError) {
        console.error('Erro ao criar usuário associado:', userCreateError);
        return NextResponse.json(
          { error: 'Erro ao criar usuário associado' },
          { status: 500 }
        );
      }
    }

    // Atualizar senha do usuário se solicitado
    if (body.alterarSenha && usuarioAssoc?.id) {
      if (isAdminInDemo) {
        return NextResponse.json(
          { error: 'Em modo demo, não é permitido criar usuário/alterar senha para administrador' },
          { status: 403 }
        );
      }
      const hashedPassword = await bcrypt.hash(body.novaSenha, 10);
      
      await db.usuario.update({
        where: { id: usuarioAssoc.id },
        data: {
          senha: hashedPassword
        }
      });
    }

    return NextResponse.json(colaborador);
  } catch (error) {
    console.error('Erro ao atualizar colaborador:', error);
    return NextResponse.json(
      { error: 'Erro ao atualizar colaborador' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    
    if (!id) {
      return NextResponse.json(
        { error: 'ID do colaborador é obrigatório' },
        { status: 400 }
      );
    }

    // Verificar se colaborador existe
    const existingColaborador = await db.colaborador.findUnique({
      where: { id },
      include: {
        _count: {
          select: {
            usuarios: true
          }
        }
      }
    });

    if (!existingColaborador) {
      return NextResponse.json(
        { error: 'Colaborador não encontrado' },
        { status: 404 }
      );
    }

    // Verificar se tem usuários associados
    if (existingColaborador._count.usuarios > 0) {
      return NextResponse.json(
        { error: 'Não é possível excluir colaborador com usuários associados' },
        { status: 400 }
      );
    }

    // Excluir colaborador
    await db.colaborador.delete({
      where: { id }
    });

    return NextResponse.json({ message: 'Colaborador excluído com sucesso' });
  } catch (error) {
    console.error('Erro ao excluir colaborador:', error);
    return NextResponse.json(
      { error: 'Erro ao excluir colaborador' },
      { status: 500 }
    );
  }
}
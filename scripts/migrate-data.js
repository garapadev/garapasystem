const { PrismaClient } = require('@prisma/client');
const sqlite3 = require('sqlite3').verbose();
const fs = require('fs');

const prisma = new PrismaClient();

async function migrateData() {
  try {
    console.log('🚀 Iniciando migração de dados do SQLite para PostgreSQL...');
    
    // Verificar se o arquivo SQLite existe
    if (!fs.existsSync('./prisma/dev.db')) {
      console.log('⚠️  Arquivo SQLite não encontrado. Criando dados de exemplo...');
      return;
    }
    
    // Conectar ao SQLite
    const db = new sqlite3.Database('./prisma/dev.db');
    
    // Migrar Usuários
    console.log('👥 Migrando usuários...');
    const usuarios = await new Promise((resolve, reject) => {
      db.all("SELECT * FROM usuarios", (err, rows) => {
        if (err) {
          console.log('ℹ️  Tabela usuarios não encontrada, pulando...');
          resolve([]);
        } else {
          resolve(rows);
        }
      });
    });
    
    for (const usuario of usuarios) {
      try {
        await prisma.usuario.create({
          data: {
            id: usuario.id,
            email: usuario.email,
            senha: usuario.senha,
            nome: usuario.nome,
            ativo: Boolean(usuario.ativo),
            createdAt: new Date(usuario.createdAt),
            updatedAt: new Date(usuario.updatedAt),
            colaboradorId: usuario.colaboradorId
          }
        });
      } catch (error) {
        console.log(`⚠️  Erro ao migrar usuário ${usuario.email}:`, error.message);
      }
    }
    console.log(`✅ ${usuarios.length} usuários migrados`);
    
    // Migrar Grupos Hierárquicos (antes dos clientes e colaboradores)
    console.log('🏢 Migrando grupos hierárquicos...');
    const grupos = await new Promise((resolve, reject) => {
      db.all("SELECT * FROM grupos_hierarquicos ORDER BY parentId NULLS FIRST", (err, rows) => {
        if (err) {
          console.log('ℹ️  Tabela grupos_hierarquicos não encontrada, pulando...');
          resolve([]);
        } else {
          resolve(rows);
        }
      });
    });
    
    for (const grupo of grupos) {
      try {
        await prisma.grupoHierarquico.create({
          data: {
            id: grupo.id,
            nome: grupo.nome,
            descricao: grupo.descricao,
            nivel: grupo.nivel,
            parentId: grupo.parentId,
            ativo: Boolean(grupo.ativo),
            createdAt: new Date(grupo.createdAt),
            updatedAt: new Date(grupo.updatedAt)
          }
        });
      } catch (error) {
        console.log(`⚠️  Erro ao migrar grupo ${grupo.nome}:`, error.message);
      }
    }
    console.log(`✅ ${grupos.length} grupos hierárquicos migrados`);
    
    // Migrar Clientes
    console.log('👤 Migrando clientes...');
    const clientes = await new Promise((resolve, reject) => {
      db.all("SELECT * FROM clientes", (err, rows) => {
        if (err) {
          console.log('ℹ️  Tabela clientes não encontrada, pulando...');
          resolve([]);
        } else {
          resolve(rows);
        }
      });
    });
    
    for (const cliente of clientes) {
      try {
        await prisma.cliente.create({
          data: {
            id: cliente.id,
            nome: cliente.nome,
            email: cliente.email,
            telefone: cliente.telefone,
            documento: cliente.documento,
            tipo: cliente.tipo,
            status: cliente.status,
            endereco: cliente.endereco,
            cidade: cliente.cidade,
            estado: cliente.estado,
            cep: cliente.cep,
            observacoes: cliente.observacoes,
            valorPotencial: cliente.valorPotencial ? parseFloat(cliente.valorPotencial) : null,
            grupoHierarquicoId: cliente.grupoHierarquicoId,
            createdAt: new Date(cliente.createdAt),
            updatedAt: new Date(cliente.updatedAt)
          }
        });
      } catch (error) {
        console.log(`⚠️  Erro ao migrar cliente ${cliente.nome}:`, error.message);
      }
    }
    console.log(`✅ ${clientes.length} clientes migrados`);
    
    // Migrar Colaboradores
    console.log('👨‍💼 Migrando colaboradores...');
    const colaboradores = await new Promise((resolve, reject) => {
      db.all("SELECT * FROM colaboradores", (err, rows) => {
        if (err) {
          console.log('ℹ️  Tabela colaboradores não encontrada, pulando...');
          resolve([]);
        } else {
          resolve(rows);
        }
      });
    });
    
    for (const colaborador of colaboradores) {
      try {
        await prisma.colaborador.create({
          data: {
            id: colaborador.id,
            nome: colaborador.nome,
            email: colaborador.email,
            telefone: colaborador.telefone,
            documento: colaborador.documento,
            cargo: colaborador.cargo,
            salario: colaborador.salario ? parseFloat(colaborador.salario) : null,
            dataAdmissao: colaborador.dataAdmissao ? new Date(colaborador.dataAdmissao) : null,
            ativo: Boolean(colaborador.ativo),
            grupoHierarquicoId: colaborador.grupoHierarquicoId,
            createdAt: new Date(colaborador.createdAt),
            updatedAt: new Date(colaborador.updatedAt)
          }
        });
      } catch (error) {
        console.log(`⚠️  Erro ao migrar colaborador ${colaborador.nome}:`, error.message);
      }
    }
    console.log(`✅ ${colaboradores.length} colaboradores migrados`);
    
    // Migrar Permissões
    console.log('🔐 Migrando permissões...');
    const permissoes = await new Promise((resolve, reject) => {
      db.all("SELECT * FROM permissoes", (err, rows) => {
        if (err) {
          console.log('ℹ️  Tabela permissoes não encontrada, pulando...');
          resolve([]);
        } else {
          resolve(rows);
        }
      });
    });
    
    for (const permissao of permissoes) {
      try {
        await prisma.permissao.create({
          data: {
            id: permissao.id,
            nome: permissao.nome,
            descricao: permissao.descricao,
            recurso: permissao.recurso,
            acao: permissao.acao,
            ativo: Boolean(permissao.ativo),
            createdAt: new Date(permissao.createdAt),
            updatedAt: new Date(permissao.updatedAt)
          }
        });
      } catch (error) {
        console.log(`⚠️  Erro ao migrar permissão ${permissao.nome}:`, error.message);
      }
    }
    console.log(`✅ ${permissoes.length} permissões migradas`);
    
    // Migrar Perfis
    console.log('👑 Migrando perfis...');
    const perfis = await new Promise((resolve, reject) => {
      db.all("SELECT * FROM perfis", (err, rows) => {
        if (err) {
          console.log('ℹ️  Tabela perfis não encontrada, pulando...');
          resolve([]);
        } else {
          resolve(rows);
        }
      });
    });
    
    for (const perfil of perfis) {
      try {
        await prisma.perfil.create({
          data: {
            id: perfil.id,
            nome: perfil.nome,
            descricao: perfil.descricao,
            ativo: Boolean(perfil.ativo),
            createdAt: new Date(perfil.createdAt),
            updatedAt: new Date(perfil.updatedAt)
          }
        });
      } catch (error) {
        console.log(`⚠️  Erro ao migrar perfil ${perfil.nome}:`, error.message);
      }
    }
    console.log(`✅ ${perfis.length} perfis migrados`);
    
    // Migrar PerfilPermissao (relacionamentos)
    console.log('🔗 Migrando relacionamentos perfil-permissão...');
    const perfilPermissoes = await new Promise((resolve, reject) => {
      db.all("SELECT * FROM perfil_permissoes", (err, rows) => {
        if (err) {
          console.log('ℹ️  Tabela perfil_permissoes não encontrada, pulando...');
          resolve([]);
        } else {
          resolve(rows);
        }
      });
    });
    
    for (const pp of perfilPermissoes) {
      try {
        await prisma.perfilPermissao.create({
          data: {
            id: pp.id,
            perfilId: pp.perfilId,
            permissaoId: pp.permissaoId,
            createdAt: new Date(pp.createdAt)
          }
        });
      } catch (error) {
        console.log(`⚠️  Erro ao migrar relacionamento perfil-permissão:`, error.message);
      }
    }
    console.log(`✅ ${perfilPermissoes.length} relacionamentos perfil-permissão migrados`);
    
    db.close();
    console.log('🎉 Migração concluída com sucesso!');
    
  } catch (error) {
    console.error('❌ Erro durante a migração:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

migrateData();
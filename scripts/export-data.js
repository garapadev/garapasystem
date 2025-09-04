const { PrismaClient } = require('@prisma/client')
const fs = require('fs')
const path = require('path')

const prisma = new PrismaClient()

async function exportData() {
  try {
    console.log('🔄 Exportando dados do banco...')
    
    // Buscar todos os dados
    const [permissoes, perfis, perfilPermissoes, gruposHierarquicos, colaboradores, usuarios, clientes] = await Promise.all([
      prisma.permissao.findMany(),
      prisma.perfil.findMany(),
      prisma.perfilPermissao.findMany(),
      prisma.grupoHierarquico.findMany(),
      prisma.colaborador.findMany(),
      prisma.usuario.findMany(),
      prisma.cliente.findMany()
    ])

    // Gerar SQL de inserção
    let sql = '-- Dados exportados automaticamente\n\n'
    
    // Permissões
    if (permissoes.length > 0) {
      sql += '-- Permissões\n'
      for (const item of permissoes) {
        const createdAt = item.createdAt ? `'${item.createdAt.toISOString()}'` : `'${new Date().toISOString()}'`
        const updatedAt = item.updatedAt ? `'${item.updatedAt.toISOString()}'` : `'${new Date().toISOString()}'`
        sql += `INSERT INTO "Permissao" ("id", "nome", "descricao", "recurso", "acao", "createdAt", "updatedAt") VALUES ('${item.id}', '${item.nome}', '${item.descricao}', '${item.recurso}', '${item.acao}', ${createdAt}, ${updatedAt}) ON CONFLICT ("id") DO NOTHING;\n`
      }
      sql += '\n'
    }

    // Perfis
    if (perfis.length > 0) {
      sql += '-- Perfis\n'
      for (const item of perfis) {
        const createdAt = item.createdAt ? `'${item.createdAt.toISOString()}'` : `'${new Date().toISOString()}'`
        const updatedAt = item.updatedAt ? `'${item.updatedAt.toISOString()}'` : `'${new Date().toISOString()}'`
        sql += `INSERT INTO "Perfil" ("id", "nome", "descricao", "ativo", "createdAt", "updatedAt") VALUES ('${item.id}', '${item.nome}', '${item.descricao}', ${item.ativo}, ${createdAt}, ${updatedAt}) ON CONFLICT ("id") DO NOTHING;\n`
      }
      sql += '\n'
    }

    // Grupos Hierárquicos
    if (gruposHierarquicos.length > 0) {
      sql += '-- Grupos Hierárquicos\n'
      for (const item of gruposHierarquicos) {
        const parentId = item.parentId ? `'${item.parentId}'` : 'NULL'
        const createdAt = item.createdAt ? `'${item.createdAt.toISOString()}'` : `'${new Date().toISOString()}'`
        const updatedAt = item.updatedAt ? `'${item.updatedAt.toISOString()}'` : `'${new Date().toISOString()}'`
        sql += `INSERT INTO "GrupoHierarquico" ("id", "nome", "descricao", "parentId", "ativo", "createdAt", "updatedAt") VALUES ('${item.id}', '${item.nome}', '${item.descricao}', ${parentId}, ${item.ativo}, ${createdAt}, ${updatedAt}) ON CONFLICT ("id") DO NOTHING;\n`
      }
      sql += '\n'
    }

    // Colaboradores
    if (colaboradores.length > 0) {
      sql += '-- Colaboradores\n'
      for (const item of colaboradores) {
        const grupoId = item.grupoHierarquicoId ? `'${item.grupoHierarquicoId}'` : 'NULL'
        const perfilId = item.perfilId ? `'${item.perfilId}'` : 'NULL'
        const dataAdmissao = item.dataAdmissao ? `'${item.dataAdmissao.toISOString()}'` : 'NULL'
        const dataDemissao = item.dataDemissao ? `'${item.dataDemissao.toISOString()}'` : 'NULL'
        const createdAt = item.createdAt ? `'${item.createdAt.toISOString()}'` : `'${new Date().toISOString()}'`
        const updatedAt = item.updatedAt ? `'${item.updatedAt.toISOString()}'` : `'${new Date().toISOString()}'`
        sql += `INSERT INTO "Colaborador" ("id", "nome", "email", "telefone", "documento", "cargo", "dataAdmissao", "dataDemissao", "ativo", "perfilId", "grupoHierarquicoId", "createdAt", "updatedAt") VALUES ('${item.id}', '${item.nome}', '${item.email}', '${item.telefone || ''}', '${item.documento || ''}', '${item.cargo || ''}', ${dataAdmissao}, ${dataDemissao}, ${item.ativo}, ${perfilId}, ${grupoId}, ${createdAt}, ${updatedAt}) ON CONFLICT ("id") DO NOTHING;\n`
      }
      sql += '\n'
    }

    // Usuários
    if (usuarios.length > 0) {
      sql += '-- Usuários\n'
      for (const item of usuarios) {
        const colaboradorId = item.colaboradorId ? `'${item.colaboradorId}'` : 'NULL'
        const createdAt = item.createdAt ? `'${item.createdAt.toISOString()}'` : `'${new Date().toISOString()}'`
        const updatedAt = item.updatedAt ? `'${item.updatedAt.toISOString()}'` : `'${new Date().toISOString()}'`
        sql += `INSERT INTO "Usuario" ("id", "email", "senha", "ativo", "colaboradorId", "createdAt", "updatedAt") VALUES ('${item.id}', '${item.email}', '${item.senha}', ${item.ativo}, ${colaboradorId}, ${createdAt}, ${updatedAt}) ON CONFLICT ("id") DO NOTHING;\n`
      }
      sql += '\n'
    }

    // Perfil Permissões
    if (perfilPermissoes.length > 0) {
      sql += '-- Perfil Permissões\n'
      for (const item of perfilPermissoes) {
        const createdAt = item.createdAt ? `'${item.createdAt.toISOString()}'` : `'${new Date().toISOString()}'`
        const updatedAt = item.updatedAt ? `'${item.updatedAt.toISOString()}'` : `'${new Date().toISOString()}'`
        sql += `INSERT INTO "PerfilPermissao" ("id", "perfilId", "permissaoId", "createdAt", "updatedAt") VALUES ('${item.id}', '${item.perfilId}', '${item.permissaoId}', ${createdAt}, ${updatedAt}) ON CONFLICT ("id") DO NOTHING;\n`
      }
      sql += '\n'
    }

    // Clientes
    if (clientes.length > 0) {
      sql += '-- Clientes\n'
      for (const item of clientes) {
        const colaboradorId = item.colaboradorId ? `'${item.colaboradorId}'` : 'NULL'
        const createdAt = item.createdAt ? `'${item.createdAt.toISOString()}'` : `'${new Date().toISOString()}'`
        const updatedAt = item.updatedAt ? `'${item.updatedAt.toISOString()}'` : `'${new Date().toISOString()}'`
        sql += `INSERT INTO "Cliente" ("id", "nome", "email", "telefone", "documento", "endereco", "ativo", "colaboradorId", "createdAt", "updatedAt") VALUES ('${item.id}', '${item.nome}', '${item.email || ''}', '${item.telefone || ''}', '${item.documento || ''}', '${item.endereco || ''}', ${item.ativo}, ${colaboradorId}, ${createdAt}, ${updatedAt}) ON CONFLICT ("id") DO NOTHING;\n`
      }
      sql += '\n'
    }

    // Salvar arquivo
    const outputPath = path.join(__dirname, '..', 'prisma', 'init-data.sql')
    fs.writeFileSync(outputPath, sql)
    
    console.log('✅ Dados exportados com sucesso!')
    console.log(`📁 Arquivo salvo em: ${outputPath}`)
    console.log(`📊 Estatísticas:`)
    console.log(`   - Permissões: ${permissoes.length}`)
    console.log(`   - Perfis: ${perfis.length}`)
    console.log(`   - Grupos: ${gruposHierarquicos.length}`)
    console.log(`   - Colaboradores: ${colaboradores.length}`)
    console.log(`   - Usuários: ${usuarios.length}`)
    console.log(`   - Clientes: ${clientes.length}`)
    
  } catch (error) {
    console.error('❌ Erro ao exportar dados:', error)
    process.exit(1)
  } finally {
    await prisma.$disconnect()
  }
}

exportData()
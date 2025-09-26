#!/usr/bin/env node

/**
 * Script para verificar se o banco de dados está vazio (sem usuários)
 * Retorna exit code 0 se vazio, 1 se contém dados
 */

const { PrismaClient } = require('@prisma/client')

async function checkDatabaseEmpty() {
  const prisma = new PrismaClient()
  
  try {
    console.log('🔍 Verificando se o banco de dados está vazio...')
    
    // Verifica se existe pelo menos um usuário
    const userCount = await prisma.usuario.count()
    
    if (userCount === 0) {
      console.log('✅ Banco de dados está vazio (sem usuários)')
      process.exit(0) // Banco vazio
    } else {
      console.log(`📊 Banco de dados contém ${userCount} usuário(s)`)
      process.exit(1) // Banco contém dados
    }
  } catch (error) {
    console.error('❌ Erro ao verificar banco de dados:', error.message)
    
    // Se a tabela não existe, consideramos o banco como vazio
    if (error.code === 'P2021' || error.message.includes('does not exist')) {
      console.log('✅ Tabela de usuários não existe - banco considerado vazio')
      process.exit(0)
    }
    
    process.exit(2) // Erro
  } finally {
    await prisma.$disconnect()
  }
}

checkDatabaseEmpty()
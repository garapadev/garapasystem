const { getServerSession } = require('next-auth');
const { authOptions } = require('./src/lib/auth');
const { NextRequest } = require('next/server');

// Simular uma requisição para testar a sessão
async function testSession() {
  try {
    console.log('Testando configuração de sessão...');
    console.log('AuthOptions:', {
      providers: authOptions.providers?.length || 0,
      session: authOptions.session,
      callbacks: Object.keys(authOptions.callbacks || {}),
      pages: authOptions.pages
    });
    
    // Verificar se NEXTAUTH_SECRET está definido
    console.log('NEXTAUTH_SECRET definido:', !!process.env.NEXTAUTH_SECRET);
    console.log('NEXTAUTH_URL:', process.env.NEXTAUTH_URL);
    
  } catch (error) {
    console.error('Erro ao testar sessão:', error);
  }
}

testSession();
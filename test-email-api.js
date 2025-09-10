const fetch = require('node-fetch');
const FormData = require('form-data');

async function testEmailAPI() {
  try {
    console.log('🔍 Testando API de envio de email...');
    
    // Primeiro, fazer login para obter session
    console.log('🔐 Fazendo login...');
    
    const loginResponse = await fetch('http://localhost:3000/api/auth/signin', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email: 'admin@garapasystem.com',
        password: 'admin123'
      })
    });
    
    console.log('Login status:', loginResponse.status);
    
    if (!loginResponse.ok) {
      console.log('❌ Falha no login');
      return;
    }
    
    // Extrair cookies de sessão
    const cookies = loginResponse.headers.get('set-cookie');
    console.log('🍪 Cookies obtidos:', cookies ? 'Sim' : 'Não');
    
    // Preparar dados do email
    const formData = new FormData();
    formData.append('to', 'ronaldo@garapasystem.com');
    formData.append('subject', 'Teste API - Debug Error 500');
    formData.append('body', 'Este é um teste para identificar o erro 500.');
    formData.append('isHtml', 'false');
    formData.append('isDraft', 'false');
    
    console.log('📧 Enviando email via API...');
    
    // Fazer requisição para envio de email
    const emailResponse = await fetch('http://localhost:3000/api/emails/send', {
      method: 'POST',
      headers: {
        'Cookie': cookies || ''
      },
      body: formData
    });
    
    console.log('📨 Status da resposta:', emailResponse.status);
    console.log('📨 Headers da resposta:', Object.fromEntries(emailResponse.headers.entries()));
    
    const responseText = await emailResponse.text();
    console.log('📨 Corpo da resposta:', responseText);
    
    if (!emailResponse.ok) {
      console.log('❌ Erro na API de email');
      
      // Tentar parsear como JSON
      try {
        const errorData = JSON.parse(responseText);
        console.log('📋 Dados do erro:', errorData);
      } catch (e) {
        console.log('📋 Resposta não é JSON válido');
      }
    } else {
      console.log('✅ Email enviado com sucesso!');
    }
    
  } catch (error) {
    console.error('❌ Erro durante teste:', error);
    console.error('Stack trace:', error.stack);
  }
}

testEmailAPI().catch(console.error);
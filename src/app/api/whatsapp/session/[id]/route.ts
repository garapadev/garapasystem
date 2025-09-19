import { NextRequest, NextResponse } from 'next/server';

// Esta rota existe para compatibilidade com chamadas antigas
// Redireciona para a rota correta /api/whatsapp/sessions/[id]
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const sessionId = params.id;
  
  // Redirecionar para a rota correta
  return NextResponse.redirect(
    new URL(`/api/whatsapp/sessions/${sessionId}`, request.url),
    { status: 301 }
  );
}

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const sessionId = params.id;
  
  // Redirecionar para a rota correta
  return NextResponse.redirect(
    new URL(`/api/whatsapp/sessions/${sessionId}`, request.url),
    { status: 301 }
  );
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const sessionId = params.id;
  
  // Redirecionar para a rota correta
  return NextResponse.redirect(
    new URL(`/api/whatsapp/sessions/${sessionId}`, request.url),
    { status: 301 }
  );
}
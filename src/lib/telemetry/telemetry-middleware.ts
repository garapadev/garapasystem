// telemetry-middleware.ts - Middleware de telemetria para Next.js
import { NextRequest, NextResponse } from 'next/server'

// Versão simplificada para Edge Runtime
let telemetryInitialized = false

// Função para gerar trace ID único (compatível com Edge Runtime)
function generateTraceId(): string {
  // Gera um trace ID de 32 caracteres hexadecimais (formato OpenTelemetry)
  const timestamp = Date.now().toString(16)
  const randomPart = Math.random().toString(16).substring(2, 18)
  const traceId = (timestamp + randomPart).padEnd(32, '0').substring(0, 32)
  return traceId
}

function ensureTelemetryInitialized() {
  if (!telemetryInitialized) {
    // No Edge Runtime, apenas marcar como inicializado
    telemetryInitialized = true
    console.log('✅ Telemetria marcada como inicializada (Edge Runtime)')
  }
}

export function telemetryMiddleware(request: NextRequest) {
  ensureTelemetryInitialized()
  
  const startTime = Date.now()
  const pathname = request.nextUrl.pathname
  const method = request.method
  
  // Criar contexto de telemetria simplificado
  const telemetryContext = {
    startTime,
    pathname,
    method,
    userAgent: request.headers.get('user-agent') || 'unknown',
    ip: request.ip || request.headers.get('x-forwarded-for') || 'unknown',
    traceId: generateTraceId()
  }

  // Log simples para Edge Runtime
  console.log(`📊 [Telemetry] ${method} ${pathname} - ${telemetryContext.traceId}`)

  return {
    request,
    telemetryContext
  }
}

export function finalizeTelemetry(
  response: NextResponse,
  telemetryContext: any,
  pathname: string,
  method: string
) {
  const endTime = Date.now()
  const duration = endTime - telemetryContext.startTime
  const statusCode = response.status

  // Log simples para Edge Runtime
  console.log(`📊 [Telemetry] ${method} ${pathname} - ${statusCode} - ${duration}ms`)

  // Adicionar headers de telemetria à resposta
  response.headers.set('x-trace-id', telemetryContext.traceId)
  response.headers.set('x-response-time', `${duration}ms`)

  return response
}

// Função para extrair contexto de telemetria de headers
export function extractTelemetryContext(request: NextRequest) {
  return {
    traceId: request.headers.get('x-telemetry-trace-id'),
    spanId: request.headers.get('x-telemetry-span-id'),
    startTime: parseInt(request.headers.get('x-telemetry-start-time') || '0')
  };
}
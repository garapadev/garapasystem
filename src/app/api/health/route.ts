import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { instrumentApiRoute, instrumentDatabaseOperation } from "@/lib/telemetry/api-instrumentation";

// Instrumentar operação de banco de dados
const checkDatabase = instrumentDatabaseOperation(
  async () => {
    await db.$queryRaw`SELECT 1`;
    return "connected";
  },
  "health_check",
  "system"
);

async function healthHandler() {
  try {
    // Verificar conexão com o banco de dados usando função instrumentada
    const databaseStatus = await checkDatabase();
    
    return NextResponse.json({ 
      status: "healthy",
      message: "Application is running",
      timestamp: new Date().toISOString(),
      database: databaseStatus
    });
  } catch (error) {
    console.error('Health check failed:', error);
    return NextResponse.json(
      { 
        status: "unhealthy",
        message: "Database connection failed",
        timestamp: new Date().toISOString(),
        database: "disconnected"
      },
      { status: 503 }
    );
  }
}

// Exportar handlers instrumentados
const instrumentedHandlers = instrumentApiRoute({
  GET: healthHandler
}, '/api/health');

export const GET = instrumentedHandlers.GET;
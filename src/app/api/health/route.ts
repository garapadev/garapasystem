import { NextResponse } from "next/server";
import { db } from "@/lib/db";

async function healthHandler() {
  try {
    // Verificar conexão com o banco de dados
    await db.$queryRaw`SELECT 1`;
    const databaseStatus = "connected";
    
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

export const GET = healthHandler;
import { NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function GET() {
  try {
    // Verificar conexão com o banco de dados
    await db.$queryRaw`SELECT 1`;
    
    return NextResponse.json({ 
      status: "healthy",
      message: "Application is running",
      timestamp: new Date().toISOString(),
      database: "connected"
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
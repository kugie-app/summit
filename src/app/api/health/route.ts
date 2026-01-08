import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db/client';

export async function GET(request: NextRequest) {
  try {
    // Basic health check
    const health = {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      environment: process.env.NODE_ENV || 'development',
    };

    // Optional: Check database connectivity
    try {
      // Simple query to verify database connection
      await db.execute('SELECT 1');
      health.database = 'connected';
    } catch (dbError) {
      health.database = 'disconnected';
      health.status = 'unhealthy';
    }

    return NextResponse.json(health, { 
      status: health.status === 'healthy' ? 200 : 503 
    });
  } catch (error) {
    return NextResponse.json(
      {
        status: 'unhealthy',
        error: error instanceof Error ? error.message : 'Health check failed',
        timestamp: new Date().toISOString(),
      },
      { status: 503 }
    );
  }
}
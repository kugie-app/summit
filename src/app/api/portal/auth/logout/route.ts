import { NextRequest, NextResponse } from 'next/server';
import { deleteClientJWTCookie } from '@/lib/auth/client/utils';

export async function POST(request: NextRequest) {
  try {
    // Delete the client JWT cookie
    await deleteClientJWTCookie();

    return NextResponse.json(
      { success: true },
      { status: 200 }
    );
  } catch (error) {
    console.error('Error during logout:', error);
    return NextResponse.json(
      { error: 'An error occurred during logout' },
      { status: 500 }
    );
  }
} 
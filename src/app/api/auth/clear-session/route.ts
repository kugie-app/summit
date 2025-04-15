import { NextResponse } from 'next/server';

export async function POST() {
  try {
    // Clear all next-auth related cookies
    const nextAuthCookies = [
      'next-auth.session-token',
      'next-auth.callback-url',
      'next-auth.csrf-token',
      '__Secure-next-auth.callback-url',
      '__Secure-next-auth.csrf-token', 
      '__Secure-next-auth.session-token',
      '__Host-next-auth.csrf-token'
    ];
    
    // Create a response and clear the cookies
    const response = NextResponse.json({ success: true });
    
    // Set each cookie to an empty value and expire it immediately
    for (const cookie of nextAuthCookies) {
      response.cookies.set({
        name: cookie,
        value: '',
        expires: new Date(0),
        path: '/',
      });
    }
    
    return response;
  } catch (error) {
    console.error('Error clearing session:', error);
    return NextResponse.json(
      { message: 'Failed to clear session' },
      { status: 500 }
    );
  }
} 
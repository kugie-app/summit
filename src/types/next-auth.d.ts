import 'next-auth';

declare module 'next-auth' {
  interface User {
    role?: string;
    companyId?: string;
  }
  
  interface Session {
    user: {
      id: string;
      name?: string | null;
      email?: string | null;
      image?: string | null;
      role: string;
      companyId?: string;
    }
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    id: string;
    role?: string;
    companyId?: string;
  }
} 
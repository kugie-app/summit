import 'next-auth';

declare module 'next-auth' {
  interface User {
    role?: string;
    companyId?: string;
    permissions?: Record<string, boolean>;
  }
  
  interface Session {
    user: {
      id: string;
      name?: string | null;
      email?: string | null;
      image?: string | null;
      role: string;
      companyId?: string;
      permissions?: Record<string, boolean>;
    }
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    id: string;
    role?: string;
    companyId?: string;
    permissions?: Record<string, boolean>;
  }
} 
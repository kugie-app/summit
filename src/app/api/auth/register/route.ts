import { NextResponse } from 'next/server';
import { z } from 'zod';
import { hash } from 'bcrypt';
import { db } from '@/lib/db';
import { companies, users } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import { config } from '@/lib/config';

// Validation schema for registration
const registerSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  email: z.string().email('Please enter a valid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  companyName: z.string().min(2, 'Company name must be at least 2 characters'),
});

export async function POST(request: Request) {
  try {
    // Check if signups are disabled
    if (config.isSignupDisabled) {
      return NextResponse.json(
        { message: 'Signups are currently disabled' },
        { status: 403 }
      );
    }
    
    // Parse and validate the request body
    const body = await request.json();
    const validatedData = registerSchema.parse(body);

    // Check if user already exists
    const existingUser = await db
      .select({ id: users.id })
      .from(users)
      .where(eq(users.email, validatedData.email))
      .limit(1);

    if (existingUser.length > 0) {
      return NextResponse.json(
        { message: 'User with this email already exists' },
        { status: 409 }
      );
    }

    // Hash the password
    const hashedPassword = await hash(validatedData.password, 10);

    // Create the company
    const [newCompany] = await db
      .insert(companies)
      .values({
        name: validatedData.companyName,
        createdAt: new Date(),
        updatedAt: new Date(),
      })
      .returning({ id: companies.id });

    if (!newCompany) {
      throw new Error('Failed to create company');
    }

    // Create the user with admin role
    const [newUser] = await db
      .insert(users)
      .values({
        name: validatedData.name,
        email: validatedData.email,
        password: hashedPassword,
        role: 'admin',
        companyId: newCompany.id,
        createdAt: new Date(),
        updatedAt: new Date(),
      })
      .returning({ id: users.id });

    if (!newUser) {
      // If user creation fails, roll back by deleting the company
      await db.delete(companies).where(eq(companies.id, newCompany.id));
      throw new Error('Failed to create user');
    }

    // Success
    return NextResponse.json({ 
      message: 'User registered successfully',
      userId: newUser.id,
    }, { status: 201 });
  } catch (error) {
    console.error('Registration error:', error);
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { message: 'Validation error', errors: error.errors },
        { status: 400 }
      );
    }
    
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    );
  }
} 
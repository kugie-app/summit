import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { db } from '@/lib/db';
import { invoices, clients } from '@/lib/db/schema';
import { and, eq, sql, or, not, inArray } from 'drizzle-orm';
import { authOptions } from '@/lib/auth/options';
import { differenceInDays } from 'date-fns';

// GET /api/reports/outstanding-invoices
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user || !session.user.companyId) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    const companyId = parseInt(session.user.companyId);
    
    // Get all outstanding invoices (not paid, not cancelled) using Drizzle query builder
    const outstandingInvoicesResult = await db
      .select({
        id: invoices.id,
        invoiceNumber: invoices.invoiceNumber,
        issueDate: invoices.issueDate,
        dueDate: invoices.dueDate,
        total: invoices.total,
        status: invoices.status,
        clientId: clients.id,
        clientName: clients.name
      })
      .from(invoices)
      .innerJoin(clients, eq(invoices.clientId, clients.id))
      .where(
        and(
          eq(invoices.companyId, companyId),
          eq(invoices.softDelete, false),
          not(inArray(invoices.status, ['paid', 'cancelled']))
        )
      )
      .orderBy(invoices.dueDate);
    
    // Process and categorize the invoices
    const today = new Date();
    const outstandingInvoices = outstandingInvoicesResult.map(row => {
      const dueDate = new Date(row.dueDate);
      const daysOverdue = differenceInDays(today, dueDate);
      
      // Categorize by age
      let ageCategory = 'current';
      if (daysOverdue > 0) {
        if (daysOverdue <= 30) ageCategory = '1-30';
        else if (daysOverdue <= 60) ageCategory = '31-60';
        else if (daysOverdue <= 90) ageCategory = '61-90';
        else ageCategory = '90+';
      }
      
      return {
        id: row.id,
        invoiceNumber: row.invoiceNumber,
        issueDate: row.issueDate,
        dueDate: row.dueDate,
        total: parseFloat(row.total.toString()),
        status: row.status,
        clientId: row.clientId,
        clientName: row.clientName,
        daysOverdue: Math.max(0, daysOverdue),
        ageCategory
      };
    });
    
    // Summarize by age category
    const agingCategories = ['current', '1-30', '31-60', '61-90', '90+'];
    const agingSummary = agingCategories.reduce((acc, category) => {
      const invoices = outstandingInvoices.filter(inv => inv.ageCategory === category);
      acc[category] = {
        count: invoices.length,
        amount: invoices.reduce((sum, inv) => sum + inv.total, 0)
      };
      return acc;
    }, {} as Record<string, { count: number; amount: number }>);
    
    // Calculate totals
    const totalOutstanding = outstandingInvoices.reduce((sum, inv) => sum + inv.total, 0);
    const totalOverdue = outstandingInvoices
      .filter(inv => inv.daysOverdue > 0)
      .reduce((sum, inv) => sum + inv.total, 0);
    
    // Get top clients with outstanding balances
    const clientOutstanding: Record<string, { clientId: number; clientName: string; amount: number }> = {};
    
    outstandingInvoices.forEach(invoice => {
      if (!clientOutstanding[invoice.clientId]) {
        clientOutstanding[invoice.clientId] = {
          clientId: invoice.clientId,
          clientName: invoice.clientName,
          amount: 0
        };
      }
      clientOutstanding[invoice.clientId].amount += invoice.total;
    });
    
    const topClients = Object.values(clientOutstanding)
      .sort((a, b) => b.amount - a.amount)
      .slice(0, 5);
    
    return NextResponse.json({
      outstandingInvoices,
      agingSummary,
      summary: {
        totalOutstanding,
        totalOverdue,
        invoiceCount: outstandingInvoices.length,
        overdueCount: outstandingInvoices.filter(inv => inv.daysOverdue > 0).length
      },
      topClients
    });
    
  } catch (error) {
    console.error('Error generating outstanding invoices report:', error);
    return NextResponse.json(
      { message: 'Failed to generate outstanding invoices report' },
      { status: 500 }
    );
  }
} 
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { db } from '@/lib/db';
import { invoices, clients } from '@/lib/db/schema';
import { and, eq, sql, or, not } from 'drizzle-orm';
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
    
    // Get all outstanding invoices (not paid, not cancelled)
    const outstandingInvoicesQuery = sql`
      SELECT 
        i.id,
        i.invoice_number,
        i.issue_date,
        i.due_date,
        i.total,
        i.status,
        c.id as client_id,
        c.name as client_name
      FROM invoices i
      JOIN clients c ON i.client_id = c.id
      WHERE 
        i.company_id = ${companyId}
        AND i.soft_delete = false
        AND i.status NOT IN ('paid', 'cancelled')
      ORDER BY i.due_date ASC
    `;
    
    const outstandingInvoicesResult = await db.execute(outstandingInvoicesQuery);
    
    // Process and categorize the invoices
    const today = new Date();
    const outstandingInvoices = outstandingInvoicesResult.rows.map(row => {
      const dueDate = new Date(row.due_date as string);
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
        invoiceNumber: row.invoice_number,
        issueDate: row.issue_date,
        dueDate: row.due_date,
        total: parseFloat(row.total as string),
        status: row.status,
        clientId: row.client_id,
        clientName: row.client_name,
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
      if (!clientOutstanding[invoice.clientId as number]) {
        clientOutstanding[invoice.clientId as number] = {
          clientId: invoice.clientId as number,
          clientName: invoice.clientName as string,
          amount: 0
        };
      }
      clientOutstanding[invoice.clientId as number].amount += invoice.total;
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
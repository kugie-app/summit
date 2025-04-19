'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import RecurringTransactionsButton from '@/components/dashboard/RecurringTransactionsButton';
import { format } from 'date-fns';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { AlertCircle, Clock, RefreshCw } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

interface RecurringExpense {
  id: number;
  vendor: string;
  description: string | null;
  amount: string;
  currency: string;
  expenseDate: string;
  nextDueDate: string;
  recurring: 'daily' | 'weekly' | 'monthly' | 'yearly';
  status: 'pending' | 'approved' | 'rejected';
  category: { id: number; name: string } | null;
}

interface RecurringIncome {
  id: number;
  source: string;
  description: string | null;
  amount: string;
  currency: string;
  incomeDate: string;
  nextDueDate: string | null;
  recurring: 'daily' | 'weekly' | 'monthly' | 'yearly';
  category: { id: number; name: string } | null;
  client: { id: number; name: string } | null;
}

interface ApiIncomeResponse {
  income: {
    id: number;
    source: string;
    description: string | null;
    amount: string;
    currency: string;
    incomeDate: string;
    nextDueDate: string | null;
    recurring: 'daily' | 'weekly' | 'monthly' | 'yearly';
  };
  category: { id: number; name: string } | null;
  client: { id: number; name: string } | null;
}

export default function RecurringTransactionsPage() {
  const [activeTab, setActiveTab] = useState('expenses');
  const [expenses, setExpenses] = useState<RecurringExpense[]>([]);
  const [income, setIncome] = useState<RecurringIncome[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  
  // Format currency
  const formatCurrency = (amount: string, currency: string) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: currency || 'IDR',
      minimumFractionDigits: 2
    }).format(parseFloat(amount));
  };
  
  // Format date
  const formatDate = (dateString: string | null) => {
    if (!dateString) return 'N/A';
    return format(new Date(dateString), 'MMM dd, yyyy');
  };
  
  // Get badge color for recurring frequency
  const getFrequencyColor = (frequency: string) => {
    switch (frequency) {
      case 'daily': return 'bg-red-100 text-red-800 border-red-200';
      case 'weekly': return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'monthly': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'yearly': return 'bg-green-100 text-green-800 border-green-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };
  
  // Fetch recurring transactions data
  const fetchData = async () => {
    setIsLoading(true);
    
    try {
      // Fetch recurring expenses
      const expensesRes = await fetch('/api/expenses?recurring=true');
      if (!expensesRes.ok) throw new Error('Failed to fetch recurring expenses');
      const expensesData = await expensesRes.json();
      
      // Fetch recurring income
      const incomeRes = await fetch('/api/income?recurring=true');
      if (!incomeRes.ok) throw new Error('Failed to fetch recurring income');
      const incomeData = await incomeRes.json();
      
      // Process expenses data
      setExpenses(expensesData.data || []);
      
      // Process income data
      if (incomeData && incomeData.data) {
        // Transform the income data to match the expected format
        const formattedIncome = incomeData.data.map((item: ApiIncomeResponse) => ({
          id: item.income.id,
          source: item.income.source,
          description: item.income.description,
          amount: item.income.amount,
          currency: item.income.currency,
          incomeDate: item.income.incomeDate,
          nextDueDate: item.income.nextDueDate,
          recurring: item.income.recurring,
          category: item.category,
          client: item.client
        }));
        
        setIncome(formattedIncome);
      } else {
        setIncome([]);
      }
    } catch (error) {
      console.error('Error fetching recurring transactions:', error);
      toast.error('Failed to load recurring transactions');
    } finally {
      setIsLoading(false);
    }
  };
  
  // Initial data load
  useEffect(() => {
    fetchData();
  }, []);
  
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Recurring Transactions</h1>
          <p className="text-muted-foreground mt-1">
            Manage expenses and income that automatically repeat on a schedule
          </p>
        </div>
        <RecurringTransactionsButton />
      </div>
      
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5" />
            Scheduled Transactions
          </CardTitle>
          <CardDescription>
            Transactions with recurring schedules will automatically generate new entries when they become due
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="expenses" value={activeTab} onValueChange={setActiveTab}>
            <TabsList>
              <TabsTrigger value="expenses">Recurring Expenses</TabsTrigger>
              <TabsTrigger value="income">Recurring Income</TabsTrigger>
            </TabsList>
            <TabsContent value="expenses" className="mt-4">
              {isLoading ? (
                <div className="py-8 text-center text-muted-foreground">
                  Loading recurring expenses...
                </div>
              ) : expenses.length === 0 ? (
                <div className="py-8 text-center text-muted-foreground">
                  <AlertCircle className="h-12 w-12 mx-auto mb-3 text-muted-foreground/50" />
                  <p>No recurring expenses found</p>
                  <p className="text-sm mt-1">To create a recurring expense, set the &quot;Recurring&quot; field when adding a new expense</p>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Vendor</TableHead>
                      <TableHead>Category</TableHead>
                      <TableHead>Amount</TableHead>
                      <TableHead>Frequency</TableHead>
                      <TableHead>Next Due</TableHead>
                      <TableHead>Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {expenses.map((expense) => (
                      <TableRow key={expense.id}>
                        <TableCell className="font-medium">{expense.vendor}</TableCell>
                        <TableCell>{expense.category?.name || 'Uncategorized'}</TableCell>
                        <TableCell>{formatCurrency(expense.amount, expense.currency)}</TableCell>
                        <TableCell>
                          <Badge variant="outline" className={getFrequencyColor(expense.recurring)}>
                            <RefreshCw className="h-3 w-3 mr-1 inline" />
                            {expense.recurring.charAt(0).toUpperCase() + expense.recurring.slice(1)}
                          </Badge>
                        </TableCell>
                        <TableCell>{formatDate(expense.nextDueDate)}</TableCell>
                        <TableCell>
                          <Badge variant={expense.status === 'approved' ? 'default' : expense.status === 'rejected' ? 'destructive' : 'outline'}>
                            {expense.status.charAt(0).toUpperCase() + expense.status.slice(1)}
                          </Badge>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </TabsContent>
            <TabsContent value="income" className="mt-4">
              {isLoading ? (
                <div className="py-8 text-center text-muted-foreground">
                  Loading recurring income...
                </div>
              ) : income.length === 0 ? (
                <div className="py-8 text-center text-muted-foreground">
                  <AlertCircle className="h-12 w-12 mx-auto mb-3 text-muted-foreground/50" />
                  <p>No recurring income found</p>
                  <p className="text-sm mt-1">To create recurring income, set the &quot;Recurring&quot; field when adding a new income entry</p>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Source</TableHead>
                      <TableHead>Client</TableHead>
                      <TableHead>Category</TableHead>
                      <TableHead>Amount</TableHead>
                      <TableHead>Frequency</TableHead>
                      <TableHead>Next Due</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {income.map((item) => (
                      <TableRow key={item.id}>
                        <TableCell className="font-medium">{item.source}</TableCell>
                        <TableCell>{item.client?.name || 'N/A'}</TableCell>
                        <TableCell>{item.category?.name || 'Uncategorized'}</TableCell>
                        <TableCell>{formatCurrency(item.amount, item.currency)}</TableCell>
                        <TableCell>
                          <Badge variant="outline" className={getFrequencyColor(item.recurring)}>
                            <RefreshCw className="h-3 w-3 mr-1 inline" />
                            {item.recurring.charAt(0).toUpperCase() + item.recurring.slice(1)}
                          </Badge>
                        </TableCell>
                        <TableCell>{formatDate(item.nextDueDate)}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
} 
'use client';

import React, { useEffect, useState } from 'react';
import { formatCurrency, formatNumber, cn } from '@/lib/utils';
import { StatCard } from '@/components/dashboard/StatCard';
import { NewProfitLossChart } from '@/components/dashboard/NewProfitLossChart';
import { VisitorsChart } from '@/components/dashboard/VisitorsChart';
import { ExpensesChart } from '@/components/dashboard/ExpensesChart';
import { NewAgingReceivablesChart } from '@/components/dashboard/NewAgingReceivablesChart';
import { DollarSign, FileText, CreditCard, TrendingUp, TrendingDown, AlertTriangle, CalendarIcon } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { format, subMonths, startOfMonth, endOfMonth, isBefore } from 'date-fns';

// Predefined date range options
const DATE_RANGES = {
  THIS_MONTH: 'this_month',
  LAST_MONTH: 'last_month',
  LAST_3_MONTHS: 'last_3_months',
  LAST_6_MONTHS: 'last_6_months',
  YEAR_TO_DATE: 'year_to_date',
  CUSTOM: 'custom',
};

const DashboardPage = () => {
  const [isLoading, setIsLoading] = useState(true);
  const [profitLossData, setProfitLossData] = useState<any>(null);
  const [invoiceSummary, setInvoiceSummary] = useState<any>(null);
  const [agingReceivables, setAgingReceivables] = useState<any>(null);
  const [expensesData, setExpensesData] = useState<any>(null);
  
  // Date filter states
  const [dateRangeType, setDateRangeType] = useState(DATE_RANGES.LAST_6_MONTHS);
  const [startDate, setStartDate] = useState<Date | undefined>(subMonths(new Date(), 6));
  const [endDate, setEndDate] = useState<Date | undefined>(new Date());
  const [isCalendarOpen, setIsCalendarOpen] = useState(false);

  // Handle date range selection
  const handleDateRangeChange = (range: string) => {
    const today = new Date();
    
    setDateRangeType(range);
    
    switch (range) {
      case DATE_RANGES.THIS_MONTH:
        setStartDate(startOfMonth(today));
        setEndDate(today);
        break;
      case DATE_RANGES.LAST_MONTH:
        const lastMonth = subMonths(today, 1);
        setStartDate(startOfMonth(lastMonth));
        setEndDate(endOfMonth(lastMonth));
        break;
      case DATE_RANGES.LAST_3_MONTHS:
        setStartDate(subMonths(today, 3));
        setEndDate(today);
        break;
      case DATE_RANGES.LAST_6_MONTHS:
        setStartDate(subMonths(today, 6));
        setEndDate(today);
        break;
      case DATE_RANGES.YEAR_TO_DATE:
        setStartDate(new Date(today.getFullYear(), 0, 1)); // January 1st of current year
        setEndDate(today);
        break;
      case DATE_RANGES.CUSTOM:
        // Don't change the dates, just set the type
        setIsCalendarOpen(true);
        break;
    }
  };

  // Format dates for API calls
  const getFormattedDates = () => {
    return {
      startDate: startDate ? format(startDate, 'yyyy-MM-dd') : undefined,
      endDate: endDate ? format(endDate, 'yyyy-MM-dd') : undefined,
    };
  };

  useEffect(() => {
    const fetchDashboardData = async () => {
      setIsLoading(true);

      try {
        const { startDate: formattedStartDate, endDate: formattedEndDate } = getFormattedDates();
        
        // Build query params
        const params = new URLSearchParams();
        if (formattedStartDate) params.append('startDate', formattedStartDate);
        if (formattedEndDate) params.append('endDate', formattedEndDate);
        
        const queryString = params.toString();
        const paramString = queryString ? `?${queryString}` : '';
        
        // Fetch profit/loss data
        const profitLossResponse = await fetch(`/api/reports/profit-loss${paramString}`);
        const profitLossData = await profitLossResponse.json();

        // Fetch invoice summary
        const invoiceSummaryResponse = await fetch(`/api/reports/invoice-summary${paramString}`);
        const invoiceSummaryData = await invoiceSummaryResponse.json();

        // Fetch aging receivables
        const agingReceivablesResponse = await fetch(`/api/reports/aging-receivables${paramString}`);
        const agingReceivablesData = await agingReceivablesResponse.json();

        // Fetch expense breakdown
        const expensesResponse = await fetch(`/api/reports/expense-breakdown${paramString}`);
        const expensesData = await expensesResponse.json();

        setProfitLossData(profitLossData);
        setInvoiceSummary(invoiceSummaryData);
        setAgingReceivables(agingReceivablesData);
        setExpensesData(expensesData);
      } catch (error) {
        console.error('Error fetching dashboard data:', error);
      } finally {
        setIsLoading(false);
      }
    };

    // Only fetch if we have valid dates
    if (startDate && endDate) {
      fetchDashboardData();
    }
  }, [startDate, endDate]);

  // Calculate date range display
  const getDateRangeDisplay = () => {
    if (!startDate || !endDate) return 'Select date range';
    
    return `${format(startDate, 'MMM d, yyyy')} - ${format(endDate, 'MMM d, yyyy')}`;
  };

  return (
    <div className="space-y-4 p-8">
      <div className="flex justify-between items-center">
        <h2 className="text-3xl font-bold tracking-tight">Dashboard</h2>
        
        {/* Date Range Filter */}
        <div className="flex items-center gap-2">
          <div className="flex gap-2">
            <Button 
              variant={dateRangeType === DATE_RANGES.THIS_MONTH ? "default" : "outline"} 
              size="sm"
              onClick={() => handleDateRangeChange(DATE_RANGES.THIS_MONTH)}
            >
              This Month
            </Button>
            <Button 
              variant={dateRangeType === DATE_RANGES.LAST_MONTH ? "default" : "outline"} 
              size="sm"
              onClick={() => handleDateRangeChange(DATE_RANGES.LAST_MONTH)}
            >
              Last Month
            </Button>
            <Button 
              variant={dateRangeType === DATE_RANGES.LAST_3_MONTHS ? "default" : "outline"} 
              size="sm"
              onClick={() => handleDateRangeChange(DATE_RANGES.LAST_3_MONTHS)}
            >
              Last 3 Months
            </Button>
            <Button 
              variant={dateRangeType === DATE_RANGES.LAST_6_MONTHS ? "default" : "outline"} 
              size="sm"
              onClick={() => handleDateRangeChange(DATE_RANGES.LAST_6_MONTHS)}
            >
              Last 6 Months
            </Button>
          </div>
          
          <Popover open={isCalendarOpen} onOpenChange={setIsCalendarOpen}>
            <PopoverTrigger asChild>
              <Button 
                variant={dateRangeType === DATE_RANGES.CUSTOM ? "default" : "outline"}
                size="sm"
                onClick={() => handleDateRangeChange(DATE_RANGES.CUSTOM)}
                className="flex items-center gap-2"
              >
                <CalendarIcon className="h-4 w-4" />
                <span>{getDateRangeDisplay()}</span>
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="end">
              <div className="grid gap-4 p-4">
                <div className="grid grid-cols-2 gap-2">
                  <div className="space-y-2">
                    <div className="font-medium text-sm">Start Date</div>
                    <Calendar
                      mode="single"
                      selected={startDate}
                      onSelect={(date) => {
                        setStartDate(date);
                        // If start date is after end date, reset end date
                        if (date && endDate && isBefore(endDate, date)) {
                          setEndDate(date);
                        }
                      }}
                      initialFocus
                    />
                  </div>
                  <div className="space-y-2">
                    <div className="font-medium text-sm">End Date</div>
                    <Calendar
                      mode="single"
                      selected={endDate}
                      onSelect={setEndDate}
                      disabled={(date) => startDate ? isBefore(date, startDate) : false}
                      initialFocus
                    />
                  </div>
                </div>
                <Button
                  onClick={() => setIsCalendarOpen(false)}
                >
                  Apply Range
                </Button>
              </div>
            </PopoverContent>
          </Popover>
        </div>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <Card key={i} className="p-6 h-32 animate-pulse bg-muted/40" />
          ))}
        </div>
      ) : (
        <>
          {/* Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {invoiceSummary && (
              <>
                <StatCard
                  title="Total Outstanding"
                  value={formatCurrency(
                    (invoiceSummary.overdue?.total || 0) + (invoiceSummary.unpaid?.total || 0)
                  )}
                  description={`${formatNumber(invoiceSummary.overdue.count + invoiceSummary.unpaid.count)} open invoices`}
                  icon={DollarSign}
                />
                <StatCard
                  title="Overdue"
                  value={formatCurrency(invoiceSummary.overdue.total)}
                  description={`${formatNumber(invoiceSummary.overdue.count)} invoices`}
                  icon={AlertTriangle}
                  trend={invoiceSummary.trends?.overdue}
                />
                <StatCard
                  title="Draft Invoices"
                  value={formatNumber(invoiceSummary.draft.count)}
                  description={`Worth ${formatCurrency(invoiceSummary.draft.total)}`}
                  icon={FileText}
                />
                <StatCard
                  title="Paid Invoices"
                  value={formatCurrency(invoiceSummary.paid.total)}
                  description={`${formatNumber(invoiceSummary.paid.count)} invoices`}
                  icon={CreditCard}
                  trend={invoiceSummary.trends?.paid}
                />
              </>
            )}
          </div>

          {/* Tabs for different report types */}
          <Tabs defaultValue="financials" className="space-y-4">
            <TabsList>
              <TabsTrigger value="financials">Financials</TabsTrigger>
              <TabsTrigger value="invoices">Invoices</TabsTrigger>
              <TabsTrigger value="expenses">Expenses</TabsTrigger>
            </TabsList>
            
            <TabsContent value="financials" className="space-y-4">
              {/* Profit/Loss Chart - Using new shadcn chart */}
              {profitLossData && profitLossData.months && (
                <div className="grid gap-4 grid-cols-1 lg:grid-cols-2">
                  <NewProfitLossChart 
                    data={profitLossData.months} 
                    startDate={startDate}
                    endDate={endDate}
                  />
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <StatCard
                      title="Monthly Average Income"
                      value={formatCurrency(
                        profitLossData.months.reduce((sum: number, m: any) => sum + m.income, 0) / 
                        profitLossData.months.length
                      )}
                      icon={TrendingUp}
                    />
                    <StatCard
                      title="Monthly Average Expenses"
                      value={formatCurrency(
                        profitLossData.months.reduce((sum: number, m: any) => sum + m.expenses, 0) / 
                        profitLossData.months.length
                      )}
                      icon={TrendingDown}
                    />
                    <StatCard
                      title={`Total Income (${dateRangeType === DATE_RANGES.LAST_6_MONTHS ? '6m' : 'period'})`}
                      value={formatCurrency(
                        profitLossData.months.reduce((sum: number, m: any) => sum + m.income, 0)
                      )}
                      icon={TrendingUp}
                    />
                    <StatCard
                      title={`Total Expenses (${dateRangeType === DATE_RANGES.LAST_6_MONTHS ? '6m' : 'period'})`}
                      value={formatCurrency(
                        profitLossData.months.reduce((sum: number, m: any) => sum + m.expenses, 0)
                      )}
                      icon={TrendingDown}
                    />
                  </div>
                </div>
              )}
            </TabsContent>
            
            <TabsContent value="invoices" className="space-y-4">
              {/* Aging Receivables - Using new shadcn chart */}
              {agingReceivables && (
                <div className="grid gap-4 grid-cols-1 lg:grid-cols-2">
                  <NewAgingReceivablesChart 
                    data={agingReceivables} 
                    startDate={startDate}
                    endDate={endDate}
                  />
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <StatCard
                      title="Current (0-30 days)"
                      value={formatCurrency(agingReceivables.current.total)}
                      description={`${formatNumber(agingReceivables.current.count)} invoices`}
                    />
                    <StatCard
                      title="31-60 days"
                      value={formatCurrency(agingReceivables.thirtyToSixty.total)}
                      description={`${formatNumber(agingReceivables.thirtyToSixty.count)} invoices`}
                    />
                    <StatCard
                      title="61-90 days"
                      value={formatCurrency(agingReceivables.sixtyToNinety.total)}
                      description={`${formatNumber(agingReceivables.sixtyToNinety.count)} invoices`}
                    />
                    <StatCard
                      title="Over 90 days"
                      value={formatCurrency(agingReceivables.overNinety.total)}
                      description={`${formatNumber(agingReceivables.overNinety.count)} invoices`}
                    />
                  </div>
                </div>
              )}
            </TabsContent>
            
            <TabsContent value="expenses" className="space-y-4">
              {/* Expenses Chart - Using real data from API */}
              <div className="grid gap-4 grid-cols-1 lg:grid-cols-2">
                <ExpensesChart 
                  title="Expense Distribution"
                  description={`Expense categories from ${format(startDate!, 'MMM d, yyyy')} to ${format(endDate!, 'MMM d, yyyy')}`}
                  data={expensesData?.expensesByCategory}
                  isLoading={isLoading}
                />
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {expensesData?.expensesByCategory && expensesData.expensesByCategory.length > 0 ? (
                    <>
                      <StatCard
                        title="Largest Expense"
                        value={expensesData.expensesByCategory[0].category}
                        description={`${((expensesData.expensesByCategory[0].amount / expensesData.totalExpenses) * 100).toFixed(0)}% of total expenses`}
                        icon={TrendingDown}
                      />
                      <StatCard
                        title="Total Categories"
                        value={expensesData.expensesByCategory.length.toString()}
                        description="Active expense categories"
                        icon={FileText}
                      />
                      <StatCard
                        title="Monthly Average"
                        value={formatCurrency(expensesData.totalExpenses / (expensesData.expensesByMonth?.length || 1))}
                        description="Per month expense"
                        icon={TrendingDown}
                      />
                      <StatCard
                        title="Total Expenses"
                        value={formatCurrency(expensesData.totalExpenses)}
                        description="All categories"
                        icon={TrendingDown}
                      />
                    </>
                  ) : (
                    // No expense data available
                    <>
                      <StatCard
                        title="Largest Expense"
                        value="N/A"
                        description="No expense data"
                        icon={TrendingDown}
                      />
                      <StatCard
                        title="Total Categories"
                        value="0"
                        description="No active categories"
                        icon={FileText}
                      />
                      <StatCard
                        title="Monthly Average"
                        value={formatCurrency(0)}
                        description="No expense data"
                        icon={TrendingDown}
                      />
                      <StatCard
                        title="Total Expenses"
                        value={formatCurrency(0)}
                        description="No expense data"
                        icon={TrendingDown}
                      />
                    </>
                  )}
                </div>
              </div>
            </TabsContent>
          </Tabs>
        </>
      )}
    </div>
  );
};

export default DashboardPage; 
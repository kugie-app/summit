'use client';

import React, { useEffect, useState } from 'react';
import { formatCurrency, formatNumber } from '@/lib/utils';
import { StatCard } from '@/components/dashboard/StatCard';
import ProfitLossChart from '@/components/dashboard/ProfitLossChart';
import AgingReceivablesChart from '@/components/dashboard/AgingReceivablesChart';
import { DollarSign, FileText, CreditCard, TrendingUp, TrendingDown, AlertTriangle } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';

const DashboardPage = () => {
  const [isLoading, setIsLoading] = useState(true);
  const [profitLossData, setProfitLossData] = useState<any>(null);
  const [invoiceSummary, setInvoiceSummary] = useState<any>(null);
  const [agingReceivables, setAgingReceivables] = useState<any>(null);

  useEffect(() => {
    const fetchDashboardData = async () => {
      setIsLoading(true);

      try {
        // Fetch profit/loss data
        const profitLossResponse = await fetch('/api/reports/profit-loss');
        const profitLossData = await profitLossResponse.json();

        // Fetch invoice summary
        const invoiceSummaryResponse = await fetch('/api/reports/invoice-summary');
        const invoiceSummaryData = await invoiceSummaryResponse.json();

        // Fetch aging receivables
        const agingReceivablesResponse = await fetch('/api/reports/aging-receivables');
        const agingReceivablesData = await agingReceivablesResponse.json();

        setProfitLossData(profitLossData);
        setInvoiceSummary(invoiceSummaryData);
        setAgingReceivables(agingReceivablesData);
      } catch (error) {
        console.error('Error fetching dashboard data:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  return (
    <div className="space-y-4 p-8">
      <div className="flex justify-between items-center">
        <h2 className="text-3xl font-bold tracking-tight">Dashboard</h2>
        {/* <Button variant="outline">Export Report</Button> */}
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
                  trend={{
                    value: 8.2,
                    label: "vs. last month",
                    positive: false
                  }}
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
                  trend={{
                    value: 12.5,
                    label: "vs. last month",
                    positive: true
                  }}
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
              {/* Profit/Loss Chart */}
              {profitLossData && profitLossData.months && (
                <div className="grid gap-4 grid-cols-1 lg:grid-cols-2">
                  <ProfitLossChart data={profitLossData.months} />
                  
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
                      title="Total Income (6m)"
                      value={formatCurrency(
                        profitLossData.months.reduce((sum: number, m: any) => sum + m.income, 0)
                      )}
                      icon={TrendingUp}
                    />
                    <StatCard
                      title="Total Expenses (6m)"
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
              {/* Aging Receivables */}
              {agingReceivables && (
                <div className="grid gap-4 grid-cols-1 lg:grid-cols-2">
                  <AgingReceivablesChart data={agingReceivables} />
                  
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
              <div className="h-[400px] border rounded-lg flex items-center justify-center">
                <p className="text-muted-foreground">Expense analytics will be available soon.</p>
              </div>
            </TabsContent>
          </Tabs>
        </>
      )}
    </div>
  );
};

export default DashboardPage; 
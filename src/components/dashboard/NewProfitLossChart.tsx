"use client"

import { Bar, BarChart, CartesianGrid, XAxis, YAxis } from "recharts"
import { format } from "date-fns"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { 
  ChartContainer, 
  ChartTooltip, 
  ChartTooltipContent, 
  ChartLegend, 
  ChartLegendContent,
  type ChartConfig
} from "@/components/ui/chart"
import { formatCurrency } from "@/lib/utils"

// Types
type MonthData = {
  month: string;
  income: number;
  expenses: number;
  profit: number;
};

interface ProfitLossChartProps {
  data: MonthData[];
  title?: string;
  description?: string;
  currency?: string;
  startDate?: Date;
  endDate?: Date;
}

// Month name mapping
const monthNames: { [key: string]: string } = {
  '01': 'Jan',
  '02': 'Feb',
  '03': 'Mar',
  '04': 'Apr',
  '05': 'May',
  '06': 'Jun',
  '07': 'Jul',
  '08': 'Aug',
  '09': 'Sep',
  '10': 'Oct',
  '11': 'Nov',
  '12': 'Dec'
};

// Y-axis formatting
const formatYAxis = (value: number): string => {
  if (value >= 1000000) {
    return `${(value / 1000000).toFixed(1)}M`;
  } else if (value >= 1000) {
    return `${(value / 1000).toFixed(1)}K`;
  }
  return value.toString();
};

// Chart configuration
const chartConfig: ChartConfig = {
  income: {
    label: "Income",
    color: "hsl(var(--chart-1))"
  },
  expenses: {
    label: "Expenses",
    color: "hsl(var(--chart-3))"
  },
  profit: {
    label: "Profit",
    color: "hsl(var(--chart-2))"
  }
};

export function NewProfitLossChart({ 
  data, 
  title = 'Profit & Loss', 
  description = 'Monthly income, expenses, and profit',
  currency = 'IDR',
  startDate,
  endDate
}: ProfitLossChartProps) {
  // Format the month display (from YYYY-MM to Month name)
  const formattedData = data.map(item => ({
    ...item,
    month: item.month.split('-')[1] ? monthNames[item.month.split('-')[1]] || item.month : item.month
  }));

  // Calculate totals for display
  const totalIncome = data.reduce((sum, item) => sum + item.income, 0);
  const totalExpenses = data.reduce((sum, item) => sum + item.expenses, 0);
  const totalProfit = data.reduce((sum, item) => sum + item.profit, 0);

  // Generate date range description if dates are provided
  const dateRangeDesc = startDate && endDate
    ? `Data from ${format(startDate, 'MMM d, yyyy')} to ${format(endDate, 'MMM d, yyyy')}`
    : description;

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        <CardDescription>{dateRangeDesc}</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-3 gap-4 mb-8">
          <div className="text-center">
            <p className="text-muted-foreground text-sm">Income</p>
            <p className="text-xl font-bold text-[hsl(var(--chart-1))]">
              {formatCurrency(totalIncome, currency)}
            </p>
          </div>
          <div className="text-center">
            <p className="text-muted-foreground text-sm">Expenses</p>
            <p className="text-xl font-bold text-[hsl(var(--chart-3))]">
              {formatCurrency(totalExpenses, currency)}
            </p>
          </div>
          <div className="text-center">
            <p className="text-muted-foreground text-sm">Profit</p>
            <p className="text-xl font-bold text-[hsl(var(--chart-2))]">
              {formatCurrency(totalProfit, currency)}
            </p>
          </div>
        </div>
        <ChartContainer config={chartConfig} className="min-h-[300px] w-full">
          <BarChart
            accessibilityLayer
            data={formattedData}
            margin={{
              top: 20,
              right: 30,
              left: 20,
              bottom: 5,
            }}
          >
            <CartesianGrid strokeDasharray="3 3" vertical={false} />
            <XAxis 
              dataKey="month" 
              tickLine={false} 
              tickMargin={10} 
              axisLine={false}
            />
            <YAxis 
              tickFormatter={formatYAxis} 
              tickLine={false}
              axisLine={false}
            />
            <ChartTooltip 
              content={
                <ChartTooltipContent 
                  formatter={(value) => [formatCurrency(Number(value), currency), '']}
                />
              } 
            />
            <ChartLegend content={<ChartLegendContent />} />
            <Bar dataKey="income" fill="hsl(var(--chart-1))" radius={4} />
            <Bar dataKey="expenses" fill="hsl(var(--chart-3))" radius={4} />
            <Bar dataKey="profit" fill="hsl(var(--chart-2))" radius={4} />
          </BarChart>
        </ChartContainer>
      </CardContent>
    </Card>
  );
} 
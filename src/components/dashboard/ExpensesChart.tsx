"use client"

import { Cell, Pie, PieChart } from "recharts"

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

// Example of expected data structure
type ExpenseCategory = {
  category: string;
  amount: number;
}

// Chart configuration dynamic generation function
const generateChartConfig = (data: ExpenseCategory[]) => {
  const colors = [
    "hsl(var(--chart-1))",
    "hsl(var(--chart-2))",
    "hsl(var(--chart-3))",
    "hsl(var(--chart-4))",
    "hsl(var(--chart-5))",
    "hsl(var(--chart-6))",
    "hsl(var(--chart-7))",
    "hsl(var(--chart-8))"
  ];
  
  const config: Record<string, { label: string; color: string }> = {};
  
  data.forEach((item, index) => {
    const key = item.category.toLowerCase().replace(/\s+/g, '_');
    config[key] = {
      label: item.category,
      color: colors[index % colors.length]
    };
  });
  
  return config as ChartConfig;
};

interface ExpensesChartProps {
  data?: ExpenseCategory[];
  title?: string;
  description?: string;
  isLoading?: boolean;
}

export function ExpensesChart({ 
  data = [],
  title = "Expense Categories",
  description = "Distribution of expenses by category",
  isLoading = false
}: ExpensesChartProps) {
  // If no data or loading, display empty state or loading state
  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>{title}</CardTitle>
          <CardDescription>{description}</CardDescription>
        </CardHeader>
        <CardContent className="min-h-[300px] flex items-center justify-center">
          <p className="text-muted-foreground">Loading expense data...</p>
        </CardContent>
      </Card>
    );
  }
  
  if (data.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>{title}</CardTitle>
          <CardDescription>{description}</CardDescription>
        </CardHeader>
        <CardContent className="min-h-[300px] flex items-center justify-center">
          <p className="text-muted-foreground">No expense data available for the selected period</p>
        </CardContent>
      </Card>
    );
  }

  // Calculate total
  const total = data.reduce((sum, item) => sum + item.amount, 0);
  
  // Transform data for chart
  const transformedData = data.map(item => {
    const key = item.category.toLowerCase().replace(/\s+/g, '_');
    return {
      category: item.category,
      value: item.amount,
      key: key,
      fill: `var(--color-${key})`,
      percentage: ((item.amount / total) * 100).toFixed(1)
    };
  });

  // Generate chart config from data
  const chartConfig = generateChartConfig(data);

  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="text-center mb-4">
          <p className="text-muted-foreground text-sm">Total Expenses</p>
          <p className="text-2xl font-bold">
            {formatCurrency(total)}
          </p>
        </div>
        <ChartContainer config={chartConfig} className="min-h-[300px] w-full">
          <PieChart accessibilityLayer>
            <Pie
              data={transformedData}
              dataKey="value"
              nameKey="category"
              cx="50%"
              cy="50%"
              outerRadius={80}
              label={({ percentage }) => `${percentage}%`}
              labelLine={false}
            >
              {transformedData.map((entry) => (
                <Cell key={entry.category} fill={entry.fill} />
              ))}
            </Pie>
            <ChartTooltip 
              content={
                <ChartTooltipContent 
                  labelKey="category"
                  nameKey="category"
                />
              } 
            />
            <ChartLegend 
              content={
                <ChartLegendContent 
                  nameKey="category"
                />
              } 
            />
          </PieChart>
        </ChartContainer>
      </CardContent>
    </Card>
  )
} 
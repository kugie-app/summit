"use client"

import { Cell, Pie, PieChart } from "recharts"
import { format } from "date-fns"

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  ChartLegend,
  ChartLegendContent,
} from "@/components/ui/chart"
import { formatCurrency } from "@/lib/utils"

type AgingData = {
  range: string;
  count: number;
  total: number;
};

interface AgingReceivablesChartProps {
  data: {
    current: AgingData;
    thirtyToSixty: AgingData;
    sixtyToNinety: AgingData;
    overNinety: AgingData;
  };
  title?: string;
  description?: string;
  currency?: string;
  startDate?: Date;
  endDate?: Date;
}

// Chart configuration
const chartConfig: ChartConfig = {
  current: {
    label: "Current (0-30 days)",
    color: "hsl(var(--chart-1))"
  },
  thirtyToSixty: {
    label: "31-60 days",
    color: "hsl(var(--chart-2))"
  },
  sixtyToNinety: {
    label: "61-90 days",
    color: "hsl(var(--chart-3))"
  },
  overNinety: {
    label: "Over 90 days",
    color: "hsl(var(--chart-4))"
  }
}

export function NewAgingReceivablesChart({
  data,
  title = "Aging Receivables",
  description = "Outstanding invoices by age",
  currency = "IDR",
  startDate,
  endDate
}: AgingReceivablesChartProps) {
  // Transform data for the pie chart
  const chartData = [
    {
      name: "Current",
      key: "current",
      value: data.current.total,
      count: data.current.count,
      fill: "hsl(var(--chart-1))"
    },
    {
      name: "31-60 Days",
      key: "thirtyToSixty",
      value: data.thirtyToSixty.total,
      count: data.thirtyToSixty.count,
      fill: "hsl(var(--chart-2))"
    },
    {
      name: "61-90 Days",
      key: "sixtyToNinety",
      value: data.sixtyToNinety.total,
      count: data.sixtyToNinety.count,
      fill: "hsl(var(--chart-3))"
    },
    {
      name: "90+ Days",
      key: "overNinety",
      value: data.overNinety.total,
      count: data.overNinety.count,
      fill: "hsl(var(--chart-4))"
    }
  ]

  // Calculate the total
  const total = chartData.reduce((sum, item) => sum + item.value, 0)
  
  // Add percentage for labels
  const dataWithPercentage = chartData.map(item => ({
    ...item,
    percentage: ((item.value / total) * 100).toFixed(1)
  }))

  // Generate date range description if dates are provided
  const dateRangeDesc = startDate && endDate
    ? `Data from ${format(startDate, 'MMM d, yyyy')} to ${format(endDate, 'MMM d, yyyy')}`
    : description

  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        <CardDescription>{dateRangeDesc}</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="text-center mb-4">
          <p className="text-muted-foreground text-sm">Total Outstanding</p>
          <p className="text-2xl font-bold">{formatCurrency(total, currency)}</p>
        </div>
        <ChartContainer 
          config={chartConfig} 
          className="mx-auto aspect-square min-h-[300px] [&_.recharts-pie-label-text]:fill-foreground"
        >
          <PieChart accessibilityLayer>
            <ChartTooltip 
              content={
                <ChartTooltipContent 
                  formatter={(value) => [formatCurrency(Number(value), currency), '']} 
                />
              } 
            />
            <Pie
              data={dataWithPercentage}
              dataKey="value"
              nameKey="key"
              cx="50%"
              cy="50%"
              outerRadius={80}
              label={({ percentage }) => `${percentage}%`}
            >
              {dataWithPercentage.map(entry => (
                <Cell key={entry.key} fill={entry.fill} />
              ))}
            </Pie>
            <ChartLegend content={<ChartLegendContent />} />
          </PieChart>
        </ChartContainer>
      </CardContent>
    </Card>
  )
} 
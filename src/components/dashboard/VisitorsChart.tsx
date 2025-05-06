"use client"

import { Bar, BarChart, CartesianGrid, XAxis } from "recharts"

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

// Sample data - this will be replaced with real API data
const chartData = [
  { month: "Jan", desktop: 12873, mobile: 13004 },
  { month: "Feb", desktop: 15402, mobile: 14908 },
  { month: "Mar", desktop: 13209, mobile: 12728 },
  { month: "Apr", desktop: 14803, mobile: 15204 },
  { month: "May", desktop: 16209, mobile: 17034 },
  { month: "Jun", desktop: 18402, mobile: 17841 }
]

// Chart configuration
const chartConfig = {
  desktop: {
    label: "Desktop",
    color: "hsl(var(--chart-1))"
  },
  mobile: {
    label: "Mobile",
    color: "hsl(var(--chart-2))"
  }
} satisfies ChartConfig

interface VisitorsChartProps {
  data?: typeof chartData
  title?: string
  description?: string
}

export function VisitorsChart({ 
  data = chartData,
  title = "Visitors",
  description = "Total visitors for the last 6 months"
}: VisitorsChartProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex items-center justify-center space-x-4 mb-4">
          <div className="text-center">
            <p className="text-muted-foreground text-sm">Desktop</p>
            <p className="text-2xl font-bold">
              {data.reduce((sum, item) => sum + item.desktop, 0).toLocaleString()}
            </p>
          </div>
          <div className="text-center">
            <p className="text-muted-foreground text-sm">Mobile</p>
            <p className="text-2xl font-bold">
              {data.reduce((sum, item) => sum + item.mobile, 0).toLocaleString()}
            </p>
          </div>
        </div>
        <ChartContainer config={chartConfig} className="min-h-[300px] w-full">
          <BarChart accessibilityLayer data={data}>
            <CartesianGrid vertical={false} />
            <XAxis 
              dataKey="month" 
              tickLine={false} 
              tickMargin={10} 
              axisLine={false}
            />
            <ChartTooltip content={<ChartTooltipContent />} />
            <ChartLegend content={<ChartLegendContent />} />
            <Bar dataKey="desktop" fill="var(--color-desktop)" radius={4} />
            <Bar dataKey="mobile" fill="var(--color-mobile)" radius={4} />
          </BarChart>
        </ChartContainer>
      </CardContent>
    </Card>
  )
} 
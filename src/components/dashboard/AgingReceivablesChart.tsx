'use client';

import React from 'react';
import {
  PieChart,
  Pie,
  Cell,
  Legend,
  Tooltip,
  ResponsiveContainer
} from 'recharts';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { formatCurrency } from '@/lib/utils';

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
}

const COLORS = ['#4ade80', '#facc15', '#f97316', '#ef4444'];

const CustomTooltip = ({ active, payload, currency }: any) => {
  if (active && payload && payload.length) {
    const data = payload[0].payload;
    return (
      <div className="bg-background p-2 rounded shadow border">
        <p className="font-semibold">{data.range}</p>
        <p>Amount: {formatCurrency(data.total, currency)}</p>
        <p>Invoices: {data.count}</p>
      </div>
    );
  }
  return null;
};

const AgingReceivablesChart = ({
  data,
  title = 'Aging Receivables',
  description = 'Outstanding invoices by age',
  currency = 'IDR'
}: AgingReceivablesChartProps) => {
  // Transform data for the pie chart
  const chartData = [
    {
      name: 'Current',
      ...data.current,
      value: data.current.total,
    },
    {
      name: '31-60 Days',
      ...data.thirtyToSixty,
      value: data.thirtyToSixty.total,
    },
    {
      name: '61-90 Days',
      ...data.sixtyToNinety,
      value: data.sixtyToNinety.total,
    },
    {
      name: '90+ Days',
      ...data.overNinety,
      value: data.overNinety.total,
    },
  ];

  // Calculate the total
  const total = chartData.reduce((sum, item) => sum + item.total, 0);

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="text-center mb-4">
          <p className="text-muted-foreground">Total Outstanding</p>
          <p className="text-2xl font-bold">{formatCurrency(total, currency)}</p>
        </div>
        <div className="h-[300px]">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={chartData}
                cx="50%"
                cy="50%"
                labelLine={false}
                outerRadius={80}
                fill="#8884d8"
                dataKey="value"
                nameKey="name"
              >
                {chartData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip content={<CustomTooltip currency={currency} />} />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
};

export default AgingReceivablesChart; 
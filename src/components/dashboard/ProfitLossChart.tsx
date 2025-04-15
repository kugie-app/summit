'use client'

import React from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer
} from 'recharts';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { formatCurrency } from '@/lib/utils';

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
}

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

const formatYAxis = (value: number): string => {
  if (value >= 1000000) {
    return `${(value / 1000000).toFixed(1)}M`;
  } else if (value >= 1000) {
    return `${(value / 1000).toFixed(1)}K`;
  }
  return value.toString();
};

const ProfitLossChart = ({ 
  data, 
  title = 'Profit & Loss', 
  description = 'Monthly income, expenses, and profit',
  currency = 'IDR'
}: ProfitLossChartProps) => {
  // Format the month display (from YYYY-MM to Month name)
  const formattedData = data.map(item => ({
    ...item,
    month: item.month.split('-')[1] ? monthNames[item.month.split('-')[1]] || item.month : item.month
  }));

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="h-[300px]">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={formattedData}
              margin={{
                top: 20,
                right: 30,
                left: 20,
                bottom: 5,
              }}
            >
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="month" />
              <YAxis tickFormatter={formatYAxis} />
              <Tooltip 
                formatter={(value: number) => [formatCurrency(value, currency), '']}
                labelFormatter={(label) => `Month: ${label}`}
              />
              <Legend />
              <Bar dataKey="income" name="Income" fill="#4ade80" />
              <Bar dataKey="expenses" name="Expenses" fill="#f87171" />
              <Bar dataKey="profit" name="Profit" fill="#60a5fa" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
};

export default ProfitLossChart; 
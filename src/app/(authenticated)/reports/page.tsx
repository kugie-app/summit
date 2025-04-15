'use client';

import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { CalendarIcon, DownloadIcon, FileText, PieChart, BarChart3, LineChart } from 'lucide-react';
import { format } from 'date-fns';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { cn } from '@/lib/utils';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Separator } from '@/components/ui/separator';

// Report types
const REPORT_TYPES = [
  {
    id: 'profit-loss',
    name: 'Profit & Loss',
    description: 'Analyze your business income, expenses, and resulting profit or loss',
    icon: LineChart,
  },
  {
    id: 'invoice-summary',
    name: 'Invoice Summary',
    description: 'Summary of invoices by status, client, and time period',
    icon: FileText,
  },
  {
    id: 'expense-analysis',
    name: 'Expense Analysis',
    description: 'Breakdown of expenses by category and time period',
    icon: PieChart,
  },
  {
    id: 'aging-receivables',
    name: 'Aging Receivables',
    description: 'Outstanding customer balances grouped by age',
    icon: BarChart3,
  },
];

const ReportsPage = () => {
  const [reportType, setReportType] = useState('profit-loss');
  const [startDate, setStartDate] = useState<Date | undefined>(
    new Date(new Date().setMonth(new Date().getMonth() - 6))
  );
  const [endDate, setEndDate] = useState<Date | undefined>(new Date());
  const [isGenerating, setIsGenerating] = useState(false);

  const handleGenerateReport = async () => {
    if (!startDate || !endDate) return;
    
    setIsGenerating(true);
    
    try {
      // Format dates
      const start = format(startDate, 'yyyy-MM-dd');
      const end = format(endDate, 'yyyy-MM-dd');
      
      // Different API endpoint based on report type
      const endpoint = `/api/reports/${reportType}?startDate=${start}&endDate=${end}`;
      
      const response = await fetch(endpoint);
      
      if (!response.ok) {
        throw new Error('Failed to generate report');
      }
      
      // For download functionality:
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${reportType}-${start}-to-${end}.csv`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      
    } catch (error) {
      console.error('Error generating report:', error);
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Reports</h1>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
        {/* Filters sidebar */}
        <div className="md:col-span-3 space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Report Filters</CardTitle>
              <CardDescription>Select the type and date range</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Report Type</label>
                <Select value={reportType} onValueChange={setReportType}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select report type" />
                  </SelectTrigger>
                  <SelectContent>
                    {REPORT_TYPES.map(type => (
                      <SelectItem key={type.id} value={type.id}>
                        {type.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div className="space-y-2">
                <label className="text-sm font-medium">Start Date</label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn(
                        "w-full justify-start text-left font-normal",
                        !startDate && "text-muted-foreground"
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {startDate ? format(startDate, "PPP") : "Pick a date"}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0">
                    <Calendar
                      mode="single"
                      selected={startDate}
                      onSelect={setStartDate}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
              </div>
              
              <div className="space-y-2">
                <label className="text-sm font-medium">End Date</label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn(
                        "w-full justify-start text-left font-normal",
                        !endDate && "text-muted-foreground"
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {endDate ? format(endDate, "PPP") : "Pick a date"}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0">
                    <Calendar
                      mode="single"
                      selected={endDate}
                      onSelect={setEndDate}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
              </div>
              
              <Button 
                className="w-full mt-4" 
                onClick={handleGenerateReport} 
                disabled={isGenerating || !startDate || !endDate}
              >
                {isGenerating ? "Generating..." : "Generate Report"}
              </Button>
              
              <Button 
                variant="outline" 
                className="w-full" 
                disabled={isGenerating || !startDate || !endDate}
              >
                <DownloadIcon className="mr-2 h-4 w-4" />
                Download CSV
              </Button>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader>
              <CardTitle>Report Descriptions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {REPORT_TYPES.map(type => (
                <div key={type.id} className="space-y-1">
                  <div className="flex items-center space-x-2">
                    <type.icon className="h-4 w-4 text-muted-foreground" />
                    <h3 className="font-medium">{type.name}</h3>
                  </div>
                  <p className="text-sm text-muted-foreground">{type.description}</p>
                  {type.id !== REPORT_TYPES[REPORT_TYPES.length - 1].id && (
                    <Separator className="my-2" />
                  )}
                </div>
              ))}
            </CardContent>
          </Card>
        </div>
        
        {/* Report preview */}
        <div className="md:col-span-9">
          <Tabs defaultValue="preview" className="w-full">
            <TabsList className="mb-4">
              <TabsTrigger value="preview">Preview</TabsTrigger>
              <TabsTrigger value="data">Data</TabsTrigger>
            </TabsList>
            
            <TabsContent value="preview" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>
                    {REPORT_TYPES.find(t => t.id === reportType)?.name || 'Report'} Preview
                  </CardTitle>
                  <CardDescription>
                    {startDate && endDate 
                      ? `${format(startDate, 'PP')} to ${format(endDate, 'PP')}` 
                      : 'Select a date range'}
                  </CardDescription>
                </CardHeader>
                <CardContent className="h-[600px] flex items-center justify-center border rounded-md">
                  <div className="text-center">
                    <p className="text-muted-foreground">
                      {isGenerating 
                        ? "Generating report preview..." 
                        : "Select report type and date range, then click Generate Report"}
                    </p>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
            
            <TabsContent value="data">
              <Card>
                <CardHeader>
                  <CardTitle>
                    {REPORT_TYPES.find(t => t.id === reportType)?.name || 'Report'} Data
                  </CardTitle>
                  <CardDescription>
                    Raw data that powers the visualization
                  </CardDescription>
                </CardHeader>
                <CardContent className="h-[600px] overflow-auto">
                  <div className="text-center pt-8">
                    <p className="text-muted-foreground">
                      {isGenerating 
                        ? "Loading data..." 
                        : "Select report type and date range, then click Generate Report"}
                    </p>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
};

export default ReportsPage; 
'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { format } from 'date-fns';
import { ArrowLeft, Download, Send, Pencil, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';

interface InvoiceItem {
  id: number;
  description: string;
  quantity: string;
  unitPrice: string;
  amount: string;
}

interface Invoice {
  id: number;
  companyId: number;
  clientId: number;
  invoiceNumber: string;
  status: 'draft' | 'sent' | 'paid' | 'overdue' | 'cancelled';
  issueDate: string;
  dueDate: string;
  subtotal: string;
  tax: string;
  total: string;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
  paidAt: string | null;
  client: {
    id: number;
    name: string;
    email: string | null;
    phone: string | null;
    address: string | null;
  };
  items: InvoiceItem[];
}

export default function InvoiceDetailPage({ params }: { params: Promise<{ invoiceId: string }> }) {
  const router = useRouter();
  const [invoice, setInvoice] = useState<Invoice | null>(null);
  const [loading, setLoading] = useState(true);
  const [sendingEmail, setSendingEmail] = useState(false);
  
  useEffect(() => {
    const fetchInvoice = async () => {
      setLoading(true);
      try {
        const { invoiceId } = await params;
        const response = await fetch(`/api/invoices/${invoiceId}`);
        
        if (!response.ok) {
          throw new Error('Failed to fetch invoice');
        }
        
        const data = await response.json();
        setInvoice(data);
      } catch (error) {
        console.error('Error fetching invoice:', error);
        toast.error('Failed to load invoice details');
      } finally {
        setLoading(false);
      }
    };
    
    fetchInvoice();
  }, [params]);
  
  const handleDelete = async () => {
    try {
      const { invoiceId } = await params;
      const response = await fetch(`/api/invoices/${invoiceId}`, {
        method: 'DELETE',
      });
      
      if (!response.ok) {
        throw new Error('Failed to delete invoice');
      }
      
      toast.success('Invoice deleted successfully');
      router.push('/invoices');
    } catch (error) {
      console.error('Error deleting invoice:', error);
      toast.error('Failed to delete invoice');
    }
  };
  
  const handleStatusUpdate = async (newStatus: Invoice['status']) => {
    try {
      if (!invoice) return;
      
      const { invoiceId } = await params;
      const response = await fetch(`/api/invoices/${invoiceId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...invoice,
          status: newStatus,
        }),
      });
      
      if (!response.ok) {
        throw new Error(`Failed to update invoice status to ${newStatus}`);
      }
      
      const updatedInvoice = await response.json();
      setInvoice(updatedInvoice);
      toast.success(`Invoice marked as ${newStatus}`);
    } catch (error) {
      console.error('Error updating invoice status:', error);
      toast.error('Failed to update invoice status');
    }
  };
  
  const handleDownloadPdf = async () => {
    if (!invoice) return;
    
    try {
      const { invoiceId } = await params;
      
      // Directly fetch the PDF from the API
      const response = await fetch(`/api/invoices/${invoiceId}/pdf`);
      
      if (!response.ok) {
        throw new Error('Failed to generate PDF');
      }
      
      // Create a blob from the PDF data
      const blob = await response.blob();
      
      // Create a URL for the blob
      const url = window.URL.createObjectURL(blob);
      
      // Create a temporary anchor element and trigger download
      const a = document.createElement('a');
      a.href = url;
      a.download = `invoice-${invoice.invoiceNumber}.pdf`;
      document.body.appendChild(a);
      a.click();
      
      // Clean up
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      
      toast.success('PDF downloaded successfully');
    } catch (error) {
      console.error('Error downloading PDF:', error);
      toast.error('Failed to download PDF');
    }
  };
  
  const handleSendEmail = async () => {
    if (!invoice) return;
    
    // Check if client has an email
    if (!invoice.client.email) {
      toast.error('Client does not have an email address');
      return;
    }
    
    setSendingEmail(true);
    
    try {
      const { invoiceId } = await params;
      const response = await fetch(`/api/invoices/${invoiceId}/send-email`, {
        method: 'POST',
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to send email');
      }

      toast.success('Email sent successfully');
      
      // Refresh invoice data if status was updated
      if (invoice.status === 'draft') {
        const { invoiceId } = await params;
        const updatedInvoiceResponse = await fetch(`/api/invoices/${invoiceId}`);
        if (updatedInvoiceResponse.ok) {
          const updatedInvoice = await updatedInvoiceResponse.json();
          setInvoice(updatedInvoice);
        }
      }
    } catch (error) {
      console.error('Error sending email:', error);
      toast.error((error as Error).message || 'Failed to send email');
    } finally {
      setSendingEmail(false);
    }
  };
  
  if (loading) {
    return (
      <div className="container mx-auto py-6">
        <div className="flex justify-center items-center h-64">
          <p>Loading invoice details...</p>
        </div>
      </div>
    );
  }
  
  if (!invoice) {
    return (
      <div className="container mx-auto py-6">
        <div className="flex justify-center items-center h-64">
          <p>Invoice not found or you don&apos;t have permission to view it.</p>
        </div>
      </div>
    );
  }
  
  const getStatusColor = (status: Invoice['status']) => {
    switch (status) {
      case 'draft': return 'bg-gray-500';
      case 'sent': return 'bg-blue-500';
      case 'paid': return 'bg-green-500';
      case 'overdue': return 'bg-red-500';
      case 'cancelled': return 'bg-gray-500';
      default: return 'bg-gray-500';
    }
  };
  
  return (
    <div className="container mx-auto py-6 space-y-8">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="icon" onClick={() => router.push('/invoices')}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Invoice {invoice.invoiceNumber}</h1>
            <p className="text-muted-foreground">
              {invoice.client.name} • {format(new Date(invoice.createdAt), 'PPP')}
            </p>
          </div>
        </div>
        
        <div className="flex gap-2">
          <Badge className={`${getStatusColor(invoice.status)} text-white`}>
            {invoice.status.charAt(0).toUpperCase() + invoice.status.slice(1)}
          </Badge>
          
          <Button variant="outline" size="sm" onClick={handleDownloadPdf}>
            <Download className="h-4 w-4 mr-2" />
            Download PDF
          </Button>
          
          {invoice.status === 'draft' && (
            <>
              <Button variant="outline" size="sm" onClick={() => handleStatusUpdate('sent')}>
                <Send className="h-4 w-4 mr-2" />
                Mark as Sent
              </Button>
              
              <Button
                variant="outline"
                size="sm"
                onClick={() => router.push(`/invoices/${invoice.id}/edit`)}
              >
                <Pencil className="h-4 w-4 mr-2" />
                Edit
              </Button>
            </>
          )}
          
          {invoice.status === 'sent' && (
            <Button variant="outline" size="sm" onClick={() => handleStatusUpdate('paid')}>
              Mark as Paid
            </Button>
          )}
          
          <Button 
            variant="outline" 
            size="sm" 
            onClick={handleSendEmail}
            disabled={sendingEmail || !invoice.client.email}
          >
            <Send className="h-4 w-4 mr-2" />
            {sendingEmail ? 'Sending...' : 'Send Email'}
          </Button>
          
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="destructive" size="sm">
                <Trash2 className="h-4 w-4 mr-2" />
                Delete
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Delete Invoice</AlertDialogTitle>
                <AlertDialogDescription>
                  Are you sure you want to delete this invoice? This action cannot be undone.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction onClick={handleDelete}>Delete</AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Client Information</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <p className="font-semibold">{invoice.client.name}</p>
              {invoice.client.email && <p>{invoice.client.email}</p>}
              {invoice.client.phone && <p>{invoice.client.phone}</p>}
              {invoice.client.address && <p className="whitespace-pre-line">{invoice.client.address}</p>}
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader>
            <CardTitle>Invoice Details</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Invoice Number:</span>
                <span>{invoice.invoiceNumber}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Issue Date:</span>
                <span>{format(new Date(invoice.issueDate), 'PPP')}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Due Date:</span>
                <span>{format(new Date(invoice.dueDate), 'PPP')}</span>
              </div>
              {invoice.paidAt && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Paid Date:</span>
                  <span>{format(new Date(invoice.paidAt), 'PPP')}</span>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader>
            <CardTitle>Amount Due</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">${parseFloat(invoice.total).toFixed(2)}</div>
            <div className="text-muted-foreground mt-2">
              Status: <span className="font-medium">{invoice.status}</span>
            </div>
          </CardContent>
        </Card>
      </div>
      
      <Card>
        <CardHeader>
          <CardTitle>Items</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[400px]">Description</TableHead>
                <TableHead className="text-right">Quantity</TableHead>
                <TableHead className="text-right">Unit Price</TableHead>
                <TableHead className="text-right">Amount</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {invoice.items.map((item) => (
                <TableRow key={item.id}>
                  <TableCell>{item.description}</TableCell>
                  <TableCell className="text-right">{parseFloat(item.quantity).toFixed(2)}</TableCell>
                  <TableCell className="text-right">${parseFloat(item.unitPrice).toFixed(2)}</TableCell>
                  <TableCell className="text-right">${parseFloat(item.amount).toFixed(2)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          
          <div className="mt-4 flex flex-col items-end">
            <div className="space-y-2 w-48">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Subtotal:</span>
                <span>${parseFloat(invoice.subtotal).toFixed(2)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Tax:</span>
                <span>${parseFloat(invoice.tax).toFixed(2)}</span>
              </div>
              <div className="flex justify-between font-semibold">
                <span>Total:</span>
                <span>${parseFloat(invoice.total).toFixed(2)}</span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
      
      {invoice.notes && (
        <Card>
          <CardHeader>
            <CardTitle>Notes</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="whitespace-pre-line">{invoice.notes}</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
} 
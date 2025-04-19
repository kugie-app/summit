'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { format } from 'date-fns';
import { ArrowLeft, Trash2, Send, Download, Pencil, Receipt } from 'lucide-react';
import { toast } from 'sonner';
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

interface QuoteItem {
  id: number;
  description: string;
  quantity: string;
  unitPrice: string;
  amount: string;
}

interface Client {
  id: number;
  name: string;
  email: string;
  phone: string | null;
  address: string | null;
}

interface Quote {
  id: number;
  quoteNumber: string;
  status: 'draft' | 'sent' | 'accepted' | 'rejected' | 'expired';
  issueDate: string;
  expiryDate: string;
  subtotal: string;
  tax: string;
  total: string;
  notes: string | null;
  client: Client;
  items: QuoteItem[];
  convertedToInvoiceId: number | null;
}

export default function QuoteDetailPage({ params }: { params: Promise<{ quoteId: string }> }) {
  const router = useRouter();
  const [quote, setQuote] = useState<Quote | null>(null);
  const [loading, setLoading] = useState(true);
  const [sendingEmail, setSendingEmail] = useState(false);
  const [converting, setConverting] = useState(false);
  
  useEffect(() => {
    const fetchQuote = async () => {
      setLoading(true);
      try {
        const { quoteId } = await params;
        const response = await fetch(`/api/quotes/${quoteId}`);
        
        if (!response.ok) {
          throw new Error('Failed to fetch quote');
        }
        
        const data = await response.json();
        setQuote(data);
      } catch (error) {
        console.error('Error fetching quote:', error);
        toast.error('Failed to load quote details');
      } finally {
        setLoading(false);
      }
    };
    
    fetchQuote();
  }, [params]);
  
  const handleDelete = async () => {
    try {
      const { quoteId } = await params;
      const response = await fetch(`/api/quotes/${quoteId}`, {
        method: 'DELETE',
      });
      
      if (!response.ok) {
        throw new Error('Failed to delete quote');
      }
      
      toast.success('Quote deleted successfully');
      router.push('/quotes');
    } catch (error) {
      console.error('Error deleting quote:', error);
      toast.error('Failed to delete quote');
    }
  };
  
  const handleStatusUpdate = async (newStatus: 'draft' | 'sent' | 'accepted' | 'rejected' | 'expired') => {
    try {
      const { quoteId } = await params;
      const response = await fetch(`/api/quotes/${quoteId}/status`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ status: newStatus }),
      });
      
      if (!response.ok) {
        throw new Error(`Failed to update quote status to ${newStatus}`);
      }
      
      const updatedQuote = await response.json();
      setQuote({...quote, ...updatedQuote});
      toast.success(`Quote status updated to ${newStatus}`);
      
      // Refresh quote data
      const refreshResponse = await fetch(`/api/quotes/${quoteId}`);
      if (refreshResponse.ok) {
        const refreshedQuote = await refreshResponse.json();
        setQuote(refreshedQuote);
      }
    } catch (error) {
      console.error('Error updating quote status:', error);
      toast.error('Failed to update quote status');
    }
  };
  
  const handleDownloadPdf = async () => {
    if (!quote) return;
    
    try {
      const { quoteId } = await params;
      
      // Directly fetch the PDF from the API
      const response = await fetch(`/api/quotes/${quoteId}/pdf`);
      
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
      a.download = `quote-${quote.quoteNumber}.pdf`;
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
    if (!quote) return;
    
    // Check if client has an email
    if (!quote.client.email) {
      toast.error('Client does not have an email address');
      return;
    }
    
    setSendingEmail(true);
    
    try {
      const { quoteId } = await params;
      const response = await fetch(`/api/quotes/${quoteId}/send-email`, {
        method: 'POST',
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to send email');
      }
      
      const result = await response.json();
      
      toast.success('Email sent successfully');
      
      // Refresh quote data if status was updated
      if (quote.status === 'draft') {
        const { quoteId } = await params;
        const updatedQuoteResponse = await fetch(`/api/quotes/${quoteId}`);
        if (updatedQuoteResponse.ok) {
          const updatedQuote = await updatedQuoteResponse.json();
          setQuote(updatedQuote);
        }
      }
    } catch (error) {
      console.error('Error sending email:', error);
      toast.error((error as Error).message || 'Failed to send email');
    } finally {
      setSendingEmail(false);
    }
  };
  
  const handleConvertToInvoice = async () => {
    if (!quote) return;
    
    setConverting(true);
    
    try {
      const { quoteId } = await params;
      // This endpoint would need to be implemented
      const response = await fetch(`/api/quotes/${quoteId}/convert-to-invoice`, {
        method: 'POST',
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to convert quote to invoice');
      }
      
      const data = await response.json();
      toast.success('Quote converted to invoice successfully');
      
      // Redirect to the new invoice
      router.push(`/invoices/${data.invoiceId}`);
    } catch (error) {
      console.error('Error converting to invoice:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to convert quote to invoice');
    } finally {
      setConverting(false);
    }
  };
  
  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'draft':
        return <Badge variant="outline">Draft</Badge>;
      case 'sent':
        return <Badge variant="secondary">Sent</Badge>;
      case 'accepted':
        return <Badge variant="default">Accepted</Badge>;
      case 'rejected':
        return <Badge variant="destructive">Rejected</Badge>;
      case 'expired':
        return <Badge variant="outline">Expired</Badge>;
      default:
        return <Badge>{status}</Badge>;
    }
  };
  
  if (loading) {
    return (
      <div className="container mx-auto py-6">
        <div className="flex justify-center items-center h-64">
          <p>Loading quote details...</p>
        </div>
      </div>
    );
  }
  
  if (!quote) {
    return (
      <div className="container mx-auto py-6">
        <div className="flex justify-center items-center h-64">
          <p>Quote not found or you don&apos;t have permission to view it.</p>
        </div>
      </div>
    );
  }
  
  return (
    <div className="container mx-auto py-6 space-y-6">
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="icon" onClick={() => router.push('/quotes')}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-3xl font-bold tracking-tight">Quote {quote.quoteNumber}</h1>
              {getStatusBadge(quote.status)}
            </div>
            <p className="text-muted-foreground">
              Created on {format(new Date(quote.issueDate), 'PPP')}
            </p>
          </div>
        </div>
        
        <div className="flex gap-2">
          <Badge className={`${getStatusBadge(quote.status)} text-white`}>
            {quote.status.charAt(0).toUpperCase() + quote.status.slice(1)}
          </Badge>
          
          <Button variant="outline" size="sm" onClick={handleDownloadPdf}>
            <Download className="h-4 w-4 mr-2" />
            Download PDF
          </Button>
          
          {quote.status === 'draft' && (
            <>
              <Button variant="outline" size="sm" onClick={() => handleStatusUpdate('sent')}>
                <Send className="h-4 w-4 mr-2" />
                Mark as Sent
              </Button>
              
              <Button
                variant="outline"
                size="sm"
                onClick={() => router.push(`/quotes/${quote.id}/edit`)}
              >
                <Pencil className="h-4 w-4 mr-2" />
                Edit
              </Button>
            </>
          )}
          
          {quote.status === 'sent' && (
            <Button variant="outline" size="sm" onClick={() => handleStatusUpdate('accepted')}>
              Accept Quote
            </Button>
          )}
          
          {quote.status === 'accepted' && !quote.convertedToInvoiceId && (
            <Button 
              variant="outline" 
              size="sm" 
              onClick={handleConvertToInvoice}
              disabled={converting}
            >
              <Receipt className="h-4 w-4 mr-2" />
              {converting ? 'Converting...' : 'Convert to Invoice'}
            </Button>
          )}
          
          <Button 
            variant="outline" 
            size="sm" 
            onClick={handleSendEmail}
            disabled={sendingEmail || !quote.client.email}
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
                <AlertDialogTitle>Delete Quote</AlertDialogTitle>
                <AlertDialogDescription>
                  Are you sure you want to delete this quote? This action cannot be undone.
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
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Client Information</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <p className="font-semibold text-lg">{quote.client.name}</p>
              <p>{quote.client.email}</p>
              {quote.client.phone && <p>{quote.client.phone}</p>}
              {quote.client.address && <p className="whitespace-pre-line">{quote.client.address}</p>}
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader>
            <CardTitle>Quote Details</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-muted-foreground">Quote Number</p>
                <p className="font-medium">{quote.quoteNumber}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Status</p>
                <div>{getStatusBadge(quote.status)}</div>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Issue Date</p>
                <p className="font-medium">{format(new Date(quote.issueDate), 'PPP')}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Expiry Date</p>
                <p className="font-medium">{format(new Date(quote.expiryDate), 'PPP')}</p>
              </div>
              {quote.convertedToInvoiceId && (
                <div className="col-span-2">
                  <p className="text-sm text-muted-foreground">Converted to Invoice</p>
                  <Button
                    variant="link"
                    className="px-0"
                    onClick={() => router.push(`/invoices/${quote.convertedToInvoiceId}`)}
                  >
                    View Invoice
                  </Button>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
      
      <Card>
        <CardHeader>
          <CardTitle>Quote Items</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="border rounded-md overflow-hidden">
            <table className="min-w-full divide-y divide-border">
              <thead className="bg-muted/50">
                <tr>
                  <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                    Item
                  </th>
                  <th scope="col" className="px-4 py-3 text-right text-xs font-medium text-muted-foreground uppercase tracking-wider">
                    Quantity
                  </th>
                  <th scope="col" className="px-4 py-3 text-right text-xs font-medium text-muted-foreground uppercase tracking-wider">
                    Unit Price
                  </th>
                  <th scope="col" className="px-4 py-3 text-right text-xs font-medium text-muted-foreground uppercase tracking-wider">
                    Amount
                  </th>
                </tr>
              </thead>
              <tbody className="bg-card divide-y divide-muted">
                {quote.items.map((item) => (
                  <tr key={item.id}>
                    <td className="px-4 py-2 whitespace-pre-line text-sm">{item.description}</td>
                    <td className="px-4 py-2 text-sm text-right">{parseFloat(item.quantity).toFixed(2)}</td>
                    <td className="px-4 py-2 text-sm text-right">${parseFloat(item.unitPrice).toFixed(2)}</td>
                    <td className="px-4 py-2 text-sm text-right">${parseFloat(item.amount).toFixed(2)}</td>
                  </tr>
                ))}
              </tbody>
              <tfoot className="bg-card">
                <tr>
                  <td colSpan={3} className="px-4 py-2 text-sm text-right font-medium">Subtotal:</td>
                  <td className="px-4 py-2 text-sm text-right">${parseFloat(quote.subtotal).toFixed(2)}</td>
                </tr>
                <tr>
                  <td colSpan={3} className="px-4 py-2 text-sm text-right font-medium">
                    Tax ({parseFloat(quote.tax) > 0 
                      ? ((parseFloat(quote.tax) / parseFloat(quote.subtotal)) * 100).toFixed(2) 
                      : '0'}%):
                  </td>
                  <td className="px-4 py-2 text-sm text-right">${parseFloat(quote.tax).toFixed(2)}</td>
                </tr>
                <tr>
                  <td colSpan={3} className="px-4 py-2 text-sm text-right font-medium">Total:</td>
                  <td className="px-4 py-2 text-sm text-right font-bold">${parseFloat(quote.total).toFixed(2)}</td>
                </tr>
              </tfoot>
            </table>
          </div>
          
          {quote.notes && (
            <div className="mt-4">
              <h3 className="text-sm font-medium mb-2">Notes</h3>
              <p className="text-sm whitespace-pre-line">{quote.notes}</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
} 
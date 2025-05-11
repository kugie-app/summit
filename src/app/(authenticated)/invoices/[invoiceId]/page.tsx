'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { format, isPast, addDays } from 'date-fns';
import { ArrowLeft, Download, Send, Pencil, Trash2, CreditCard, ExternalLink, RefreshCw } from 'lucide-react';
import { toast } from 'sonner';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
  TableFooter,
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

interface Client {
  id: number;
  name: string;
  email: string;
  phone: string | null;
  address: string | null;
}

interface InvoiceItem {
  id: number;
  description: string;
  quantity: string;
  unitPrice: string;
  amount: string;
}

interface Invoice {
  id: number;
  invoiceNumber: string;
  status: 'draft' | 'sent' | 'paid' | 'overdue' | 'cancelled';
  issueDate: string;
  dueDate: string;
  subtotal: string;
  tax: string;
  taxRate: string;
  total: string;
  notes: string | null;
  clientId: number;
  client?: Client;
  items: InvoiceItem[];
  company?: {
    defaultCurrency: string;
  };
  createdAt?: string;
  updatedAt?: string;
  paidAt?: string | null;
  companyId?: number;
  xenditInvoiceId?: string | null;
  xenditInvoiceUrl?: string | null;
}

export default function InvoiceDetailPage({ params }: { params: Promise<{ invoiceId: string }> }) {
  const router = useRouter();
  const [invoice, setInvoice] = useState<Invoice | null>(null);
  const [loading, setLoading] = useState(true);
  const [sendingEmail, setSendingEmail] = useState(false);
  const [generatingPaymentLink, setGeneratingPaymentLink] = useState(false);
  const [regeneratingPaymentLink, setRegeneratingPaymentLink] = useState(false);
  
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
        setInvoice({
          id: data.id,
          invoiceNumber: data.invoiceNumber,
          status: data.status,
          issueDate: data.issueDate,
          dueDate: data.dueDate,
          subtotal: data.subtotal,
          tax: data.tax,
          taxRate: data.taxRate,
          total: data.total,
          notes: data.notes,
          clientId: data.clientId,
          client: data.client || {
            id: 0,
            name: '',
            email: '',
            phone: null,
            address: null,
          },
          company: data.company || {
            defaultCurrency: 'IDR'
          },
          items: data.items || [],
        });
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
          clientId: invoice.clientId,
          status: newStatus,
          notes: invoice.notes || '',
        }),
      });
      
      if (!response.ok) {
        throw new Error(`Failed to update invoice status to ${newStatus}`);
      }
      
      // fetch the updated invoice
      const updatedInvoiceResponse = await fetch(`/api/invoices/${invoiceId}`);
      const updatedInvoice = await updatedInvoiceResponse.json();
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
    if (!invoice.client?.email) {
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
  
  // Check if the payment link is expired based on due date
  const isPaymentLinkExpired = (invoice: Invoice) => {
    if (!invoice.dueDate) return false;
    
    // Define "expired" as either:
    // 1. Due date is in the past, or
    // 2. The invoice has status of 'overdue'
    return isPast(new Date(invoice.dueDate)) || invoice.status === 'overdue';
  };
  
  const handleGeneratePaymentLink = async () => {
    if (!invoice) return;
    
    // Check if client has an email
    if (!invoice.client?.email) {
      toast.error('Client must have an email address to generate a payment link');
      return;
    }
    
    setGeneratingPaymentLink(true);
    
    try {
      const { invoiceId } = await params;
      const response = await fetch(`/api/invoices/${invoiceId}/create-xendit-invoice`, {
        method: 'POST',
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to generate payment link');
      }
      
      const data = await response.json();
      
      // Update the invoice with the new Xendit information
      setInvoice(prev => {
        if (!prev) return null;
        return {
          ...prev,
          xenditInvoiceId: data.invoice.xenditInvoiceId,
          xenditInvoiceUrl: data.invoice.xenditInvoiceUrl,
        };
      });
      
      toast.success('Payment link generated successfully');
      
      // Optionally open the payment link in a new tab
      if (data.xenditInvoiceUrl) {
        window.open(data.xenditInvoiceUrl, '_blank');
      }
    } catch (error) {
      console.error('Error generating payment link:', error);
      toast.error((error as Error).message || 'Failed to generate payment link');
    } finally {
      setGeneratingPaymentLink(false);
    }
  };
  
  const handleRegeneratePaymentLink = async () => {
    if (!invoice) return;
    
    // Check if client has an email
    if (!invoice.client?.email) {
      toast.error('Client must have an email address to regenerate a payment link');
      return;
    }
    
    setRegeneratingPaymentLink(true);
    
    try {
      const { invoiceId } = await params;
      const response = await fetch(`/api/invoices/${invoiceId}/create-xendit-invoice`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          regenerate: true
        }),
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to regenerate payment link');
      }
      
      const data = await response.json();
      
      // Update the invoice with the new Xendit information
      setInvoice(prev => {
        if (!prev) return null;
        return {
          ...prev,
          xenditInvoiceId: data.invoice.xenditInvoiceId,
          xenditInvoiceUrl: data.invoice.xenditInvoiceUrl,
        };
      });
      
      toast.success('Payment link regenerated successfully');
      
      // Optionally open the payment link in a new tab
      if (data.xenditInvoiceUrl) {
        window.open(data.xenditInvoiceUrl, '_blank');
      }
    } catch (error) {
      console.error('Error regenerating payment link:', error);
      toast.error((error as Error).message || 'Failed to regenerate payment link');
    } finally {
      setRegeneratingPaymentLink(false);
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

  const formatCurrency = (amount: string) => {
    return Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR' }).format(parseFloat(amount));
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
            <>
              <Button variant="outline" size="sm" onClick={() => handleStatusUpdate('paid')}>
                Mark as Paid
              </Button>
              
              {/* Payment link button */}
              {invoice.xenditInvoiceUrl ? (
                <>
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => invoice.xenditInvoiceUrl && window.open(invoice.xenditInvoiceUrl, '_blank')}
                  >
                    <ExternalLink className="h-4 w-4 mr-2" />
                    View Payment Link
                  </Button>
                  
                  {/* Add Regenerate button if the payment link is expired */}
                  {isPaymentLinkExpired(invoice) && (
                    <Button 
                      variant="outline" 
                      size="sm" 
                      onClick={handleRegeneratePaymentLink}
                      disabled={regeneratingPaymentLink}
                    >
                      <RefreshCw className={`h-4 w-4 mr-2 ${regeneratingPaymentLink ? 'animate-spin' : ''}`} />
                      {regeneratingPaymentLink ? 'Regenerating...' : 'Regenerate Link'}
                    </Button>
                  )}
                </>
              ) : (
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={handleGeneratePaymentLink}
                  disabled={generatingPaymentLink || !invoice.client?.email}
                >
                  <CreditCard className="h-4 w-4 mr-2" />
                  {generatingPaymentLink ? 'Generating...' : 'Generate Payment Link'}
                </Button>
              )}
            </>
          )}
          
          {/* Add same functionality for overdue status */}
          {invoice.status === 'overdue' && (
            <>
              <Button variant="outline" size="sm" onClick={() => handleStatusUpdate('paid')}>
                Mark as Paid
              </Button>
              
              {invoice.xenditInvoiceUrl ? (
                <>
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => invoice.xenditInvoiceUrl && window.open(invoice.xenditInvoiceUrl, '_blank')}
                  >
                    <ExternalLink className="h-4 w-4 mr-2" />
                    View Payment Link
                  </Button>
                  
                  {/* Always show regenerate button for overdue invoices with payment links */}
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={handleRegeneratePaymentLink}
                    disabled={regeneratingPaymentLink}
                  >
                    <RefreshCw className={`h-4 w-4 mr-2 ${regeneratingPaymentLink ? 'animate-spin' : ''}`} />
                    {regeneratingPaymentLink ? 'Regenerating...' : 'Regenerate Link'}
                  </Button>
                </>
              ) : (
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={handleGeneratePaymentLink}
                  disabled={generatingPaymentLink || !invoice.client?.email}
                >
                  <CreditCard className="h-4 w-4 mr-2" />
                  {generatingPaymentLink ? 'Generating...' : 'Generate Payment Link'}
                </Button>
              )}
            </>
          )}
          
          <Button 
            variant="outline" 
            size="sm" 
            onClick={handleSendEmail}
            disabled={sendingEmail || !invoice.client?.email}
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
      
      {/* If we have a payment link, show it in a card */}
      {invoice.xenditInvoiceUrl && (
        <Card className={`${isPaymentLinkExpired(invoice) ? 'bg-amber-50' : 'bg-slate-50'}`}>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-semibold">
                  Payment Link {isPaymentLinkExpired(invoice) ? '(Expired)' : 'Available'}
                </h3>
                <p className="text-muted-foreground">
                  {isPaymentLinkExpired(invoice) 
                    ? 'This payment link has expired. Please regenerate a new one.' 
                    : 'Share this link with your client to receive payment online'}
                </p>
              </div>
              {isPaymentLinkExpired(invoice) ? (
                <Button 
                  onClick={handleRegeneratePaymentLink}
                  className="ml-4"
                  disabled={regeneratingPaymentLink}
                >
                  <RefreshCw className={`h-4 w-4 mr-2 ${regeneratingPaymentLink ? 'animate-spin' : ''}`} />
                  {regeneratingPaymentLink ? 'Regenerating...' : 'Regenerate Link'}
                </Button>
              ) : (
                <Button 
                  onClick={() => invoice.xenditInvoiceUrl && window.open(invoice.xenditInvoiceUrl, '_blank')}
                  className="ml-4"
                >
                  <ExternalLink className="h-4 w-4 mr-2" />
                  Open Payment Page
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      )}
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Client Information</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <p className="font-semibold">{invoice.client?.name}</p>
              {invoice.client?.email && <p>{invoice.client?.email}</p>}
              {invoice.client?.phone && <p>{invoice.client?.phone}</p>}
              {invoice.client?.address && <p className="whitespace-pre-line">{invoice.client?.address}</p>}
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
            <div className="text-3xl font-bold">{formatCurrency(invoice.total)}</div>
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
                  <TableCell className="text-right">{invoice.company?.defaultCurrency || "IDR"} {parseFloat(item.unitPrice).toFixed(2)}</TableCell>
                  <TableCell className="text-right">{invoice.company?.defaultCurrency || "IDR"} {parseFloat(item.amount).toFixed(2)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          <div className="mt-4 flex flex-col items-end">
            <div className="space-y-2 w-48">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Subtotal:</span>
                {invoice.company?.defaultCurrency || "IDR"} {parseFloat(invoice.subtotal).toFixed(2)}
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Tax ({invoice.taxRate || '0'}%)</span>
                {invoice.company?.defaultCurrency || "IDR"} {parseFloat(invoice.tax).toFixed(2)}
              </div>
              <div className="flex justify-between font-semibold">
                <span>Total:</span>
                {invoice.company?.defaultCurrency || "IDR"} {parseFloat(invoice.total).toFixed(2)}
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
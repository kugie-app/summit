'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { PDFDownloadLink, PDFViewer } from '@react-pdf/renderer';
import { InvoicePDF } from '@/components/invoices/InvoicePDF';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Download, Printer } from 'lucide-react';
import { toast } from 'sonner';

interface InvoiceItem {
  id: number;
  description: string;
  quantity: string;
  unitPrice: string;
  amount: string;
}

interface InvoiceClient {
  name: string;
  email: string | null;
  phone: string | null;
  address: string | null;
}

interface Invoice {
  id: number;
  invoiceNumber: string;
  status: 'draft' | 'sent' | 'paid' | 'overdue' | 'cancelled';
  issueDate: string;
  dueDate: string;
  subtotal: string;
  tax: string;
  total: string;
  notes: string | null;
  client: InvoiceClient;
  items: InvoiceItem[];
}

export default function InvoicePrintPage({ params }: { params: Promise<{ invoiceId: string }> }) {
  const router = useRouter();
  const [invoice, setInvoice] = useState<Invoice | null>(null);
  const [companyName, setCompanyName] = useState<string>('Your Company');
  const [companyAddress, setCompanyAddress] = useState<string | undefined>(undefined);
  const [loading, setLoading] = useState(true);
  const [invoiceId, setInvoiceId] = useState<string | null>(null);
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        // Fetch invoice data
        const { invoiceId } = await params;
        setInvoiceId(invoiceId);
        const response = await fetch(`/api/invoices/${invoiceId}`);
        
        if (!response.ok) {
          throw new Error('Failed to fetch invoice');
        }
        
        const invoiceData = await response.json();
        setInvoice(invoiceData);
        
        // Fetch company data - you might need to create this endpoint
        // or get company data from session/context if available
        try {
          const companyResponse = await fetch('/api/companies/current');
          if (companyResponse.ok) {
            const companyData = await companyResponse.json();
            setCompanyName(companyData.name);
            setCompanyAddress(companyData.address);
          }
        } catch (companyError) {
          console.error('Error fetching company data:', companyError);
          // Continue with default values if company fetch fails
        }
      } catch (error) {
        console.error('Error fetching invoice data:', error);
        toast.error('Failed to load invoice for printing');
      } finally {
        setLoading(false);
      }
    };
    
    fetchData();
  }, [params]);
  
  if (loading) {
    return (
      <div className="container mx-auto py-6 h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="mb-4">Preparing your invoice for printing...</p>
          <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full mx-auto"></div>
        </div>
      </div>
    );
  }
  
  if (!invoice) {
    return (
      <div className="container mx-auto py-6">
        <div className="flex justify-center items-center h-64">
          <p>Invoice not found or you don't have permission to view it.</p>
        </div>
      </div>
    );
  }
  
  const pdfData = {
    ...invoice,
    companyName,
    companyAddress,
  };
  
  return (
    <div className="container mx-auto px-6 py-6">
      <div className="flex items-center justify-between mb-6">
        <Button variant="ghost" onClick={() => router.push(`/invoices/${invoiceId}`)}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Invoice
        </Button>
        
        <div className="flex gap-2">
          <PDFDownloadLink 
            document={<InvoicePDF invoice={pdfData} />} 
            fileName={`invoice-${invoice.invoiceNumber}.pdf`}
            className="inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 bg-primary text-primary-foreground hover:bg-primary/90 h-10 px-4 py-2"
          >
            {({ loading }) => 
              loading ? (
                'Preparing Download...'
              ) : (
                <>
                  <Download className="h-4 w-4 mr-2" />
                  Download PDF
                </>
              )
            }
          </PDFDownloadLink>
          
          <Button onClick={() => window.print()}>
            <Printer className="h-4 w-4 mr-2" />
            Print
          </Button>
        </div>
      </div>
      
      <div className="max-w-full w-full h-[calc(100vh-150px)] border rounded shadow-sm">
        <PDFViewer width="100%" height="100%" className="w-full h-full">
          <InvoicePDF invoice={pdfData} />
        </PDFViewer>
      </div>
    </div>
  );
} 
import React from 'react';
import {
  Document,
  Page,
  Text,
  View,
  StyleSheet,
  PDFViewer,
  Image as PDFImage
} from '@react-pdf/renderer';
import { format } from 'date-fns';

// Register custom fonts if needed
// Font.register({
//   family: 'Roboto',
//   src: 'https://fonts.googleapis.com/css?family=Roboto',
// });

// Define styles
const styles = StyleSheet.create({
  page: {
    flexDirection: 'column',
    backgroundColor: '#FFFFFF',
    padding: 30,
    fontFamily: 'Helvetica',
    fontSize: 10,
  },
  section: {
    margin: 10,
    padding: 10,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  headerLeft: {
    flexDirection: 'column',
    width: '50%',
  },
  headerRight: {
    flexDirection: 'column',
    alignItems: 'flex-end',
    width: '50%',
  },
  logoContainer: {
    marginBottom: 10,
    maxWidth: 120,
    maxHeight: 60,
  },
  logo: {
    width: '100%',
    maxHeight: 60,
    objectFit: 'contain',
  },
  invoiceTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  label: {
    fontSize: 10,
    fontWeight: 'bold',
    marginBottom: 3,
  },
  value: {
    fontSize: 10,
    marginBottom: 6,
  },
  addressBox: {
    borderWidth: 1,
    borderColor: '#EEEEEE',
    padding: 10,
    marginBottom: 10,
  },
  table: {
    display: 'flex',
    width: 'auto',
    border: '1pt solid #EEEEEE',
    marginTop: 20,
    marginBottom: 20,
  },
  tableRow: {
    flexDirection: 'row',
    borderBottom: '1pt solid #EEEEEE',
  },
  tableRowLast: {
    flexDirection: 'row',
  },
  tableHeader: {
    backgroundColor: '#F9FAFB',
    fontWeight: 'bold',
  },
  tableCell: {
    padding: 5,
  },
  tableCellBordered: {
    padding: 5,
    borderRight: '1pt solid #EEEEEE',
  },
  col1: {
    width: '40%',
  },
  col2: {
    width: '15%',
    textAlign: 'right',
  },
  col3: {
    width: '15%',
    textAlign: 'right',
  },
  col4: {
    width: '15%',
    textAlign: 'right',
  },
  col5: {
    width: '15%',
    textAlign: 'right',
  },
  totalsContainer: {
    marginTop: 10,
    alignSelf: 'flex-end',
    width: '40%',
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 5,
  },
  totalRowEmphasis: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 3,
    marginBottom: 3,
    paddingTop: 3,
    borderTop: '1pt solid #EEEEEE',
  },
  totalLabel: {
    fontWeight: 'bold',
  },
  bankDetails: {
    marginTop: 20,
    padding: 10,
    backgroundColor: '#F9FAFB',
    borderRadius: 5,
  },
  bankDetailsTitle: {
    fontSize: 10,
    fontWeight: 'bold',
    marginBottom: 5,
  },
  footer: {
    marginTop: 30,
    paddingTop: 10,
    borderTop: '1pt solid #EEEEEE',
    textAlign: 'center',
    fontSize: 10,
    color: '#666666',
  },
  notes: {
    marginTop: 20,
    padding: 10,
    backgroundColor: '#F9FAFB',
    fontSize: 10,
  },
});

// Define the expected props
interface InvoicePDFProps {
  invoice: {
    id: number;
    invoiceNumber: string;
    status: string;
    issueDate: string | Date;
    dueDate: string | Date;
    subtotal: number | string;
    tax: number | string;
    total: number | string;
    notes?: string;
    currency?: string;
    client: {
      id: number;
      name: string;
      email?: string;
      phone?: string;
      address?: string;
    };
    items: Array<{
      id: number;
      description: string;
      quantity: number | string;
      unitPrice: number | string;
      amount: number | string;
    }>;
    company?: {
      name: string;
      email?: string;
      phone?: string;
      address?: string;
      logoUrl?: string;
      bankAccount?: string;
      defaultCurrency?: string;
    };
  };
  preview?: boolean;
}

// Helper functions
const formatDate = (date: string | Date) => {
  if (!date) return '';
  return format(new Date(date), 'MMM dd, yyyy');
};

const formatCurrency = (amount: string | number, currency: string = 'USD') => {
  const numericAmount = typeof amount === 'string' ? parseFloat(amount) : amount;
  
  if (isNaN(numericAmount)) return `${currency} 0.00`;
  
  // Format based on currency
  let formattedAmount: string;
  
  switch (currency) {
    case 'IDR':
      formattedAmount = new Intl.NumberFormat('id-ID', { 
        style: 'currency', 
        currency: 'IDR',
        minimumFractionDigits: 0,
        maximumFractionDigits: 0
      }).format(numericAmount);
      break;
    case 'EUR':
      formattedAmount = new Intl.NumberFormat('de-DE', { 
        style: 'currency', 
        currency: 'EUR' 
      }).format(numericAmount);
      break;
    default:
      formattedAmount = new Intl.NumberFormat('en-US', { 
        style: 'currency', 
        currency: currency || 'USD' 
      }).format(numericAmount);
  }
  
  return formattedAmount;
};

// Component for creating PDF
export const InvoicePDF: React.FC<InvoicePDFProps> = ({ invoice, preview = false }) => {
  const currency = invoice.currency || invoice.company?.defaultCurrency || 'USD';
  
  const document = (
    <Document>
      <Page size="A4" style={styles.page}>
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            {invoice.company?.logoUrl && (
              <View style={styles.logoContainer}>
                <PDFImage src={invoice.company.logoUrl} style={styles.logo} />
              </View>
            )}
            <Text style={styles.invoiceTitle}>INVOICE</Text>
            {invoice.company && (
              <>
                <Text style={styles.value}>{invoice.company.name}</Text>
                {invoice.company.address && (
                  <Text style={styles.value}>{invoice.company.address}</Text>
                )}
                {invoice.company.email && (
                  <Text style={styles.value}>{invoice.company.email}</Text>
                )}
                {invoice.company.phone && (
                  <Text style={styles.value}>{invoice.company.phone}</Text>
                )}
              </>
            )}
          </View>
          <View style={styles.headerRight}>
            <Text style={styles.label}>Invoice Number</Text>
            <Text style={styles.value}>{invoice.invoiceNumber}</Text>
            <Text style={styles.label}>Status</Text>
            <Text style={styles.value}>{invoice.status.toUpperCase()}</Text>
            <Text style={styles.label}>Issue Date</Text>
            <Text style={styles.value}>{formatDate(invoice.issueDate)}</Text>
            <Text style={styles.label}>Due Date</Text>
            <Text style={styles.value}>{formatDate(invoice.dueDate)}</Text>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.label}>Bill To</Text>
          <View style={styles.addressBox}>
            <Text style={styles.value}>{invoice.client.name}</Text>
            {invoice.client.address && (
              <Text style={styles.value}>{invoice.client.address}</Text>
            )}
            {invoice.client.email && (
              <Text style={styles.value}>{invoice.client.email}</Text>
            )}
            {invoice.client.phone && (
              <Text style={styles.value}>{invoice.client.phone}</Text>
            )}
          </View>
        </View>

        <View style={styles.table}>
          <View style={[styles.tableRow, styles.tableHeader]}>
            <View style={[styles.tableCellBordered, styles.col1]}>
              <Text>Description</Text>
            </View>
            <View style={[styles.tableCellBordered, styles.col2]}>
              <Text>Quantity</Text>
            </View>
            <View style={[styles.tableCellBordered, styles.col3]}>
              <Text>Unit Price</Text>
            </View>
            <View style={[styles.tableCell, styles.col4]}>
              <Text>Amount</Text>
            </View>
          </View>
          
          {invoice.items.map((item, index) => (
            <View key={item.id} style={index === invoice.items.length - 1 ? styles.tableRowLast : styles.tableRow}>
              <View style={[styles.tableCellBordered, styles.col1]}>
                <Text>{item.description}</Text>
              </View>
              <View style={[styles.tableCellBordered, styles.col2]}>
                <Text>{item.quantity}</Text>
              </View>
              <View style={[styles.tableCellBordered, styles.col3]}>
                <Text>{formatCurrency(item.unitPrice, currency)}</Text>
              </View>
              <View style={[styles.tableCell, styles.col4]}>
                <Text>{formatCurrency(item.amount, currency)}</Text>
              </View>
            </View>
          ))}
        </View>

        <View style={styles.totalsContainer}>
          <View style={styles.totalRow}>
            <Text style={styles.totalLabel}>Subtotal:</Text>
            <Text>{formatCurrency(invoice.subtotal, currency)}</Text>
          </View>
          <View style={styles.totalRow}>
            <Text style={styles.totalLabel}>Tax:</Text>
            <Text>{formatCurrency(invoice.tax, currency)}</Text>
          </View>
          <View style={styles.totalRowEmphasis}>
            <Text style={styles.totalLabel}>Total:</Text>
            <Text style={styles.totalLabel}>{formatCurrency(invoice.total, currency)}</Text>
          </View>
        </View>

        {invoice.company?.bankAccount && (
          <View style={styles.bankDetails}>
            <Text style={styles.bankDetailsTitle}>Payment Information</Text>
            <Text style={styles.value}>Bank Account: {invoice.company.bankAccount}</Text>
            <Text style={styles.value}>Please include the invoice number in your payment reference.</Text>
          </View>
        )}

        {invoice.notes && (
          <View style={styles.notes}>
            <Text style={styles.label}>Notes</Text>
            <Text>{invoice.notes}</Text>
          </View>
        )}

        <View style={styles.footer} fixed>
          <Text>Thank you for your business!</Text>
        </View>
      </Page>
    </Document>
  );

  // Return the document, optionally wrapped in a viewer for preview
  return preview ? <PDFViewer width="100%" height="600px">{document}</PDFViewer> : document;
}; 
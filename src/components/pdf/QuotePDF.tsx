import React from 'react';
import {
  Document,
  Page,
  Text,
  View,
  StyleSheet,
  PDFViewer,
  Image
} from '@react-pdf/renderer';
import { format } from 'date-fns';

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
  quoteTitle: {
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
  validityPeriod: {
    marginTop: 15,
    fontSize: 10,
  },
});

// Define the expected props
interface QuotePDFProps {
  quote: {
    id: number;
    quoteNumber: string;
    status: string;
    issueDate: string | Date;
    expiryDate: string | Date;
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
export const QuotePDF: React.FC<QuotePDFProps> = ({ quote, preview = false }) => {
  const currency = quote.currency || quote.company?.defaultCurrency || 'USD';
  
  const document = (
    <Document>
      <Page size="A4" style={styles.page}>
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            {quote.company?.logoUrl && (
              <View style={styles.logoContainer}>
                <Image src={quote.company.logoUrl} style={styles.logo} />
              </View>
            )}
            <Text style={styles.quoteTitle}>QUOTE</Text>
            {quote.company && (
              <>
                <Text style={styles.value}>{quote.company.name}</Text>
                {quote.company.address && (
                  <Text style={styles.value}>{quote.company.address}</Text>
                )}
                {quote.company.email && (
                  <Text style={styles.value}>{quote.company.email}</Text>
                )}
                {quote.company.phone && (
                  <Text style={styles.value}>{quote.company.phone}</Text>
                )}
              </>
            )}
          </View>
          <View style={styles.headerRight}>
            <Text style={styles.label}>Quote Number</Text>
            <Text style={styles.value}>{quote.quoteNumber}</Text>
            <Text style={styles.label}>Status</Text>
            <Text style={styles.value}>{quote.status.toUpperCase()}</Text>
            <Text style={styles.label}>Issue Date</Text>
            <Text style={styles.value}>{formatDate(quote.issueDate)}</Text>
            <Text style={styles.label}>Valid Until</Text>
            <Text style={styles.value}>{formatDate(quote.expiryDate)}</Text>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.label}>To</Text>
          <View style={styles.addressBox}>
            <Text style={styles.value}>{quote.client.name}</Text>
            {quote.client.address && (
              <Text style={styles.value}>{quote.client.address}</Text>
            )}
            {quote.client.email && (
              <Text style={styles.value}>{quote.client.email}</Text>
            )}
            {quote.client.phone && (
              <Text style={styles.value}>{quote.client.phone}</Text>
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
          
          {quote.items.map((item, index) => (
            <View key={item.id} style={index === quote.items.length - 1 ? styles.tableRowLast : styles.tableRow}>
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
            <Text>{formatCurrency(quote.subtotal, currency)}</Text>
          </View>
          <View style={styles.totalRow}>
            <Text style={styles.totalLabel}>Tax:</Text>
            <Text>{formatCurrency(quote.tax, currency)}</Text>
          </View>
          <View style={styles.totalRowEmphasis}>
            <Text style={styles.totalLabel}>Total:</Text>
            <Text style={styles.totalLabel}>{formatCurrency(quote.total, currency)}</Text>
          </View>
        </View>

        <View style={styles.validityPeriod}>
          <Text>This quote is valid until {formatDate(quote.expiryDate)}.</Text>
        </View>

        {quote.notes && (
          <View style={styles.notes}>
            <Text style={styles.label}>Notes</Text>
            <Text>{quote.notes}</Text>
          </View>
        )}

        <View style={styles.footer} fixed>
          <Text>Thank you for your interest in our services!</Text>
        </View>
      </Page>
    </Document>
  );

  // Return the document, optionally wrapped in a viewer for preview
  return preview ? <PDFViewer width="100%" height="600px">{document}</PDFViewer> : document;
};

export default QuotePDF; 
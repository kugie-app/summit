import React from 'react';
import {
  Document,
  Page,
  Text,
  View,
  StyleSheet,
  PDFViewer
} from '@react-pdf/renderer';
import { format } from 'date-fns';

// Define styles
const styles = StyleSheet.create({
  page: {
    flexDirection: 'column',
    backgroundColor: '#FFFFFF',
    padding: 30,
    fontFamily: 'Helvetica',
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
  },
  headerRight: {
    flexDirection: 'column',
    alignItems: 'flex-end',
  },
  quoteTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  label: {
    fontSize: 12,
    fontWeight: 'bold',
    marginBottom: 5,
  },
  value: {
    fontSize: 12,
    marginBottom: 10,
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
    borderWidth: 1,
    borderColor: '#EEEEEE',
    marginTop: 20,
    marginBottom: 20,
  },
  tableRow: {
    flexDirection: 'row',
  },
  tableHeader: {
    backgroundColor: '#F9FAFB',
    fontWeight: 'bold',
    padding: 5,
  },
  tableCell: {
    padding: 5,
    borderTopWidth: 1,
    borderColor: '#EEEEEE',
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
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginTop: 10,
  },
  totalLabel: {
    width: '20%',
    textAlign: 'right',
    fontWeight: 'bold',
    paddingRight: 5,
  },
  totalValue: {
    width: '15%',
    textAlign: 'right',
    paddingRight: 5,
  },
  footer: {
    marginTop: 30,
    textAlign: 'center',
    fontSize: 12,
    color: '#666666',
  },
  notes: {
    marginTop: 20,
    padding: 10,
    backgroundColor: '#F9FAFB',
    fontSize: 12,
  },
  validity: {
    marginTop: 20,
    fontSize: 12,
    textAlign: 'center',
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
    };
  };
  preview?: boolean;
}

// Convert dates and numbers to proper format
const formatDate = (date: string | Date) => {
  return format(new Date(date), 'PP');
};

const formatCurrency = (amount: number | string) => {
  return `$${Number(amount).toFixed(2)}`;
};

// Component for creating PDF
export const QuotePDF: React.FC<QuotePDFProps> = ({ quote, preview = false }) => {
  const document = (
    <Document>
      <Page size="A4" style={styles.page}>
        <View style={styles.header}>
          <View style={styles.headerLeft}>
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
            <Text style={styles.label}>Date</Text>
            <Text style={styles.value}>{formatDate(quote.issueDate)}</Text>
            <Text style={styles.label}>Valid Until</Text>
            <Text style={styles.value}>{formatDate(quote.expiryDate)}</Text>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.label}>Prepared For</Text>
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
            <Text style={[styles.col1, styles.tableCell]}>Description</Text>
            <Text style={[styles.col2, styles.tableCell]}>Quantity</Text>
            <Text style={[styles.col3, styles.tableCell]}>Unit Price</Text>
            <Text style={[styles.col4, styles.tableCell]}>Amount</Text>
          </View>
          
          {quote.items.map((item) => (
            <View key={item.id} style={styles.tableRow}>
              <Text style={[styles.col1, styles.tableCell]}>{item.description}</Text>
              <Text style={[styles.col2, styles.tableCell]}>{item.quantity}</Text>
              <Text style={[styles.col3, styles.tableCell]}>{formatCurrency(item.unitPrice)}</Text>
              <Text style={[styles.col4, styles.tableCell]}>{formatCurrency(item.amount)}</Text>
            </View>
          ))}
        </View>

        <View style={styles.totalRow}>
          <Text style={styles.totalLabel}>Subtotal:</Text>
          <Text style={styles.totalValue}>{formatCurrency(quote.subtotal)}</Text>
        </View>

        <View style={styles.totalRow}>
          <Text style={styles.totalLabel}>Tax:</Text>
          <Text style={styles.totalValue}>{formatCurrency(quote.tax)}</Text>
        </View>

        <View style={styles.totalRow}>
          <Text style={styles.totalLabel}>Total:</Text>
          <Text style={styles.totalValue}>{formatCurrency(quote.total)}</Text>
        </View>

        {quote.notes && (
          <View style={styles.notes}>
            <Text style={styles.label}>Notes</Text>
            <Text>{quote.notes}</Text>
          </View>
        )}

        <View style={styles.validity}>
          <Text>This quote is valid until {formatDate(quote.expiryDate)}</Text>
        </View>

        <View style={styles.footer} fixed>
          <Text>Thank you for considering our services!</Text>
        </View>
      </Page>
    </Document>
  );

  // Return the document, optionally wrapped in a viewer for preview
  return preview ? <PDFViewer width="100%" height="600px">{document}</PDFViewer> : document;
};

export default QuotePDF; 
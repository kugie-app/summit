import { Document, Page, Text, View, StyleSheet, Image, Font } from '@react-pdf/renderer';
import { format } from 'date-fns';

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

interface InvoiceData {
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
  companyName: string;
  companyAddress?: string;
}

// Define styles
const styles = StyleSheet.create({
  page: {
    fontFamily: 'Helvetica',
    fontSize: 11,
    paddingTop: 30,
    paddingBottom: 30,
    paddingHorizontal: 35,
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
  companyName: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  companyAddress: {
    fontSize: 10,
    color: '#555555',
  },
  invoiceInfo: {
    flexDirection: 'column',
    alignItems: 'flex-end',
  },
  invoiceTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  invoiceNumber: {
    fontSize: 12,
    marginBottom: 4,
  },
  invoiceDate: {
    fontSize: 10,
    color: '#555555',
  },
  section: {
    marginBottom: 10,
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  table: {
    display: 'flex',
    width: 'auto',
    borderStyle: 'solid',
    borderColor: '#DDDDDD',
    borderWidth: 1,
    borderRightWidth: 0,
    borderBottomWidth: 0,
  },
  tableRow: {
    flexDirection: 'row',
  },
  tableHeader: {
    backgroundColor: '#F0F0F0',
  },
  tableCell: {
    padding: 5,
    borderStyle: 'solid',
    borderColor: '#DDDDDD',
    borderWidth: 0,
    borderRightWidth: 1,
    borderBottomWidth: 1,
  },
  tableCellDescription: {
    width: '50%',
  },
  tableCellQuantity: {
    width: '15%',
    textAlign: 'right',
  },
  tableCellUnitPrice: {
    width: '15%',
    textAlign: 'right',
  },
  tableCellAmount: {
    width: '20%',
    textAlign: 'right',
  },
  clientInfo: {
    marginBottom: 20,
  },
  clientName: {
    fontSize: 12,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  clientDetail: {
    fontSize: 10,
    marginBottom: 2,
  },
  totals: {
    marginTop: 20,
    flexDirection: 'row',
    justifyContent: 'flex-end',
  },
  totalsTable: {
    width: '40%',
  },
  totalsRow: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: '#DDDDDD',
    borderBottomStyle: 'solid',
    paddingVertical: 4,
  },
  totalsLabel: {
    width: '60%',
  },
  totalsValue: {
    width: '40%',
    textAlign: 'right',
  },
  totalRow: {
    flexDirection: 'row',
    paddingVertical: 4,
    fontWeight: 'bold',
  },
  notes: {
    marginTop: 30,
    fontSize: 10,
    color: '#555555',
  },
  footer: {
    position: 'absolute',
    bottom: 30,
    left: 35,
    right: 35,
    fontSize: 10,
    color: '#555555',
    textAlign: 'center',
    borderTopWidth: 1,
    borderTopColor: '#DDDDDD',
    borderTopStyle: 'solid',
    paddingTop: 10,
  },
  status: {
    marginTop: 20,
    fontSize: 14,
    textAlign: 'center',
    padding: 8,
    backgroundColor: '#F8F8F8',
    borderRadius: 4,
  },
  paidStatus: {
    color: '#2E7D32',
  },
  overdueStatus: {
    color: '#C62828',
  },
  draftStatus: {
    color: '#616161',
  },
  sentStatus: {
    color: '#1976D2',
  },
});

export function InvoicePDF({ invoice }: { invoice: InvoiceData }) {
  const formatCurrency = (value: string) => `$${parseFloat(value).toFixed(2)}`;
  
  const getStatusStyle = (status: string) => {
    switch(status) {
      case 'paid': return styles.paidStatus;
      case 'overdue': return styles.overdueStatus;
      case 'draft': return styles.draftStatus;
      case 'sent': return styles.sentStatus;
      default: return {};
    }
  };

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        {/* Header Section */}
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <Text style={styles.companyName}>{invoice.companyName}</Text>
            {invoice.companyAddress && (
              <Text style={styles.companyAddress}>{invoice.companyAddress}</Text>
            )}
          </View>
          <View style={styles.headerRight}>
            <Text style={styles.invoiceTitle}>INVOICE</Text>
            <Text style={styles.invoiceNumber}>{invoice.invoiceNumber}</Text>
            <Text style={styles.invoiceDate}>
              Issue Date: {format(new Date(invoice.issueDate), 'MMM dd, yyyy')}
            </Text>
            <Text style={styles.invoiceDate}>
              Due Date: {format(new Date(invoice.dueDate), 'MMM dd, yyyy')}
            </Text>
          </View>
        </View>
        
        {/* Client Information */}
        <View style={styles.clientInfo}>
          <Text style={styles.sectionTitle}>Bill To:</Text>
          <Text style={styles.clientName}>{invoice.client.name}</Text>
          {invoice.client.email && (
            <Text style={styles.clientDetail}>{invoice.client.email}</Text>
          )}
          {invoice.client.phone && (
            <Text style={styles.clientDetail}>{invoice.client.phone}</Text>
          )}
          {invoice.client.address && (
            <Text style={styles.clientDetail}>{invoice.client.address}</Text>
          )}
        </View>
        
        {/* Items Table */}
        <View style={styles.section}>
          <View style={styles.table}>
            {/* Table Header */}
            <View style={[styles.tableRow, styles.tableHeader]}>
              <View style={[styles.tableCell, styles.tableCellDescription]}>
                <Text>Description</Text>
              </View>
              <View style={[styles.tableCell, styles.tableCellQuantity]}>
                <Text>Quantity</Text>
              </View>
              <View style={[styles.tableCell, styles.tableCellUnitPrice]}>
                <Text>Unit Price</Text>
              </View>
              <View style={[styles.tableCell, styles.tableCellAmount]}>
                <Text>Amount</Text>
              </View>
            </View>
            
            {/* Table Items */}
            {invoice.items.map((item) => (
              <View key={item.id} style={styles.tableRow}>
                <View style={[styles.tableCell, styles.tableCellDescription]}>
                  <Text>{item.description}</Text>
                </View>
                <View style={[styles.tableCell, styles.tableCellQuantity]}>
                  <Text>{parseFloat(item.quantity).toFixed(2)}</Text>
                </View>
                <View style={[styles.tableCell, styles.tableCellUnitPrice]}>
                  <Text>{formatCurrency(item.unitPrice)}</Text>
                </View>
                <View style={[styles.tableCell, styles.tableCellAmount]}>
                  <Text>{formatCurrency(item.amount)}</Text>
                </View>
              </View>
            ))}
          </View>
        </View>
        
        {/* Totals */}
        <View style={styles.totals}>
          <View style={styles.totalsTable}>
            <View style={styles.totalsRow}>
              <Text style={styles.totalsLabel}>Subtotal:</Text>
              <Text style={styles.totalsValue}>{formatCurrency(invoice.subtotal)}</Text>
            </View>
            <View style={styles.totalsRow}>
              <Text style={styles.totalsLabel}>Tax:</Text>
              <Text style={styles.totalsValue}>{formatCurrency(invoice.tax)}</Text>
            </View>
            <View style={styles.totalRow}>
              <Text style={styles.totalsLabel}>Total:</Text>
              <Text style={styles.totalsValue}>{formatCurrency(invoice.total)}</Text>
            </View>
          </View>
        </View>
        
        {/* Status */}
        <View style={styles.status}>
          <Text style={getStatusStyle(invoice.status)}>
            {invoice.status.toUpperCase()}
            {invoice.status === 'paid' && ' - Thank you for your business!'}
          </Text>
        </View>
        
        {/* Notes */}
        {invoice.notes && (
          <View style={styles.notes}>
            <Text style={styles.sectionTitle}>Notes:</Text>
            <Text>{invoice.notes}</Text>
          </View>
        )}
        
        {/* Footer */}
        <View style={styles.footer}>
          <Text>
            Invoice {invoice.invoiceNumber} | Issue Date: {format(new Date(invoice.issueDate), 'MMM dd, yyyy')} | 
            Generated on {format(new Date(), 'MMM dd, yyyy')}
          </Text>
        </View>
      </Page>
    </Document>
  );
} 
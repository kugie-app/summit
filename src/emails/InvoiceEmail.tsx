import React from 'react';
import {
  Body,
  Button,
  Container,
  Head,
  Heading,
  Html,
  Img,
  Link,
  Preview,
  Section,
  Text,
  Hr,
  Column,
  Row,
} from '@react-email/components';
import { format } from 'date-fns';

interface InvoiceEmailProps {
  invoice: {
    id: number;
    invoiceNumber: string;
    status: string;
    issueDate: string | Date;
    dueDate: string | Date;
    total: number | string;
    client: {
      name: string;
      email?: string;
    };
    company?: {
      name: string;
    };
  };
  downloadUrl: string;
  viewUrl: string;
  paymentUrl?: string;
}

const formatDate = (date: string | Date) => {
  return format(new Date(date), 'PP');
};

const formatCurrency = (amount: number | string) => {
  // apply id-ID currency format
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
  }).format(Number(amount));
};

export const InvoiceEmail: React.FC<InvoiceEmailProps> = ({
  invoice,
  downloadUrl,
  viewUrl,
  paymentUrl,
}) => {
  const previewText = `Invoice ${invoice.invoiceNumber} for ${formatCurrency(invoice.total)}`;

  return (
    <Html>
      <Head />
      <Preview>{previewText}</Preview>
      <Body style={main}>
        <Container style={container}>
          <Section style={logoContainer}>
            <Img
              src="https://via.placeholder.com/150x50?text=Your+Logo"
              width="150"
              height="50"
              alt="Company Logo"
            />
          </Section>
          
          <Section style={content}>
            <Heading style={heading}>Invoice {invoice.invoiceNumber}</Heading>
            
            <Text style={paragraph}>
              Dear {invoice.client.name},
            </Text>
            
            <Text style={paragraph}>
              We hope this email finds you well. Please find attached your invoice 
              {' '}<strong>{invoice.invoiceNumber}</strong> for the amount of 
              {' '}<strong>{formatCurrency(invoice.total)}</strong>.
            </Text>
            
            <Section style={details}>
              <Row>
                <Column>Issue Date:</Column>
                <Column align="right">{formatDate(invoice.issueDate)}</Column>
              </Row>
              <Row>
                <Column>Due Date:</Column>
                <Column align="right">{formatDate(invoice.dueDate)}</Column>
              </Row>
              <Row style={totalRow}>
                <Column>Total Amount:</Column>
                <Column align="right">{formatCurrency(invoice.total)}</Column>
              </Row>
            </Section>
            
            <Section style={buttonContainer}>
              <Button style={button} href={viewUrl}>
                View Invoice
              </Button>
              
              <Button style={{...button, backgroundColor: '#34D399'}} href={downloadUrl}>
                Download PDF
              </Button>
              
              {paymentUrl && (
                <Button style={{...button, backgroundColor: '#3B82F6'}} href={paymentUrl}>
                  Pay Now
                </Button>
              )}
            </Section>
            
            <Hr style={hr} />
            
            <Text style={paragraph}>
              If you have any questions regarding this invoice, please don&apos;t hesitate to contact us.
            </Text>
            
            <Text style={paragraph}>
              Thank you for your business!
            </Text>
            
            <Text style={footer}>
              {invoice.company?.name || 'Your Company'} - {new Date().getFullYear()}
            </Text>
          </Section>
        </Container>
      </Body>
    </Html>
  );
};

// Styles
const main = {
  backgroundColor: '#f6f9fc',
  fontFamily:
    '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Oxygen-Sans, Ubuntu, Cantarell, "Helvetica Neue", sans-serif',
};

const container = {
  backgroundColor: '#ffffff',
  margin: '0 auto',
  padding: '20px 0',
  borderRadius: '4px',
  maxWidth: '600px',
};

const logoContainer = {
  padding: '20px',
};

const content = {
  padding: '0 20px',
};

const heading = {
  fontSize: '24px',
  fontWeight: 'bold',
  marginBottom: '15px',
};

const paragraph = {
  fontSize: '16px',
  lineHeight: '26px',
  marginBottom: '15px',
};

const details = {
  padding: '15px',
  backgroundColor: '#f9fafb',
  borderRadius: '4px',
  marginBottom: '20px',
};

const totalRow = {
  fontWeight: 'bold',
  borderTop: '1px solid #e5e7eb',
  paddingTop: '8px',
  marginTop: '8px',
};

const buttonContainer = {
  textAlign: 'center' as const,
  margin: '25px 0',
};

const button = {
  backgroundColor: '#10B981',
  borderRadius: '4px',
  color: '#ffffff',
  fontSize: '16px',
  textDecoration: 'none',
  padding: '10px 20px',
  margin: '0 8px',
  display: 'inline-block',
};

const hr = {
  borderColor: '#e5e7eb',
  margin: '25px 0',
};

const footer = {
  fontSize: '14px',
  color: '#6b7280',
  marginTop: '25px',
  textAlign: 'center' as const,
};

export default InvoiceEmail; 
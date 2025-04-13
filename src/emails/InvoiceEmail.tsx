import {
  Body,
  Button,
  Container,
  Head,
  Heading,
  Hr,
  Html,
  Img,
  Link,
  Preview,
  Section,
  Text,
} from '@react-email/components';
import { format } from 'date-fns';

interface InvoiceEmailProps {
  invoiceNumber: string;
  clientName: string;
  issueDate: string;
  dueDate: string;
  total: string;
  status: string;
  viewUrl: string;
  paymentUrl?: string;
  companyName: string;
}

export function InvoiceEmail({
  invoiceNumber,
  clientName,
  issueDate,
  dueDate,
  total,
  status,
  viewUrl,
  paymentUrl,
  companyName = 'Your Company',
}: InvoiceEmailProps) {
  const formattedTotal = `$${parseFloat(total).toFixed(2)}`;
  const formattedIssueDate = format(new Date(issueDate), 'MMMM dd, yyyy');
  const formattedDueDate = format(new Date(dueDate), 'MMMM dd, yyyy');
  
  return (
    <Html>
      <Head />
      <Preview>Invoice {invoiceNumber} from {companyName}</Preview>
      <Body style={main}>
        <Container style={container}>
          <Heading style={header}>{companyName}</Heading>
          
          <Section style={section}>
            <Heading as="h2" style={subheader}>
              Invoice {invoiceNumber}
            </Heading>
            
            <Text style={paragraph}>Dear {clientName},</Text>
            
            <Text style={paragraph}>
              Please find attached your invoice {invoiceNumber}, issued on {formattedIssueDate} and due on {formattedDueDate}.
            </Text>
            
            <Section style={infoBox}>
              <Text style={infoText}>
                <strong>Invoice Number:</strong> {invoiceNumber}
              </Text>
              <Text style={infoText}>
                <strong>Issue Date:</strong> {formattedIssueDate}
              </Text>
              <Text style={infoText}>
                <strong>Due Date:</strong> {formattedDueDate}
              </Text>
              <Text style={infoText}>
                <strong>Total Amount:</strong> {formattedTotal}
              </Text>
              <Text style={infoText}>
                <strong>Status:</strong> {status.charAt(0).toUpperCase() + status.slice(1)}
              </Text>
            </Section>
            
            <Section style={buttonContainer}>
              <Button style={button} href={viewUrl}>
                View Invoice
              </Button>
              
              {paymentUrl && status !== 'paid' && (
                <Button style={{ ...button, backgroundColor: '#16a34a' }} href={paymentUrl}>
                  Pay Now
                </Button>
              )}
            </Section>
            
            <Text style={paragraph}>
              You can view the full invoice details by clicking the button above or following this link: <Link href={viewUrl}>{viewUrl}</Link>
            </Text>
            
            {status !== 'paid' && (
              <Text style={paragraph}>
                Please ensure payment is made by the due date. If you have any questions about this invoice, please don't hesitate to contact us.
              </Text>
            )}
            
            {status === 'paid' && (
              <Text style={paragraph}>
                Thank you for your payment. This invoice has been marked as paid.
              </Text>
            )}
          </Section>
          
          <Hr style={hr} />
          
          <Text style={footer}>
            &copy; {new Date().getFullYear()} {companyName}. All rights reserved.
          </Text>
        </Container>
      </Body>
    </Html>
  );
}

// Styles
const main = {
  backgroundColor: '#f6f9fc',
  fontFamily:
    '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Oxygen-Sans, Ubuntu, Cantarell, "Helvetica Neue", sans-serif',
};

const container = {
  margin: '0 auto',
  padding: '20px 0 48px',
  maxWidth: '600px',
};

const header = {
  fontSize: '24px',
  lineHeight: '1.3',
  fontWeight: '700',
  color: '#484848',
  padding: '17px 0 0',
};

const subheader = {
  fontSize: '20px',
  lineHeight: '1.3',
  fontWeight: '700',
  color: '#484848',
};

const section = {
  backgroundColor: '#ffffff',
  padding: '24px',
  border: '1px solid #e6ebf1',
  borderRadius: '6px',
  marginTop: '16px',
};

const paragraph = {
  fontSize: '16px',
  lineHeight: '1.4',
  color: '#484848',
  marginTop: '16px',
  marginBottom: '16px',
};

const infoBox = {
  backgroundColor: '#f9fafb',
  borderRadius: '4px',
  padding: '16px',
  marginTop: '16px',
  marginBottom: '16px',
};

const infoText = {
  fontSize: '14px',
  lineHeight: '1.4',
  color: '#484848',
  margin: '4px 0',
};

const buttonContainer = {
  display: 'flex',
  justifyContent: 'center',
  gap: '12px',
  marginTop: '24px',
  marginBottom: '24px',
};

const button = {
  backgroundColor: '#1e40af',
  borderRadius: '4px',
  color: '#fff',
  fontSize: '14px',
  fontWeight: '600',
  textDecoration: 'none',
  textAlign: 'center' as const,
  padding: '10px 20px',
};

const hr = {
  borderColor: '#e6ebf1',
  margin: '20px 0',
};

const footer = {
  fontSize: '12px',
  lineHeight: '1.5',
  color: '#9ca3af',
  textAlign: 'center' as const,
  marginTop: '16px',
}; 
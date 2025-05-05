import Xendit from 'xendit-node';

// Initialize the Xendit SDK with the secret key from environment variables
// Important: This key should only be used server-side
export const xenditClient = new Xendit({
  secretKey: process.env.XENDIT_SECRET_KEY || '',
});

// Get the Invoice service
export const Invoice = xenditClient.Invoice;

// Function to create a Xendit invoice for an internal invoice
export const createXenditInvoice = async ({
  invoiceId,
  invoiceNumber,
  amount,
  currency,
  customerEmail,
  customerName,
  description,
  successRedirectUrl,
  failureRedirectUrl,
  invoiceDuration,
}: {
  invoiceId: number;
  invoiceNumber: string;
  amount: number;
  currency: string;
  customerEmail: string;
  customerName: string;
  description: string;
  successRedirectUrl?: string;
  failureRedirectUrl?: string;
  invoiceDuration?: number;
}) => {
  try {
    // Create a Xendit invoice - following the official SDK structure
    // Use type assertion to handle discrepancy between SDK types and actual API
    const xenditInvoice = await (Invoice as any).createInvoice({
      data: {
        externalId: `inv-${invoiceId}-${invoiceNumber.replace(/[^a-zA-Z0-9]/g, '')}`,
        amount,
        payerEmail: customerEmail,
        description,
        currency: currency || 'IDR',
        invoiceDuration: invoiceDuration,
        successRedirectURL: successRedirectUrl || `${process.env.NEXT_PUBLIC_URL}/payment/success`,
        failureRedirectURL: failureRedirectUrl || `${process.env.NEXT_PUBLIC_URL}/payment/failure`,
        payerName: customerName,
        reminderTime: 24,
        shouldSendEmail: true,
      }
    });

    return xenditInvoice;
  } catch (error) {
    console.error('Error creating Xendit invoice:', error);
    throw error;
  }
};

// Verify Xendit webhook signature
export const verifyWebhookSignature = (
  token: string | null,
  expectedToken: string | undefined
) => {
  if (!token || !expectedToken) {
    return false;
  }
  
  return token === expectedToken;
}; 
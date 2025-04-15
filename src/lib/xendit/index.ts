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
  expiryDate,
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
  expiryDate?: Date;
}) => {
  try {
    // Create a Xendit invoice - using any type to bypass type checking as Xendit's
    // SDK types may not match their actual API
    const xenditInvoice = await (Invoice as any).createInvoice({
      externalID: `inv-${invoiceId}-${invoiceNumber.replace(/[^a-zA-Z0-9]/g, '')}`, // Must be unique in Xendit's system
      amount,
      payerEmail: customerEmail,
      description,
      currency: currency || 'IDR', // Default to IDR if not specified
      invoiceDuration: expiryDate ? Math.ceil((expiryDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24)) : 7, // Default 7 days or until expiry date
      successRedirectURL: successRedirectUrl || process.env.NEXT_PUBLIC_URL + '/payment/success',
      failureRedirectURL: failureRedirectUrl || process.env.NEXT_PUBLIC_URL + '/payment/failure',
      // Optional fields
      payerName: customerName,
      reminderTime: 24, // Send reminder 24 hours before expiry
      shouldSendEmail: true,
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
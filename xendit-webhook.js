import { Hono } from "hono@4";
import { cors } from "hono/cors";
import 'dotenv/config';

const app = new Hono();
app.use("/*", cors());

app.get("/", (c) => c.text("Xendit webhook handler"));
app.get("/api/health", (c) => c.json({ status: "ok" }));

// Format currency as IDR
function formatIDR(amount) {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    minimumFractionDigits: 0,
  }).format(amount);
}

// Helper function to format date
function formatDate(dateString) {
  const date = new Date(dateString);
  return date.toLocaleString("id-ID", {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: "Asia/Jakarta",
  });
}

// Enhanced endpoint to handle Xendit invoice payment webhook
app.post("/api/notify/invoice", async (c) => {
  try {
    // Verify the Xendit webhook using token verification
    const callbackToken = c.req.headers.get('x-callback-token');
    const expectedToken = process.env.XENDIT_CALLBACK_VERIFICATION_TOKEN;

    if (callbackToken !== expectedToken) {
      console.error('Invalid Xendit callback token');
      return c.json({ message: 'Invalid token' }, 401);
    }

    // Parse the webhook payload
    const payload = await c.req.json();
    console.log(payload);

    // The Slack webhook URL
    const webhookUrl = process.env.SLACK_WEBHOOK;

    // Determine message styling and content based on payment status
    let headerText = "";
    let headerEmoji = "";
    let messageText = "";
    let buttonStyle = "primary";
    let buttonText = "View Details";
    let invoiceUpdateResult = null;

    // Configure message based on payment status
    switch (payload.status) {
      case "PAID":
        headerText = "Payment Received!";
        headerEmoji = "🎉";
        messageText = `Hi, a payment has been successfully processed through Xendit!`;
        
        // Update invoice status by calling the internal API
        try {
          // Forward the payment data to our internal API
          const apiResponse = await fetch(`${process.env.INTERNAL_API_URL}/api/webhooks/xendit/payment`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'x-callback-token': callbackToken || ''
            },
            body: JSON.stringify(payload)
          });
          
          if (apiResponse.ok) {
            invoiceUpdateResult = await apiResponse.json();
            if (invoiceUpdateResult.invoiceNumber) {
              messageText += `\n\n*Invoice ${invoiceUpdateResult.invoiceNumber} has been marked as paid in the system.*`;
            }
          } else {
            const errorData = await apiResponse.json();
            console.error('API error:', errorData);
            messageText += `\n\n⚠️ *Note: Could not update invoice status in the system. Please update manually.*`;
          }
        } catch (apiError) {
          console.error('Error updating invoice status:', apiError);
          messageText += `\n\n⚠️ *Note: Could not update invoice status in the system. Please update manually.*`;
        }
        break;
      case "EXPIRED":
        headerText = "Payment Expired";
        headerEmoji = "⚠️";
        messageText = `Hi <!subteam^S08EKGKPHPV>, an invoice payment has expired without being completed.`;
        buttonStyle = "danger";
        break;
      case "PENDING":
        headerText = "Payment Pending";
        headerEmoji = "⏳";
        messageText = `Hi <!subteam^S08EKGKPHPV>, a new invoice has been created and is awaiting payment.`;
        buttonStyle = "default";
        break;
      case "SETTLED":
        headerText = "Payment Settled";
        headerEmoji = "✅";
        messageText = `Hi <!subteam^S08EKGKPHPV>, a payment has been settled and funds have been disbursed.`;
        break;
      case "FAILED":
        headerText = "Payment Failed";
        headerEmoji = "❌";
        messageText = `Hi <!subteam^S08EKGKPHPV>, a payment attempt has failed.`;
        buttonStyle = "danger";
        buttonText = "View Payment Error";
        break;
      default:
        headerText = "Payment Status Update";
        headerEmoji = "📌";
        messageText = `Hi <!subteam^S08EKGKPHPV>, there's an update on a payment (status: ${payload.status}).`;
    }

    // Common fields that apply to all statuses
    const commonFields = [
      {
        type: "mrkdwn",
        text: `*Invoice ID:*\n${payload.external_id || payload.id}`,
      },
      {
        type: "mrkdwn",
        text: `*Status:*\n${payload.status}`,
      },
      {
        type: "mrkdwn",
        text: `*Amount:*\n${formatIDR(payload.amount)}`,
      },
    ];

    // Fields that may depend on status
    const additionalFields = [];

    // Add payment method if available
    if (
      payload.payment_method ||
      payload.bank_code ||
      payload.payment_channel
    ) {
      additionalFields.push({
        type: "mrkdwn",
        text: `*Payment Method:*\n${payload.payment_method || "Unknown"} (${
          payload.bank_code || payload.payment_channel || "N/A"
        })`,
      });
    }

    // Add payer info if available
    if (payload.payer_email) {
      additionalFields.push({
        type: "mrkdwn",
        text: `*Payer:*\n${payload.payer_email}`,
      });
    }

    // Add timestamp based on status
    if (payload.status === "PAID" && payload.paid_at) {
      additionalFields.push({
        type: "mrkdwn",
        text: `*Paid At:*\n${formatDate(payload.paid_at)}`,
      });
    } else if (payload.status === "EXPIRED" && payload.updated) {
      additionalFields.push({
        type: "mrkdwn",
        text: `*Expired At:*\n${formatDate(payload.updated)}`,
      });
    } else if (payload.created) {
      additionalFields.push({
        type: "mrkdwn",
        text: `*Created At:*\n${formatDate(payload.created)}`,
      });
    }

    // Create a more descriptive message with payment details
    const message = {
      blocks: [
        {
          type: "header",
          text: {
            type: "plain_text",
            text: `${headerEmoji} ${headerText}`,
            emoji: true,
          },
        },
        {
          type: "section",
          text: {
            type: "mrkdwn",
            text: messageText,
          },
        },
        {
          type: "divider",
        },
        {
          type: "section",
          fields: [...commonFields, ...additionalFields],
        },
        {
          type: "context",
          elements: [
            {
              type: "mrkdwn",
              text: `*Description:* ${
                payload.description || "No description provided"
              }`,
            },
          ],
        },
        {
          type: "actions",
          elements: [
            {
              type: "button",
              text: {
                type: "plain_text",
                text: buttonText,
                emoji: true,
              },
              url: "https://dashboard.xendit.co/invoices",
              style: buttonStyle,
            },
          ],
        },
      ],
    };

    // Send the notification to Slack
    const response = await fetch(webhookUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(message),
    });

    if (!response.ok) {
      throw new Error(
        `Failed to send Slack notification: ${response.status} ${response.statusText}`
      );
    }

    return c.json({
      success: true,
      message: `${headerText} notification sent to Slack`,
      payment_details: {
        id: payload.id,
        external_id: payload.external_id,
        amount: payload.amount,
        status: payload.status,
      },
      invoice_update: invoiceUpdateResult,
    });
  } catch (error) {
    console.error(
      "Error processing webhook or sending Slack notification:",
      error
    );
    return c.json({ success: false, error: error.message }, 500);
  }
});

Bun.serve({
  port: process.env.PORT ?? 3000,
  fetch: app.fetch,
}); 
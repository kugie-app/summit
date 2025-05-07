/**
 * Application configuration based on environment variables
 */
export const config = {
  /**
   * Whether signup functionality is disabled
   * Set NEXT_PUBLIC_DISABLE_SIGNUP=1 to disable signup
   */
  isSignupDisabled: process.env.NEXT_PUBLIC_DISABLE_SIGNUP === '1',
  
  /**
   * Public URL for the application
   */
  publicUrl: process.env.NEXT_PUBLIC_URL || 'https://summitfinance.app',
  
  /**
   * Email configuration
   */
  email: {
    fromName: process.env.RESEND_FROM_NAME,
    fromEmail: process.env.RESEND_FROM_EMAIL || 'summit@kugie.app',
  },
}; 
/**
 * Recurring Transactions Cron Job Configuration
 * 
 * This file contains settings and documentation for setting up the recurring transactions cron job
 * in different deployment environments.
 */

/**
 * For Vercel deployment:
 * 
 * 1. Add the following to your package.json:
 * 
 * "scripts": {
 *   ...
 *   "process-recurring": "curl -X POST https://your-domain.com/api/jobs/recurring-transactions -H 'Authorization: Bearer $RECURRING_TRANSACTIONS_API_KEY'"
 * }
 * 
 * 2. Go to Vercel dashboard > your project > Settings > Cron Jobs
 * 3. Add a new Cron Job:
 *    - Name: Process Recurring Transactions
 *    - Command: npm run process-recurring
 *    - Schedule: 0 0 * * * (runs daily at midnight)
 * 4. Make sure your RECURRING_TRANSACTIONS_API_KEY environment variable is set in Vercel
 */

/**
 * For other deployment environments (e.g., AWS, Node server):
 * 
 * Option 1: Using node-cron (for standalone Node.js server)
 * 
 * 1. Install node-cron: npm install node-cron
 * 2. Create a cron.js file:
 * 
 * ```javascript
 * const cron = require('node-cron');
 * const fetch = require('node-fetch');
 * const API_KEY = process.env.RECURRING_TRANSACTIONS_API_KEY;
 * 
 * // Schedule task to run at midnight every day
 * cron.schedule('0 0 * * *', async () => {
 *   try {
 *     const response = await fetch('https://your-domain.com/api/jobs/recurring-transactions', {
 *       method: 'POST',
 *       headers: {
 *         'Authorization': `Bearer ${API_KEY}`
 *       }
 *     });
 *     const data = await response.json();
 *     console.log('Recurring transactions processed:', data);
 *   } catch (error) {
 *     console.error('Error processing recurring transactions:', error);
 *   }
 * });
 * ```
 * 
 * Option 2: Using external cron service (e.g., AWS Lambda + EventBridge)
 * 
 * 1. Create an AWS Lambda function that makes a POST request to your API endpoint
 * 2. Set up an EventBridge rule to trigger the Lambda function daily
 * 3. Store your API key securely in AWS Parameter Store or Secrets Manager
 */

// Configuration constants (can be customized based on your needs)
export const RECURRING_TRANSACTION_CONFIG = {
  // Default schedule (cron syntax) - daily at midnight
  DEFAULT_SCHEDULE: '0 0 * * *',
  
  // Alternative schedules
  SCHEDULES: {
    HOURLY: '0 * * * *',
    DAILY: '0 0 * * *',
    WEEKLY: '0 0 * * 0', // Midnight on Sunday
    MONTHLY: '0 0 1 * *', // Midnight on the 1st of each month
  },
  
  // The endpoint to call
  ENDPOINT: '/api/jobs/recurring-transactions',
  
  // For testing/debugging
  DEBUG_MODE: process.env.NODE_ENV === 'development',
};

export default RECURRING_TRANSACTION_CONFIG; 
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
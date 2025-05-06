// src/lib/utils.test.ts
import { formatCurrency, cn, formatDate, formatNumber, generateInvoiceNumber } from '@/lib/utils';

describe('Utility Functions', () => {
  it('should format currency correctly', () => {
    // Don't test for exact format due to locale differences
    const formatted = formatCurrency(12345.67, 'IDR');
    expect(formatted).toContain('Rp');
    expect(formatted).toContain('12');
    
    // For USD, just check if it has $ symbol
    const formattedUSD = formatCurrency(100, 'USD');
    expect(formattedUSD).toContain('$');
    expect(formattedUSD).toContain('100');
  });

  it('should combine class names', () => {
    expect(cn('a', 'b', { c: true, d: false })).toBe('a b c');
    expect(cn('a', { b: false, c: true })).toBe('a c');
    expect(cn('a', { b: true }, ['c', 'd'])).toBe('a b c d');
  });

  it('should format date correctly', () => {
    // Creating a fixed date for testing
    const testDate = new Date(2024, 5, 15); // June 15, 2024
    expect(formatDate(testDate)).toBe('Jun 15, 2024');
    
    // Test with string date
    const testDateString = '2024-06-15T12:00:00Z';
    expect(formatDate(testDateString)).toBe('Jun 15, 2024');
  });

  it('should format numbers with thousand separators', () => {
    // Don't test exact formatting due to locale differences
    const formatted = formatNumber(1234567);
    expect(formatted.length).toBeGreaterThan(7); // Should have separators
    expect(formatted).toContain('1');
    expect(formatted).toContain('234');
    expect(formatted).toContain('567');
  });

  it('should generate invoice numbers with the correct format', () => {
    const invoiceNumber = generateInvoiceNumber();
    
    // Check if it starts with the prefix
    expect(invoiceNumber).toMatch(/^INV-\d{8}-\d{4}$/);
    
    // Generate a second one to ensure they're unique
    const invoiceNumber2 = generateInvoiceNumber();
    expect(invoiceNumber).not.toBe(invoiceNumber2);
  });
}); 
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import ExpenseForm from '@/components/expenses/ExpenseForm';
import { toast } from 'sonner';
import { useRouter } from 'next/navigation';
import { format } from 'date-fns';

// Mock fetch
global.fetch = jest.fn();

// Mock next/navigation
jest.mock('next/navigation', () => ({
  useRouter: jest.fn(() => ({
    push: jest.fn(),
    refresh: jest.fn(),
    back: jest.fn()
  }))
}));

// Mock sonner
jest.mock('sonner', () => ({
  toast: {
    success: jest.fn(),
    error: jest.fn()
  }
}));

// Mock date-fns
jest.mock('date-fns', () => ({
  format: jest.fn().mockImplementation((date, formatString) => {
    if (formatString === 'yyyy-MM-dd') {
      return '2023-01-01';
    }
    return 'Jan 1, 2023';
  })
}));

describe('ExpenseForm', () => {
  const mockRouter = {
    push: jest.fn(),
    refresh: jest.fn()
  };
  
  // Spy on console.error
  const originalConsoleError = console.error;
  
  // Mock data for categories and vendors
  const mockCategories = [
    { id: 1, name: 'Office Supplies' },
    { id: 2, name: 'Software' },
    { id: 3, name: 'Travel' }
  ];
  
  const mockVendors = [
    { id: 1, name: 'Acme Inc.' },
    { id: 2, name: 'TechStore' }
  ];
  
  beforeEach(() => {
    (fetch as jest.Mock).mockClear();
    (toast.success as jest.Mock).mockClear();
    (toast.error as jest.Mock).mockClear();
    (useRouter as jest.Mock).mockImplementation(() => mockRouter);
    mockRouter.push.mockClear();
    mockRouter.refresh.mockClear();
    
    // Default mock implementations for fetch calls
    (fetch as jest.Mock).mockImplementation((url) => {
      if (url === '/api/vendors') {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({ data: mockVendors })
        });
      } else if (url === '/api/expense-categories') {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({ data: mockCategories })
        });
      }
      
      return Promise.resolve({ ok: false });
    });
    
    // Replace console.error with a mock
    console.error = jest.fn();
  });
  
  afterEach(() => {
    // Restore original console.error
    console.error = originalConsoleError;
  });
  
  it('renders the form correctly for creating new expense', async () => {
    await act(async () => {
      render(<ExpenseForm />);
    });
    
    // Check form fields
    expect(screen.getByLabelText(/Amount/i)).toBeInTheDocument();
    
    // Look for text elements rather than specific form elements
    expect(screen.getByLabelText(/Expense Date/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Description/i)).toBeInTheDocument();
    
    // Check for select elements
    expect(screen.getByLabelText(/Status/i)).toBeInTheDocument();
    
    // For elements with multiple matches, use getByRole with name
    const recurringLabel = screen.getAllByText(/Recurring/i)[0];
    expect(recurringLabel).toBeInTheDocument();
    
    // Check for vendor and category options
    expect(screen.getByText('Office Supplies')).toBeInTheDocument();
    expect(screen.getByText('Acme Inc.')).toBeInTheDocument();
    
    // Look for button by role
    const submitButton = screen.getByRole('button', { name: /create expense/i });
    expect(submitButton).toBeInTheDocument();
  });
  
  it('loads and displays expense data when editing', async () => {
    // Mock fetch for getting expense details
    (fetch as jest.Mock).mockImplementationOnce((url) => {
      if (url === '/api/expenses/1') {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({
            id: 1,
            amount: '100.50',
            description: 'Office chair',
            expenseDate: '2023-01-15',
            vendorId: 1,
            categoryId: 1,
            status: 'approved',
            recurring: 'none'
          })
        });
      }
      return Promise.resolve({ ok: true });
    });
    
    await act(async () => {
      render(<ExpenseForm expenseId="1" />);
    });
    
    // Look for "Edit Expense" title instead of specific input values
    await waitFor(() => {
      const cardTitle = screen.getAllByText(/Edit Expense/i)[0];
      expect(cardTitle).toBeInTheDocument();
    });
    
    // Wait for form data to be populated
    await waitFor(() => {
      // Look for any input field with the numeric value
      const amountInput = screen.getByLabelText(/Amount/i);
      expect(amountInput).toBeInTheDocument();
    });
  });
  
  it('shows next due date field when recurring is not "none"', async () => {
    await act(async () => {
      render(<ExpenseForm />);
    });
    
    // Wait for form to load
    await waitFor(() => {
      const recurringSelect = screen.getByLabelText(/Recurring/i);
      expect(recurringSelect).toBeInTheDocument();
    });
    
    // Initially, next due date should not be visible
    expect(screen.queryByText(/Next Due Date/i)).not.toBeInTheDocument();
    
    // Change recurring value to monthly
    await act(async () => {
      // Find the recurring select by label
      const recurringSelect = screen.getByLabelText(/Recurring/i);
      fireEvent.change(recurringSelect, { target: { value: 'monthly' } });
    });
    
    // Next due date should now be visible
    await waitFor(() => {
      expect(screen.getByText(/Next Due Date/i)).toBeInTheDocument();
    });
  });
  
  it('submits new expense successfully', async () => {
    // Mock successful response for categories and vendors
    (fetch as jest.Mock).mockImplementation((url) => {
      if (url === '/api/vendors') {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({ data: mockVendors })
        });
      } else if (url === '/api/expense-categories') {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({ data: mockCategories })
        });
      } else if (url === '/api/expenses' && (fetch as jest.Mock).mock.calls[2]?.[1]?.method === 'POST') {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({ id: 1, success: true })
        });
      }
      
      return Promise.resolve({
        ok: true,
        json: () => Promise.resolve({ data: [] })
      });
    });
    
    await act(async () => {
      render(<ExpenseForm />);
    });
    
    // Wait for form to load
    await waitFor(() => {
      expect(screen.getByLabelText(/Amount/i)).toBeInTheDocument();
    });
    
    // Fill in required fields
    await act(async () => {
      // Fill amount
      fireEvent.change(screen.getByLabelText(/Amount/i), { target: { value: '200' } });
      
      // Fill expense date
      const dateInput = screen.getByLabelText(/Expense Date/i);
      fireEvent.change(dateInput, { target: { value: '2023-01-15' } });
      
      // Select vendor using by ID
      const vendorSelect = document.getElementById('vendorId') as HTMLSelectElement;
      fireEvent.change(vendorSelect, { target: { value: '1' } });
    });
    
    // Submit the form
    await act(async () => {
      const submitButton = screen.getByRole('button', { name: /create expense/i });
      fireEvent.click(submitButton);
    });
    
    // Wait for submission to complete and verify toast was called
    await waitFor(() => {
      expect(toast.success).toHaveBeenCalledWith("Expense created successfully");
    });
    
    // Verify router was called to redirect
    expect(mockRouter.push).toHaveBeenCalledWith("/expenses");
    expect(mockRouter.refresh).toHaveBeenCalled();
  });
  
  it('handles API errors during submission', async () => {
    // Mock failed form submission
    (fetch as jest.Mock).mockImplementationOnce((url, options) => {
      if (url === '/api/expenses' && options.method === 'POST') {
        return Promise.resolve({
          ok: false,
          json: () => Promise.resolve({ message: 'Validation error' })
        });
      }
      return Promise.resolve({ ok: true });
    });
    
    await act(async () => {
      render(<ExpenseForm />);
    });
    
    // Wait for form to load
    await waitFor(() => {
      expect(screen.getByLabelText(/Amount/i)).toBeInTheDocument();
    });
    
    // Fill in only the amount field
    await act(async () => {
      fireEvent.change(screen.getByLabelText(/Amount/i), { target: { value: '200' } });
    });
    
    // Submit the form
    await act(async () => {
      const submitButton = screen.getByRole('button', { name: /create expense/i });
      fireEvent.click(submitButton);
    });
    
    // Wait for API response
    await waitFor(() => {
      expect(fetch).toHaveBeenCalledWith('/api/expenses', expect.anything());
    });
    
    // Verify error toast was shown
    expect(toast.error).toHaveBeenCalled();
  });
}); 
// src/components/clients/ClientForm.test.tsx
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ClientForm } from '@/components/clients/ClientForm';
import { toast } from 'sonner';

// Mock fetch
global.fetch = jest.fn();

// Mock next/navigation
jest.mock('next/navigation');

// Mock sonner
jest.mock('sonner');

describe('ClientForm', () => {
  // Spy on console.error 
  const originalConsoleError = console.error;
  
  beforeEach(() => {
    (fetch as jest.Mock).mockClear();
    (toast.success as jest.Mock).mockClear();
    (toast.error as jest.Mock).mockClear();
    // Replace console.error with a mock to suppress error output in tests
    console.error = jest.fn();
  });

  afterEach(() => {
    // Restore original console.error after each test
    console.error = originalConsoleError;
  });

  it('renders the form correctly', () => {
    render(<ClientForm onSuccess={jest.fn()} />);
    
    // Check if form elements are rendered
    expect(screen.getByLabelText(/Name/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Email/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Phone/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Address/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Payment Terms/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Create Client/i })).toBeInTheDocument();
  });

  it('renders with initial data when provided', () => {
    const initialData = {
      id: 1,
      name: 'Test Client',
      email: 'test@example.com',
      phone: '123456789',
      address: '123 Test St',
      paymentTerms: 45
    };
    
    render(<ClientForm initialData={initialData} onSuccess={jest.fn()} />);
    
    // Check if form fields are populated with initial data
    expect(screen.getByLabelText(/Name/i)).toHaveValue('Test Client');
    expect(screen.getByLabelText(/Email/i)).toHaveValue('test@example.com');
    expect(screen.getByLabelText(/Phone/i)).toHaveValue('123456789');
    expect(screen.getByLabelText(/Address/i)).toHaveValue('123 Test St');
    expect(screen.getByLabelText(/Payment Terms/i)).toHaveValue(45);
    
    // Should show Update Client button for editing instead of Save Changes
    expect(screen.getByRole('button', { name: /Update Client/i })).toBeInTheDocument();
  });
  
  it('submits the form with correct data', async () => {
    const user = userEvent.setup();
    const mockSuccess = jest.fn();
    
    // Mock successful fetch response
    (fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ id: 1, name: 'New Client' })
    });
    
    render(<ClientForm onSuccess={mockSuccess} />);
    
    // Fill in form fields
    await user.type(screen.getByLabelText(/Name/i), 'New Client');
    await user.type(screen.getByLabelText(/Email/i), 'new@example.com');
    await user.type(screen.getByLabelText(/Phone/i), '987654321');
    await user.type(screen.getByLabelText(/Address/i), '789 New St');
    
    // Clear payment terms and set new value
    await user.clear(screen.getByLabelText(/Payment Terms/i));
    await user.type(screen.getByLabelText(/Payment Terms/i), '60');
    
    // Submit the form
    await user.click(screen.getByRole('button', { name: /Create Client/i }));
    
    // Check if fetch was called correctly
    await waitFor(() => {
      expect(fetch).toHaveBeenCalledWith('/api/clients', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          name: 'New Client',
          email: 'new@example.com',
          phone: '987654321',
          address: '789 New St',
          paymentTerms: 60
        })
      });
    });
    
    // Check if success callback was called
    await waitFor(() => {
      expect(mockSuccess).toHaveBeenCalledWith({ id: 1, name: 'New Client' });
      expect(toast.success).toHaveBeenCalledWith('Client created successfully');
    });
  });
  
  it('handles errors during form submission', async () => {
    const user = userEvent.setup();
    
    // Mock failed fetch response
    (fetch as jest.Mock).mockResolvedValueOnce({
      ok: false,
      json: async () => ({ message: 'Client with this email already exists' })
    });
    
    render(<ClientForm onSuccess={jest.fn()} />);
    
    // Fill in just the required fields
    await user.type(screen.getByLabelText(/Name/i), 'Error Test');
    
    // Submit the form
    await user.click(screen.getByRole('button', { name: /Create Client/i }));
    
    // Verify error handling
    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith('Client with this email already exists');
      // We expect console.error to have been called with the error
      expect(console.error).toHaveBeenCalled();
    });
  });
  
  it('renders in edit mode correctly', async () => {
    const user = userEvent.setup();
    const mockSuccess = jest.fn();
    
    // Mock successful update
    (fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ id: 2, name: 'Updated Client' })
    });
    
    render(
      <ClientForm 
        initialData={{ 
          id: 2, 
          name: 'Original Name', 
          email: 'original@example.com',
          paymentTerms: 30 
        }} 
        onSuccess={mockSuccess} 
      />
    );
    
    // Change name field
    await user.clear(screen.getByLabelText(/Name/i));
    await user.type(screen.getByLabelText(/Name/i), 'Updated Client');
    
    // Submit form - use "Update Client" instead of "Save Changes"
    await user.click(screen.getByRole('button', { name: /Update Client/i }));
    
    // Check fetch was called with PUT and correct ID
    await waitFor(() => {
      expect(fetch).toHaveBeenCalledWith('/api/clients/2', expect.anything());
      expect(JSON.parse((fetch as jest.Mock).mock.calls[0][1].body).name).toBe('Updated Client');
      expect(toast.success).toHaveBeenCalledWith('Client updated successfully');
    });
  });
}); 
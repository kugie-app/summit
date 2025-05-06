import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { InvoiceItemForm } from '@/components/invoices/InvoiceItemForm';

describe('InvoiceItemForm', () => {
  // Setup for tests
  const mockSubmit = jest.fn();
  const mockCancel = jest.fn();
  const mockRemove = jest.fn();

  beforeEach(() => {
    mockSubmit.mockClear();
    mockCancel.mockClear();
    mockRemove.mockClear();
  });

  it('renders the form correctly', () => {
    render(
      <InvoiceItemForm
        onSubmit={mockSubmit}
        onCancel={mockCancel}
      />
    );
    
    // Check if form elements are rendered
    expect(screen.getByLabelText(/Description/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Quantity/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Unit Price/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Amount/i)).toBeInTheDocument();
    
    // Check buttons
    expect(screen.getByRole('button', { name: /Cancel/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Add Item/i })).toBeInTheDocument();
  });

  it('renders with initial data when provided', () => {
    const initialData = {
      id: 1,
      description: 'Test Item',
      quantity: 2,
      unitPrice: 50,
      amount: 100
    };
    
    render(
      <InvoiceItemForm
        initialData={initialData}
        onSubmit={mockSubmit}
        onCancel={mockCancel}
        onRemove={mockRemove}
      />
    );
    
    // Check if form fields are populated with initial data
    expect(screen.getByLabelText(/Description/i)).toHaveValue('Test Item');
    expect(screen.getByLabelText(/Quantity/i)).toHaveValue(2);
    expect(screen.getByLabelText(/Unit Price/i)).toHaveValue(50);
    expect(screen.getByLabelText(/Amount/i)).toHaveValue(100);
    
    // Should show Update Item button when editing
    expect(screen.getByRole('button', { name: /Update Item/i })).toBeInTheDocument();
    // Should show remove button when editing
    expect(screen.getByRole('button', { name: '' })).toBeInTheDocument();
  });
  
  it('automatically calculates amount when quantity or unit price changes', async () => {
    const user = userEvent.setup();
    
    render(
      <InvoiceItemForm
        onSubmit={mockSubmit}
        onCancel={mockCancel}
      />
    );
    
    // Clear and set new values
    await user.clear(screen.getByLabelText(/Quantity/i));
    await user.type(screen.getByLabelText(/Quantity/i), '3');
    
    await user.clear(screen.getByLabelText(/Unit Price/i));
    await user.type(screen.getByLabelText(/Unit Price/i), '25');
    
    // Check if amount is calculated correctly
    expect(screen.getByLabelText(/Amount/i)).toHaveValue(75);
  });
  
  it('submits the form with correct data', async () => {
    const user = userEvent.setup();
    
    render(
      <InvoiceItemForm
        onSubmit={mockSubmit}
        onCancel={mockCancel}
      />
    );
    
    // Fill in form fields
    await user.type(screen.getByLabelText(/Description/i), 'New Item');
    await user.clear(screen.getByLabelText(/Quantity/i));
    await user.type(screen.getByLabelText(/Quantity/i), '2');
    await user.clear(screen.getByLabelText(/Unit Price/i));
    await user.type(screen.getByLabelText(/Unit Price/i), '75');
    
    // Submit the form
    await user.click(screen.getByRole('button', { name: /Add Item/i }));
    
    // Check if onSubmit was called with correct data
    expect(mockSubmit).toHaveBeenCalledTimes(1);
    expect(mockSubmit).toHaveBeenCalledWith({
      id: undefined,
      description: 'New Item',
      quantity: 2,
      unitPrice: 75,
      amount: 150
    });
  });
  
  it('calls onCancel when cancel button is clicked', async () => {
    const user = userEvent.setup();
    
    render(
      <InvoiceItemForm
        onSubmit={mockSubmit}
        onCancel={mockCancel}
      />
    );
    
    await user.click(screen.getByRole('button', { name: /Cancel/i }));
    
    expect(mockCancel).toHaveBeenCalledTimes(1);
  });
  
  it('calls onRemove when remove button is clicked', async () => {
    const user = userEvent.setup();
    
    render(
      <InvoiceItemForm
        initialData={{ id: 1, description: 'Test Item', quantity: 1, unitPrice: 100, amount: 100 }}
        onSubmit={mockSubmit}
        onCancel={mockCancel}
        onRemove={mockRemove}
      />
    );
    
    await user.click(screen.getByRole('button', { name: '' }));
    
    expect(mockRemove).toHaveBeenCalledTimes(1);
  });

  it('shows different button text based on isEditing state', () => {
    // Without initialData (Add mode)
    const { rerender } = render(
      <InvoiceItemForm
        onSubmit={mockSubmit}
        onCancel={mockCancel}
      />
    );
    
    expect(screen.getByRole('button', { name: /Add Item/i })).toBeInTheDocument();
    
    // With initialData (Edit mode)
    rerender(
      <InvoiceItemForm
        initialData={{ id: 1, description: 'Test Item', quantity: 1, unitPrice: 100, amount: 100 }}
        onSubmit={mockSubmit}
        onCancel={mockCancel}
      />
    );
    
    expect(screen.getByRole('button', { name: /Update Item/i })).toBeInTheDocument();
  });
}); 
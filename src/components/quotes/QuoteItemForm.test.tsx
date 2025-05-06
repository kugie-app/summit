import { render, screen, fireEvent, act } from '@testing-library/react';
import { QuoteItemForm } from '@/components/quotes/QuoteItemForm';

describe('QuoteItemForm', () => {
  // Setup for tests
  const mockSubmit = jest.fn();
  const mockCancel = jest.fn();
  const mockRemove = jest.fn();

  beforeEach(() => {
    mockSubmit.mockClear();
    mockCancel.mockClear();
    mockRemove.mockClear();
  });

  it('renders the form correctly', async () => {
    await act(async () => {
      render(
        <QuoteItemForm
          onSubmit={mockSubmit}
          onCancel={mockCancel}
        />
      );
    });
    
    // Check if form elements are rendered
    expect(screen.getByLabelText(/Description/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Quantity/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Unit Price/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Amount/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Add Item/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Cancel/i })).toBeInTheDocument();
  });

  it('renders with initial data when provided', async () => {
    await act(async () => {
      render(
        <QuoteItemForm
          initialData={{
            id: 1,
            description: 'Test Item',
            quantity: 2,
            unitPrice: 100,
            amount: 200
          }}
          onSubmit={mockSubmit}
          onCancel={mockCancel}
          onRemove={mockRemove}
        />
      );
    });
    
    // Check if form is populated with initial data
    expect(screen.getByDisplayValue('Test Item')).toBeInTheDocument();
    expect(screen.getByDisplayValue('2')).toBeInTheDocument();
    expect(screen.getByDisplayValue('100')).toBeInTheDocument();
    expect(screen.getByDisplayValue('200')).toBeInTheDocument();
    
    // Should show Edit button and Remove button when editing
    expect(screen.getByRole('button', { name: /Update Item/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Cancel/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: '' })).toBeInTheDocument(); // Remove icon button
  });

  it('calculates amount automatically when quantity or unit price changes', async () => {
    await act(async () => {
      render(
        <QuoteItemForm
          onSubmit={mockSubmit}
          onCancel={mockCancel}
        />
      );
    });
    
    // Get form inputs
    const quantityInput = screen.getByLabelText(/Quantity/i);
    const unitPriceInput = screen.getByLabelText(/Unit Price/i);
    const amountInput = screen.getByLabelText(/Amount/i);
    
    // Change quantity to 5
    await act(async () => {
      fireEvent.change(quantityInput, { target: { value: '5' } });
    });
    
    // Change unit price to 10
    await act(async () => {
      fireEvent.change(unitPriceInput, { target: { value: '10' } });
    });
    
    // Amount should be calculated as 5 * 10 = 50
    expect((amountInput as HTMLInputElement).value).toBe('50');
    
    // Update unit price to 20
    await act(async () => {
      fireEvent.change(unitPriceInput, { target: { value: '20' } });
    });
    
    // Amount should update to 5 * 20 = 100
    expect((amountInput as HTMLInputElement).value).toBe('100');
  });

  it('submits the form with correct values', async () => {
    await act(async () => {
      render(
        <QuoteItemForm
          onSubmit={mockSubmit}
          onCancel={mockCancel}
        />
      );
    });
    
    // Fill in the form
    await act(async () => {
      fireEvent.change(screen.getByLabelText(/Description/i), { target: { value: 'New Service' } });
      fireEvent.change(screen.getByLabelText(/Quantity/i), { target: { value: '3' } });
      fireEvent.change(screen.getByLabelText(/Unit Price/i), { target: { value: '50' } });
    });
    
    // Submit the form
    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: /Add Item/i }));
    });
    
    // Check if onSubmit was called with correct values
    expect(mockSubmit).toHaveBeenCalledWith({
      id: undefined,
      description: 'New Service',
      quantity: 3,
      unitPrice: 50,
      amount: 150
    });
  });

  it('calls onCancel when cancel button is clicked', async () => {
    await act(async () => {
      render(
        <QuoteItemForm
          onSubmit={mockSubmit}
          onCancel={mockCancel}
        />
      );
    });
    
    // Click cancel button
    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: /Cancel/i }));
    });
    
    // Check if onCancel was called
    expect(mockCancel).toHaveBeenCalled();
    expect(mockSubmit).not.toHaveBeenCalled();
  });

  it('calls onRemove when remove button is clicked during edit mode', async () => {
    await act(async () => {
      render(
        <QuoteItemForm
          initialData={{
            id: 1,
            description: 'Test Item',
            quantity: 2,
            unitPrice: 100,
            amount: 200
          }}
          onSubmit={mockSubmit}
          onCancel={mockCancel}
          onRemove={mockRemove}
        />
      );
    });
    
    // Click the remove button (icon button with no text)
    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: '' }));
    });
    
    // Check if onRemove was called
    expect(mockRemove).toHaveBeenCalled();
    expect(mockSubmit).not.toHaveBeenCalled();
    expect(mockCancel).not.toHaveBeenCalled();
  });
}); 
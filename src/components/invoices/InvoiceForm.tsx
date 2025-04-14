'use client';

import { useState, useEffect } from 'react';
import { useForm, SubmitHandler } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { InvoiceItemFormValues } from '@/lib/validations/invoice';
import { Button } from '@/components/ui/button';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';
import { useRouter } from 'next/navigation';
import { InvoiceItemForm } from './InvoiceItemForm';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { format } from 'date-fns';
import { PlusIcon } from 'lucide-react';
import { z } from 'zod';

interface Client {
  id: number;
  name: string;
  email: string | null;
  phone: string | null;
  address: string | null;
  paymentTerms: number;
}

interface Invoice {
  id: number;
  companyId: number;
  clientId: number;
  invoiceNumber: string;
  status: 'draft' | 'sent' | 'paid' | 'overdue' | 'cancelled';
  issueDate: string;
  dueDate: string;
  subtotal: string;
  tax: string;
  total: string;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
  paidAt: string | null;
  client?: Client;
  items: Array<{
    id: number;
    invoiceId: number;
    description: string;
    quantity: string;
    unitPrice: string;
    amount: string;
  }>;
}

interface InvoiceFormProps {
  initialData?: Partial<Invoice>;
  onSuccess?: (invoice: any) => void;
  onCancel?: () => void;
}

// Define our form schema using Zod
const formSchema = z.object({
  clientId: z.number(),
  invoiceNumber: z.string(),
  status: z.enum(['draft', 'sent', 'paid', 'overdue', 'cancelled']),
  issueDate: z.date(),
  dueDate: z.date(),
  subtotal: z.number(),
  tax: z.number(),
  total: z.number(),
  notes: z.string().optional(),
  items: z.array(z.any()).optional(),
});

// Extract the type from our schema
type FormValues = z.infer<typeof formSchema>;

export function InvoiceForm({ initialData, onSuccess, onCancel }: InvoiceFormProps) {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [clients, setClients] = useState<Client[]>([]);
  const [isLoadingClients, setIsLoadingClients] = useState(false);
  const [items, setItems] = useState<InvoiceItemFormValues[]>([]);
  const [editingItem, setEditingItem] = useState<InvoiceItemFormValues | null>(null);
  const [editingItemIndex, setEditingItemIndex] = useState<number | null>(null);
  const [showItemForm, setShowItemForm] = useState(false);
  
  const isEditing = !!initialData?.id;

  // Transform initial data for the form
  const initialFormValues: FormValues = {
    clientId: initialData?.clientId ?? 0,
    invoiceNumber: initialData?.invoiceNumber ?? '',
    status: initialData?.status ?? 'draft',
    issueDate: initialData?.issueDate ? new Date(initialData.issueDate) : new Date(),
    dueDate: initialData?.dueDate ? new Date(initialData.dueDate) : new Date(),
    subtotal: initialData?.subtotal ? parseFloat(initialData.subtotal) : 0,
    tax: initialData?.tax ? parseFloat(initialData.tax) : 0,
    total: initialData?.total ? parseFloat(initialData.total) : 0,
    notes: initialData?.notes ?? '',
    items: []
  };

  // Initialize items state from initial data
  useEffect(() => {
    if (initialData?.items) {
      setItems(
        initialData.items.map(item => ({
          id: item.id,
          description: item.description,
          quantity: parseFloat(item.quantity),
          unitPrice: parseFloat(item.unitPrice),
          amount: parseFloat(item.amount),
        }))
      );
    }
  }, [initialData]);

  // Fetch clients
  useEffect(() => {
    const fetchClients = async () => {
      setIsLoadingClients(true);
      try {
        const response = await fetch('/api/clients');
        
        if (!response.ok) {
          throw new Error('Failed to fetch clients');
        }
        
        const data = await response.json();
        setClients(data.data);
      } catch (error) {
        console.error('Error fetching clients:', error);
        toast.error('Failed to load clients');
      } finally {
        setIsLoadingClients(false);
      }
    };
    
    fetchClients();
  }, []);

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: initialFormValues
  });

  // Calculate totals whenever items change
  useEffect(() => {
    if (items.length > 0) {
      const subtotal = items.reduce((sum, item) => sum + (item.amount || 0), 0);
      const taxRate = form.getValues('tax') || 0;
      const taxAmount = (subtotal * taxRate) / 100;
      const total = subtotal + taxAmount;
      
      form.setValue('subtotal', subtotal);
      form.setValue('total', total);
    } else {
      form.setValue('subtotal', 0);
      form.setValue('total', 0);
    }
  }, [items, form]);

  // When tax changes, recalculate the total
  const taxValue = form.watch('tax');
  useEffect(() => {
    const subtotal = form.getValues('subtotal') || 0;
    const taxAmount = (subtotal * (taxValue || 0)) / 100;
    form.setValue('total', subtotal + taxAmount);
  }, [taxValue, form]);

  // Handle adding/editing items
  const handleAddItem = () => {
    setEditingItem(null);
    setEditingItemIndex(null);
    setShowItemForm(true);
  };

  const handleEditItem = (item: InvoiceItemFormValues, index: number) => {
    setEditingItem(item);
    setEditingItemIndex(index);
    setShowItemForm(true);
  };

  const handleRemoveItem = (index: number) => {
    const newItems = [...items];
    newItems.splice(index, 1);
    setItems(newItems);
  };

  const handleItemSubmit = (item: InvoiceItemFormValues) => {
    if (editingItemIndex !== null) {
      // Update existing item
      const newItems = [...items];
      newItems[editingItemIndex] = item;
      setItems(newItems);
    } else {
      // Add new item
      setItems([...items, item]);
    }
    
    setShowItemForm(false);
    setEditingItem(null);
    setEditingItemIndex(null);
  };

  const handleItemCancel = () => {
    setShowItemForm(false);
    setEditingItem(null);
    setEditingItemIndex(null);
  };

  // Handle form submission
  const onSubmit: SubmitHandler<FormValues> = async (values) => {
    if (items.length === 0) {
      toast.error('Please add at least one item to the invoice');
      return;
    }

    setIsSubmitting(true);
    
    try {
      // Format data according to API expectations
      const formattedValues = {
        ...values,
        // Format dates as YYYY-MM-DD strings
        issueDate: format(values.issueDate, 'yyyy-MM-dd'),
        dueDate: format(values.dueDate, 'yyyy-MM-dd'),
        // Convert appropriate values to strings
        subtotal: values.subtotal.toString(),
        tax: values.tax.toString(),
        total: values.total.toString(),
      };
      
      // Format items according to API expectations
      const formattedItems = items.map(item => {
        // Create a new object to control exactly what we send
        return {
          id: item.id, // Pass through ID if it exists
          description: item.description,
          // Keep quantity as a number according to API validation
          quantity: Number(item.quantity),
          // unitPrice must be a string according to API expectations
          unitPrice: item.unitPrice.toString(),
          // amount must be a string according to API expectations
          amount: item.amount.toString(),
        };
      });

      const dataToSubmit = {
        ...formattedValues,
        items: formattedItems,
      };
      
      // Debug logged to help diagnose any further validation issues
      console.log("Submitting data:", JSON.stringify(dataToSubmit, null, 2));
      console.log("Item types:", formattedItems.map(item => ({
        description: typeof item.description,
        quantity: typeof item.quantity,
        unitPrice: typeof item.unitPrice,
        amount: typeof item.amount
      })));
      
      const url = isEditing 
        ? `/api/invoices/${initialData!.id}` 
        : '/api/invoices';
      
      const method = isEditing ? 'PUT' : 'POST';
      
      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(dataToSubmit),
      });
      
      if (!response.ok) {
        const error = await response.json();
        console.error("API validation error:", error);
        throw new Error(error.message || 'Something went wrong');
      }
      
      const invoice = await response.json();
      
      toast.success(
        isEditing 
          ? 'Invoice updated successfully' 
          : 'Invoice created successfully'
      );
      
      if (onSuccess) {
        onSuccess(invoice);
      } else {
        router.push('/invoices');
        router.refresh();
      }
    } catch (error) {
      if (error instanceof Error) {
        toast.error(error.message);
      } else {
        toast.error('Something went wrong. Please try again.');
      }
      console.error(error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <FormField
            control={form.control}
            name="clientId"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Client</FormLabel>
                <Select
                  disabled={isLoadingClients || isSubmitting}
                  onValueChange={(value) => field.onChange(parseInt(value))}
                  defaultValue={field.value ? field.value.toString() : undefined}
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select a client" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {clients.map((client) => (
                      <SelectItem key={client.id} value={client.id.toString()}>
                        {client.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormDescription>
                  Select the client for this invoice
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="invoiceNumber"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Invoice Number</FormLabel>
                <FormControl>
                  <Input placeholder="INV-001" {...field} disabled={isSubmitting} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="status"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Status</FormLabel>
                <Select
                  disabled={isSubmitting}
                  onValueChange={field.onChange}
                  defaultValue={field.value}
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select status" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="draft">Draft</SelectItem>
                    <SelectItem value="sent">Sent</SelectItem>
                    <SelectItem value="paid">Paid</SelectItem>
                    <SelectItem value="overdue">Overdue</SelectItem>
                    <SelectItem value="cancelled">Cancelled</SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="issueDate"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Issue Date</FormLabel>
                <FormControl>
                  <Input
                    type="date"
                    {...field}
                    value={field.value ? format(new Date(field.value), 'yyyy-MM-dd') : ''}
                    onChange={(e) => {
                      const date = e.target.value ? new Date(e.target.value) : new Date();
                      field.onChange(date);
                    }}
                    disabled={isSubmitting}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="dueDate"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Due Date</FormLabel>
                <FormControl>
                  <Input
                    type="date"
                    {...field}
                    value={field.value ? format(new Date(field.value), 'yyyy-MM-dd') : ''}
                    onChange={(e) => {
                      const date = e.target.value ? new Date(e.target.value) : new Date();
                      field.onChange(date);
                    }}
                    disabled={isSubmitting}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="tax"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Tax Rate (%)</FormLabel>
                <FormControl>
                  <Input
                    type="number"
                    min="0"
                    step="0.01"
                    {...field}
                    onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                    disabled={isSubmitting}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-md font-medium">Invoice Items</CardTitle>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleAddItem}
              disabled={isSubmitting}
            >
              <PlusIcon className="mr-2 h-4 w-4" />
              Add Item
            </Button>
          </CardHeader>
          <CardContent>
            {showItemForm ? (
              <div className="border p-4 rounded-md mb-4">
                <InvoiceItemForm
                  initialData={editingItem || undefined}
                  onSubmit={handleItemSubmit}
                  onCancel={handleItemCancel}
                />
              </div>
            ) : null}

            {items.length === 0 ? (
              <div className="text-center py-6 text-muted-foreground">
                No items added yet. Click &quot;Add Item&quot; to start.
              </div>
            ) : (
              <div className="border rounded-md divide-y">
                <div className="grid grid-cols-12 p-2 bg-muted font-medium text-sm">
                  <div className="col-span-6 px-2">Description</div>
                  <div className="col-span-2 px-2 text-right">Quantity</div>
                  <div className="col-span-2 px-2 text-right">Unit Price</div>
                  <div className="col-span-2 px-2 text-right">Amount</div>
                </div>
                {items.map((item, index) => (
                  <div
                    key={index}
                    className="grid grid-cols-12 p-2 items-center hover:bg-muted/50 cursor-pointer"
                    onClick={() => handleEditItem(item, index)}
                  >
                    <div className="col-span-6 px-2">{item.description}</div>
                    <div className="col-span-2 px-2 text-right">{item.quantity}</div>
                    <div className="col-span-2 px-2 text-right">${item.unitPrice.toFixed(2)}</div>
                    <div className="col-span-2 px-2 text-right">${item.amount.toFixed(2)}</div>
                  </div>
                ))}
              </div>
            )}

            <div className="mt-4 flex flex-col items-end space-y-1">
              <div className="grid grid-cols-2 gap-8 text-sm w-48">
                <div className="text-muted-foreground">Subtotal:</div>
                <div className="text-right">${form.watch('subtotal').toFixed(2)}</div>
              </div>
              <div className="grid grid-cols-2 gap-8 text-sm w-48">
                <div className="text-muted-foreground">Tax ({form.watch('tax')}%):</div>
                <div className="text-right">
                  ${((form.watch('subtotal') * form.watch('tax')) / 100).toFixed(2)}
                </div>
              </div>
              <div className="grid grid-cols-2 gap-8 font-medium w-48">
                <div>Total:</div>
                <div className="text-right">${form.watch('total').toFixed(2)}</div>
              </div>
            </div>
          </CardContent>
        </Card>

        <FormField
          control={form.control}
          name="notes"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Notes</FormLabel>
              <FormControl>
                <Textarea
                  placeholder="Additional notes or payment instructions"
                  {...field}
                  value={field.value || ''}
                  disabled={isSubmitting}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        
        <div className="flex justify-end gap-2">
          {onCancel && (
            <Button 
              type="button" 
              variant="outline" 
              onClick={onCancel}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
          )}
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting 
              ? (isEditing ? 'Updating...' : 'Creating...') 
              : (isEditing ? 'Update Invoice' : 'Create Invoice')
            }
          </Button>
        </div>
      </form>
    </Form>
  );
} 
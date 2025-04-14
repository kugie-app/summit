'use client';

import { useState, useEffect } from 'react';
import { useForm, SubmitHandler } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { QuoteItemFormValues } from '@/lib/validations/quote';
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
import { QuoteItemForm } from './QuoteItemForm';
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

interface Quote {
  id: number;
  companyId: number;
  clientId: number;
  quoteNumber: string;
  status: 'draft' | 'sent' | 'accepted' | 'rejected' | 'expired';
  issueDate: string;
  expiryDate: string;
  subtotal: string;
  tax: string;
  total: string;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
  acceptedAt: string | null;
  client?: Client;
  items: Array<{
    id: number;
    quoteId: number;
    description: string;
    quantity: string;
    unitPrice: string;
    amount: string;
  }>;
}

interface QuoteFormProps {
  initialData?: Partial<Quote>;
  onSuccess?: (quote: any) => void;
  onCancel?: () => void;
}

// Define our form schema using Zod
const formSchema = z.object({
  clientId: z.number(),
  quoteNumber: z.string(),
  status: z.enum(['draft', 'sent', 'accepted', 'rejected', 'expired']),
  issueDate: z.date(),
  expiryDate: z.date(),
  subtotal: z.number(),
  tax: z.number(),
  total: z.number(),
  notes: z.string().optional(),
  items: z.array(z.any()).optional(),
});

// Extract the type from our schema
type FormValues = z.infer<typeof formSchema>;

export function QuoteForm({ initialData, onSuccess, onCancel }: QuoteFormProps) {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [clients, setClients] = useState<Client[]>([]);
  const [isLoadingClients, setIsLoadingClients] = useState(false);
  const [items, setItems] = useState<QuoteItemFormValues[]>([]);
  const [editingItem, setEditingItem] = useState<QuoteItemFormValues | null>(null);
  const [editingItemIndex, setEditingItemIndex] = useState<number | null>(null);
  const [showItemForm, setShowItemForm] = useState(false);
  
  const isEditing = !!initialData?.id;

  // Transform initial data for the form
  const initialFormValues: FormValues = {
    clientId: initialData?.clientId ?? 0,
    quoteNumber: initialData?.quoteNumber ?? '',
    status: initialData?.status ?? 'draft',
    issueDate: initialData?.issueDate ? new Date(initialData.issueDate) : new Date(),
    expiryDate: initialData?.expiryDate ? new Date(initialData.expiryDate) : new Date(new Date().setDate(new Date().getDate() + 30)),
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

  const handleEditItem = (item: QuoteItemFormValues, index: number) => {
    setEditingItem(item);
    setEditingItemIndex(index);
    setShowItemForm(true);
  };

  const handleRemoveItem = (index: number) => {
    const newItems = [...items];
    newItems.splice(index, 1);
    setItems(newItems);
  };

  const handleItemSubmit = (item: QuoteItemFormValues) => {
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

  const onSubmit: SubmitHandler<FormValues> = async (values) => {
    if (items.length === 0) {
      toast.error('Please add at least one item to the quote');
      return;
    }

    setIsSubmitting(true);

    try {
      const quoteData = {
        ...values,
        items: items.map(item => ({
          id: item.id,
          description: item.description,
          quantity: item.quantity,
          unitPrice: item.unitPrice,
          amount: item.amount
        })),
        issueDate: format(values.issueDate, 'yyyy-MM-dd'),
        expiryDate: format(values.expiryDate, 'yyyy-MM-dd'),
        taxRate: values.tax, // Send the tax rate to the API
      };

      const url = isEditing 
        ? `/api/quotes/${initialData!.id}` 
        : '/api/quotes';
      
      const method = isEditing ? 'PUT' : 'POST';
      
      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(quoteData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to save quote');
      }

      const savedQuote = await response.json();

      toast.success(isEditing ? 'Quote updated successfully' : 'Quote created successfully');
      
      if (onSuccess) {
        onSuccess(savedQuote);
      } else {
        router.push(`/quotes/${savedQuote.id}`);
      }
    } catch (error) {
      console.error('Error saving quote:', error);
      toast.error((error as Error).message || 'Failed to save quote');
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
                  Select the client for this quote
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="quoteNumber"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Quote Number</FormLabel>
                <FormControl>
                  <Input placeholder="QUO-001" {...field} disabled={isSubmitting} />
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
                      <SelectValue placeholder="Select a status" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="draft">Draft</SelectItem>
                    <SelectItem value="sent">Sent</SelectItem>
                    <SelectItem value="accepted">Accepted</SelectItem>
                    <SelectItem value="rejected">Rejected</SelectItem>
                    <SelectItem value="expired">Expired</SelectItem>
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
            name="expiryDate"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Expiry Date</FormLabel>
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
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Items</CardTitle>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleAddItem}
              disabled={isSubmitting || showItemForm}
            >
              <PlusIcon className="h-4 w-4 mr-2" />
              Add Item
            </Button>
          </CardHeader>
          <CardContent>
            {showItemForm ? (
              <QuoteItemForm
                initialData={editingItem || undefined}
                onSubmit={handleItemSubmit}
                onCancel={handleItemCancel}
              />
            ) : items.length === 0 ? (
              <div className="text-center py-4 text-muted-foreground">
                No items added yet. Click &quot;Add Item&quot; to add your first item.
              </div>
            ) : (
              <div className="space-y-4">
                {items.map((item, index) => (
                  <div
                    key={index}
                    className="grid grid-cols-1 md:grid-cols-12 gap-4 border-b pb-4"
                  >
                    <div className="md:col-span-6">
                      <p className="font-medium">{item.description}</p>
                    </div>
                    <div className="md:col-span-2 text-right">
                      <p className="text-muted-foreground">Qty: {item.quantity.toFixed(2)}</p>
                    </div>
                    <div className="md:col-span-2 text-right">
                      <p className="text-muted-foreground">Price: ${item.unitPrice.toFixed(2)}</p>
                    </div>
                    <div className="md:col-span-2 flex justify-end items-center space-x-2">
                      <p>${item.amount.toFixed(2)}</p>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => handleEditItem(item, index)}
                        disabled={isSubmitting || showItemForm}
                      >
                        Edit
                      </Button>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="text-destructive hover:text-destructive"
                        onClick={() => handleRemoveItem(index)}
                        disabled={isSubmitting || showItemForm}
                      >
                        Delete
                      </Button>
                    </div>
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
                  placeholder="Additional notes or terms & conditions"
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
              : (isEditing ? 'Update Quote' : 'Create Quote')
            }
          </Button>
        </div>
      </form>
    </Form>
  );
} 
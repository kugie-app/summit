'use client';

import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { QuoteItemFormValues, quoteItemSchema } from '@/lib/validations/quote';
import { Button } from '@/components/ui/button';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Trash2 } from 'lucide-react';

interface QuoteItemFormProps {
  initialData?: Partial<QuoteItemFormValues>;
  onSubmit: (data: QuoteItemFormValues) => void;
  onCancel: () => void;
  onRemove?: () => void;
}

export function QuoteItemForm({
  initialData,
  onSubmit,
  onCancel,
  onRemove,
}: QuoteItemFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const isEditing = !!initialData?.id;

  const form = useForm<QuoteItemFormValues>({
    resolver: zodResolver(quoteItemSchema),
    defaultValues: {
      id: initialData?.id,
      description: initialData?.description || '',
      quantity: initialData?.quantity || 1,
      unitPrice: initialData?.unitPrice || 0,
      amount: initialData?.amount || 0,
    },
  });

  // Auto-calculate amount when quantity or unitPrice changes
  const quantity = form.watch('quantity');
  const unitPrice = form.watch('unitPrice');

  useEffect(() => {
    const amount = Number(quantity) * Number(unitPrice);
    form.setValue('amount', amount);
  }, [quantity, unitPrice, form]);

  const handleSubmit = async (values: QuoteItemFormValues) => {
    setIsSubmitting(true);
    try {
      onSubmit(values);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
          <FormField
            control={form.control}
            name="description"
            render={({ field }) => (
              <FormItem className="md:col-span-6">
                <FormLabel>Description</FormLabel>
                <FormControl>
                  <Input
                    placeholder="Item description"
                    {...field}
                    disabled={isSubmitting}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="quantity"
            render={({ field }) => (
              <FormItem className="md:col-span-2">
                <FormLabel>Quantity</FormLabel>
                <FormControl>
                  <Input
                    type="number"
                    min="0.01"
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

          <FormField
            control={form.control}
            name="unitPrice"
            render={({ field }) => (
              <FormItem className="md:col-span-2">
                <FormLabel>Unit Price</FormLabel>
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

          <FormField
            control={form.control}
            name="amount"
            render={({ field }) => (
              <FormItem className="md:col-span-2">
                <FormLabel>Amount</FormLabel>
                <FormControl>
                  <Input
                    type="number"
                    readOnly
                    {...field}
                    disabled={true}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <div className="flex justify-end gap-2">
          {onRemove && isEditing && (
            <Button
              type="button"
              variant="destructive"
              size="icon"
              onClick={onRemove}
              disabled={isSubmitting}
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          )}
          <Button
            type="button"
            variant="outline"
            onClick={onCancel}
            disabled={isSubmitting}
          >
            Cancel
          </Button>
          <Button 
            type="submit" 
            disabled={isSubmitting}
          >
            {isSubmitting
              ? (isEditing ? 'Updating...' : 'Adding...')
              : (isEditing ? 'Update Item' : 'Add Item')
            }
          </Button>
        </div>
      </form>
    </Form>
  );
} 
'use client';

import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { InvoiceItemFormValues, invoiceItemSchema } from '@/lib/validations/invoice';
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

interface InvoiceItemFormProps {
  initialData?: Partial<InvoiceItemFormValues>;
  onSubmit: (data: InvoiceItemFormValues) => void;
  onCancel: () => void;
  onRemove?: () => void;
}

export function InvoiceItemForm({
  initialData,
  onSubmit,
  onCancel,
  onRemove,
}: InvoiceItemFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [calculatedAmount, setCalculatedAmount] = useState(0);
  const isEditing = !!initialData?.id;

  const form = useForm<InvoiceItemFormValues>({
    resolver: zodResolver(invoiceItemSchema),
    defaultValues: {
      id: initialData?.id,
      description: initialData?.description || '',
      quantity: initialData?.quantity || 1,
      unitPrice: initialData?.unitPrice || 0,
    },
  });

  // Auto-calculate amount when quantity or unitPrice changes
  const quantity = form.watch('quantity');
  const unitPrice = form.watch('unitPrice');

  useEffect(() => {
    const amount = Number(quantity) * Number(unitPrice);
    setCalculatedAmount(amount);
  }, [quantity, unitPrice]);

  const handleSubmit = async (values: InvoiceItemFormValues) => {
    setIsSubmitting(true);
    try {
      // Include the calculated amount in the submitted data
      const amount = Number(quantity) * Number(unitPrice);
      onSubmit({
        ...values,
        amount: amount
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Form {...form}>
      <div className="space-y-4">
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

          <div className="md:col-span-2">
            <FormLabel>Amount (calculated)</FormLabel>
            <Input
              type="number"
              readOnly
              value={calculatedAmount}
              disabled={true}
            />
          </div>
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
            onClick={form.handleSubmit(handleSubmit)}
            disabled={isSubmitting}
          >
            {isSubmitting
              ? (isEditing ? 'Updating...' : 'Adding...')
              : (isEditing ? 'Update Item' : 'Add Item')
            }
          </Button>
        </div>
      </div>
    </Form>
  );
} 
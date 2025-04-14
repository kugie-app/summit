'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
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
import { toast } from 'sonner';
import { useRouter } from 'next/navigation';

interface Client {
  id: number;
  name: string;
  email: string | null;
  phone: string | null;
  address: string | null;
  paymentTerms: number;
}

// Explicitly define the form values type with required paymentTerms
type ClientFormValues = {
  name: string;
  email: string;
  phone: string;
  address: string;
  paymentTerms: number;
};

interface ClientFormProps {
  initialData?: Partial<Client>;
  onSuccess?: (client: any) => void;
  onCancel?: () => void;
}

export function ClientForm({ initialData, onSuccess, onCancel }: ClientFormProps) {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const isEditing = !!initialData?.id;

  const form = useForm<ClientFormValues>({
    defaultValues: {
      name: initialData?.name || '',
      email: initialData?.email || '',
      phone: initialData?.phone || '',
      address: initialData?.address || '',
      paymentTerms: initialData?.paymentTerms ?? 30,
    },
  });

  async function onSubmit(values: ClientFormValues) {
    setIsSubmitting(true);
    
    try {
      const url = isEditing 
        ? `/api/clients/${initialData!.id}` 
        : '/api/clients';
      
      const method = isEditing ? 'PUT' : 'POST';
      
      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(values),
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Something went wrong');
      }
      
      const client = await response.json();
      
      toast.success(
        isEditing 
          ? 'Client updated successfully' 
          : 'Client created successfully'
      );
      
      if (onSuccess) {
        onSuccess(client);
      } else {
        router.push('/clients');
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
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Name</FormLabel>
              <FormControl>
                <Input 
                  placeholder="Client name"
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
          name="email"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Email</FormLabel>
              <FormControl>
                <Input 
                  placeholder="client@example.com"
                  type="email"
                  {...field}
                  value={field.value || ''}
                  disabled={isSubmitting}
                />
              </FormControl>
              <FormDescription>
                Optional but recommended for communication
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />
        
        <FormField
          control={form.control}
          name="phone"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Phone</FormLabel>
              <FormControl>
                <Input 
                  placeholder="Phone number"
                  {...field}
                  value={field.value || ''}
                  disabled={isSubmitting}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        
        <FormField
          control={form.control}
          name="address"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Address</FormLabel>
              <FormControl>
                <Input 
                  placeholder="Client address"
                  {...field}
                  value={field.value || ''}
                  disabled={isSubmitting}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        
        <FormField
          control={form.control}
          name="paymentTerms"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Payment Terms (days)</FormLabel>
              <FormControl>
                <Input 
                  type="number"
                  min={0}
                  {...field}
                  onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
                  disabled={isSubmitting}
                />
              </FormControl>
              <FormDescription>
                Number of days before payment is due
              </FormDescription>
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
              : (isEditing ? 'Update Client' : 'Create Client')
            }
          </Button>
        </div>
      </form>
    </Form>
  );
} 
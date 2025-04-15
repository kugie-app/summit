'use client';

import { useState, ReactNode } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { ClientForm } from './ClientForm';
import { PlusIcon } from 'lucide-react';

interface Client {
  id: number;
  name: string;
  email: string | null;
  phone: string | null;
  address: string | null;
  paymentTerms: number;
}

interface ClientDialogProps {
  triggerLabel?: ReactNode;
  initialData?: Partial<Client>;
  title?: string;
  triggerVariant?: 'default' | 'outline' | 'secondary' | 'destructive' | 'ghost' | 'link';
  onSuccess?: (client: any) => void;
}

export function ClientDialog({
  triggerLabel = 'Add Client',
  initialData,
  title = initialData?.id ? 'Edit Client' : 'Add Client',
  triggerVariant = 'default',
  onSuccess,
}: ClientDialogProps) {
  const [open, setOpen] = useState(false);

  const handleSuccess = (client: any) => {
    setOpen(false);
    if (onSuccess) {
      onSuccess(client);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant={triggerVariant}>
          {!initialData && typeof triggerLabel === 'string' && <PlusIcon className="mr-2 h-4 w-4" />}
          {triggerLabel}
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
        </DialogHeader>
        <div className="py-4">
          <ClientForm
            initialData={initialData}
            onSuccess={handleSuccess}
            onCancel={() => setOpen(false)}
          />
        </div>
      </DialogContent>
    </Dialog>
  );
} 
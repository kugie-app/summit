'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeftIcon, TrashIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ClientDialog } from '@/components/clients/ClientDialog';
import { toast } from 'sonner';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';

interface Client {
  id: number;
  name: string;
  email: string | null;
  phone: string | null;
  address: string | null;
  paymentTerms: number;
  createdAt: string;
  updatedAt: string;
}

export default function ClientDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { clientId } = params;
  
  const [client, setClient] = useState<Client | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isDeleting, setIsDeleting] = useState(false);
  
  useEffect(() => {
    const fetchClient = async () => {
      setIsLoading(true);
      try {
        const response = await fetch(`/api/clients/${clientId}`);
        
        if (!response.ok) {
          if (response.status === 404) {
            toast.error('Client not found');
            router.push('/clients');
            return;
          }
          throw new Error('Failed to fetch client');
        }
        
        const data = await response.json();
        setClient(data);
      } catch (error) {
        console.error('Error fetching client:', error);
        toast.error('Failed to load client. Please try again.');
      } finally {
        setIsLoading(false);
      }
    };
    
    if (clientId) {
      fetchClient();
    }
  }, [clientId, router]);
  
  const handleDelete = async () => {
    if (!client) return;
    
    setIsDeleting(true);
    try {
      const response = await fetch(`/api/clients/${client.id}`, {
        method: 'DELETE',
      });
      
      if (!response.ok) {
        throw new Error('Failed to delete client');
      }
      
      toast.success('Client deleted successfully');
      router.push('/clients');
    } catch (error) {
      console.error('Error deleting client:', error);
      toast.error('Failed to delete client. Please try again.');
    } finally {
      setIsDeleting(false);
    }
  };
  
  const handleUpdateSuccess = (updatedClient: Client) => {
    setClient(updatedClient);
    toast.success('Client updated successfully');
  };
  
  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-32">
        <p className="text-muted-foreground">Loading client information...</p>
      </div>
    );
  }
  
  if (!client) {
    return (
      <div className="flex flex-col items-center justify-center h-32 space-y-4">
        <p className="text-muted-foreground">Client not found</p>
        <Button asChild>
          <Link href="/clients">
            <ArrowLeftIcon className="mr-2 h-4 w-4" />
            Back to Clients
          </Link>
        </Button>
      </div>
    );
  }
  
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <Button variant="outline" size="icon" asChild>
            <Link href="/clients">
              <ArrowLeftIcon className="h-4 w-4" />
            </Link>
          </Button>
          <h1 className="text-3xl font-bold">{client.name}</h1>
        </div>
        
        <div className="flex space-x-2">
          <ClientDialog
            triggerLabel="Edit"
            initialData={client}
            onSuccess={handleUpdateSuccess}
            triggerVariant="outline"
          />
          
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="destructive">
                <TrashIcon className="mr-2 h-4 w-4" />
                Delete
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                <AlertDialogDescription>
                  This action cannot be undone. This will permanently delete the
                  client and all related data.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction
                  onClick={handleDelete}
                  disabled={isDeleting}
                  className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                >
                  {isDeleting ? 'Deleting...' : 'Delete'}
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Client Information</CardTitle>
            <CardDescription>Basic information about the client.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <h3 className="text-sm font-medium text-muted-foreground">Name</h3>
              <p>{client.name}</p>
            </div>
            <div>
              <h3 className="text-sm font-medium text-muted-foreground">Email</h3>
              <p>{client.email || 'Not provided'}</p>
            </div>
            <div>
              <h3 className="text-sm font-medium text-muted-foreground">Phone</h3>
              <p>{client.phone || 'Not provided'}</p>
            </div>
            <div>
              <h3 className="text-sm font-medium text-muted-foreground">Address</h3>
              <p>{client.address || 'Not provided'}</p>
            </div>
            <div>
              <h3 className="text-sm font-medium text-muted-foreground">Payment Terms</h3>
              <p>{client.paymentTerms} days</p>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader>
            <CardTitle>Recent Invoices</CardTitle>
            <CardDescription>Latest invoices for this client.</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-center py-8 text-muted-foreground">
              No invoices found for this client.
            </p>
            <div className="flex justify-center mt-4">
              <Button variant="outline" disabled>
                Create Invoice
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
} 
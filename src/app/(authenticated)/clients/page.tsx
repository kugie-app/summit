'use client';

import { useState, useEffect } from 'react';
import { useSearchParams, useRouter, usePathname } from 'next/navigation';
import { ClientsTable } from '@/components/clients/ClientsTable';
import { ClientDialog } from '@/components/clients/ClientDialog';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { SearchIcon, XIcon } from 'lucide-react';
import { toast } from 'sonner';

interface Client {
  id: number;
  name: string;
  email: string | null;
  phone: string | null;
  address: string | null;
  paymentTerms: number;
}

interface ClientsResponse {
  data: Client[];
  meta: {
    total: number;
    page: number;
    limit: number;
    pageCount: number;
  };
}

export default function ClientsPage() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  
  const [clients, setClients] = useState<Client[]>([]);
  const [totalClients, setTotalClients] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  
  // Get current page from search params or default to 1
  const page = searchParams.get('page') ? parseInt(searchParams.get('page')!) : 1;
  const limit = searchParams.get('limit') ? parseInt(searchParams.get('limit')!) : 10;
  const sort = searchParams.get('sort') || 'name';
  const order = searchParams.get('order') || 'asc';
  
  // Function to update URL with new search params
  const updateSearchParams = (params: Record<string, string | number | null>) => {
    const newSearchParams = new URLSearchParams(searchParams.toString());
    
    Object.entries(params).forEach(([key, value]) => {
      if (value === null) {
        newSearchParams.delete(key);
      } else {
        newSearchParams.set(key, value.toString());
      }
    });
    
    router.push(`${pathname}?${newSearchParams.toString()}`);
  };
  
  // Function to handle page change
  const handlePageChange = (newPage: number) => {
    updateSearchParams({ page: newPage });
  };
  
  // Function to handle sort change
  const handleSort = (field: string) => {
    const newOrder = sort === field && order === 'asc' ? 'desc' : 'asc';
    updateSearchParams({ sort: field, order: newOrder, page: 1 });
  };
  
  // Function to handle client deletion (optimistic UI update)
  const handleDelete = (id: number) => {
    setClients((prevClients) => prevClients.filter((client) => client.id !== id));
    setTotalClients((prev) => prev - 1);
  };
  
  // Function to handle search
  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    updateSearchParams({ q: searchTerm, page: 1 });
  };
  
  // Function to clear search
  const clearSearch = () => {
    setSearchTerm('');
    updateSearchParams({ q: null, page: 1 });
  };
  
  // Fetch clients when search params change
  useEffect(() => {
    const fetchClients = async () => {
      setIsLoading(true);
      
      const query = new URLSearchParams();
      query.set('page', page.toString());
      query.set('limit', limit.toString());
      query.set('sort', sort);
      query.set('order', order);
      
      if (searchParams.has('q')) {
        query.set('q', searchParams.get('q')!);
        setSearchTerm(searchParams.get('q')!);
      }
      
      try {
        const response = await fetch(`/api/clients?${query.toString()}`);
        
        if (!response.ok) {
          throw new Error('Failed to fetch clients');
        }
        
        const data: ClientsResponse = await response.json();
        setClients(data.data);
        setTotalClients(data.meta.total);
      } catch (error) {
        console.error('Error fetching clients:', error);
        toast.error('Failed to load clients. Please try again.');
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchClients();
  }, [page, limit, sort, order, searchParams]);
  
  // Handle client create success
  const handleCreateSuccess = () => {
    // Refresh the client list
    router.refresh();
    toast.success('Client created successfully');
  };
  
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Clients</h1>
        <ClientDialog 
          triggerLabel="Add Client" 
          onSuccess={handleCreateSuccess} 
        />
      </div>
      
      <Card>
        <CardHeader>
          <CardTitle>Manage Clients</CardTitle>
          <CardDescription>
            View and manage all your clients. You can add, edit, and delete clients.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="mb-6">
            <form onSubmit={handleSearch} className="flex gap-2">
              <div className="relative flex-1">
                <SearchIcon className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  type="search"
                  placeholder="Search clients..."
                  className="pl-8"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
                {searchTerm && (
                  <Button
                    variant="ghost"
                    size="icon"
                    className="absolute right-0 top-0"
                    onClick={clearSearch}
                    type="button"
                  >
                    <XIcon className="h-4 w-4" />
                  </Button>
                )}
              </div>
              <Button type="submit">Search</Button>
            </form>
          </div>
          
          {isLoading ? (
            <div className="py-8 text-center text-muted-foreground">
              Loading clients...
            </div>
          ) : (
            <ClientsTable
              clients={clients}
              totalClients={totalClients}
              page={page}
              pageSize={limit}
              onPageChange={handlePageChange}
              onDelete={handleDelete}
              onRefresh={() => router.refresh()}
              sortField={sort}
              sortOrder={order as 'asc' | 'desc'}
              onSort={handleSort}
            />
          )}
        </CardContent>
      </Card>
    </div>
  );
} 
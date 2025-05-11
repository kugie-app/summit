'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { formatDistanceToNow, format } from 'date-fns';
import { formatCurrency } from '@/lib/utils';
import { Plus, ArrowUp, ArrowDown, Search, MoreHorizontal } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

interface QuoteListProps {
  className?: string;
}

interface Quote {
  id: number;
  quoteNumber: string;
  status: 'draft' | 'sent' | 'accepted' | 'rejected' | 'expired';
  issueDate: string;
  expiryDate: string;
  total: string;
  currency: string;
  client: {
    name: string;
    email: string;
  };
  company?: {
    defaultCurrency: string;
  };
}

export function QuoteList({ className }: QuoteListProps) {
  const router = useRouter();
  const [quotes, setQuotes] = useState<Quote[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [sortField, setSortField] = useState('createdAt');
  const [sortOrder, setSortOrder] = useState('desc');
  const [statusFilter, setStatusFilter] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');

  const fetchQuotes = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: currentPage.toString(),
        limit: '10',
        sortBy: sortField,
        sortOrder: sortOrder,
        ...(statusFilter !== 'all' && { status: statusFilter }),
        ...(searchTerm && { search: searchTerm }),
      });

      const response = await fetch(`/api/quotes?${params}`);
      
      if (!response.ok) {
        throw new Error('Failed to fetch quotes');
      }
      
      const data = await response.json();
      setQuotes(data.data || []);
      setTotalPages(Math.ceil(data.total / 10));
    } catch (error) {
      console.error('Error fetching quotes:', error);
      toast.error('Failed to load quotes');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchQuotes();
  }, [currentPage, sortField, sortOrder, statusFilter, searchTerm]);

  const handleSort = (field: string) => {
    if (sortField === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortOrder('asc');
    }
  };

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  const handleNewQuote = () => {
    router.push('/quotes/new');
  };

  const handleViewQuote = (id: number) => {
    router.push(`/quotes/${id}`);
  };

  const handleEditQuote = (id: number) => {
    router.push(`/quotes/${id}/edit`);
  };

  const handleDeleteQuote = async (id: number) => {
    if (confirm('Are you sure you want to delete this quote?')) {
      try {
        const response = await fetch(`/api/quotes/${id}`, {
          method: 'DELETE',
        });
        
        if (!response.ok) {
          throw new Error('Failed to delete quote');
        }
        
        toast.success('Quote deleted successfully');
        fetchQuotes();
      } catch (error) {
        console.error('Error deleting quote:', error);
        toast.error('Failed to delete quote');
      }
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'draft':
        return <Badge variant="outline">Draft</Badge>;
      case 'sent':
        return <Badge variant="secondary">Sent</Badge>;
      case 'accepted':
        return <Badge variant="default">Accepted</Badge>;
      case 'rejected':
        return <Badge variant="destructive">Rejected</Badge>;
      case 'expired':
        return <Badge variant="outline">Expired</Badge>;
      default:
        return <Badge>{status}</Badge>;
    }
  };

  return (
    <div className={className}>
      <div className="flex justify-between items-center mb-6">
        <div className="flex items-center space-x-2">
          <Select
            value={statusFilter}
            onValueChange={setStatusFilter}
          >
            <SelectTrigger className="w-[140px]">
              <SelectValue placeholder="Filter by status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Statuses</SelectItem>
              <SelectItem value="draft">Draft</SelectItem>
              <SelectItem value="sent">Sent</SelectItem>
              <SelectItem value="accepted">Accepted</SelectItem>
              <SelectItem value="rejected">Rejected</SelectItem>
              <SelectItem value="expired">Expired</SelectItem>
            </SelectContent>
          </Select>
          
          <div className="relative">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search quotes..."
              className="pl-8 w-[200px]"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>
        
        <Button onClick={handleNewQuote}>
          <Plus className="h-4 w-4 mr-2" />
          New Quote
        </Button>
      </div>
      
      <div className="border rounded-md">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead 
                className="w-[100px] cursor-pointer"
                onClick={() => handleSort('quoteNumber')}
              >
                <div className="flex items-center space-x-1">
                  <span>Quote #</span>
                  {sortField === 'quoteNumber' && (
                    sortOrder === 'asc' ? <ArrowUp className="h-4 w-4" /> : <ArrowDown className="h-4 w-4" />
                  )}
                </div>
              </TableHead>
              <TableHead>Client</TableHead>
              <TableHead className="cursor-pointer" onClick={() => handleSort('status')}>
                <div className="flex items-center space-x-1">
                  <span>Status</span>
                  {sortField === 'status' && (
                    sortOrder === 'asc' ? <ArrowUp className="h-4 w-4" /> : <ArrowDown className="h-4 w-4" />
                  )}
                </div>
              </TableHead>
              <TableHead className="cursor-pointer" onClick={() => handleSort('issueDate')}>
                <div className="flex items-center space-x-1">
                  <span>Issue Date</span>
                  {sortField === 'issueDate' && (
                    sortOrder === 'asc' ? <ArrowUp className="h-4 w-4" /> : <ArrowDown className="h-4 w-4" />
                  )}
                </div>
              </TableHead>
              <TableHead className="cursor-pointer" onClick={() => handleSort('expiryDate')}>
                <div className="flex items-center space-x-1">
                  <span>Expiry Date</span>
                  {sortField === 'expiryDate' && (
                    sortOrder === 'asc' ? <ArrowUp className="h-4 w-4" /> : <ArrowDown className="h-4 w-4" />
                  )}
                </div>
              </TableHead>
              <TableHead className="text-right cursor-pointer" onClick={() => handleSort('total')}>
                <div className="flex items-center justify-end space-x-1">
                  <span>Total</span>
                  {sortField === 'total' && (
                    sortOrder === 'asc' ? <ArrowUp className="h-4 w-4" /> : <ArrowDown className="h-4 w-4" />
                  )}
                </div>
              </TableHead>
              <TableHead className="w-[100px]">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={7} className="h-24 text-center">
                  Loading quotes...
                </TableCell>
              </TableRow>
            ) : quotes.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="h-24 text-center">
                  No quotes found. Create your first quote!
                </TableCell>
              </TableRow>
            ) : (
              quotes.map((quote) => (
                <TableRow key={quote.id} className="cursor-pointer hover:bg-muted/50">
                  <TableCell 
                    className="font-medium" 
                    onClick={() => handleViewQuote(quote.id)}
                  >
                    {quote.quoteNumber}
                  </TableCell>
                  <TableCell onClick={() => handleViewQuote(quote.id)}>
                    <div className="font-medium">{quote.client.name}</div>
                    <div className="text-sm text-muted-foreground">{quote.client.email}</div>
                  </TableCell>
                  <TableCell onClick={() => handleViewQuote(quote.id)}>
                    {getStatusBadge(quote.status)}
                  </TableCell>
                  <TableCell onClick={() => handleViewQuote(quote.id)}>
                    <div>{format(new Date(quote.issueDate), 'MMM dd, yyyy')}</div>
                    <div className="text-xs text-muted-foreground">
                      {formatDistanceToNow(new Date(quote.issueDate), { addSuffix: true })}
                    </div>
                  </TableCell>
                  <TableCell onClick={() => handleViewQuote(quote.id)}>
                    <div>{format(new Date(quote.expiryDate), 'MMM dd, yyyy')}</div>
                    <div className="text-xs text-muted-foreground">
                      {formatDistanceToNow(new Date(quote.expiryDate), { addSuffix: true })}
                    </div>
                  </TableCell>
                  <TableCell className="text-right" onClick={() => handleViewQuote(quote.id)}>
                    {formatCurrency(parseFloat(quote.total), quote.company?.defaultCurrency || 'IDR')}
                  </TableCell>
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon">
                          <MoreHorizontal className="h-4 w-4" />
                          <span className="sr-only">Open menu</span>
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => handleViewQuote(quote.id)}>
                          View details
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleEditQuote(quote.id)}>
                          Edit
                        </DropdownMenuItem>
                        {quote.status === 'accepted' && (
                          <DropdownMenuItem onClick={() => router.push(`/quotes/${quote.id}/convert`)}>
                            Convert to Invoice
                          </DropdownMenuItem>
                        )}
                        <DropdownMenuSeparator />
                        <DropdownMenuItem 
                          className="text-destructive focus:text-destructive"
                          onClick={() => handleDeleteQuote(quote.id)}
                        >
                          Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
      
      {totalPages > 1 && (
        <div className="flex justify-center mt-4 space-x-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => handlePageChange(currentPage - 1)}
            disabled={currentPage === 1 || loading}
          >
            Previous
          </Button>
          <div className="flex items-center space-x-1">
            {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
              <Button
                key={page}
                variant={currentPage === page ? "default" : "outline"}
                size="sm"
                onClick={() => handlePageChange(page)}
                disabled={loading}
              >
                {page}
              </Button>
            ))}
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => handlePageChange(currentPage + 1)}
            disabled={currentPage === totalPages || loading}
          >
            Next
          </Button>
        </div>
      )}
    </div>
  );
} 
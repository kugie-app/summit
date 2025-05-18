"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Pencil, Trash2, Plus, Loader2, FileUp, CheckCircle, XCircle, Clock } from "lucide-react";
import { toast } from "sonner";
import { formatCurrency } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";

type ExpenseCategory = {
  id: number;
  name: string;
};

type Expense = {
  id: number;
  vendor: string;
  description: string | null;
  amount: string;
  currency: string;
  expenseDate: string;
  receiptUrl: string | null;
  status: "pending" | "approved" | "rejected";
  recurring: "none" | "daily" | "weekly" | "monthly" | "yearly";
  nextDueDate: string | null;
  category: ExpenseCategory | null;
};

export default function ExpensesPage() {
  const { data: session } = useSession();
  const router = useRouter();
  
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [categories, setCategories] = useState<ExpenseCategory[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [selectedCategoryId, setSelectedCategoryId] = useState<string | null>(null);
  const [selectedStatus, setSelectedStatus] = useState<string | null>(null);
  const [pageSize, setPageSize] = useState(10);
  const [totalItems, setTotalItems] = useState(0);
  
  // Fetch expenses on component mount and when filters or pagination changes
  useEffect(() => {
    fetchExpenses();
  }, [currentPage, selectedCategoryId, selectedStatus, pageSize]);
  
  useEffect(() => {
    fetchCategories();
  }, []);
  
  const fetchExpenses = async () => {
    setIsLoading(true);
    try {
      let url = `/api/expenses?page=${currentPage}&limit=${pageSize}`;
      
      if (selectedCategoryId) {
        url += `&categoryId=${selectedCategoryId}`;
      }
      
      if (selectedStatus) {
        url += `&status=${selectedStatus}`;
      }
      
      const response = await fetch(url);
      if (!response.ok) throw new Error("Failed to fetch expenses");
      
      const data = await response.json();
      setExpenses(data.data || []);
      setTotalPages(data.meta?.totalPages || data.totalPages || 1);
      setTotalItems(data.total || 0);
    } catch (error) {
      console.error("Error fetching expenses:", error);
      toast.error("Failed to load expenses");
    } finally {
      setIsLoading(false);
    }
  };
  
  const fetchCategories = async () => {
    try {
      const response = await fetch("/api/expense-categories");
      if (!response.ok) throw new Error("Failed to fetch categories");
      
      const data = await response.json();
      setCategories(data.data || []);
    } catch (error) {
      console.error("Error fetching expense categories:", error);
      toast.error("Failed to load expense categories");
    }
  };
  
  const handleAddExpense = () => {
    router.push("/expenses/new");
  };
  
  const handleEditExpense = (id: number) => {
    router.push(`/expenses/${id}/edit`);
  };
  
  const handleDeleteExpense = async (id: number) => {
    if (!confirm("Are you sure you want to delete this expense?")) return;
    
    try {
      const response = await fetch(`/api/expenses/${id}`, {
        method: "DELETE",
      });
      
      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.message || "Failed to delete expense");
      }
      
      await fetchExpenses();
      toast.success("Expense deleted successfully");
    } catch (error) {
      console.error("Error deleting expense:", error);
      toast.error(error instanceof Error ? error.message : "Failed to delete expense");
    }
  };
  
  const handleUpdateStatus = async (id: number, status: "approved" | "rejected") => {
    try {
      const response = await fetch(`/api/expenses/${id}/status`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ status }),
      });
      
      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.message || `Failed to ${status} expense`);
      }
      
      await fetchExpenses();
      toast.success(`Expense ${status} successfully`);
    } catch (error) {
      console.error(`Error ${status} expense:`, error);
      toast.error(error instanceof Error ? error.message : `Failed to ${status} expense`);
    }
  };
  
  const getStatusBadge = (status: string) => {
    switch (status) {
      case "approved":
        return <Badge variant="default">Approved</Badge>;
      case "rejected":
        return <Badge variant="destructive">Rejected</Badge>;
      default:
        return <Badge variant="outline">Pending</Badge>;
    }
  };
  
  const handlePageSizeChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newPageSize = parseInt(e.target.value);
    setPageSize(newPageSize);
    setCurrentPage(1); // Reset to first page when changing page size
  };
  
  return (
    <div className="container mx-auto py-8">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>Expenses</CardTitle>
            <CardDescription>
              Manage your business expenses
            </CardDescription>
          </div>
          <Button onClick={handleAddExpense}>
            <Plus className="mr-2 h-4 w-4" /> Add Expense
          </Button>
        </CardHeader>
        <CardContent>
          <div className="mb-6 flex flex-wrap gap-4">
            <div>
              <label htmlFor="category-filter" className="block text-sm mb-1">
                Filter by Category
              </label>
              <select
                id="category-filter"
                className="border rounded p-2"
                value={selectedCategoryId || ""}
                onChange={(e) => {
                  setSelectedCategoryId(e.target.value || null);
                  setCurrentPage(1);
                }}
              >
                <option value="">All Categories</option>
                {categories.map((category) => (
                  <option key={category.id} value={category.id}>
                    {category.name}
                  </option>
                ))}
              </select>
            </div>
            
            <div>
              <label htmlFor="status-filter" className="block text-sm mb-1">
                Filter by Status
              </label>
              <select
                id="status-filter"
                className="border rounded p-2"
                value={selectedStatus || ""}
                onChange={(e) => {
                  setSelectedStatus(e.target.value || null);
                  setCurrentPage(1);
                }}
              >
                <option value="">All Statuses</option>
                <option value="pending">Pending</option>
                <option value="approved">Approved</option>
                <option value="rejected">Rejected</option>
              </select>
            </div>
            
            <div>
              <label htmlFor="page-size" className="block text-sm mb-1">
                Items per page
              </label>
              <select
                id="page-size"
                className="border rounded p-2"
                value={pageSize}
                onChange={handlePageSizeChange}
              >
                <option value="5">5</option>
                <option value="10">10</option>
                <option value="25">25</option>
                <option value="50">50</option>
              </select>
            </div>
          </div>
          
          {isLoading ? (
            <div className="flex justify-center items-center py-8">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : expenses.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No expenses found. Add your first expense.
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Date</TableHead>
                      <TableHead>Vendor</TableHead>
                      <TableHead>Category</TableHead>
                      <TableHead>Amount</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Receipt</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {expenses.map((expense) => (
                      <TableRow key={expense.id}>
                        <TableCell>{new Date(expense.expenseDate).toLocaleDateString()}</TableCell>
                        <TableCell>{expense.vendor}</TableCell>
                        <TableCell>{expense.category?.name || "Uncategorized"}</TableCell>
                        <TableCell>{formatCurrency(parseFloat(expense.amount), expense.currency)}</TableCell>
                        <TableCell>{getStatusBadge(expense.status)}</TableCell>
                        <TableCell>
                          {expense.receiptUrl ? (
                            <a
                              onClick={async (e) => {
                                e.preventDefault();
                                try {
                                  // Get the fileName - this is now just the path since we updated getFileUrl
                                  const url = new URL(expense.receiptUrl as string);
                                  const fileName = url.pathname.startsWith("/")
                                    ? url.pathname.slice(1)
                                    : url.pathname;
                                  
                                  // ALWAYS use our API to get a presigned URL
                                  const response = await fetch(`/api/download/receipt?fileName=${fileName}`);
                                  if (!response.ok) throw new Error('Failed to get download link');
                                  
                                  const data = await response.json();
                                  window.open(data.url, '_blank');
                                } catch (error) {
                                  console.error('Error opening receipt:', error);
                                  toast.error('Failed to open receipt');
                                }
                              }}
                              href="#"
                              className="text-blue-600 hover:underline cursor-pointer"
                            >
                              <FileUp className="h-4 w-4 inline" /> View
                            </a>
                          ) : (
                            <span className="text-muted-foreground">None</span>
                          )}
                        </TableCell>
                        <TableCell className="text-right space-x-1">
                          {expense.status === "pending" && (
                            <>
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => handleUpdateStatus(expense.id, "approved")}
                                title="Approve"
                              >
                                <CheckCircle className="h-4 w-4 text-green-600" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => handleUpdateStatus(expense.id, "rejected")}
                                title="Reject"
                              >
                                <XCircle className="h-4 w-4 text-red-600" />
                              </Button>
                            </>
                          )}
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleEditExpense(expense.id)}
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleDeleteExpense(expense.id)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
              
              <div className="flex flex-col sm:flex-row justify-between items-center mt-6 gap-4">
                <div className="text-sm text-muted-foreground">
                  Showing {expenses.length} of {totalItems} items
                </div>
                
                <div className="flex justify-center space-x-2">
                  <Button
                    variant="outline"
                    onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
                    disabled={currentPage === 1}
                  >
                    Previous
                  </Button>
                  <span className="flex items-center px-4">
                    Page {currentPage} of {totalPages || 1}
                  </span>
                  <Button
                    variant="outline"
                    onClick={() => setCurrentPage((prev) => Math.min(prev + 1, totalPages))}
                    disabled={currentPage === totalPages || totalPages === 0}
                  >
                    Next
                  </Button>
                </div>
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
} 
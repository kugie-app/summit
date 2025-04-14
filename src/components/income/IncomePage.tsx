"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Pencil, Trash2, Plus, Loader2, Calendar, FileText } from "lucide-react";
import { toast } from "sonner";
import { formatCurrency, formatDate } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";

type IncomeCategory = {
  id: number;
  name: string;
};

type Client = {
  id: number;
  name: string;
}

type Income = {
  income: {
    id: number;
    source: string;
    description: string | null;
    amount: string;
    currency: string;
    incomeDate: string;
    recurring: "none" | "daily" | "weekly" | "monthly" | "yearly";
    nextDueDate: string | null;
    invoiceId: number | null;
  };
  category: IncomeCategory | null;
  client: Client | null;
};

export default function IncomePage() {
  const { data: session } = useSession();
  const router = useRouter();
  
  const [incomeEntries, setIncomeEntries] = useState<Income[]>([]);
  const [categories, setCategories] = useState<IncomeCategory[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [selectedCategoryId, setSelectedCategoryId] = useState<string | null>(null);
  const [dateRange, setDateRange] = useState<{
    startDate: string | null;
    endDate: string | null;
  }>({
    startDate: null,
    endDate: null,
  });
  
  // Fetch income entries on component mount and when filters change
  useEffect(() => {
    fetchIncomeEntries();
  }, [currentPage, selectedCategoryId, dateRange]);
  
  useEffect(() => {
    fetchCategories();
  }, []);
  
  const fetchIncomeEntries = async () => {
    setIsLoading(true);
    try {
      let url = `/api/income?page=${currentPage}&limit=10`;
      
      if (selectedCategoryId) {
        url += `&categoryId=${selectedCategoryId}`;
      }
      
      if (dateRange.startDate) {
        url += `&startDate=${dateRange.startDate}`;
      }
      
      if (dateRange.endDate) {
        url += `&endDate=${dateRange.endDate}`;
      }
      
      const response = await fetch(url);
      if (!response.ok) throw new Error("Failed to fetch income entries");
      
      const data = await response.json();
      setIncomeEntries(data.data || []);
      setTotalPages(data.meta?.totalPages || 1);
    } catch (error) {
      console.error("Error fetching income entries:", error);
      toast.error("Failed to load income entries");
    } finally {
      setIsLoading(false);
    }
  };
  
  const fetchCategories = async () => {
    try {
      const response = await fetch("/api/income-categories");
      if (!response.ok) throw new Error("Failed to fetch categories");
      
      const data = await response.json();
      setCategories(data.data || []);
    } catch (error) {
      console.error("Error fetching income categories:", error);
      toast.error("Failed to load income categories");
    }
  };
  
  const handleAddIncome = () => {
    router.push("/income/new");
  };
  
  const handleEditIncome = (id: number) => {
    router.push(`/income/${id}/edit`);
  };
  
  const handleDeleteIncome = async (id: number) => {
    if (!confirm("Are you sure you want to delete this income entry?")) return;
    
    try {
      const response = await fetch(`/api/income/${id}`, {
        method: "DELETE",
      });
      
      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Failed to delete income entry");
      }
      
      await fetchIncomeEntries();
      toast.success("Income entry deleted successfully");
    } catch (error) {
      console.error("Error deleting income entry:", error);
      toast.error(error instanceof Error ? error.message : "Failed to delete income entry");
    }
  };
  
  const handleViewInvoice = (invoiceId: number) => {
    router.push(`/invoices/${invoiceId}`);
  };
  
  const getRecurringBadge = (recurring: string) => {
    if (recurring === "none") return null;
    
    let variant = "default";
    switch (recurring) {
      case "daily":
        variant = "warning";
        break;
      case "weekly":
      case "monthly":
        variant = "secondary";
        break;
      case "yearly":
        variant = "default";
        break;
    }
    
    return (
      <Badge variant={variant as any} className="ml-2">
        <Calendar className="h-3 w-3 mr-1" /> {recurring}
      </Badge>
    );
  };
  
  return (
    <div className="container mx-auto py-8">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>Income</CardTitle>
            <CardDescription>
              Manage your business income
            </CardDescription>
          </div>
          <Button onClick={handleAddIncome}>
            <Plus className="mr-2 h-4 w-4" /> Add Income
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
              <label htmlFor="start-date" className="block text-sm mb-1">
                Start Date
              </label>
              <input
                id="start-date"
                type="date"
                className="border rounded p-2"
                value={dateRange.startDate || ""}
                onChange={(e) => {
                  setDateRange((prev) => ({
                    ...prev,
                    startDate: e.target.value || null,
                  }));
                  setCurrentPage(1);
                }}
              />
            </div>
            
            <div>
              <label htmlFor="end-date" className="block text-sm mb-1">
                End Date
              </label>
              <input
                id="end-date"
                type="date"
                className="border rounded p-2"
                value={dateRange.endDate || ""}
                onChange={(e) => {
                  setDateRange((prev) => ({
                    ...prev,
                    endDate: e.target.value || null,
                  }));
                  setCurrentPage(1);
                }}
              />
            </div>
          </div>
          
          {isLoading ? (
            <div className="flex justify-center items-center py-8">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : incomeEntries.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No income entries found. Add your first income entry.
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Date</TableHead>
                      <TableHead>Source</TableHead>
                      <TableHead>Category</TableHead>
                      <TableHead>Client</TableHead>
                      <TableHead>Amount</TableHead>
                      <TableHead>Invoice</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {incomeEntries.map((entry) => (
                      <TableRow key={entry.income.id}>
                        <TableCell>
                          {new Date(entry.income.incomeDate).toLocaleDateString()}
                          {getRecurringBadge(entry.income.recurring)}
                        </TableCell>
                        <TableCell>{entry.income.source}</TableCell>
                        <TableCell>{entry.category?.name || "Uncategorized"}</TableCell>
                        <TableCell>{entry.client?.name || "-"}</TableCell>
                        <TableCell>
                          {formatCurrency(parseFloat(entry.income.amount), entry.income.currency)}
                        </TableCell>
                        <TableCell>
                          {entry.income.invoiceId ? (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleViewInvoice(entry.income.invoiceId!)}
                              className="text-blue-600 hover:underline flex items-center"
                            >
                              <FileText className="h-4 w-4 mr-1" /> View
                            </Button>
                          ) : (
                            "-"
                          )}
                        </TableCell>
                        <TableCell className="text-right space-x-1">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleEditIncome(entry.income.id)}
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleDeleteIncome(entry.income.id)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
              
              {totalPages > 1 && (
                <div className="flex justify-center mt-6 space-x-2">
                  <Button
                    variant="outline"
                    onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
                    disabled={currentPage === 1}
                  >
                    Previous
                  </Button>
                  <span className="flex items-center px-4">
                    Page {currentPage} of {totalPages}
                  </span>
                  <Button
                    variant="outline"
                    onClick={() => setCurrentPage((prev) => Math.min(prev + 1, totalPages))}
                    disabled={currentPage === totalPages}
                  >
                    Next
                  </Button>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
} 
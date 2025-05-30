"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";
import { incomeSchema } from "@/lib/validations/income";

type IncomeFormValues = z.infer<typeof incomeSchema>;

type Category = {
  id: number;
  name: string;
};

type Client = {
  id: number;
  name: string;
};

type Invoice = {
  id: number;
  invoiceNumber: string;
  clientId: number;
  total: string;
  currency: string;
};

type Company = {
  id: number;
  name: string;
  defaultCurrency: string;
  address: string | null;
  logoUrl: string | null;
  bankAccount: string | null;
  email: string | null;
  phone: string | null;
  website: string | null;
  taxNumber: string | null;
};

interface IncomeFormProps {
  incomeId?: string;
}

export default function IncomeForm({ incomeId }: IncomeFormProps) {
  const router = useRouter();
  const isEditing = !!incomeId;
  
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [categories, setCategories] = useState<Category[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [selectedClientId, setSelectedClientId] = useState<string | null>(null);
  const [company, setCompany] = useState<Company | null>(null);
  
  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm<IncomeFormValues>({
    defaultValues: {
      source: "",
      description: "",
      amount: "",
      currency: "USD",
      incomeDate: new Date(),
      categoryId: 0,
      clientId: 0,
      invoiceId: 0,
      recurring: "none",
      nextDueDate: new Date(),
    },
  });
  
  const recurringValue = watch("recurring");
  const clientIdValue = watch("clientId");
  const invoiceIdValue = watch("invoiceId");
  
  useEffect(() => {
    const initialize = async () => {
      setIsLoading(true);
      try {
        await Promise.all([
          fetchCategories(),
          fetchClients(),
          fetchCompany()
        ]);
        
        if (incomeId) {
          // Load income data if in edit mode
          await fetchIncome();
        }
      } catch (error) {
        console.error('Initialization error:', error);
        toast.error('Failed to load form data');
      } finally {
        setIsLoading(false);
      }
    };
    
    initialize();
  }, [incomeId]);
  
  // Watch for changes in the client selection to filter invoices
  useEffect(() => {
    setSelectedClientId(clientIdValue ? String(clientIdValue) : null);
    if (clientIdValue) {
      fetchInvoicesByClient(String(clientIdValue));
    } else {
      setInvoices([]);
      setValue("invoiceId", 0);
    }
  }, [clientIdValue]);
  
  // Watch for changes in the invoice selection to auto-fill amount
  useEffect(() => {
    if (invoiceIdValue) {
      // Convert invoiceIdValue to number to match invoice.id type
      const selectedInvoice = invoices.find((invoice) => invoice.id === Number(invoiceIdValue));
      if (selectedInvoice) {
        setValue("amount", selectedInvoice.total);
        setValue("source", `Invoice #${selectedInvoice.invoiceNumber}`);
        // Use invoice's currency if available, otherwise use company's default currency
        if (selectedInvoice.currency) {
          setValue("currency", selectedInvoice.currency);
        } else if (company?.defaultCurrency) {
          setValue("currency", company.defaultCurrency);
        }
      }
    }
  }, [invoiceIdValue, invoices, company?.defaultCurrency, setValue]);
  
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
  
  const fetchClients = async () => {
    try {
      const response = await fetch("/api/clients");
      if (!response.ok) throw new Error("Failed to fetch clients");
      
      const data = await response.json();
      setClients(data.data || []);
    } catch (error) {
      console.error("Error fetching clients:", error);
      toast.error("Failed to load clients");
    }
  };
  
  const fetchInvoicesByClient = async (clientId: string) => {
    try {
      const response = await fetch(`/api/invoices?clientId=${clientId}&status=paid`);
      if (!response.ok) throw new Error("Failed to fetch invoices");
      
      const data = await response.json();
      setInvoices(data.data || []);
    } catch (error) {
      console.error("Error fetching invoices:", error);
      toast.error("Failed to load invoices");
    }
  };
  
  const fetchIncome = async () => {
    setIsLoading(true);
    try {
      const response = await fetch(`/api/income/${incomeId}`);
      if (!response.ok) throw new Error("Failed to fetch income");
      
      const data = await response.json();
      const incomeData = data.income;
      
      // Populate form with income data
      setValue("source", incomeData.source);
      setValue("description", incomeData.description || "");
      setValue("amount", incomeData.amount);
      setValue("currency", incomeData.currency);
      setValue("incomeDate", new Date(incomeData.incomeDate));
      setValue("categoryId", incomeData.categoryId);
      setValue("clientId", incomeData.clientId);
      setValue("invoiceId", incomeData.invoiceId);
      setValue("recurring", incomeData.recurring);
      
      if (incomeData.nextDueDate) {
        setValue("nextDueDate", new Date(incomeData.nextDueDate));
      }
      
      // If there's a client ID, fetch the related invoices
      if (incomeData.clientId) {
        setSelectedClientId(String(incomeData.clientId));
        fetchInvoicesByClient(String(incomeData.clientId));
      }
    } catch (error) {
      console.error("Error fetching income:", error);
      toast.error("Failed to load income data");
      router.push("/income");
    } finally {
      setIsLoading(false);
    }
  };
  
  const fetchCompany = async () => {
    try {
      const response = await fetch('/api/companies/current');
      
      if (!response.ok) {
        throw new Error('Failed to fetch company information');
      }
      
      const data = await response.json();
      setCompany(data);
    } catch (error) {
      console.error('Error fetching company information:', error);
      toast.error('Failed to load company information');
    }
  };
  
  const onSubmit = async (data: IncomeFormValues) => {
    setIsSubmitting(true);
    
    try {
      const incomeData = {
        ...data,
        // Convert string values to numbers, or null if empty/zero
        categoryId: data.categoryId && Number(data.categoryId) !== 0 ? Number(data.categoryId) : null,
        clientId: data.clientId && Number(data.clientId) !== 0 ? Number(data.clientId) : null,
        invoiceId: data.invoiceId && Number(data.invoiceId) !== 0 ? Number(data.invoiceId) : null,
        // Only include nextDueDate if recurring is not "none"
        nextDueDate: data.recurring !== "none" ? data.nextDueDate : null,
      };
      
      const url = isEditing ? `/api/income/${incomeId}` : "/api/income";
      const method = isEditing ? "PUT" : "POST";
      
      const response = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(incomeData),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to save income");
      }
      
      toast.success(`Income ${isEditing ? "updated" : "created"} successfully`);
      router.push("/income");
      router.refresh();
    } catch (error) {
      console.error("Error saving income:", error);
      toast.error(error instanceof Error ? error.message : "Failed to save income");
    } finally {
      setIsSubmitting(false);
    }
  };
  
  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }
  
  return (
    <div className="container mx-auto py-8">
      <Card>
        <CardHeader>
          <CardTitle>{isEditing ? "Edit Income" : "Add Income"}</CardTitle>
          <CardDescription>
            {isEditing
              ? "Update an existing income record"
              : "Create a new income record for your business"}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
              {/* Client (Optional) */}
              <div className="space-y-2">
                <Label htmlFor="clientId">Client</Label>
                <select
                  id="clientId"
                  {...register("clientId")}
                  className="w-full border rounded p-2"
                >
                  <option value="">Select a client (optional)</option>
                  {clients.map((client) => (
                    <option key={client.id} value={client.id}>
                      {client.name}
                    </option>
                  ))}
                </select>
              </div>
              
              {/* Invoice (Optional, only if client is selected) */}
              {selectedClientId && (
                <div className="space-y-2">
                  <Label htmlFor="invoiceId">Invoice</Label>
                  <select
                    id="invoiceId"
                    {...register("invoiceId")}
                    className="w-full border rounded p-2"
                  >
                    <option value="">Select an invoice (optional)</option>
                    {invoices.map((invoice) => (
                      <option key={invoice.id} value={invoice.id}>
                        #{invoice.invoiceNumber} - {new Intl.NumberFormat('id-ID', { style: 'currency', currency: company?.defaultCurrency || 'IDR' }).format(parseFloat(invoice.total))}
                      </option>
                    ))}
                  </select>
                </div>
              )}
              
              {/* Source */}
              <div className="space-y-2">
                <Label htmlFor="source">
                  Source <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="source"
                  {...register("source")}
                  placeholder="Income source"
                />
                {errors.source && (
                  <p className="text-sm text-red-500">{errors.source.message}</p>
                )}
              </div>
              
              {/* Amount */}
              <div className="space-y-2">
                <Label htmlFor="amount">
                  Amount <span className="text-red-500">*</span>
                </Label>
                <div className="flex">
                  <Input
                    id="amount"
                    {...register("amount")}
                    placeholder="0.00"
                    type="number"
                    step="0.01"
                    min="0"
                    className="flex-1"
                  />
                  <select
                    {...register("currency")}
                    className="ml-2 border rounded p-2 w-24"
                    defaultValue={company?.defaultCurrency || "IDR"}
                  >
                    <option value="IDR">IDR</option>
                    <option value="USD">USD</option>
                    <option value="EUR">EUR</option>
                    <option value="GBP">GBP</option>
                    <option value="JPY">JPY</option>
                    <option value="CAD">CAD</option>
                    <option value="AUD">AUD</option>
                  </select>
                </div>
                {errors.amount && (
                  <p className="text-sm text-red-500">{errors.amount.message}</p>
                )}
              </div>
              
              {/* Income Date */}
              <div className="space-y-2">
                <Label htmlFor="incomeDate">
                  Income Date <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="incomeDate"
                  type="date"
                  {...register("incomeDate")}
                />
                {errors.incomeDate && (
                  <p className="text-sm text-red-500">{errors.incomeDate.message}</p>
                )}
              </div>
              
              {/* Category */}
              <div className="space-y-2">
                <Label htmlFor="categoryId">Category</Label>
                <select
                  id="categoryId"
                  {...register("categoryId")}
                  className="w-full border rounded p-2"
                >
                  <option value="">Select a category</option>
                  {categories.map((category) => (
                    <option key={category.id} value={category.id}>
                      {category.name}
                    </option>
                  ))}
                </select>
              </div>
              
              {/* Recurring */}
              <div className="space-y-2">
                <Label htmlFor="recurring">Recurring</Label>
                <select
                  id="recurring"
                  {...register("recurring")}
                  className="w-full border rounded p-2"
                >
                  <option value="none">Not recurring</option>
                  <option value="daily">Daily</option>
                  <option value="weekly">Weekly</option>
                  <option value="monthly">Monthly</option>
                  <option value="yearly">Yearly</option>
                </select>
              </div>
              
              {/* Next Due Date (only if recurring) */}
              {recurringValue !== "none" && (
                <div className="space-y-2">
                  <Label htmlFor="nextDueDate">Next Due Date</Label>
                  <Input
                    id="nextDueDate"
                    type="date"
                    {...register("nextDueDate")}
                  />
                </div>
              )}
            </div>
            
            {/* Description */}
            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                {...register("description")}
                placeholder="Details about this income"
                rows={3}
              />
            </div>
            
            <div className="flex justify-end space-x-4 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => router.push("/income")}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    {isEditing ? "Updating..." : "Creating..."}
                  </>
                ) : (
                  <>{isEditing ? "Update" : "Create"} Income</>
                )}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
} 
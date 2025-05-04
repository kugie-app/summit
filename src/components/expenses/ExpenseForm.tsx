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

const expenseSchema = z.object({
  vendorId: z.string().optional(),
  vendor: z.string().min(1, "Vendor is required").optional(),
  description: z.string().optional(),
  amount: z.string().min(1, "Amount is required"),
  currency: z.string().default("USD"),
  expenseDate: z.string().min(1, "Expense date is required"),
  categoryId: z.string().optional(),
  status: z.enum(["pending", "approved", "rejected"]).default("pending"),
  recurring: z.enum(["none", "daily", "weekly", "monthly", "yearly"]).default("none"),
  nextDueDate: z.string().optional(),
}).refine(data => {
  // Either vendorId or vendor must be provided
  return !!data.vendorId || !!data.vendor;
}, {
  message: "Either vendor name or vendor selection is required",
  path: ["vendorId"]
});

type ExpenseFormValues = z.infer<typeof expenseSchema>;

type Category = {
  id: number;
  name: string;
};

type Vendor = {
  id: number;
  name: string;
};

interface ExpenseFormProps {
  expenseId?: string;
}

export default function ExpenseForm({ expenseId }: ExpenseFormProps) {
  const router = useRouter();
  const isEditing = !!expenseId;

  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [categories, setCategories] = useState<Category[]>([]);
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [receiptFile, setReceiptFile] = useState<File | null>(null);
  const [existingReceiptUrl, setExistingReceiptUrl] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    reset,
    watch,
    setValue,
    formState: { errors },
  } = useForm<ExpenseFormValues>({
    defaultValues: {
      vendorId: "",
      vendor: "",
      description: "",
      amount: "",
      currency: "USD",
      expenseDate: format(new Date(), "yyyy-MM-dd"),
      categoryId: "",
      status: "pending",
      recurring: "none",
      nextDueDate: "",
    },
  });

  const recurringValue = watch("recurring");
  const vendorIdValue = watch("vendorId");

  useEffect(() => {
    fetchCategories();
    fetchVendors();

    if (isEditing) {
      fetchExpense();
    }
  }, [isEditing, expenseId]);

  const fetchVendors = async () => {
    try {
      const response = await fetch("/api/vendors");
      if (!response.ok) throw new Error("Failed to fetch vendors");

      const data = await response.json();
      setVendors(data.data || []);
    } catch (error) {
      console.error("Error fetching vendors:", error);
      toast.error("Failed to load vendors");
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

  const fetchExpense = async () => {
    setIsLoading(true);
    try {
      const response = await fetch(`/api/expenses/${expenseId}`);
      if (!response.ok) throw new Error("Failed to fetch expense");

      const data = await response.json();

      // Populate form with expense data
      setValue("vendorId", data.vendorId ? String(data.vendorId) : "");
      setValue("vendor", data.vendor || "");
      setValue("description", data.description || "");
      setValue("amount", data.amount);
      setValue("currency", data.currency);
      setValue("expenseDate", format(new Date(data.expenseDate), "yyyy-MM-dd"));
      setValue("categoryId", data.categoryId ? String(data.categoryId) : "");
      setValue("status", data.status);
      setValue("recurring", data.recurring);

      if (data.nextDueDate) {
        setValue("nextDueDate", format(new Date(data.nextDueDate), "yyyy-MM-dd"));
      }

      if (data.receiptUrl) {
        setExistingReceiptUrl(data.receiptUrl);
      }
    } catch (error) {
      console.error("Error fetching expense:", error);
      toast.error("Failed to load expense data");
      router.push("/expenses");
    } finally {
      setIsLoading(false);
    }
  };

  const uploadReceipt = async (): Promise<string | null> => {
    if (!receiptFile) return null;

    const formData = new FormData();
    formData.append("receipt", receiptFile);

    try {
      const response = await fetch("/api/upload/receipt", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Failed to upload receipt");
      }

      const data = await response.json();
      return data.url;
    } catch (error) {
      console.error("Error uploading receipt:", error);
      // Don't throw the error, just return null to make receipts optional
      return null;
    }
  };

  const onSubmit = async (data: ExpenseFormValues) => {
    setIsSubmitting(true);

    try {
      // Start with null receipt URL if none exists
      let receiptUrl = existingReceiptUrl || null;

      // Upload receipt only if a new file was selected
      if (receiptFile) {
        const uploadedUrl = await uploadReceipt();
        if (uploadedUrl) {
          receiptUrl = uploadedUrl;
        }
      }

      const expenseData = {
        ...data,
        vendorId: data.vendorId ? parseInt(data.vendorId) : null,
        categoryId: data.categoryId ? parseInt(data.categoryId) : null,
        receiptUrl, // This can be null if no receipt was uploaded
        // Only include nextDueDate if recurring is not "none"
        nextDueDate: data.recurring !== "none" ? data.nextDueDate : null,
      };

      const url = isEditing ? `/api/expenses/${expenseId}` : "/api/expenses";
      const method = isEditing ? "PUT" : "POST";

      const response = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(expenseData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        if (errorData.errors) {
          // Format validation errors for better display
          const errorMessages = [];
          
          // Check for field-specific errors
          for (const field in errorData.errors) {
            if (field !== '_errors' && errorData.errors[field]?._errors?.length > 0) {
              errorMessages.push(`${field}: ${errorData.errors[field]._errors.join(', ')}`);
            }
          }
          
          // Check for general errors
          if (errorData.errors._errors?.length > 0) {
            errorMessages.push(...errorData.errors._errors);
          }
          
          const errorMessage = errorMessages.length > 0 
            ? `Validation errors: ${errorMessages.join('; ')}` 
            : errorData.message || "Failed to save expense";
            
          throw new Error(errorMessage);
        } else {
          throw new Error(errorData.message || "Failed to save expense");
        }
      }

      toast.success(`Expense ${isEditing ? "updated" : "created"} successfully`);
      router.push("/expenses");
      router.refresh();
    } catch (error) {
      console.error("Error saving expense:", error);
      toast.error(error instanceof Error ? error.message : "Failed to save expense");
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
          <CardTitle>{isEditing ? "Edit Expense" : "Add Expense"}</CardTitle>
          <CardDescription>
            {isEditing
              ? "Update an existing expense record"
              : "Create a new expense record for your business"}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
              {/* Vendor Selection */}
              <div className="space-y-2">
                <Label htmlFor="vendorId">
                  Vendor <span className="text-red-500">*</span>
                </Label>
                <select
                  id="vendorId"
                  {...register("vendorId")}
                  className="w-full border rounded p-2"
                  onChange={(e) => {
                    const selectedVendor = vendors.find(vendor => vendor.id === parseInt(e.target.value));
                    setValue("vendor", selectedVendor ? selectedVendor.name : "");
                  }}
                >
                  <option value="">Select a vendor</option>
                  {vendors.map((vendor) => (
                    <option key={vendor.id} value={vendor.id}>
                      {vendor.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Manual Vendor Entry (only if no vendor selected) */}
              {!vendorIdValue && (
                <div className="space-y-2">
                  <Label htmlFor="vendor">
                    Or Enter Vendor Name <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="vendor"
                    {...register("vendor")}
                    placeholder="Enter vendor name manually"
                  />
                  {errors.vendor && (
                    <p className="text-sm text-red-500">{errors.vendor.message}</p>
                  )}
                </div>
              )}

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

              {/* Expense Date */}
              <div className="space-y-2">
                <Label htmlFor="expenseDate">
                  Expense Date <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="expenseDate"
                  type="date"
                  {...register("expenseDate")}
                />
                {errors.expenseDate && (
                  <p className="text-sm text-red-500">{errors.expenseDate.message}</p>
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

              {/* Status */}
              <div className="space-y-2">
                <Label htmlFor="status">Status</Label>
                <select
                  id="status"
                  {...register("status")}
                  className="w-full border rounded p-2"
                >
                  <option value="pending">Pending</option>
                  <option value="approved">Approved</option>
                  <option value="rejected">Rejected</option>
                </select>
              </div>

              {/* Receipt Upload */}
              <div className="space-y-2">
                <Label htmlFor="receipt">Receipt (Optional)</Label>
                <div className="flex items-center space-x-4">
                  <Input
                    id="receipt"
                    type="file"
                    accept="image/*,.pdf"
                    onChange={(e) => {
                      if (e.target.files && e.target.files[0]) {
                        setReceiptFile(e.target.files[0]);
                      }
                    }}
                    className="flex-1"
                  />
                  {existingReceiptUrl && !receiptFile && (
                    <a
                      onClick={async (e) => {
                        e.preventDefault();
                        try {
                          // Get the fileName - this is now just the path
                          const url = new URL(existingReceiptUrl as string);
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
                      className="text-blue-600 hover:underline flex items-center cursor-pointer"
                    >
                      View Current
                    </a>
                  )}
                </div>
                {receiptFile && (
                  <p className="text-sm text-muted-foreground">
                    New receipt selected: {receiptFile.name}
                  </p>
                )}
              </div>
            </div>

            {/* Description */}
            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                {...register("description")}
                placeholder="Details about this expense"
                rows={3}
              />
            </div>

            <div className="flex justify-end space-x-4 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => router.push("/expenses")}
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
                  <>{isEditing ? "Update Expense" : "Create Expense"}</>
                )}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
} 
"use client";

import { useState, useEffect } from "react";
import { useForm, useController } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";

const vendorSchema = z.object({
  name: z.string().min(1, "Vendor name is required"),
  contactName: z.string().optional(),
  email: z.string().email("Invalid email format").optional().or(z.literal("")),
  phone: z.string().optional(),
  address: z.string().optional(),
  website: z.string().url("Invalid URL format").optional().or(z.literal("")),
  notes: z.string().optional(),
});

type VendorFormValues = z.infer<typeof vendorSchema>;

interface VendorFormProps {
  vendorId?: number;
  onComplete: (refresh: boolean) => void;
}

export default function VendorForm({ vendorId, onComplete }: VendorFormProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const isEditing = !!vendorId;

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    control,
    formState: { errors, isDirty, isSubmitted },
  } = useForm<VendorFormValues>({
    resolver: zodResolver(vendorSchema),
    defaultValues: async () => {
      // If we're editing, try to fetch the initial values
      if (isEditing && vendorId) {
        try {
          const response = await fetch(`/api/vendors/${vendorId}`);
          if (!response.ok) throw new Error("Failed to fetch vendor for defaultValues");
          
          const data = await response.json();
          const vendor = data.data;
          
          return {
            name: vendor.name || "",
            contactName: vendor.contactName || "",
            email: vendor.email || "",
            phone: vendor.phone || "",
            address: vendor.address || "",
            website: vendor.website || "",
            notes: vendor.notes || "",
          };
        } catch (error) {
          console.error("Error fetching initial defaultValues:", error);
          // Fall back to empty values
          return {
            name: "",
            contactName: "",
            email: "",
            phone: "",
            address: "",
            website: "",
            notes: "",
          };
        }
      }
      
      // Default empty values for new vendor
      return {
        name: "",
        contactName: "",
        email: "",
        phone: "",
        address: "",
        website: "",
        notes: "",
      };
    },
  });

  // Use controllers for better tracking of form state
  const { field: nameField } = useController({
    name: "name",
    control,
  });

  const { field: contactNameField } = useController({
    name: "contactName",
    control,
  });

  const { field: emailField } = useController({
    name: "email",
    control,
  });

  const { field: phoneField } = useController({
    name: "phone",
    control,
  });
  
  const { field: addressField } = useController({
    name: "address",
    control,
  });
  
  const { field: websiteField } = useController({
    name: "website",
    control,
  });
  
  const { field: notesField } = useController({
    name: "notes",
    control,
  });

  useEffect(() => {
    const fetchVendor = async () => {
      if (!vendorId) return;
      setIsLoading(true);
      
      try {
        const response = await fetch(`/api/vendors/${vendorId}`);
        if (!response.ok) throw new Error("Failed to fetch vendor");
        
        const data = await response.json();
        const vendor = data.data[0];
        
        // Check if vendor data has the expected structure
        if (!vendor || typeof vendor !== 'object') {
          console.error("Invalid vendor data structure:", vendor);
          throw new Error("Invalid vendor data received");
        }
        
        // Set values individually using setValue for each field
        setValue("name", vendor.name || "");
        setValue("contactName", vendor.contactName || "");
        setValue("email", vendor.email || "");
        setValue("phone", vendor.phone || "");
        setValue("address", vendor.address || "");
        setValue("website", vendor.website || "");
        setValue("notes", vendor.notes || "");
        
        // Also do a full reset as a backup approach
        reset({
          name: vendor.name || "",
          contactName: vendor.contactName || "",
          email: vendor.email || "",
          phone: vendor.phone || "",
          address: vendor.address || "",
          website: vendor.website || "",
          notes: vendor.notes || "",
        });
      } catch (error) {
        console.error("Error fetching vendor:", error);
        toast.error("Failed to load vendor data");
        onComplete(false);
      } finally {
        setIsLoading(false);
      }
    };

    if (isEditing && vendorId) {
      fetchVendor();
    }
  }, [isEditing, vendorId, reset, setValue, onComplete]);

  const onSubmit = async (data: VendorFormValues) => {
    setIsSubmitting(true);
    
    try {
      const url = isEditing ? `/api/vendors/${vendorId}` : "/api/vendors";
      const method = isEditing ? "PUT" : "POST";
      
      const response = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to save vendor");
      }
      
      toast.success(`Vendor ${isEditing ? "updated" : "created"} successfully`);
      onComplete(true);
    } catch (error) {
      console.error("Error saving vendor:", error);
      toast.error(error instanceof Error ? error.message : "Failed to save vendor");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-[200px]">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      {/* Vendor Name */}
      <div className="space-y-2">
        <Label htmlFor="name">
          Vendor Name <span className="text-red-500">*</span>
        </Label>
        <Input
          id="name"
          value={nameField.value}
          onChange={nameField.onChange}
          onBlur={nameField.onBlur}
          placeholder="Enter vendor name"
        />
        {errors.name && (
          <p className="text-sm text-red-500">{errors.name.message}</p>
        )}
        <p className="text-xs text-gray-500">Current value: {nameField.value}</p>
      </div>

      {/* Contact Person */}
      <div className="space-y-2">
        <Label htmlFor="contactName">Contact Person</Label>
        <Input
          id="contactName"
          value={contactNameField.value}
          onChange={contactNameField.onChange}
          onBlur={contactNameField.onBlur}
          placeholder="Enter contact person's name"
        />
        <p className="text-xs text-gray-500">Current value: {contactNameField.value}</p>
      </div>

      {/* Email and Phone */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="email">Email</Label>
          <Input
            id="email"
            type="email"
            value={emailField.value}
            onChange={emailField.onChange}
            onBlur={emailField.onBlur}
            placeholder="Enter email address"
          />
          {errors.email && (
            <p className="text-sm text-red-500">{errors.email.message}</p>
          )}
          <p className="text-xs text-gray-500">Current value: {emailField.value}</p>
        </div>
        <div className="space-y-2">
          <Label htmlFor="phone">Phone</Label>
          <Input
            id="phone"
            value={phoneField.value}
            onChange={phoneField.onChange}
            onBlur={phoneField.onBlur}
            placeholder="Enter phone number"
          />
          <p className="text-xs text-gray-500">Current value: {phoneField.value}</p>
        </div>
      </div>

      {/* Address */}
      <div className="space-y-2">
        <Label htmlFor="address">Address</Label>
        <Textarea
          id="address"
          value={addressField.value}
          onChange={addressField.onChange}
          onBlur={addressField.onBlur}
          placeholder="Enter address"
          rows={3}
        />
        <p className="text-xs text-gray-500">Current value: {addressField.value}</p>
      </div>

      {/* Website */}
      <div className="space-y-2">
        <Label htmlFor="website">Website</Label>
        <Input
          id="website"
          value={websiteField.value}
          onChange={websiteField.onChange}
          onBlur={websiteField.onBlur}
          placeholder="Enter website URL"
        />
        {errors.website && (
          <p className="text-sm text-red-500">{errors.website.message}</p>
        )}
        <p className="text-xs text-gray-500">Current value: {websiteField.value}</p>
      </div>

      {/* Notes */}
      <div className="space-y-2">
        <Label htmlFor="notes">Notes</Label>
        <Textarea
          id="notes"
          value={notesField.value}
          onChange={notesField.onChange}
          onBlur={notesField.onBlur}
          placeholder="Enter additional notes"
          rows={3}
        />
        <p className="text-xs text-gray-500">Current value: {notesField.value}</p>
      </div>

      {/* Form Actions */}
      <div className="flex justify-end space-x-2 pt-4">
        <Button type="button" variant="outline" onClick={() => onComplete(false)}>
          Cancel
        </Button>
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          {isEditing ? "Update" : "Create"} Vendor
        </Button>
      </div>
    </form>
  );
} 
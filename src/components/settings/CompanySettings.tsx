import { useState, useEffect } from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import { Loader2 } from 'lucide-react';
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
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from 'sonner';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

const companyFormSchema = z.object({
  name: z.string().min(2, {
    message: 'Company name must be at least 2 characters.',
  }),
  address: z.string().min(5, {
    message: 'Address must be at least 5 characters.',
  }),
  city: z.string().min(2, {
    message: 'City is required.',
  }),
  state: z.string().optional(),
  postalCode: z.string().min(1, {
    message: 'Postal code is required.',
  }),
  country: z.string().min(2, {
    message: 'Country is required.',
  }),
  email: z.string().email({
    message: 'Please enter a valid email address.',
  }),
  phone: z.string().min(5, {
    message: 'Phone number is required.',
  }),
  taxId: z.string().optional(),
  taxNumber: z.string().optional(),
  website: z.string().url({
    message: 'Please enter a valid URL.',
  }).optional(),
  bankAccount: z.string().optional(),
  defaultCurrency: z.string().min(1, {
    message: 'Currency is required.',
  }),
});

type CompanyFormValues = z.infer<typeof companyFormSchema>;

// Common currency options
const currencies = [
  { value: 'USD', label: 'USD (US Dollar)' },
  { value: 'EUR', label: 'EUR (Euro)' },
  { value: 'GBP', label: 'GBP (British Pound)' },
  { value: 'JPY', label: 'JPY (Japanese Yen)' },
  { value: 'CAD', label: 'CAD (Canadian Dollar)' },
  { value: 'AUD', label: 'AUD (Australian Dollar)' },
  { value: 'CHF', label: 'CHF (Swiss Franc)' },
  { value: 'CNY', label: 'CNY (Chinese Yuan)' },
  { value: 'INR', label: 'INR (Indian Rupee)' },
  { value: 'SGD', label: 'SGD (Singapore Dollar)' },
  { value: 'IDR', label: 'IDR (Indonesian Rupiah)' },
];

export default function CompanySettings() {
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [existingLogoUrl, setExistingLogoUrl] = useState<string | null>(null);
  const [logoPresignedUrl, setLogoPresignedUrl] = useState<string | null>(null);

  const form = useForm<CompanyFormValues>({
    resolver: zodResolver(companyFormSchema),
    defaultValues: {
      name: '',
      address: '',
      city: '',
      state: '',
      postalCode: '',
      country: '',
      email: '',
      phone: '',
      taxId: '',
      taxNumber: '',
      website: '',
      bankAccount: '',
      defaultCurrency: 'USD',
    },
    mode: 'onChange',
  });

  // Fetch company data when the component mounts
  useEffect(() => {
    async function fetchCompanyData() {
      setIsLoading(true);
      try {
        const response = await fetch('/api/companies/current');
        if (!response.ok) throw new Error('Failed to fetch company data');
        
        const company = await response.json();
        
        // Parse address into components or set empty strings
        const addressParts = parseAddress(company.address || '');
        
        form.reset({
          name: company.name || '',
          address: addressParts.address || '',
          city: addressParts.city || '',
          state: addressParts.state || '',
          postalCode: addressParts.postalCode || '',
          country: addressParts.country || '',
          email: company.email || addressParts.email || '',
          phone: company.phone || addressParts.phone || '',
          taxId: addressParts.taxId || '',
          taxNumber: company.taxNumber || '',
          website: company.website || addressParts.website || '',
          bankAccount: company.bankAccount || '',
          defaultCurrency: company.defaultCurrency || 'USD',
        });

        if (company.logoUrl) {
          setExistingLogoUrl(company.logoUrl);
          fetchLogoPresignedUrl(company.logoUrl);
        }
      } catch (error) {
        console.error('Error fetching company data:', error);
        toast.error('Failed to load company information');
      } finally {
        setIsLoading(false);
      }
    }

    fetchCompanyData();
  }, []);

  // Fetch presigned URL for logo
  async function fetchLogoPresignedUrl(logoFileName: string) {
    try {
      const response = await fetch(`/api/download/company-logo?fileName=${logoFileName}`);
      if (!response.ok) throw new Error('Failed to get logo URL');
      
      const data = await response.json();
      setLogoPresignedUrl(data.url);
    } catch (error) {
      console.error('Error fetching logo URL:', error);
      // Don't show error toast to avoid cluttering the UI
    }
  }
  
  // Helper function to parse address
  function parseAddress(fullAddress: string) {
    // This is a simple implementation. In a real app, you might want to use
    // a more sophisticated address parser or store address components separately in DB
    const parts = {
      address: '',
      city: '',
      state: '',
      postalCode: '',
      country: '',
      email: '',
      phone: '',
      taxId: '',
      website: '',
    };
    
    if (!fullAddress) return parts;
    
    // Try to extract parts with a simple algorithm
    // This is just a placeholder, should be improved for production
    const lines = fullAddress.split('\n');
    if (lines.length >= 1) parts.address = lines[0];
    if (lines.length >= 2) {
      const cityLine = lines[1].split(',');
      if (cityLine.length >= 1) parts.city = cityLine[0].trim();
      if (cityLine.length >= 2) {
        const statePostal = cityLine[1].trim().split(' ');
        if (statePostal.length >= 1) parts.state = statePostal[0];
        if (statePostal.length >= 2) parts.postalCode = statePostal.slice(1).join(' ');
      }
    }
    if (lines.length >= 3) parts.country = lines[2];
    
    return parts;
  }
  
  // Helper function to compose address from parts
  function composeAddress(data: CompanyFormValues) {
    let address = data.address;
    address += `\n${data.city}`;
    if (data.state) address += `, ${data.state}`;
    if (data.postalCode) address += ` ${data.postalCode}`;
    address += `\n${data.country}`;
    return address;
  }

  // Function to upload logo
  async function uploadLogo(): Promise<string | null> {
    if (!logoFile) return existingLogoUrl;

    const formData = new FormData();
    formData.append("logo", logoFile);

    try {
      const response = await fetch("/api/upload/company-logo", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Failed to upload logo");
      }

      const data = await response.json();
      return data.url;
    } catch (error) {
      console.error("Error uploading logo:", error);
      toast.error("Failed to upload company logo");
      return existingLogoUrl;
    }
  }

  async function onSubmit(data: CompanyFormValues) {
    setIsSubmitting(true);
    
    try {
      // Upload logo if a new one was selected
      const logoUrl = await uploadLogo();
      
      // Compose full address from parts
      const address = composeAddress(data);
      
      // Prepare data for API
      const companyData = {
        name: data.name,
        address,
        defaultCurrency: data.defaultCurrency,
        logoUrl,
        bankAccount: data.bankAccount,
        email: data.email,
        phone: data.phone,
        website: data.website,
        taxNumber: data.taxNumber,
      };
      
      // Submit to API
      const response = await fetch('/api/companies/current', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(companyData),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to update company');
      }
      
      // Update existing logo URL if a new one was uploaded
      if (logoUrl && logoUrl !== existingLogoUrl) {
        setExistingLogoUrl(logoUrl);
        setLogoFile(null);
      }
      
      toast.success('Company information updated', {
        description: 'Your company details have been saved successfully.'
      });
    } catch (error) {
      console.error('Error updating company:', error);
      toast.error('Error', {
        description: 'Something went wrong. Please try again.'
      });
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Company Information</CardTitle>
        <CardDescription>
          Update your company details. This information will be displayed on your invoices and quotes.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Company Name</FormLabel>
                    <FormControl>
                      <Input placeholder="Acme Inc." {...field} />
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
                      <Input placeholder="contact@example.com" {...field} />
                    </FormControl>
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
                      <Input placeholder="+1 (555) 000-0000" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="website"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Website</FormLabel>
                    <FormControl>
                      <Input placeholder="https://example.com" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="taxId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Tax ID / VAT Number</FormLabel>
                    <FormControl>
                      <Input placeholder="Tax ID / VAT Number" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="taxNumber"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Tax Number</FormLabel>
                    <FormControl>
                      <Input placeholder="Enter your tax number" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="defaultCurrency"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Default Currency</FormLabel>
                    <Select 
                      onValueChange={field.onChange} 
                      value={field.value}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select currency" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {currencies.map((currency) => (
                          <SelectItem key={currency.value} value={currency.value}>
                            {currency.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="bankAccount"
                render={({ field }) => (
                  <FormItem className="col-span-2">
                    <FormLabel>Bank Account Number</FormLabel>
                    <FormControl>
                      <Input placeholder="Bank Account Number" {...field} />
                    </FormControl>
                    <FormDescription>
                      This will be displayed on your invoices for client payments.
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            
            <div>
              <h3 className="text-lg font-medium mb-2">Address</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="address"
                  render={({ field }) => (
                    <FormItem className="col-span-2">
                      <FormLabel>Street Address</FormLabel>
                      <FormControl>
                        <Textarea placeholder="123 Main St, Suite 100" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="city"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>City</FormLabel>
                      <FormControl>
                        <Input placeholder="City" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="state"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>State / Province</FormLabel>
                      <FormControl>
                        <Input placeholder="State / Province" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="postalCode"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Postal Code</FormLabel>
                      <FormControl>
                        <Input placeholder="Postal Code" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="country"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Country</FormLabel>
                      <FormControl>
                        <Input placeholder="Country" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </div>

            {/* Company Logo Upload */}
            <div className="space-y-4">
              <h3 className="text-lg font-medium">Company Logo</h3>
              <div className="flex flex-col space-y-4">
                {existingLogoUrl && logoPresignedUrl && (
                  <div className="flex items-center space-x-4">
                    <img 
                      src={logoPresignedUrl} 
                      alt="Company Logo" 
                      className="h-16 w-auto object-contain"
                    />
                    <p className="text-sm text-muted-foreground">Current logo</p>
                  </div>
                )}
                <FormItem>
                  <FormLabel>Upload Logo</FormLabel>
                  <FormControl>
                    <Input
                      type="file"
                      accept="image/*"
                      onChange={(e) => {
                        if (e.target.files && e.target.files[0]) {
                          setLogoFile(e.target.files[0]);
                        }
                      }}
                    />
                  </FormControl>
                  <FormDescription>
                    Upload a company logo to be displayed on invoices and quotes. Recommended size: 200x200px.
                  </FormDescription>
                  {logoFile && (
                    <p className="text-sm text-muted-foreground mt-2">
                      New logo selected: {logoFile.name}
                    </p>
                  )}
                </FormItem>
              </div>
            </div>
            
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Saving...
                </>
              ) : (
                'Save Company Information'
              )}
            </Button>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
} 
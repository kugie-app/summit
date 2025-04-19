import { Metadata } from "next";
import VendorsList from "@/components/vendors/VendorsList";

export const metadata: Metadata = {
  title: "Vendors | Invoicing App",
  description: "Manage your business vendors",
};

export default function VendorsPage() {
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Vendors</h1>
          <p className="text-muted-foreground mt-1">
            Manage vendors you do business with
          </p>
        </div>
      </div>
      
      <VendorsList />
    </div>
  );
} 
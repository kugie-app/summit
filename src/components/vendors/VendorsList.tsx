"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { toast } from "sonner";
import { Edit, Plus, Search, Trash2 } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { useRouter } from "next/navigation";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import VendorForm from "./VendorForm";

interface Vendor {
  id: number;
  name: string;
  contactName: string | null;
  email: string | null;
  phone: string | null;
}

export default function VendorsList() {
  const router = useRouter();
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [openDialog, setOpenDialog] = useState(false);
  const [selectedVendor, setSelectedVendor] = useState<Vendor | null>(null);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [vendorToDelete, setVendorToDelete] = useState<number | null>(null);

  const fetchVendors = async (search: string = "") => {
    setIsLoading(true);
    try {
      const url = new URL("/api/vendors", window.location.origin);
      if (search) {
        url.searchParams.append("search", search);
      }
      
      const response = await fetch(url.toString());
      if (!response.ok) throw new Error("Failed to fetch vendors");
      
      const data = await response.json();
      setVendors(data.data || []);
    } catch (error) {
      console.error("Error fetching vendors:", error);
      toast.error("Failed to load vendors");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchVendors();
  }, []);

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value);
  };

  const handleSearch = () => {
    fetchVendors(searchQuery);
  };

  const handleSearchKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      handleSearch();
    }
  };

  const handleEditVendor = (vendor: Vendor) => {
    setSelectedVendor(vendor);
    setOpenDialog(true);
  };

  const handleDeleteClick = (vendorId: number) => {
    setVendorToDelete(vendorId);
    setDeleteConfirmOpen(true);
  };

  const handleDeleteVendor = async () => {
    if (!vendorToDelete) return;
    
    try {
      const response = await fetch(`/api/vendors/${vendorToDelete}`, {
        method: "DELETE",
      });
      
      if (!response.ok) throw new Error("Failed to delete vendor");
      
      toast.success("Vendor deleted successfully");
      fetchVendors(searchQuery);
    } catch (error) {
      console.error("Error deleting vendor:", error);
      toast.error("Failed to delete vendor");
    } finally {
      setDeleteConfirmOpen(false);
      setVendorToDelete(null);
    }
  };

  const handleDialogClose = (refresh: boolean = false) => {
    setOpenDialog(false);
    setSelectedVendor(null);
    if (refresh) {
      fetchVendors(searchQuery);
    }
  };

  return (
    <>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Vendors</CardTitle>
          <div className="flex items-center space-x-2">
            <div className="relative">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                type="search"
                placeholder="Search vendors..."
                className="w-64 pl-8"
                value={searchQuery}
                onChange={handleSearchChange}
                onKeyPress={handleSearchKeyPress}
              />
            </div>
            <Dialog open={openDialog} onOpenChange={setOpenDialog}>
              <DialogTrigger asChild>
                <Button size="sm">
                  <Plus className="mr-2 h-4 w-4" />
                  Add Vendor
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[550px]">
                <DialogHeader>
                  <DialogTitle>{selectedVendor ? "Edit Vendor" : "Add Vendor"}</DialogTitle>
                  <DialogDescription>
                    {selectedVendor
                      ? "Update vendor details below"
                      : "Fill in the details to add a new vendor"}
                  </DialogDescription>
                </DialogHeader>
                <VendorForm 
                  vendorId={selectedVendor?.id}
                  onComplete={(refresh) => handleDialogClose(refresh)}
                />
              </DialogContent>
            </Dialog>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="py-8 text-center text-muted-foreground">
              Loading vendors...
            </div>
          ) : vendors.length === 0 ? (
            <div className="py-8 text-center text-muted-foreground">
              <p>No vendors found</p>
              <p className="text-sm mt-1">
                {searchQuery
                  ? "Try adjusting your search query"
                  : "Add a vendor to get started"}
              </p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Vendor Name</TableHead>
                  <TableHead>Contact Person</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Phone</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {vendors.map((vendor) => (
                  <TableRow key={vendor.id}>
                    <TableCell className="font-medium">{vendor.name}</TableCell>
                    <TableCell>{vendor.contactName || "-"}</TableCell>
                    <TableCell>{vendor.email || "-"}</TableCell>
                    <TableCell>{vendor.phone || "-"}</TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end space-x-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleEditVendor(vendor)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <AlertDialog
                          open={deleteConfirmOpen && vendorToDelete === vendor.id}
                          onOpenChange={(open) => {
                            if (!open) setVendorToDelete(null);
                            setDeleteConfirmOpen(open);
                          }}
                        >
                          <AlertDialogTrigger asChild>
                            <Button
                              size="sm"
                              variant="outline"
                              className="text-red-600 hover:text-red-700"
                              onClick={() => handleDeleteClick(vendor.id)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Delete Vendor</AlertDialogTitle>
                              <AlertDialogDescription>
                                Are you sure you want to delete this vendor? This action cannot be undone.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancel</AlertDialogCancel>
                              <AlertDialogAction
                                onClick={handleDeleteVendor}
                                className="bg-red-600 hover:bg-red-700"
                              >
                                Delete
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </>
  );
} 
import { Metadata } from "next";
import IncomeCategoriesPage from "@/components/income/IncomeCategoriesPage";

export const metadata: Metadata = {
  title: "Income Categories | Invoicing App",
  description: "Manage income categories for your business",
};

export default function IncomeCategories() {
  return <IncomeCategoriesPage />;
} 
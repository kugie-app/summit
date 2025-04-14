import { Metadata } from "next";
import ExpenseCategoriesPage from "@/components/expenses/ExpenseCategoriesPage";

export const metadata: Metadata = {
  title: "Expense Categories | Invoicing App",
  description: "Manage expense categories for your business",
};

export default function ExpenseCategories() {
  return <ExpenseCategoriesPage />;
} 
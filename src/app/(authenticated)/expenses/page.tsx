import ExpensesPage from "@/components/expenses/ExpensesPage";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Expenses | Invoicing App",
  description: "Manage your business expenses",
};

export default function Expenses() {
  return <ExpensesPage />;
} 
import { Metadata } from "next";
import ExpenseForm from "@/components/expenses/ExpenseForm";

export const metadata: Metadata = {
  title: "Add Expense | Invoicing App",
  description: "Add a new expense to your business",
};

export default function NewExpense() {
  return <ExpenseForm />;
} 
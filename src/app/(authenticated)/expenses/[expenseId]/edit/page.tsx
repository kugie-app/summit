import ExpenseForm from "@/components/expenses/ExpenseForm";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Edit Expense | Invoicing App",
  description: "Edit an existing expense",
};

export default async function EditExpense({ params }: { params: Promise<{ expenseId: string }> }) {
  const { expenseId } = await params;
  return <ExpenseForm expenseId={expenseId} />;
} 
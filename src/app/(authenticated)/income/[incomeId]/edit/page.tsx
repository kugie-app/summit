import IncomeForm from "@/components/income/IncomeForm";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Edit Income | Invoicing App",
  description: "Edit an existing income entry",
};

export default async function EditIncome({ params }: { params: Promise<{ incomeId: string }> }) {
  const { incomeId } = await params;
  return <IncomeForm incomeId={incomeId} />;
} 
import { Metadata } from "next";
import IncomeForm from "@/components/income/IncomeForm";

export const metadata: Metadata = {
  title: "Add Income | Invoicing App",
  description: "Add a new income entry to your business",
};

export default function NewIncome() {
  return <IncomeForm />;
} 
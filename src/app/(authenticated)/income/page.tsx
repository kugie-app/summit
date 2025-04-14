import IncomePage from "@/components/income/IncomePage";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Income | Invoicing App",
  description: "Manage your business income",
};

export default function Income() {
  return <IncomePage />;
} 
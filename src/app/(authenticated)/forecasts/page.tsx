import { Metadata } from 'next';
import ForecastsListPage from '@/components/forecasts/ForecastsListPage';

export const metadata: Metadata = {
  title: 'Forecasts | Summit Finance',
  description: 'Manage your financial forecasts and budgets',
};

export default function ForecastsPage() {
  return <ForecastsListPage />;
}

import { Metadata } from 'next';
import ForecastComparisonPage from '@/components/forecasts/ForecastComparisonPage';

export const metadata: Metadata = {
  title: 'Budget vs Actuals | Summit Finance',
};

export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <ForecastComparisonPage forecastId={parseInt(id)} />;
}

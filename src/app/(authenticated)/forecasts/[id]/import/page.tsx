import { Metadata } from 'next';
import ForecastImportPage from '@/components/forecasts/ForecastImportPage';

export const metadata: Metadata = {
  title: 'Import CSV | Summit Finance',
};

export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <ForecastImportPage forecastId={parseInt(id)} />;
}

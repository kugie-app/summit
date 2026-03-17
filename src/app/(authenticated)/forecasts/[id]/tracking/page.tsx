import { Metadata } from 'next';
import ForecastTrackingPage from '@/components/forecasts/ForecastTrackingPage';

export const metadata: Metadata = {
  title: 'Forecast Tracking | Summit Finance',
};

export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <ForecastTrackingPage forecastId={parseInt(id)} />;
}

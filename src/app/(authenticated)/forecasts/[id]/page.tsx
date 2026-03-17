import { Metadata } from 'next';
import ForecastEditorPage from '@/components/forecasts/ForecastEditorPage';

export const metadata: Metadata = {
  title: 'Forecast Editor | Summit Finance',
};

export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <ForecastEditorPage forecastId={parseInt(id)} />;
}

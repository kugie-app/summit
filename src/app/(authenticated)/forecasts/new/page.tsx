import { Metadata } from 'next';
import NewForecastPage from '@/components/forecasts/NewForecastPage';

export const metadata: Metadata = {
  title: 'New Forecast | Summit Finance',
};

export default function Page() {
  return <NewForecastPage />;
}

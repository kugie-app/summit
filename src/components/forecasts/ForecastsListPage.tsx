'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Plus, Calendar, TrendingUp } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

interface Forecast {
  id: number;
  name: string;
  description: string | null;
  startDate: string;
  endDate: string;
  currency: string;
  updatedAt: string;
}

export default function ForecastsListPage() {
  const [forecasts, setForecasts] = useState<Forecast[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/forecasts')
      .then((r) => r.json())
      .then(setForecasts)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="space-y-6 p-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Forecasts</h1>
          <p className="text-muted-foreground mt-1">Plan and track your financial forecasts</p>
        </div>
        <Button asChild>
          <Link href="/forecasts/new">
            <Plus className="h-4 w-4 mr-2" /> New Forecast
          </Link>
        </Button>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3].map((i) => (
            <Card key={i} className="h-40 animate-pulse bg-muted/40" />
          ))}
        </div>
      ) : forecasts.length === 0 ? (
        <Card className="p-12 text-center">
          <TrendingUp className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
          <h3 className="text-lg font-semibold">No forecasts yet</h3>
          <p className="text-muted-foreground mt-1 mb-4">
            Create your first financial forecast to start tracking budgets and projections.
          </p>
          <Button asChild>
            <Link href="/forecasts/new">
              <Plus className="h-4 w-4 mr-2" /> Create Forecast
            </Link>
          </Button>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {forecasts.map((forecast) => (
            <Card key={forecast.id} className="hover:shadow-md transition-shadow">
              <CardHeader className="pb-2">
                <div className="flex items-start justify-between">
                  <CardTitle className="text-base leading-tight">{forecast.name}</CardTitle>
                  <Badge variant="outline">{forecast.currency}</Badge>
                </div>
                {forecast.description && (
                  <p className="text-sm text-muted-foreground line-clamp-2">{forecast.description}</p>
                )}
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-2 text-sm text-muted-foreground mb-4">
                  <Calendar className="h-4 w-4" />
                  <span>{forecast.startDate} → {forecast.endDate}</span>
                </div>
                <div className="text-xs text-muted-foreground mb-3">
                  Updated {new Date(forecast.updatedAt).toLocaleDateString()}
                </div>
                <div className="flex gap-2">
                  <Button asChild size="sm" className="flex-1">
                    <Link href={`/forecasts/${forecast.id}`}>Edit</Link>
                  </Button>
                  <Button asChild size="sm" variant="outline" className="flex-1">
                    <Link href={`/forecasts/${forecast.id}/comparison`}>Compare</Link>
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

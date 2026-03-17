'use client';

import { useState, useRef } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowLeft, Upload, CheckCircle2 } from 'lucide-react';

interface ForecastImportPageProps {
  forecastId: number;
}

export default function ForecastImportPage({ forecastId }: ForecastImportPageProps) {
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string[][] | null>(null);
  const [uploading, setUploading] = useState(false);
  const [result, setResult] = useState<{ rowsProcessed: number; valuesUpserted: number } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const selected = e.target.files?.[0];
    if (!selected) return;
    setFile(selected);
    setResult(null);
    setError(null);

    // Preview first 5 rows
    const reader = new FileReader();
    reader.onload = (ev) => {
      const text = ev.target?.result as string;
      const lines = text.split(/\r?\n/).filter((l) => l.trim());
      const rows = lines.slice(0, 6).map((l) => l.split(','));
      setPreview(rows);
    };
    reader.readAsText(selected);
  }

  async function handleUpload() {
    if (!file) return;
    setUploading(true);
    setError(null);

    try {
      const formData = new FormData();
      formData.append('file', file);

      const res = await fetch(`/api/forecasts/${forecastId}/import`, {
        method: 'POST',
        body: formData,
      });

      const data = await res.json();
      if (!res.ok) {
        setError(data.message ?? 'Import failed');
      } else {
        setResult(data);
        setFile(null);
        setPreview(null);
      }
    } catch {
      setError('An unexpected error occurred');
    } finally {
      setUploading(false);
    }
  }

  return (
    <div className="max-w-3xl mx-auto p-8 space-y-6">
      <div className="flex items-center gap-3">
        <Button asChild variant="ghost" size="sm">
          <Link href={`/forecasts/${forecastId}`}><ArrowLeft className="h-4 w-4 mr-1" /> Back to Editor</Link>
        </Button>
        <h1 className="text-2xl font-bold">Import CSV</h1>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>CSV Format</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground mb-2">
            Upload a CSV with the following columns:
          </p>
          <pre className="text-xs bg-muted rounded p-3 overflow-x-auto">
{`stream,item,category,2026-01,2026-02,2026-03,...
Revenue,SaaS Subscriptions,Software Sales,50000,52000,54000,...
Expenses,Payroll,HR,80000,80000,80000,...`}
          </pre>
          <ul className="text-xs text-muted-foreground mt-3 space-y-1 list-disc list-inside">
            <li><code>stream</code> — Stream name (created if not exists)</li>
            <li><code>item</code> — Line item name (created if not exists)</li>
            <li><code>category</code> — Optional category mapping</li>
            <li><code>YYYY-MM</code> columns — Monthly amounts</li>
          </ul>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle>Upload File</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <div
            className="border-2 border-dashed rounded-lg p-8 text-center cursor-pointer hover:bg-accent/20 transition-colors"
            onClick={() => inputRef.current?.click()}
          >
            <Upload className="h-10 w-10 mx-auto text-muted-foreground mb-2" />
            <p className="text-sm font-medium">{file ? file.name : 'Click to select a CSV file'}</p>
            <p className="text-xs text-muted-foreground mt-1">or drag and drop</p>
            <input
              ref={inputRef}
              type="file"
              accept=".csv,text/csv"
              className="hidden"
              onChange={handleFileChange}
            />
          </div>

          {preview && (
            <div>
              <p className="text-xs font-medium text-muted-foreground mb-2">Preview (first 5 rows):</p>
              <div className="overflow-x-auto border rounded">
                <table className="min-w-full text-xs">
                  <tbody>
                    {preview.map((row, i) => (
                      <tr key={i} className={i === 0 ? 'bg-muted/50 font-medium' : 'border-t'}>
                        {row.map((cell, j) => (
                          <td key={j} className="px-2 py-1 whitespace-nowrap">{cell}</td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {error && (
            <div className="text-sm text-destructive bg-destructive/10 rounded p-3">{error}</div>
          )}

          {result && (
            <div className="flex items-center gap-3 text-sm text-green-700 bg-green-50 rounded p-3">
              <CheckCircle2 className="h-5 w-5" />
              <span>Import complete: {result.rowsProcessed} rows, {result.valuesUpserted} values upserted</span>
            </div>
          )}

          <Button onClick={handleUpload} disabled={!file || uploading} className="w-full">
            {uploading ? 'Importing…' : 'Import CSV'}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}

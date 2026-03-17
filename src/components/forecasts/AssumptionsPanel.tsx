'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Plus, Trash2, Settings2 } from 'lucide-react';

interface Variable {
  key: string;
  value: string;
  description?: string;
}

interface GrowthRule {
  scopeType: 'global' | 'stream' | 'item';
  scopeId?: number | null;
  year: number;
  growthRate: string;
}

interface SeasonalityWeight {
  scopeType: 'global' | 'item';
  scopeId?: number | null;
  month: number;
  weight: string;
}

interface ScopeOption {
  id: number;
  name: string;
}

interface AssumptionsPanelProps {
  forecastId: number;
  streams: ScopeOption[];
  items: ScopeOption[];
  variables: Variable[];
  growthRules: GrowthRule[];
  seasonalityWeights: SeasonalityWeight[];
  onSave: (data: { variables: Variable[]; growthRules: GrowthRule[]; seasonalityWeights: SeasonalityWeight[] }) => Promise<void>;
  onApply: () => Promise<void>;
}

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

export function AssumptionsPanel({
  forecastId,
  streams,
  items,
  variables: initialVars,
  growthRules: initialRules,
  seasonalityWeights: initialWeights,
  onSave,
  onApply,
}: AssumptionsPanelProps) {
  const [variables, setVariables] = useState<Variable[]>(initialVars);
  const [growthRules, setGrowthRules] = useState<GrowthRule[]>(initialRules);
  const [weights, setWeights] = useState<SeasonalityWeight[]>(initialWeights);
  const [saving, setSaving] = useState(false);
  const [applying, setApplying] = useState(false);
  const [open, setOpen] = useState(false);

  async function handleSave() {
    setSaving(true);
    try {
      await onSave({ variables, growthRules, seasonalityWeights: weights });
    } finally {
      setSaving(false);
    }
  }

  async function handleApply() {
    setApplying(true);
    try {
      await onApply();
    } finally {
      setApplying(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          <Settings2 className="h-4 w-4 mr-2" /> Assumptions
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Forecast Assumptions</DialogTitle>
        </DialogHeader>

        <Tabs defaultValue="growth" className="mt-2">
          <TabsList className="w-full">
            <TabsTrigger value="growth" className="flex-1">Growth Rates</TabsTrigger>
            <TabsTrigger value="seasonality" className="flex-1">Seasonality</TabsTrigger>
            <TabsTrigger value="variables" className="flex-1">Variables</TabsTrigger>
          </TabsList>

          {/* Growth Rules */}
          <TabsContent value="growth" className="space-y-3 mt-3">
            <p className="text-xs text-muted-foreground">
              Define year-over-year growth rates. Global rules apply to all items unless overridden.
            </p>
            {growthRules.map((rule, i) => (
              <div key={i} className="flex gap-2 items-end flex-wrap">
                <div className="w-24">
                  <Label className="text-xs">Scope</Label>
                  <select
                    className="w-full border rounded px-2 py-1.5 text-sm"
                    value={rule.scopeType}
                    onChange={(e) => {
                      const next = [...growthRules];
                      next[i] = { ...next[i], scopeType: e.target.value as GrowthRule['scopeType'], scopeId: null };
                      setGrowthRules(next);
                    }}
                  >
                    <option value="global">Global</option>
                    <option value="stream">Stream</option>
                    <option value="item">Item</option>
                  </select>
                </div>
                {rule.scopeType !== 'global' && (
                  <div className="flex-1 min-w-[140px]">
                    <Label className="text-xs">{rule.scopeType === 'stream' ? 'Stream' : 'Item'}</Label>
                    <select
                      className="w-full border rounded px-2 py-1.5 text-sm"
                      value={rule.scopeId ?? ''}
                      onChange={(e) => {
                        const next = [...growthRules];
                        next[i] = { ...next[i], scopeId: e.target.value ? parseInt(e.target.value) : null };
                        setGrowthRules(next);
                      }}
                    >
                      <option value="">— select —</option>
                      {(rule.scopeType === 'stream' ? streams : items).map((opt) => (
                        <option key={opt.id} value={opt.id}>{opt.name}</option>
                      ))}
                    </select>
                  </div>
                )}
                <div className="w-20">
                  <Label className="text-xs">Year</Label>
                  <Input
                    type="number"
                    value={rule.year}
                    onChange={(e) => {
                      const next = [...growthRules];
                      next[i] = { ...next[i], year: parseInt(e.target.value) };
                      setGrowthRules(next);
                    }}
                  />
                </div>
                <div className="w-28">
                  <Label className="text-xs">Growth Rate</Label>
                  <Input
                    placeholder="0.20"
                    value={rule.growthRate}
                    onChange={(e) => {
                      const next = [...growthRules];
                      next[i] = { ...next[i], growthRate: e.target.value };
                      setGrowthRules(next);
                    }}
                  />
                </div>
                <Button
                  size="icon"
                  variant="ghost"
                  className="text-destructive"
                  onClick={() => setGrowthRules(growthRules.filter((_, j) => j !== i))}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            ))}
            <Button
              variant="outline"
              size="sm"
              onClick={() => setGrowthRules([...growthRules, { scopeType: 'global', year: new Date().getFullYear() + 1, growthRate: '0.10' }])}
            >
              <Plus className="h-4 w-4 mr-1" /> Add Rule
            </Button>
          </TabsContent>

          {/* Seasonality */}
          <TabsContent value="seasonality" className="space-y-3 mt-3">
            <p className="text-xs text-muted-foreground">
              Monthly weights (global) — must sum to 1.0. Leave empty for equal distribution.
            </p>
            <div className="grid grid-cols-3 gap-2">
              {MONTHS.map((month, idx) => {
                const existing = weights.find((w) => w.scopeType === 'global' && w.month === idx + 1);
                return (
                  <div key={idx}>
                    <Label className="text-xs">{month}</Label>
                    <Input
                      type="number"
                      step="0.0001"
                      placeholder="0.0833"
                      value={existing?.weight ?? ''}
                      onChange={(e) => {
                        const val = e.target.value;
                        setWeights((prev) => {
                          const filtered = prev.filter((w) => !(w.scopeType === 'global' && w.month === idx + 1));
                          if (val) filtered.push({ scopeType: 'global', month: idx + 1, weight: val });
                          return filtered;
                        });
                      }}
                    />
                  </div>
                );
              })}
            </div>
          </TabsContent>

          {/* Variables */}
          <TabsContent value="variables" className="space-y-3 mt-3">
            <p className="text-xs text-muted-foreground">
              Named constants for use in descriptions and planning notes.
            </p>
            {variables.map((v, i) => (
              <div key={i} className="flex gap-2 items-end">
                <div className="flex-1">
                  <Label className="text-xs">Key</Label>
                  <Input
                    value={v.key}
                    onChange={(e) => {
                      const next = [...variables];
                      next[i] = { ...next[i], key: e.target.value };
                      setVariables(next);
                    }}
                  />
                </div>
                <div className="flex-1">
                  <Label className="text-xs">Value</Label>
                  <Input
                    value={v.value}
                    onChange={(e) => {
                      const next = [...variables];
                      next[i] = { ...next[i], value: e.target.value };
                      setVariables(next);
                    }}
                  />
                </div>
                <Button
                  size="icon"
                  variant="ghost"
                  className="text-destructive"
                  onClick={() => setVariables(variables.filter((_, j) => j !== i))}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            ))}
            <Button
              variant="outline"
              size="sm"
              onClick={() => setVariables([...variables, { key: '', value: '' }])}
            >
              <Plus className="h-4 w-4 mr-1" /> Add Variable
            </Button>
          </TabsContent>
        </Tabs>

        <div className="flex gap-2 mt-4">
          <Button onClick={handleSave} disabled={saving} className="flex-1">
            {saving ? 'Saving…' : 'Save Assumptions'}
          </Button>
          <Button onClick={handleApply} disabled={applying} variant="outline" className="flex-1">
            {applying ? 'Applying…' : 'Apply Assumptions'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

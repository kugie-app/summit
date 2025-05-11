'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogClose,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { PlusIcon, Trash2Icon, Loader2, ClipboardCopyIcon, EyeIcon, EyeOffIcon } from 'lucide-react';
import { toast } from 'sonner';
import { format } from 'date-fns';

interface ApiToken {
  id: number;
  name: string;
  tokenPrefix: string;
  createdAt: string;
  lastUsedAt: string | null;
  expiresAt: string | null;
}

interface NewApiToken extends ApiToken {
  fullToken: string;
}

export default function ApiTokenSettings() {
  const [tokens, setTokens] = useState<ApiToken[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isGenerating, setIsGenerating] = useState(false);
  const [newTokenName, setNewTokenName] = useState('');
  const [generatedToken, setGeneratedToken] = useState<NewApiToken | null>(null);
  const [showToken, setShowToken] = useState(false);
  const [showGenerateDialog, setShowGenerateDialog] = useState(false);
  const [tokenToRevoke, setTokenToRevoke] = useState<ApiToken | null>(null);

  const fetchTokens = async () => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/api-tokens');
      if (!response.ok) throw new Error('Failed to fetch API tokens');
      const data = await response.json();
      setTokens(data);
    } catch (error) {
      console.error(error);
      toast.error('Failed to load API tokens.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchTokens();
  }, []);

  const handleGenerateToken = async () => {
    if (!newTokenName.trim()) {
      toast.error('Please provide a name for the token.');
      return;
    }
    setIsGenerating(true);
    try {
      const response = await fetch('/api/api-tokens', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: newTokenName }),
      });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to generate token');
      }
      const data = await response.json();
      setGeneratedToken(data);
      setShowGenerateDialog(false); // Close generation dialog
      setNewTokenName(''); // Reset name input
      fetchTokens(); // Refresh the list
      toast.success('API Token generated successfully!');
    } catch (error) {
      console.error(error);
      toast.error(error instanceof Error ? error.message : 'Failed to generate token.');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleRevokeToken = async () => {
    if (!tokenToRevoke) return;
    try {
      const response = await fetch(`/api/api-tokens/${tokenToRevoke.id}`, {
        method: 'DELETE',
      });
      if (!response.ok) {
         const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to revoke token');
      }
      fetchTokens();
      toast.success(`Token "${tokenToRevoke.name}" revoked successfully.`);
    } catch (error) {
      console.error(error);
      toast.error(error instanceof Error ? error.message : 'Failed to revoke token.');
    } finally {
      setTokenToRevoke(null);
    }
  };
  
  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success('Token copied to clipboard!');
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>API Tokens</CardTitle>
        <CardDescription>
          Manage API tokens to access your account programmatically.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Dialog open={showGenerateDialog} onOpenChange={setShowGenerateDialog}>
          <DialogTrigger asChild>
            <Button onClick={() => { setNewTokenName(''); setGeneratedToken(null); setShowGenerateDialog(true); }}>
              <PlusIcon className="mr-2 h-4 w-4" /> Generate New Token
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Generate New API Token</DialogTitle>
              <DialogDescription>
                Give your token a descriptive name.
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="tokenName" className="text-right">Name</Label>
                <Input
                  id="tokenName"
                  value={newTokenName}
                  onChange={(e) => setNewTokenName(e.target.value)}
                  className="col-span-3"
                  placeholder="e.g., My Integration"
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowGenerateDialog(false)}>Cancel</Button>
              <Button onClick={handleGenerateToken} disabled={isGenerating}>
                {isGenerating ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                Generate Token
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {generatedToken && (
          <Dialog open={!!generatedToken} onOpenChange={() => setGeneratedToken(null)}>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>New API Token Generated</DialogTitle>
                <DialogDescription className="text-destructive">
                  Please copy your new API token. You won&apos;t be able to see it again!
                </DialogDescription>
              </DialogHeader>
              <div className="my-4 p-3 bg-muted rounded-md">
                <div className="flex items-center justify-between">
                    <pre className="text-sm overflow-x-auto">
                        {showToken ? generatedToken.fullToken : `${generatedToken.tokenPrefix}_${'*'.repeat(10)}`}
                    </pre>
                    <div className="flex items-center">
                        <Button variant="ghost" size="icon" onClick={() => setShowToken(!showToken)}>
                            {showToken ? <EyeOffIcon className="h-4 w-4" /> : <EyeIcon className="h-4 w-4" />}
                        </Button>
                        <Button variant="ghost" size="icon" onClick={() => copyToClipboard(generatedToken.fullToken)}>
                            <ClipboardCopyIcon className="h-4 w-4" />
                        </Button>
                    </div>
                </div>
              </div>
              <DialogFooter>
                <Button onClick={() => setGeneratedToken(null)}>Close</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        )}
        
        {isLoading ? (
           <div className="flex justify-center items-center py-8">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
           </div>
        ) : tokens.length === 0 ? (
          <p className="mt-4 text-muted-foreground text-center">No API tokens generated yet.</p>
        ) : (
          <Table className="mt-6">
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Prefix</TableHead>
                <TableHead>Created At</TableHead>
                <TableHead>Last Used</TableHead>
                <TableHead>Expires At</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {tokens.map((token) => (
                <TableRow key={token.id}>
                  <TableCell>{token.name}</TableCell>
                  <TableCell>{token.tokenPrefix}...</TableCell>
                  <TableCell>{format(new Date(token.createdAt), 'MMM dd, yyyy')}</TableCell>
                  <TableCell>{token.lastUsedAt ? format(new Date(token.lastUsedAt), 'MMM dd, yyyy, p') : 'Never'}</TableCell>
                  <TableCell>{token.expiresAt ? format(new Date(token.expiresAt), 'MMM dd, yyyy') : 'Never'}</TableCell>
                  <TableCell className="text-right">
                    <Button variant="destructive" size="sm" onClick={() => setTokenToRevoke(token)}>
                      <Trash2Icon className="h-4 w-4 mr-1" /> Revoke
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}

        {tokenToRevoke && (
          <Dialog open={!!tokenToRevoke} onOpenChange={() => setTokenToRevoke(null)}>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Revoke API Token</DialogTitle>
                <DialogDescription>
                  Are you sure you want to revoke the token &quot;{tokenToRevoke.name}&quot;? This action cannot be undone.
                </DialogDescription>
              </DialogHeader>
              <DialogFooter>
                <Button variant="outline" onClick={() => setTokenToRevoke(null)}>Cancel</Button>
                <Button variant="destructive" onClick={handleRevokeToken}>Revoke Token</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        )}
      </CardContent>
    </Card>
  );
} 
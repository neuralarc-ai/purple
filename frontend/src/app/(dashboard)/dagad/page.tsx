'use client';

import { useEffect, useState } from 'react';
import { PageHeader } from '@/components/ui/page-header';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { createClient } from '@/lib/supabase/client';
import { Notebook } from 'lucide-react';

type Entry = {
  entry_id: string;
  title: string;
  description?: string;
  content: string;
  category: 'instructions' | 'preferences' | 'rules' | 'notes' | 'general';
  priority: 1 | 2 | 3;
  is_active: boolean;
  is_global: boolean;
  auto_inject: boolean;
  trigger_keywords?: string[];
  trigger_patterns?: string[];
  created_at: string;
  updated_at: string;
};

const API_BASE = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:8000/api';

export default function DAGADPage() {
  const [entries, setEntries] = useState<Entry[]>([]);
  const [loading, setLoading] = useState(true);
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [category, setCategory] = useState<'instructions' | 'preferences' | 'rules' | 'notes' | 'general'>('general');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const fetchEntries = async () => {
    try {
      const supabase = createClient();
      const { data: { session } } = await supabase.auth.getSession();
      const token = session?.access_token;

      const res = await fetch(`${API_BASE}/dagad`, {
        headers: token ? { 'Authorization': `Bearer ${token}` } : undefined,
        credentials: 'include',
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        const detail = data?.detail || res.statusText || 'Unknown error';
        setErrorMsg(`Failed to load entries: ${res.status} ${detail}`);
        setEntries([]);
        return;
      }
      const data = await res.json();
      setEntries(data.entries || []);
      setErrorMsg(null);
    } catch (e) {
      console.error('Failed to load DAGAD entries', e);
      setErrorMsg('Failed to load entries. Check API URL and auth.');
    } finally {
      setLoading(false);
    }
  };

  const createEntry = async () => {
    if (!title.trim() || !content.trim()) return;
    try {
      const supabase = createClient();
      const { data: { session } } = await supabase.auth.getSession();
      const token = session?.access_token;

      const res = await fetch(`${API_BASE}/dagad`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
        },
        credentials: 'include',
        body: JSON.stringify({ title, content, category, priority: 1, is_global: false, auto_inject: true }),
      });
      if (res.ok) {
        setTitle('');
        setContent('');
        await fetchEntries();
        setErrorMsg(null);
      } else {
        const data = await res.json().catch(() => ({}));
        const detail = data?.detail || res.statusText || 'Unknown error';
        setErrorMsg(`Failed to create entry: ${res.status} ${detail}`);
      }
    } catch (e) {
      console.error('Failed to create DAGAD entry', e);
      setErrorMsg('Failed to create entry. Check API URL and auth.');
    }
  };

  useEffect(() => {
    fetchEntries();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="container mx-auto max-w-7xl px-4 py-8 space-y-8">
      <PageHeader icon={Notebook}>
        <span className="text-primary">DAGAD – Personal Instructions</span>
      </PageHeader>

      <Card>
        <CardHeader>
          <CardTitle>Create a quick entry</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {errorMsg && (
            <div className="text-sm text-red-500 border border-red-500/30 rounded-md p-2 bg-red-500/5">
              {errorMsg}
            </div>
          )}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <Input placeholder="Title" value={title} onChange={(e) => setTitle(e.target.value)} />
            <select
              className="h-10 rounded-md border border-input bg-background px-3 text-sm"
              value={category}
              onChange={(e) => setCategory(e.target.value as any)}
            >
              <option value="instructions">Instructions</option>
              <option value="preferences">Preferences</option>
              <option value="rules">Rules</option>
              <option value="notes">Notes</option>
              <option value="general">General</option>
            </select>
          </div>
          <Textarea rows={4} placeholder="Content" value={content} onChange={(e) => setContent(e.target.value)} />
          <Button onClick={createEntry}>Add Entry</Button>
        </CardContent>
      </Card>

      <div className="space-y-4">
        {loading ? (
          <div>Loading...</div>
        ) : entries.length === 0 ? (
          <div>No entries yet.</div>
        ) : (
          entries.map((e) => (
            <Card key={e.entry_id}>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  {e.title}
                  <Badge variant="secondary">{e.category}</Badge>
                  {e.auto_inject && <Badge variant="destructive">Auto</Badge>}
                </CardTitle>
              </CardHeader>
              <CardContent>
                {e.description && <div className="text-sm text-muted-foreground mb-2">{e.description}</div>}
                <div className="text-sm whitespace-pre-wrap">{e.content}</div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}



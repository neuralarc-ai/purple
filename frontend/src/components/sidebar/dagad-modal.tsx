'use client';

import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Switch } from '@/components/ui/switch';
import { createClient } from '@/lib/supabase/client';
import { Notebook, Eye, Trash2, Loader2, Pencil, Upload, X, Image as ImageIcon } from 'lucide-react';
import { toast } from 'sonner';

type Entry = {
  entry_id: string;
  title: string;
  description?: string;
  content?: string;
  image_url?: string;
  image_alt_text?: string;
  image_metadata?: Record<string, any>;
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

interface DagadModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function DagadModal({ open, onOpenChange }: DagadModalProps) {
  const [entries, setEntries] = useState<Entry[]>([]);
  const [loading, setLoading] = useState(true);
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [category, setCategory] = useState<'instructions' | 'preferences' | 'rules' | 'notes' | 'general'>('general');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [selectedEntry, setSelectedEntry] = useState<Entry | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [confirmEntry, setConfirmEntry] = useState<Entry | null>(null);
  const [editEntry, setEditEntry] = useState<Entry | null>(null);
  const [editTitle, setEditTitle] = useState('');
  const [editContent, setEditContent] = useState('');
  const [editCategory, setEditCategory] = useState<'instructions' | 'preferences' | 'rules' | 'notes' | 'general'>('general');
  const [savingEdit, setSavingEdit] = useState(false);
  const [editIsActive, setEditIsActive] = useState<boolean>(true);
  
  // Image handling state
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [editSelectedImage, setEditSelectedImage] = useState<File | null>(null);
  const [editImagePreview, setEditImagePreview] = useState<string | null>(null);
  const [editUploadingImage, setEditUploadingImage] = useState(false);

  const fetchEntries = async () => {
    try {
      const supabase = createClient();
      const { data: { session } } = await supabase.auth.getSession();
      const token = session?.access_token;

      const res = await fetch(`${API_BASE}/dagad?include_inactive=true`, {
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

  const uploadImage = async (file: File, isEdit: boolean = false): Promise<string | null> => {
    try {
      if (isEdit) {
        setEditUploadingImage(true);
      } else {
        setUploadingImage(true);
      }
      
      const supabase = createClient();
      const { data: { session } } = await supabase.auth.getSession();
      const token = session?.access_token;

      // Convert file to base64
      const base64 = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => {
          const result = reader.result as string;
          // Remove data URL prefix
          const base64Data = result.split(',')[1];
          resolve(base64Data);
        };
        reader.onerror = reject;
        reader.readAsDataURL(file);
      });

      const res = await fetch(`${API_BASE}/dagad/upload-image`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
        },
        credentials: 'include',
        body: JSON.stringify({ 
          base64_data: base64,
          alt_text: file.name,
          metadata: { 
            original_name: file.name,
            size: file.size,
            type: file.type 
          }
        }),
      });

      if (res.ok) {
        const data = await res.json();
        return data.image_url;
      } else {
        const data = await res.json().catch(() => ({}));
        const detail = data?.detail || res.statusText || 'Unknown error';
        throw new Error(`Failed to upload image: ${res.status} ${detail}`);
      }
    } catch (e) {
      console.error('Failed to upload image', e);
      throw e;
    } finally {
      if (isEdit) {
        setEditUploadingImage(false);
      } else {
        setUploadingImage(false);
      }
    }
  };

  const createEntry = async () => {
    if (!title.trim() || (!content.trim() && !selectedImage)) return;
    
    try {
      const supabase = createClient();
      const { data: { session } } = await supabase.auth.getSession();
      const token = session?.access_token;

      let imageUrl: string | null = null;
      if (selectedImage) {
        imageUrl = await uploadImage(selectedImage);
      }

      const res = await fetch(`${API_BASE}/dagad`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
        },
        credentials: 'include',
        body: JSON.stringify({ 
          title, 
          content: content.trim() || null, 
          image_url: imageUrl,
          image_alt_text: selectedImage?.name,
          category, 
          priority: 1, 
          is_global: false, 
          auto_inject: true 
        }),
      });
      
      if (res.ok) {
        setTitle('');
        setContent('');
        setSelectedImage(null);
        setImagePreview(null);
        await fetchEntries();
        setErrorMsg(null);
        toast.success('Entry created successfully');
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

  const deleteEntry = async (entryId: string) => {
    try {
      setDeletingId(entryId);
      const supabase = createClient();
      const { data: { session } } = await supabase.auth.getSession();
      const token = session?.access_token;
      const res = await fetch(`${API_BASE}/dagad/${entryId}`, {
        method: 'DELETE',
        headers: token ? { 'Authorization': `Bearer ${token}` } : undefined,
        credentials: 'include',
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        const detail = data?.detail || res.statusText || 'Unknown error';
        throw new Error(`Failed to delete entry: ${res.status} ${detail}`);
      }
      setEntries((prev) => prev.filter((x) => x.entry_id !== entryId));
      if (selectedEntry?.entry_id === entryId) setSelectedEntry(null);
      toast.success('Entry deleted');
    } catch (err: any) {
      console.error(err);
      toast.error(err?.message || 'Failed to delete entry');
    } finally {
      setDeletingId(null);
    }
  };

  const handleImageSelect = (file: File) => {
    setSelectedImage(file);
    const reader = new FileReader();
    reader.onload = (e) => {
      setImagePreview(e.target?.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleEditImageSelect = (file: File) => {
    setEditSelectedImage(file);
    const reader = new FileReader();
    reader.onload = (e) => {
      setEditImagePreview(e.target?.result as string);
    };
    reader.readAsDataURL(file);
  };

  const openEdit = (entry: Entry) => {
    setEditEntry(entry);
    setEditTitle(entry.title);
    setEditContent(entry.content || '');
    setEditCategory(entry.category);
    setEditIsActive(entry.is_active);
    setEditImagePreview(entry.image_url || null);
    setEditSelectedImage(null);
  };

  const saveEdit = async () => {
    if (!editEntry) return;
    try {
      setSavingEdit(true);
      const supabase = createClient();
      const { data: { session } } = await supabase.auth.getSession();
      const token = session?.access_token;

      let imageUrl: string | null = editEntry.image_url || null;
      if (editSelectedImage) {
        imageUrl = await uploadImage(editSelectedImage, true);
      }

      const res = await fetch(`${API_BASE}/dagad/${editEntry.entry_id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
        },
        credentials: 'include',
        body: JSON.stringify({
          title: editTitle,
          content: editContent.trim() || null,
          image_url: imageUrl,
          image_alt_text: editSelectedImage?.name || editEntry.image_alt_text,
          category: editCategory,
          is_active: editIsActive,
        }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        const detail = data?.detail || res.statusText || 'Unknown error';
        throw new Error(`Failed to update entry: ${res.status} ${detail}`);
      }
      const updated = await res.json();
      setEntries((prev) => prev.map((x) => (x.entry_id === updated.entry_id ? { ...x, ...updated } : x)));
      toast.success('Entry updated');
      setEditEntry(null);
    } catch (e: any) {
      console.error(e);
      toast.error(e?.message || 'Failed to update entry');
    } finally {
      setSavingEdit(false);
    }
  };

  const toggleActive = async (entry: Entry, next: boolean) => {
    try {
      const supabase = createClient();
      const { data: { session } } = await supabase.auth.getSession();
      const token = session?.access_token;
      const res = await fetch(`${API_BASE}/dagad/${entry.entry_id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
        },
        credentials: 'include',
        body: JSON.stringify({ is_active: next }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        const detail = data?.detail || res.statusText || 'Unknown error';
        throw new Error(`Failed to update active state: ${res.status} ${detail}`);
      }
      const updated = await res.json();
      setEntries((prev) => prev.map((x) => (x.entry_id === entry.entry_id ? { ...x, ...updated } : x)));
      toast.success(`Entry ${next ? 'activated' : 'deactivated'}`);
    } catch (e: any) {
      console.error(e);
      toast.error(e?.message || 'Failed to update active state');
    }
  };

  useEffect(() => {
    if (open) {
      fetchEntries();
    }
  }, [open]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Notebook className="h-5 w-5 text-primary" />
            <span className="text-primary">DAGAD – Personal Instructions</span>
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-6">
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
              
              {/* Image Upload Section */}
              <div className="space-y-2">
                <label className="text-sm font-medium">Image (optional)</label>
                {!imagePreview ? (
                  <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 text-center">
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) handleImageSelect(file);
                      }}
                      className="hidden"
                      id="image-upload"
                    />
                    <label htmlFor="image-upload" className="cursor-pointer">
                      <Upload className="h-8 w-8 mx-auto text-gray-400 mb-2" />
                      <p className="text-sm text-gray-600">Click to upload an image</p>
                      <p className="text-xs text-gray-400">PNG, JPG, GIF up to 10MB</p>
                    </label>
                  </div>
                ) : (
                  <div className="relative">
                    <img src={imagePreview} alt="Preview" className="w-full h-32 object-cover rounded-lg" />
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedImage(null);
                        setImagePreview(null);
                      }}
                      className="absolute top-2 right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                )}
              </div>
              
              <Button onClick={createEntry} disabled={uploadingImage}>
                {uploadingImage ? (
                  <span className="inline-flex items-center gap-2">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Uploading...
                  </span>
                ) : (
                  'Add Entry'
                )}
              </Button>
            </CardContent>
          </Card>

           <div className="h-[300px] overflow-y-auto space-y-2 pr-2">
             {loading ? (
               <div className="flex items-center justify-center h-full">
                 <div className="text-muted-foreground">Loading...</div>
               </div>
             ) : entries.length === 0 ? (
               <div className="flex items-center justify-center h-full">
                 <div className="text-muted-foreground">No entries yet.</div>
               </div>
             ) : (
               entries.map((e) => (
                 <Card 
                   key={e.entry_id} 
                   className="cursor-pointer hover:bg-accent/50 transition-colors"
                   onClick={() => setSelectedEntry(e)}
                 >
                   <CardContent className="p-4">
                     <div className="flex items-center justify-between gap-3">
                       <div className="flex flex-col gap-1 min-w-0">
                         <div className="flex items-center gap-2 min-w-0">
                           <h3 className="font-medium text-sm truncate">{e.title}</h3>
                           <Badge variant="secondary" className="text-xs">{e.category}</Badge>
                           {e.auto_inject && <Badge variant="destructive" className="text-xs">Auto</Badge>}
                           {e.image_url && <ImageIcon className="h-4 w-4 text-blue-500" />}
                         </div>
                         <div className="text-xs text-muted-foreground">
                           {new Date(e.created_at).toLocaleString()}
                         </div>
                       </div>
                       <div className="flex items-center gap-3 flex-shrink-0" onClick={(ev) => ev.stopPropagation()}>
                         <div className="flex items-center gap-2">
                           <span className="text-xs text-muted-foreground">{e.is_active ? 'Active' : 'Inactive'}</span>
                           <Switch checked={e.is_active} onCheckedChange={(checked) => toggleActive(e, !!checked)} />
                         </div>
                         <button
                           type="button"
                           className="h-7 w-7 inline-flex items-center justify-center rounded-md hover:bg-muted text-muted-foreground"
                           title="View"
                           onClick={() => setSelectedEntry(e)}
                         >
                           <Eye className="h-4 w-4" />
                         </button>
                         <button
                           type="button"
                           className="h-7 w-7 inline-flex items-center justify-center rounded-md hover:bg-muted text-muted-foreground"
                           title="Edit"
                           onClick={() => openEdit(e)}
                         >
                           {/* pencil icon via Eye rotated fallback if Pencil not imported */}
                           <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 20h9"/><path d="M16.5 3.5a2.121 2.121 0 1 1 3 3L7 19l-4 1 1-4 12.5-12.5z"/></svg>
                         </button>
                         <button
                           type="button"
                           className="h-7 w-7 inline-flex items-center justify-center rounded-md hover:bg-destructive/10 text-destructive"
                           title="Delete"
                           onClick={() => setConfirmEntry(e)}
                           disabled={deletingId === e.entry_id}
                         >
                           {deletingId === e.entry_id ? (
                             <Loader2 className="h-4 w-4 animate-spin" />
                           ) : (
                             <Trash2 className="h-4 w-4" />
                           )}
                         </button>
                       </div>
                     </div>
                   </CardContent>
                 </Card>
               ))
             )}
           </div>
        </div>
      </DialogContent>
      
      {/* Entry Detail Popup */}
      <Dialog open={!!selectedEntry} onOpenChange={() => setSelectedEntry(null)}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Notebook className="h-5 w-5 text-primary" />
              {selectedEntry?.title}
            </DialogTitle>
          </DialogHeader>
          
          {selectedEntry && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Badge variant="secondary">{selectedEntry.category}</Badge>
                  {selectedEntry.auto_inject && <Badge variant="destructive">Auto</Badge>}
                </div>
                <div className="text-xs text-muted-foreground">
                  Created: {new Date(selectedEntry.created_at).toLocaleString()}
                </div>
              </div>
              
              {selectedEntry.description && (
                <div className="p-3 bg-muted/50 rounded-md">
                  <h4 className="font-medium text-sm mb-2">Description</h4>
                  <p className="text-sm text-muted-foreground">{selectedEntry.description}</p>
                </div>
              )}
              
              {selectedEntry.image_url && (
                <div className="p-4 bg-background/50 rounded-md border">
                  <h4 className="font-medium text-sm mb-3">Image</h4>
                  <img 
                    src={selectedEntry.image_url} 
                    alt={selectedEntry.image_alt_text || selectedEntry.title}
                    className="w-full max-w-md rounded-lg"
                  />
                </div>
              )}
              
              {selectedEntry.content && (
                <div className="p-4 bg-background/50 rounded-md border">
                  <h4 className="font-medium text-sm mb-3">Content</h4>
                  <div className="text-sm whitespace-pre-wrap leading-relaxed">
                    {selectedEntry.content}
                  </div>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <Dialog open={!!confirmEntry} onOpenChange={() => setConfirmEntry(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Delete entry?</DialogTitle>
          </DialogHeader>
          <div className="text-sm text-muted-foreground">
            This action cannot be undone. The entry
            {confirmEntry ? ` "${confirmEntry.title}"` : ''} will be permanently deleted.
          </div>
          <div className="flex justify-end gap-2 pt-4">
            <Button variant="outline" onClick={() => setConfirmEntry(null)} disabled={!!deletingId}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={async () => {
                if (!confirmEntry) return;
                await deleteEntry(confirmEntry.entry_id);
                setConfirmEntry(null);
              }}
              disabled={!!deletingId}
            >
              {deletingId ? (
                <span className="inline-flex items-center gap-2"><Loader2 className="h-4 w-4 animate-spin" /> Deleting</span>
              ) : (
                'Delete'
              )}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Edit Entry Dialog */}
      <Dialog open={!!editEntry} onOpenChange={() => setEditEntry(null)}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Edit entry</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <Input placeholder="Title" value={editTitle} onChange={(e) => setEditTitle(e.target.value)} />
            <select
              className="h-10 rounded-md border border-input bg-background px-3 text-sm"
              value={editCategory}
              onChange={(e) => setEditCategory(e.target.value as any)}
            >
              <option value="instructions">Instructions</option>
              <option value="preferences">Preferences</option>
              <option value="rules">Rules</option>
              <option value="notes">Notes</option>
              <option value="general">General</option>
            </select>
            <Textarea rows={6} placeholder="Content" value={editContent} onChange={(e) => setEditContent(e.target.value)} />
            
            {/* Image Upload Section for Edit */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Image (optional)</label>
              {!editImagePreview ? (
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 text-center">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) handleEditImageSelect(file);
                    }}
                    className="hidden"
                    id="edit-image-upload"
                  />
                  <label htmlFor="edit-image-upload" className="cursor-pointer">
                    <Upload className="h-6 w-6 mx-auto text-gray-400 mb-1" />
                    <p className="text-xs text-gray-600">Click to upload an image</p>
                  </label>
                </div>
              ) : (
                <div className="relative">
                  <img src={editImagePreview} alt="Preview" className="w-full h-24 object-cover rounded-lg" />
                  <button
                    type="button"
                    onClick={() => {
                      setEditSelectedImage(null);
                      setEditImagePreview(editEntry?.image_url || null);
                    }}
                    className="absolute top-1 right-1 bg-red-500 text-white rounded-full p-1 hover:bg-red-600"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </div>
              )}
            </div>
            
            <div className="flex items-center justify-between pt-1">
              <span className="text-sm text-muted-foreground">Active</span>
              <Switch checked={editIsActive} onCheckedChange={(checked) => setEditIsActive(!!checked)} />
            </div>
            <div className="flex justify-end gap-2 pt-1">
              <Button variant="outline" onClick={() => setEditEntry(null)} disabled={savingEdit}>Cancel</Button>
              <Button onClick={saveEdit} disabled={savingEdit || editUploadingImage}>
                {savingEdit || editUploadingImage ? (
                  <span className="inline-flex items-center gap-2">
                    <Loader2 className="h-4 w-4 animate-spin" /> 
                    {editUploadingImage ? 'Uploading...' : 'Saving'}
                  </span>
                ) : (
                  'Save'
                )}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </Dialog>
  );
}

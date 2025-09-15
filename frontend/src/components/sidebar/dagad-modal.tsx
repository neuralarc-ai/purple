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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { createClient } from '@/lib/supabase/client';
import { Notebook, Trash2, Loader2, Pencil, Upload, X, Image as ImageIcon, Info, Plus } from 'lucide-react';
import { toast } from 'sonner';
import { useModeSelection } from '@/components/thread/chat-input/_use-mode-selection';

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
  const { selectedMode } = useModeSelection(); // Get current mode
  const [loading, setLoading] = useState(true);
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [category, setCategory] = useState<'instructions' | 'preferences' | 'rules' | 'notes' | 'general'>('general');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
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
  
  // View state management
  const [showAddForm, setShowAddForm] = useState(false);

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
        resetAddForm();
        await fetchEntries();
        toast.success('Entry created successfully');
        setShowAddForm(false);
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

  const resetAddForm = () => {
    setTitle('');
    setContent('');
    setCategory('general');
    setSelectedImage(null);
    setImagePreview(null);
    setErrorMsg(null);
  };

  const handleCancelAdd = () => {
    resetAddForm();
    setShowAddForm(false);
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
      // Reset form state when dialog opens
      setShowAddForm(false);
      resetAddForm();
    }
  }, [open]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-6xl min-h-[600px] max-h-[85vh] bg-background/95 backdrop-blur border-border/50">
        {/* Header */}
        <DialogHeader className="pb-4">
          <DialogTitle className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-primary/10 border border-primary/20">
              <Notebook className="h-5 w-5 text-primary" />
            </div>
            <span className="text-foreground font-semibold text-lg">Knowledge Base</span>
          </DialogTitle>
          <p className="text-sm text-muted-foreground mt-2">
            Teach Helium your preferences and best practices. It will recall the right knowledge when needed, with support for up to 12 entries.
          </p>
        </DialogHeader>

        <div className="flex flex-col h-full py-4">
          {!showAddForm ? (
            // Table View
            <>
              {/* Add Knowledge Button */}
              <div className="mb-4">
                <Button 
                  onClick={() => setShowAddForm(true)}
                  className="bg-primary hover:bg-primary/90 text-primary-foreground"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Add Knowledge
                </Button>
              </div>

              {/* Table */}
              <div className="flex-1 min-h-0">
                <div className="bg-card/30 backdrop-blur border border-border/30 rounded-lg overflow-hidden">
                  {/* Table Header - Fixed */}
                  <div className="hidden md:grid grid-cols-12 gap-4 p-4 bg-muted/30 border-b border-border/30 text-sm font-medium text-muted-foreground sticky top-0 z-10">
                    <div className="col-span-3">Name</div>
                    <div className="col-span-5">Content</div>
                    <div className="col-span-2">Created at</div>
                    <div className="col-span-1 text-center">Status</div>
                    <div className="col-span-1 text-center">Actions</div>
                  </div>

                  {/* Table Body - Scrollable */}
                  <div className="min-h-[400px] max-h-[400px] overflow-y-auto">
                    {loading ? (
                      <div className="flex items-center justify-center py-12">
                        <div className="flex items-center gap-2 text-muted-foreground">
                          <Loader2 className="h-4 w-4 animate-spin" />
                          Loading entries...
                        </div>
                      </div>
                    ) : entries.length === 0 ? (
                      <div className="flex flex-col items-center justify-center py-16 px-6 text-center">
                        <div className="p-4 rounded-full bg-muted/50 border border-border/30 mb-4">
                          <Notebook className="h-8 w-8 text-muted-foreground" />
                        </div>
                        <h4 className="text-base font-medium text-foreground/90 mb-2">No knowledge entries yet</h4>
                        <p className="text-sm text-muted-foreground max-w-sm mb-4">
                          Create your first knowledge entry to provide context and information for conversations
                        </p>
                        <Button 
                          onClick={() => setShowAddForm(true)}
                          variant="outline"
                          className="border-border/50"
                        >
                          <Notebook className="h-4 w-4 mr-2" />
                          Add Your First Entry
                        </Button>
                      </div>
                    ) : (
                      entries.map((entry) => (
                        <div 
                          key={entry.entry_id} 
                          className="md:grid md:grid-cols-12 gap-4 p-4 border-b border-border/20 hover:bg-muted/20 transition-colors group"
                        >
                          {/* Mobile Layout */}
                          <div className="md:hidden space-y-3">
                            <div className="flex items-start justify-between">
                              <div className="flex-1">
                                <div className="flex items-center gap-2 mb-1">
                                  <span className="font-medium text-sm text-foreground/90">
                                    {entry.title}
                                  </span>
                                  <Badge variant="secondary" className="text-xs bg-muted/70 text-muted-foreground border-border/30">
                                    {entry.category}
                                  </Badge>
                                  {entry.image_url && <ImageIcon className="h-3 w-3 text-primary" />}
                                </div>
                                <p className="text-sm text-muted-foreground mb-2">
                                  {entry.content ? entry.content.substring(0, 60) + (entry.content.length > 60 ? '...' : '') : 'No content'}
                                </p>
                                <span className="text-xs text-muted-foreground">
                                  {new Date(entry.created_at).toLocaleDateString()}
                                </span>
                              </div>
                              <Switch 
                                checked={entry.is_active} 
                                onCheckedChange={(checked) => toggleActive(entry, !!checked)}
                              />
                            </div>
                            <div className="flex justify-end gap-1">
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-8 w-8 p-0"
                                onClick={() => openEdit(entry)}
                                title="Edit entry"
                              >
                                <Pencil className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-8 w-8 p-0 text-destructive hover:bg-destructive/10"
                                onClick={() => setConfirmEntry(entry)}
                                disabled={deletingId === entry.entry_id}
                                title="Delete entry"
                              >
                                {deletingId === entry.entry_id ? (
                                  <Loader2 className="h-4 w-4 animate-spin" />
                                ) : (
                                  <Trash2 className="h-4 w-4" />
                                )}
                              </Button>
                            </div>
                          </div>

                          {/* Desktop Layout */}
                          <div className="hidden md:contents">
                            {/* Name */}
                            <div className="col-span-3">
                              <div className="flex items-center gap-2">
                                <span className="font-medium text-sm text-foreground/90 truncate">
                                  {entry.title}
                                </span>
                                <Badge variant="secondary" className="text-xs bg-muted/70 text-muted-foreground border-border/30">
                                  {entry.category}
                                </Badge>
                                {entry.image_url && <ImageIcon className="h-3 w-3 text-primary" />}
                              </div>
                            </div>

                            {/* Content */}
                            <div className="col-span-5">
                              <p className="text-sm text-muted-foreground truncate">
                                {entry.content ? entry.content.substring(0, 100) + (entry.content.length > 100 ? '...' : '') : 'No content'}
                              </p>
                            </div>

                            {/* Created at */}
                            <div className="col-span-2">
                              <span className="text-sm text-muted-foreground">
                                {new Date(entry.created_at).toLocaleDateString()}
                              </span>
                            </div>

                            {/* Status */}
                            <div className="col-span-1 flex justify-center">
                              <Switch 
                                checked={entry.is_active} 
                                onCheckedChange={(checked) => toggleActive(entry, !!checked)}
                              />
                            </div>

                            {/* Actions */}
                            <div className="col-span-1 flex justify-center gap-1">
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-8 w-8 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
                                onClick={() => openEdit(entry)}
                                title="Edit entry"
                              >
                                <Pencil className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-8 w-8 p-0 opacity-0 group-hover:opacity-100 transition-opacity text-destructive hover:bg-destructive/10"
                                onClick={() => setConfirmEntry(entry)}
                                disabled={deletingId === entry.entry_id}
                                title="Delete entry"
                              >
                                {deletingId === entry.entry_id ? (
                                  <Loader2 className="h-4 w-4 animate-spin" />
                                ) : (
                                  <Trash2 className="h-4 w-4" />
                                )}
                              </Button>
                            </div>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </div>
            </>
          ) : (
            // Add Knowledge Form
            <>
              <div className="bg-card/30 backdrop-blur border border-border/30 rounded-lg p-6">
                {errorMsg && (
                  <div className="text-sm text-destructive border border-destructive/30 rounded-lg p-3 mb-6 bg-destructive/5">
                    {errorMsg}
                  </div>
                )}

                <div className="space-y-6">
                  {/* Entry Title */}
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-foreground/80">Entry title</label>
                    <Input 
                      placeholder="Enter a descriptive title for your knowledge entry" 
                      value={title} 
                      onChange={(e) => setTitle(e.target.value)}
                      className="bg-background/50 border-border/50"
                    />
                  </div>

                  {/* Category */}
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-foreground/80">Category</label>
                    <Select value={category} onValueChange={(value) => setCategory(value as any)}>
                      <SelectTrigger className="bg-background/50 border-border/50">
                        <SelectValue placeholder="Select category" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="instructions">Instructions</SelectItem>
                        <SelectItem value="preferences">Preferences</SelectItem>
                        <SelectItem value="rules">Rules</SelectItem>
                        <SelectItem value="notes">Notes</SelectItem>
                        <SelectItem value="general">General</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Entry Content */}
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-foreground/80">Entry content</label>
                    <Textarea 
                      placeholder="Enter the knowledge content, guidelines, or information" 
                      value={content} 
                      onChange={(e) => setContent(e.target.value)}
                      className="bg-background/50 border-border/50 resize-none min-h-[120px]"
                      rows={5}
                    />
                  </div>

                  {/* Image Upload */}
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-foreground/80">Image (optional)</label>
                    {!imagePreview ? (
                      <div className="border-2 border-dashed border-border/40 rounded-lg p-8 text-center bg-muted/20 hover:bg-muted/30 transition-colors">
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
                        <label htmlFor="image-upload" className="cursor-pointer block">
                          <Upload className="h-8 w-8 mx-auto text-muted-foreground mb-3" />
                          <p className="text-sm text-muted-foreground mb-1">Click to upload an image</p>
                          <p className="text-xs text-muted-foreground/70">PNG, JPG, GIF up to 10MB</p>
                        </label>
                      </div>
                    ) : (
                      <div className="relative rounded-lg overflow-hidden border border-border/30">
                        <img src={imagePreview} alt="Preview" className="w-full h-40 object-cover" />
                        <button
                          type="button"
                          onClick={() => {
                            setSelectedImage(null);
                            setImagePreview(null);
                          }}
                          className="absolute top-2 right-2 bg-destructive/90 hover:bg-destructive text-destructive-foreground rounded-full p-2 transition-colors"
                        >
                          <X className="h-4 w-4" />
                        </button>
                      </div>
                    )}
                  </div>

                  {/* Action Buttons */}
                  <div className="flex justify-end gap-3 pt-4 border-t border-border/30">
                    <Button 
                      variant="outline" 
                      onClick={handleCancelAdd}
                      disabled={uploadingImage}
                      className="border-border/50"
                    >
                      Cancel
                    </Button>
                    <Button 
                      onClick={createEntry} 
                      disabled={uploadingImage || (!title.trim() || (!content.trim() && !selectedImage))}
                      className="bg-primary hover:bg-primary/90 text-primary-foreground"
                    >
                      {uploadingImage ? (
                        <>
                          <Loader2 className="h-4 w-4 animate-spin mr-2" />
                          Uploading...
                        </>
                      ) : (
                        'Save'
                      )}
                    </Button>
                  </div>
                </div>
              </div>
            </>
          )}
        </div>
      </DialogContent>

      {/* Delete Confirmation */}
      <Dialog open={!!confirmEntry} onOpenChange={() => setConfirmEntry(null)}>
        <DialogContent className="sm:max-w-md bg-background/95 backdrop-blur border-border/50">
          <DialogHeader className="border-b border-border/50 pb-4">
            <DialogTitle className="flex items-center gap-2 text-destructive">
              <Trash2 className="h-4 w-4" />
              Delete Entry
            </DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <p className="text-sm text-muted-foreground mb-2">
              This action cannot be undone. The entry will be permanently deleted.
            </p>
            {confirmEntry && (
              <div className="p-3 bg-muted/30 rounded-lg border border-border/30 mt-3">
                <p className="text-sm font-medium text-foreground/90">
                  "{confirmEntry.title}"
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  {confirmEntry.category} • {new Date(confirmEntry.created_at).toLocaleDateString()}
                </p>
              </div>
            )}
          </div>
          <div className="flex justify-end gap-3 pt-2 border-t border-border/50">
            <Button 
              variant="outline" 
              onClick={() => setConfirmEntry(null)} 
              disabled={!!deletingId}
              className="border-border/50"
            >
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
              className="bg-destructive hover:bg-destructive/90 text-destructive-foreground"
            >
              {deletingId ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin mr-2" /> 
                  Deleting...
                </>
              ) : (
                <>
                  <Trash2 className="h-4 w-4 mr-2" />
                  Delete
                </>
              )}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Edit Entry Dialog */}
      <Dialog open={!!editEntry} onOpenChange={() => setEditEntry(null)}>
        <DialogContent className="sm:max-w-lg bg-background/95 backdrop-blur border-border/50">
          <DialogHeader className="border-b border-border/50 pb-4">
            <DialogTitle className="flex items-center gap-2">
              <Pencil className="h-4 w-4 text-primary" />
              Edit Entry
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <Input 
              placeholder="Entry title" 
              value={editTitle} 
              onChange={(e) => setEditTitle(e.target.value)}
              className="bg-background/50 border-border/50"
            />
            <Select value={editCategory} onValueChange={(value) => setEditCategory(value as any)}>
              <SelectTrigger className="bg-background/50 border-border/50">
                <SelectValue placeholder="Select category" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="instructions">Instructions</SelectItem>
                <SelectItem value="preferences">Preferences</SelectItem>
                <SelectItem value="rules">Rules</SelectItem>
                <SelectItem value="notes">Notes</SelectItem>
                <SelectItem value="general">General</SelectItem>
              </SelectContent>
            </Select>
            <Textarea 
              placeholder="Entry content" 
              value={editContent} 
              onChange={(e) => setEditContent(e.target.value)}
              className="bg-background/50 border-border/50 resize-none min-h-[120px]"
              rows={6}
            />
            
            {/* Image Upload Section for Edit */}
            <div className="space-y-3">
              <label className="text-sm font-medium text-foreground/70">Image (optional)</label>
              {!editImagePreview ? (
                <div className="border-2 border-dashed border-border/40 rounded-lg p-4 text-center bg-muted/20 hover:bg-muted/30 transition-colors">
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
                  <label htmlFor="edit-image-upload" className="cursor-pointer block">
                    <Upload className="h-6 w-6 mx-auto text-muted-foreground mb-1" />
                    <p className="text-xs text-muted-foreground">Click to upload an image</p>
                  </label>
                </div>
              ) : (
                <div className="relative rounded-lg overflow-hidden border border-border/30">
                  <img src={editImagePreview} alt="Preview" className="w-full h-24 object-cover" />
                  <button
                    type="button"
                    onClick={() => {
                      setEditSelectedImage(null);
                      setEditImagePreview(editEntry?.image_url || null);
                    }}
                    className="absolute top-1 right-1 bg-destructive/90 hover:bg-destructive text-destructive-foreground rounded-full p-1 transition-colors"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </div>
              )}
            </div>
            
            <div className="flex items-center justify-between py-2 px-3 bg-muted/30 rounded-lg border border-border/30">
              <span className="text-sm font-medium text-foreground/80">Active</span>
              <Switch 
                checked={editIsActive} 
                onCheckedChange={(checked) => setEditIsActive(!!checked)}
              />
            </div>
            
            <div className="flex justify-end gap-3 pt-2">
              <Button 
                variant="outline" 
                onClick={() => setEditEntry(null)} 
                disabled={savingEdit}
                className="border-border/50"
              >
                Cancel
              </Button>
              <Button 
                onClick={saveEdit} 
                disabled={savingEdit || editUploadingImage || !editTitle.trim()}
                className="bg-primary hover:bg-primary/90 text-primary-foreground"
              >
                {savingEdit || editUploadingImage ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin mr-2" /> 
                    {editUploadingImage ? 'Uploading...' : 'Saving...'}
                  </>
                ) : (
                  'Save Changes'
                )}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </Dialog>
  );
}

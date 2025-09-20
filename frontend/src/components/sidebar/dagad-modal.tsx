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
import { useAuth } from '@/components/AuthProvider';
import { Notebook, Trash2, Loader2, Pencil, Upload, X, Info, Plus, Eye, Folder, FolderOpen, ChevronRight, ChevronDown } from 'lucide-react';
import Image from 'next/image';
import { toast } from 'sonner';
import { useModeSelection } from '@/components/thread/chat-input/_use-mode-selection';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';

// API configuration
const API_BASE_URL = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:8000';
const API_BASE = API_BASE_URL.endsWith('/api') ? API_BASE_URL : `${API_BASE_URL}/api`;

type Entry = {
  entry_id: string;
  title: string;
  description?: string;
  content?: string;
  image_url?: string;
  image_alt_text?: string;
  image_metadata?: Record<string, any>;
  // File support
  file_url?: string;
  file_name?: string;
  file_size?: number;
  file_mime_type?: string;
  file_metadata?: Record<string, any>;
  category: 'instructions' | 'preferences' | 'rules' | 'notes' | 'general';
  priority: 1 | 2 | 3;
  is_active: boolean;
  is_global: boolean;
  auto_inject: boolean;
  trigger_keywords?: string[];
  trigger_patterns?: string[];
  created_at: string;
  updated_at: string;
  folder_id?: string | null;
};

const MAX_CONTENT_CHARS = 5000;
const MAX_TITLE_CHARS = 100;
const MAX_ENTRIES = 12;

// Utility to detect if a file is an image
const isImageFile = (file: File | null | undefined) => !!file && file.type.startsWith('image/');

// Function to get the appropriate icon for file types
const getFileIcon = (entry: Entry) => {
  if (entry.image_url) {
    return (
      <Image
        src="/images/image_4725998.svg"
        alt="Image file"
        width={12}
        height={12}
        className="h-3 w-3"
      />
    );
  }
  
  if (entry.file_url) {
    const fileMime = (entry.file_mime_type || '').toLowerCase();
    const fileNameLower = (entry.file_name || entry.file_url || '').toLowerCase();
    
    // Check for PDF
    if (fileMime.includes('pdf') || fileNameLower.endsWith('.pdf')) {
      return (
        <Image
          src="/images/pdf_4726010.svg"
          alt="PDF file"
          width={12}
          height={12}
          className="h-3 w-3"
        />
      );
    }
    
    // Check for CSV
    if (fileMime.includes('csv') || fileNameLower.endsWith('.csv')) {
      return (
        <Image
          src="/images/excel_4725976.svg"
          alt="CSV file"
          width={12}
          height={12}
          className="h-3 w-3"
        />
      );
    }
    
    // Check for DOC/DOCX
    if (fileMime.includes('officedocument.wordprocessingml.document') || 
        fileNameLower.endsWith('.docx') || 
        fileNameLower.endsWith('.doc')) {
      return (
        <Image
          src="/images/doc_4725970.svg"
          alt="Document file"
          width={12}
          height={12}
          className="h-3 w-3"
        />
      );
    }
    
    // Default file icon for other types (using doc icon as fallback)
    return (
      <Image
        src="/images/doc_4725970.svg"
        alt="File"
        width={12}
        height={12}
        className="h-3 w-3 opacity-50"
      />
    );
  }
  
  return null;
};

interface DagadModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function DagadModal({ open, onOpenChange }: DagadModalProps) {
  const [entries, setEntries] = useState<Entry[]>([]);
  const { selectedMode } = useModeSelection(); // Get current mode
  const { session, isLoading: authLoading } = useAuth(); // Use the auth context
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
  
  // File handling state
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploadingFile, setUploadingFile] = useState(false);
  const [uploadedFileInfo, setUploadedFileInfo] = useState<{
    file_url: string;
    file_name: string;
    file_size: number;
    file_mime_type: string;
    file_metadata?: Record<string, any>;
  } | null>(null);
  const [editSelectedFile, setEditSelectedFile] = useState<File | null>(null);
  const [editUploadingFile, setEditUploadingFile] = useState(false);
  const [editUploadedFileInfo, setEditUploadedFileInfo] = useState<{
    file_url: string;
    file_name: string;
    file_size: number;
    file_mime_type: string;
    file_metadata?: Record<string, any>;
  } | null>(null);
  
  // View state management
  const [showAddForm, setShowAddForm] = useState(false);
  // View entry modal state
  const [viewEntryState, setViewEntryState] = useState<Entry | null>(null);
  // Toggle for showing attachments (image/file) inside the view dialog
  const [showViewFile, setShowViewFile] = useState<boolean>(false);
  // Folders state
  const [folders, setFolders] = useState<{ folder_id: string; name: string }[]>([]);
  const [expandedFolders, setExpandedFolders] = useState<Record<string, boolean>>({});
  const [newFolderName, setNewFolderName] = useState('');
  const [creatingFolder, setCreatingFolder] = useState(false);
  const [selectedFolderId, setSelectedFolderId] = useState<string>('unfiled');
  const [editSelectedFolderId, setEditSelectedFolderId] = useState<string>('unfiled');
  const [confirmDeleteFolder, setConfirmDeleteFolder] = useState<{ folder_id: string; name: string } | null>(null);

  // Reset attachment visibility whenever a new entry is opened or dialog closed
  useEffect(() => {
    setShowViewFile(false);
  }, [viewEntryState]);

  // Derived file preview info for the View dialog
  const fileMime = (viewEntryState?.file_mime_type || '').toLowerCase();
  const fileNameLower = (viewEntryState?.file_name || viewEntryState?.file_url || '').toLowerCase();
  const isPdf = !!viewEntryState?.file_url && (fileMime.includes('pdf') || fileNameLower.endsWith('.pdf'));
  const isCsv = !!viewEntryState?.file_url && (fileMime.includes('csv') || fileNameLower.endsWith('.csv'));
  const isDocx = !!viewEntryState?.file_url && (
    fileMime.includes('officedocument.wordprocessingml.document') ||
    fileNameLower.endsWith('.docx') ||
    fileNameLower.endsWith('.doc')
  );
  const viewerUrl = viewEntryState?.file_url
    ? (isPdf
        ? viewEntryState.file_url
        : isDocx
          ? `https://view.officeapps.live.com/op/view.aspx?src=${encodeURIComponent(viewEntryState.file_url)}`
          : isCsv
            ? viewEntryState.file_url
            : null)
    : null;

  const fetchEntries = async () => {
    try {
      const token = session?.access_token;
      console.log('🔍 Fetching entries with token:', !!token);
      console.log('🔍 API_BASE:', API_BASE);

      const res = await fetch(`${API_BASE}/dagad?include_inactive=true`, {
        headers: token ? { 'Authorization': `Bearer ${token}` } : undefined,
        credentials: 'include',
      });
      
      console.log('📡 Entries response status:', res.status);
      console.log('📡 Entries response ok:', res.ok);
      
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        const detail = data?.detail || res.statusText || 'Unknown error';
        console.error('❌ Failed to fetch entries:', res.status, detail);
        setErrorMsg(`Failed to load entries: ${res.status} ${detail}`);
        setEntries([]);
        return;
      }
      const data = await res.json();
      console.log('📦 Entries API Response:', data);
      console.log('📦 Entries count:', data.entries?.length || 0);
      setEntries(data.entries || []);
      setErrorMsg(null);
    } catch (e) {
      console.error('💥 Error fetching entries:', e);
      setErrorMsg('Failed to load entries. Check API URL and auth.');
    } finally {
      setLoading(false);
    }
  };

  const fetchFolders = async () => {
    try {
      if (!session?.access_token) {
        console.log('⚠️ No session token, skipping folder fetch');
        setFolders([]);
        return;
      }
      
      const token = session.access_token;
      const apiUrl = `${API_BASE}/dagad/folders`;
      console.log('🌐 Making folders API call to:', apiUrl);
      console.log('🔑 Using token:', token.substring(0, 20) + '...');
      
      const res = await fetch(apiUrl, {
        headers: token ? { 'Authorization': `Bearer ${token}` } : undefined,
        credentials: 'include',
      });
      
      console.log('📡 Folders response status:', res.status);
      console.log('📡 Folders response ok:', res.ok);
      
      if (!res.ok) {
        const errorText = await res.text();
        console.error('❌ Failed to fetch folders:', res.status, res.statusText, errorText);
        setFolders([]);
        return;
      }
      
      const data = await res.json();
      console.log('📦 Folders API Response:', data);
      console.log('📦 Folders count:', data.folders?.length || 0);
      
      const folders = (data.folders || []).map((f: any) => ({ folder_id: f.folder_id, name: f.name }));
      console.log('📁 Processed folders:', folders);
      console.log('📁 Processed folders length:', folders.length);
      setFolders(folders);
      console.log('✅ Folders set in state');
    } catch (e) {
      console.error('💥 Error fetching folders:', e);
      setFolders([]);
    }
  };

  const createFolder = async () => {
    if (!newFolderName.trim()) return;
    try {
      setCreatingFolder(true);
      const token = session?.access_token;
      const res = await fetch(`${API_BASE}/dagad/folders`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...(token ? { 'Authorization': `Bearer ${token}` } : {}) },
        credentials: 'include',
        body: JSON.stringify({ name: newFolderName.trim() })
      });
      if (res.ok) {
        const folder = await res.json();
        setFolders((prev) => [...prev, { folder_id: folder.folder_id, name: folder.name }]);
        setNewFolderName('');
        toast.success('Folder created');
      } else {
        const errorData = await res.json().catch(() => ({}));
        console.error('Failed to create folder:', res.status, errorData);
        toast.error('Failed to create folder');
      }
    } catch (e) {
      console.error('Error creating folder:', e);
      toast.error('Failed to create folder');
    } finally {
      setCreatingFolder(false);
    }
  };

  const deleteFolder = async (folderId: string) => {
    try {
      const token = session?.access_token;
      const res = await fetch(`${API_BASE}/dagad/folders/${folderId}`, {
        method: 'DELETE',
        headers: token ? { 'Authorization': `Bearer ${token}` } : undefined,
        credentials: 'include',
      });
      if (res.ok) {
        setFolders((prev) => prev.filter((f) => f.folder_id !== folderId));
        // Move entries from deleted folder to unfiled
        setEntries((prev) => prev.map((entry) => 
          entry.folder_id === folderId ? { ...entry, folder_id: null } : entry
        ));
        toast.success('Folder deleted');
      } else {
        toast.error('Failed to delete folder');
      }
    } catch (e) {
      console.error('Error deleting folder:', e);
      toast.error('Failed to delete folder');
    }
  };

  const uploadImage = async (file: File, isEdit: boolean = false): Promise<string | null> => {
    try {
      if (isEdit) {
        setEditUploadingImage(true);
      } else {
        setUploadingImage(true);
      }
      
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

  const uploadFile = async (file: File, isEdit: boolean = false) => {
    try {
      if (isEdit) setEditUploadingFile(true); else setUploadingFile(true);
      const token = session?.access_token;
      const form = new FormData();
      form.append('file', file);
      const res = await fetch(`${API_BASE}/dagad/upload-file`, {
        method: 'POST',
        headers: token ? { 'Authorization': `Bearer ${token}` } : undefined,
        credentials: 'include',
        body: form,
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        const detail = data?.detail || res.statusText || 'Unknown error';
        throw new Error(`Failed to upload file: ${res.status} ${detail}`);
      }
      const info = await res.json();
      if (isEdit) setEditUploadedFileInfo(info); else setUploadedFileInfo(info);
      return info as {
        file_url: string;
        file_name: string;
        file_size: number;
        file_mime_type: string;
        file_metadata?: Record<string, any>;
      };
    } finally {
      if (isEdit) setEditUploadingFile(false); else setUploadingFile(false);
    }
  };

  const createEntry = async () => {
    if (entries.length >= MAX_ENTRIES) {
      setErrorMsg(`You can only create up to ${MAX_ENTRIES} entries. Delete one to add another.`);
      toast.error(`Limit reached: ${MAX_ENTRIES} entries`);
      return;
    }
    if (!title.trim() || (!content.trim() && !selectedImage && !selectedFile)) return;
    
    try {
      const token = session?.access_token;

      let imageUrl: string | null = null;
      if (selectedImage) {
        imageUrl = await uploadImage(selectedImage);
      }

      let filePayload: any = null;
      if (selectedFile) {
        const info = await uploadFile(selectedFile);
        filePayload = {
          file_url: info.file_url,
          file_name: info.file_name,
          file_size: info.file_size,
          file_mime_type: info.file_mime_type,
          file_metadata: info.file_metadata || {},
          source_type: 'file',
        };
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
          auto_inject: true,
          folder_id: selectedFolderId === 'unfiled' ? null : selectedFolderId,
          ...(filePayload || {}),
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
    setSelectedFile(null);
    setUploadedFileInfo(null);
    setErrorMsg(null);
  };

  const handleCancelAdd = () => {
    resetAddForm();
    setShowAddForm(false);
  };

  const deleteEntry = async (entryId: string) => {
    try {
      setDeletingId(entryId);
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
    setEditSelectedFile(null); // Reset file state for edit
    setEditUploadedFileInfo(null);
    setEditSelectedFolderId((entry.folder_id ?? 'unfiled') as string);
  };

  const saveEdit = async () => {
    if (!editEntry) return;
    try {
      setSavingEdit(true);
      const token = session?.access_token;

      let imageUrl: string | null = editEntry.image_url || null;
      if (editSelectedImage) {
        imageUrl = await uploadImage(editSelectedImage, true);
      }

      let filePayload: any = null;
      if (editSelectedFile) {
        const info = await uploadFile(editSelectedFile, true);
        filePayload = {
          file_url: info.file_url,
          file_name: info.file_name,
          file_size: info.file_size,
          file_mime_type: info.file_mime_type,
          file_metadata: info.file_metadata || {},
          source_type: 'file',
        };
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
          folder_id: editSelectedFolderId === 'unfiled' ? null : editSelectedFolderId,
          ...(filePayload || {}),
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
      console.log('🚀 Modal opened, auth state:', { 
        authLoading,
        hasSession: !!session, 
        hasToken: !!session?.access_token,
        userId: session?.user?.id,
        sessionObject: session
      });
      
      // Reset form state when dialog opens
      setShowAddForm(false);
      resetAddForm();
    } else {
      console.log('🚫 Modal closed');
    }
  }, [open]);

  // Separate useEffect for data fetching when auth is ready
  useEffect(() => {
    console.log('🔄 Auth useEffect triggered:', {
      open,
      authLoading,
      hasSession: !!session,
      hasToken: !!session?.access_token,
      userId: session?.user?.id
    });
    
    if (open && !authLoading && session?.access_token) {
      console.log('✅ Auth ready, fetching data...', {
        hasSession: !!session,
        hasToken: !!session?.access_token,
        userId: session?.user?.id,
        userEmail: session?.user?.email,
        tokenPreview: session?.access_token?.substring(0, 20) + '...'
      });
      fetchEntries();
      fetchFolders();
    } else if (open && !authLoading && !session?.access_token) {
      console.log('⚠️ Auth loaded but no session available');
    } else if (open && authLoading) {
      console.log('⏳ Auth still loading...');
    } else if (!open) {
      console.log('🚫 Modal not open, skipping data fetch');
    }
  }, [open, authLoading, session?.access_token]);


  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-7xl min-h-[700px] max-h-[90vh] bg-gradient-to-br from-background via-background to-muted/20 backdrop-blur-xl border-border/30 shadow-2xl">
        {/* Header */}
        <DialogHeader className="pb-6 border-b border-border/20">
          <div className="flex items-start justify-between">
            <div className="space-y-3">
              <div className="flex items-center gap-4">
                <div className="p-3 rounded-xl bg-gradient-to-br from-primary/20 to-primary/10 border border-primary/20 shadow-lg">
                  <i className="ri-brain-line text-2xl text-primary"></i>
                </div>
                <div>
                  <DialogTitle className="text-3xl font-bold bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text text-transparent">
                    Knowledge Base
                  </DialogTitle>
                  <p className="text-muted-foreground mt-1 text-base leading-relaxed max-w-2xl">
                    Teach Helium your preferences and best practices. It will recall the right knowledge when needed.
                  </p>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2 bg-muted/50 px-4 py-2.5 rounded-full border border-border/30 shadow-sm">
                <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></div>
                <span className="text-sm font-medium text-foreground">
                  {Math.min(entries.length, MAX_ENTRIES)}/{MAX_ENTRIES} entries
                </span>
              </div>
            </div>
          </div>
        </DialogHeader>

        <div className="flex flex-col h-full py-4">
          {!showAddForm ? (
            // Table View
            <>
              {/* Add Knowledge Button */}
              <div className="mb-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <Button 
                      onClick={() => {
                        if (entries.length >= MAX_ENTRIES) {
                          toast.error(`You can only have up to ${MAX_ENTRIES} entries.`);
                          return;
                        }
                        setShowAddForm(true);
                      }}
                      disabled={entries.length >= MAX_ENTRIES}
                      className="bg-gradient-to-r from-primary to-primary/90 hover:from-primary/90 hover:to-primary text-primary-foreground disabled:opacity-60 shadow-lg hover:shadow-xl transition-all duration-200 px-6 py-2.5 text-base font-medium"
                    >
                      <Plus className="h-5 w-5 mr-2" />
                      {entries.length >= MAX_ENTRIES ? 'Limit Reached' : 'Add Knowledge'}
                    </Button>
                    {entries.length >= MAX_ENTRIES && (
                      <div className="flex items-center gap-2 text-amber-600 bg-amber-50 dark:bg-amber-950/20 px-3 py-2 rounded-lg border border-amber-200 dark:border-amber-800">
                        <i className="ri-error-warning-line text-sm"></i>
                        <span className="text-sm font-medium">Maximum entries reached</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Folder Toolbar */}
              <div className="mb-6 p-4 bg-gradient-to-r from-muted/20 to-muted/10 rounded-xl border border-border/30 shadow-sm">
                <div className="flex items-center gap-4">
                  <div className="flex-1">
                    <label className="text-sm font-medium text-foreground mb-2 block">
                      Create New Folder
                    </label>
                    <Input
                      placeholder="Enter folder name..."
                      value={newFolderName}
                      onChange={(e) => setNewFolderName(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && createFolder()}
                      className="bg-background/50 border-border/50 focus:border-primary/50 focus:ring-primary/20"
                    />
                  </div>
                  <div className="pt-6">
                    <Button 
                      onClick={createFolder} 
                      disabled={!newFolderName.trim() || creatingFolder}
                      className="bg-gradient-to-r from-primary/90 to-primary hover:from-primary hover:to-primary/90 text-primary-foreground shadow-md hover:shadow-lg transition-all duration-200"
                    >
                      {creatingFolder ? (
                        <>
                          <Loader2 className="h-4 w-4 animate-spin mr-2" />
                          Creating...
                        </>
                      ) : (
                        <>
                          <i className="ri-folder-add-line mr-2"></i>
                          Create Folder
                        </>
                      )}
                    </Button>
                  </div>
                </div>
              </div>

              {/* Table */}
              <div className="flex-1 min-h-0">
                <div className="bg-card/30 backdrop-blur border border-muted rounded-lg overflow-hidden">
                  {/* Table Header - Fixed */}
                  <div className="hidden md:grid grid-cols-12 gap-4 p-6 bg-gradient-to-r from-muted/60 to-muted/40 border-b border-border/30 text-sm font-semibold text-foreground/80 sticky top-0 z-10">
                    <div className="col-span-3 flex items-center gap-2">
                      <i className="ri-folder-line text-base"></i>
                      Folder Name
                    </div>
                    <div className="col-span-4 flex items-center gap-2">
                      <i className="ri-file-text-line text-base"></i>
                      Content
                    </div>
                    <div className="col-span-1 text-center flex items-center justify-center gap-2">
                      <i className="ri-eye-line text-base"></i>
                      View
                    </div>
                    <div className="col-span-2 flex items-center gap-2">
                      <i className="ri-calendar-line text-base"></i>
                      Created
                    </div>
                    <div className="col-span-1 text-center flex items-center justify-center gap-2">
                      <i className="ri-checkbox-circle-line text-base"></i>
                      Status
                    </div>
                    <div className="col-span-1 text-center flex items-center justify-center gap-2">
                      <i className="ri-more-2-line text-base"></i>
                      Actions
                    </div>
                  </div>

                  {/* Table Body - Scrollable */}
                  <div className="min-h-[400px] max-h-[400px] overflow-y-auto">
                    {(() => {
                      console.log('🔄 Rendering table body - authLoading:', authLoading, 'loading:', loading, 'entries:', entries.length, 'folders:', folders.length);
                      return null;
                    })()}
                    {authLoading ? (
                      <div className="flex items-center justify-center py-12">
                        <div className="flex items-center gap-2 text-muted-foreground">
                          <Loader2 className="h-4 w-4 animate-spin" />
                          Loading authentication...
                        </div>
                      </div>
                    ) : loading ? (
                      <div className="flex items-center justify-center py-12">
                        <div className="flex items-center gap-2 text-muted-foreground">
                          <Loader2 className="h-4 w-4 animate-spin" />
                          Loading entries...
                        </div>
                      </div>
                    ) : entries.length === 0 ? (
                      <div className="flex flex-col items-center justify-center py-20 px-6 text-center">
                        <div className="relative mb-8">
                          <div className="p-6 rounded-2xl bg-gradient-to-br from-primary/10 to-primary/5 border border-primary/20 shadow-lg">
                            <i className="ri-brain-line text-4xl text-primary"></i>
                          </div>
                          <div className="absolute -top-2 -right-2 w-6 h-6 rounded-full bg-green-500 flex items-center justify-center">
                            <i className="ri-add-line text-white text-sm"></i>
                          </div>
                        </div>
                        <h4 className="text-2xl font-bold text-foreground mb-3">No knowledge entries yet</h4>
                        <p className="text-muted-foreground max-w-md mb-8 text-base leading-relaxed">
                          Start building your knowledge base by creating your first entry. Teach Helium your preferences and best practices.
                        </p>
                        <Button 
                          onClick={() => setShowAddForm(true)}
                          className="bg-gradient-to-r from-primary to-primary/90 hover:from-primary/90 hover:to-primary text-primary-foreground shadow-lg hover:shadow-xl transition-all duration-200 px-8 py-3 text-base font-medium"
                        >
                          <i className="ri-add-line mr-2 text-lg"></i>
                          Create Your First Entry
                        </Button>
                      </div>
                    ) : (
                      <div>
                        {(() => {
                          const allFolders = [{ folder_id: 'unfiled', name: 'Unfiled' }, ...folders];
                          console.log('🎨 Rendering folders:', allFolders);
                          console.log('📊 Folders state:', folders);
                          console.log('📊 Folders state length:', folders.length);
                          console.log('📊 All folders length:', allFolders.length);
                          return allFolders;
                        })().map((folder) => {
                          const folderEntries = entries.filter((e) => (e.folder_id ?? 'unfiled') === folder.folder_id);
                          const isOpen = !!expandedFolders[folder.folder_id];
                          const toggle = () => setExpandedFolders((prev) => ({ ...prev, [folder.folder_id]: !prev[folder.folder_id] }));
                          return (
                            <div key={folder.folder_id} className="group">
                              <div className="md:grid md:grid-cols-12 gap-4 p-6 border-b border-border/20 bg-gradient-to-r from-card/50 to-card/30 hover:from-card/70 hover:to-card/50 transition-all duration-200 group-hover:shadow-sm">
                                <div className="md:hidden flex items-center justify-between">
                                  <button className="flex items-center gap-3 group/folder" onClick={toggle}>
                                    <div className="p-1.5 rounded-lg bg-primary/10 group-hover/folder:bg-primary/20 transition-colors">
                                      {isOpen ? <FolderOpen className="h-5 w-5 text-primary" /> : <Folder className="h-5 w-5 text-primary" />}
                                    </div>
                                    <div className="flex items-center gap-2">
                                      <span className="font-semibold text-base text-foreground">{folder.name}</span>
                                      <Badge variant="secondary" className="text-xs bg-primary/10 text-primary border-primary/20 font-medium">
                                        {folderEntries.length} {folderEntries.length === 1 ? 'item' : 'items'}
                                      </Badge>
                                    </div>
                                    <div className="p-1 rounded-full bg-muted/50 group-hover/folder:bg-muted/70 transition-colors">
                                      {isOpen ? <ChevronDown className="h-4 w-4 text-muted-foreground" /> : <ChevronRight className="h-4 w-4 text-muted-foreground" />}
                                    </div>
                                  </button>
                                  {folder.folder_id !== 'unfiled' && (
                                    <Button 
                                      variant="ghost" 
                                      size="sm" 
                                      className="h-9 w-9 p-0 text-destructive hover:bg-destructive/10 hover:text-destructive rounded-lg transition-all duration-200" 
                                      onClick={() => setConfirmDeleteFolder({ folder_id: folder.folder_id, name: folder.name })}
                                      title="Delete folder"
                                    >
                                      <Trash2 className="h-4 w-4" />
                                    </Button>
                                  )}
                                </div>
                                <div className="hidden md:contents">
                                  <div className="col-span-3">
                                    <button className="flex items-center gap-3 group/folder" onClick={toggle}>
                                      <div className="p-1.5 rounded-lg bg-primary/10 group-hover/folder:bg-primary/20 transition-colors">
                                        {isOpen ? <FolderOpen className="h-5 w-5 text-primary" /> : <Folder className="h-5 w-5 text-primary" />}
                                      </div>
                                      <div className="flex items-center gap-2">
                                        <span className="font-semibold text-base text-foreground">{folder.name}</span>
                                        <Badge variant="secondary" className="text-xs bg-primary/10 text-primary border-primary/20 font-medium">
                                          {folderEntries.length} {folderEntries.length === 1 ? 'item' : 'items'}
                                        </Badge>
                                      </div>
                                      <div className="p-1 rounded-full bg-muted/50 group-hover/folder:bg-muted/70 transition-colors ml-auto">
                                        {isOpen ? <ChevronDown className="h-4 w-4 text-muted-foreground" /> : <ChevronRight className="h-4 w-4 text-muted-foreground" />}
                                      </div>
                                    </button>
                                  </div>
                                  <div className="col-span-4 flex items-center text-sm text-muted-foreground">
                                    <i className="ri-file-text-line mr-2"></i>
                                    {folderEntries.length === 0 ? 'No entries yet' : `${folderEntries.length} knowledge ${folderEntries.length === 1 ? 'entry' : 'entries'}`}
                                  </div>
                                  <div className="col-span-1 flex justify-center">
                                    <div className="w-8 h-8 rounded-full bg-muted/50 flex items-center justify-center">
                                      <i className="ri-eye-line text-muted-foreground"></i>
                                    </div>
                                  </div>
                                  <div className="col-span-2 flex items-center text-sm text-muted-foreground">
                                    <i className="ri-calendar-line mr-2"></i>
                                    Recently created
                                  </div>
                                  <div className="col-span-1 flex justify-center">
                                    <div className="flex items-center gap-1 px-2 py-1 rounded-full bg-green-100 dark:bg-green-900/20 text-green-700 dark:text-green-400 text-xs font-medium">
                                      <div className="w-1.5 h-1.5 rounded-full bg-green-500"></div>
                                      Active
                                    </div>
                                  </div>
                                  <div className="col-span-1 flex justify-center">
                                    {folder.folder_id !== 'unfiled' && (
                                      <Button 
                                        variant="ghost" 
                                        size="sm" 
                                        className="h-9 w-9 p-0 text-destructive hover:bg-destructive/10 hover:text-destructive rounded-lg transition-all duration-200" 
                                        onClick={() => setConfirmDeleteFolder({ folder_id: folder.folder_id, name: folder.name })}
                                        title="Delete folder"
                                      >
                                        <Trash2 className="h-4 w-4" />
                                      </Button>
                                    )}
                                  </div>
                                </div>
                              </div>

                              {isOpen && folderEntries.map((entry) => (
                                <div key={entry.entry_id} className="md:grid md:grid-cols-12 gap-4 p-4 pl-6 md:pl-4 border-b border-border/20 hover:bg-muted/20 transition-colors group">
                                <div className="md:hidden space-y-3">
                                  <div className="flex items-start justify-between">
                                    <div className="flex-1">
                                      <div className="flex items-center gap-2 mb-1">
                                        {getFileIcon(entry)}
                                        <span className="font-medium text-sm text-foreground/90">{entry.title}</span>
                                        <Badge variant="secondary" className="text-xs bg-muted/70 text-muted-foreground border-border/30">{entry.category}</Badge>
                                      </div>
                                      <p className="text-sm text-muted-foreground mb-2">{entry.content ? entry.content.substring(0, 60) + (entry.content.length > 60 ? '...' : '') : 'No content'}</p>
                                      <span className="text-xs text-muted-foreground">{new Date(entry.created_at).toLocaleDateString()}</span>
                                    </div>
                                    <Switch checked={entry.is_active} onCheckedChange={(checked) => toggleActive(entry, !!checked)} />
                                  </div>
                                  <div className="flex justify-end gap-1">
                                    <Button variant="ghost" size="sm" className="h-8 w-8 p-0" onClick={() => openEdit(entry)} title="Edit entry">
                                      <Pencil className="h-4 w-4" />
                                    </Button>
                                    <Button variant="ghost" size="sm" className="h-8 w-8 p-0 text-destructive hover:bg-destructive/10" onClick={() => setConfirmEntry(entry)} disabled={deletingId === entry.entry_id} title="Delete entry">
                                      {deletingId === entry.entry_id ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
                                    </Button>
                                  </div>
                                </div>

                                <div className="hidden md:contents">
                                  <div className="col-span-3 pl-6 flex items-center">
                                    <div className="flex items-center gap-2">
                                      {getFileIcon(entry)}
                                      <span className="font-medium text-sm text-foreground/90 truncate">{entry.title}</span>
                                      <Badge variant="secondary" className="text-xs bg-muted/70 text-muted-foreground border-border/30">{entry.category}</Badge>
                                    </div>
                                  </div>
                                  <div className="col-span-4">
                                    <p className="text-sm text-muted-foreground truncate">{entry.content ? entry.content.substring(0, 100) + (entry.content.length > 100 ? '...' : '') : 'No content'}</p>
                                  </div>
                                  <div className="col-span-1 flex justify-center">
                                    <Button variant="ghost" size="sm" className="h-8 w-8 p-0" onClick={() => setViewEntryState(entry)} title="View entry">
                                      <Eye className="h-4 w-4" />
                                    </Button>
                                  </div>
                                  <div className="col-span-2">
                                    <span className="text-sm text-muted-foreground">{new Date(entry.created_at).toLocaleDateString()}</span>
                                  </div>
                                  <div className="col-span-1 flex justify-center">
                                    <Switch checked={entry.is_active} onCheckedChange={(checked) => toggleActive(entry, !!checked)} />
                                  </div>
                                  <div className="col-span-1 flex justify-center gap-1">
                                    <Button variant="ghost" size="sm" className="h-8 w-8 p-0 opacity-0 group-hover:opacity-100 transition-opacity" onClick={() => openEdit(entry)} title="Edit entry">
                                      <Pencil className="h-4 w-4" />
                                    </Button>
                                    <Button variant="ghost" size="sm" className="h-8 w-8 p-0 opacity-0 group-hover:opacity-100 transition-opacity text-destructive hover:bg-destructive/10" onClick={() => setConfirmEntry(entry)} disabled={deletingId === entry.entry_id} title="Delete entry">
                                      {deletingId === entry.entry_id ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
                                    </Button>
                                  </div>
                                </div>
                              </div>
                            ))}
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </>
          ) : (
            // Add Knowledge Form
            <>
              <div>
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
                      maxLength={MAX_TITLE_CHARS}
                      onChange={(e) => setTitle(e.target.value)}
                      className="bg-background/50 border-border/50"
                    />
                    <div className="flex items-center justify-end text-xs text-muted-foreground">
                      {title.length}/{MAX_TITLE_CHARS}
                    </div>
                  </div>

                  {/* Category */}
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <label className="text-sm font-medium text-foreground/80">Category</label>
                      <Popover>
                        <PopoverTrigger asChild>
                          <button
                            type="button"
                            aria-label="Category help"
                            className="inline-flex h-5 w-5 items-center justify-center rounded hover:bg-muted/50 text-muted-foreground"
                          >
                            <Info className="h-3 w-3" />
                          </button>
                        </PopoverTrigger>
                        <PopoverContent align="start" className="w-80 text-sm">
                          <div className="space-y-2">
                            <div className="font-medium">Category guide</div>
                            <ul className="list-disc pl-5 space-y-1 text-muted-foreground">
                              <li><span className="text-foreground">Instructions</span> → Step-by-step tasks.</li>
                              <li><span className="text-foreground">Preferences</span> → Style, tone, format choices.</li>
                              <li><span className="text-foreground">Rules</span> → Strict constraints to follow.</li>
                              <li><span className="text-foreground">Notes</span> → Context or references.</li>
                              <li><span className="text-foreground">General</span> → Anything else.</li>
                            </ul>
                          </div>
                        </PopoverContent>
                      </Popover>
                    </div>
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
                      onChange={(e) => setContent(e.target.value.slice(0, MAX_CONTENT_CHARS))}
                      maxLength={MAX_CONTENT_CHARS}
                      className="bg-background/50 border-border/50 resize-none h-[120px] overflow-y-auto overflow-x-hidden break-all whitespace-pre-wrap"
                      rows={5}
                    />
                    <div className="flex items-center justify-end text-xs text-muted-foreground">
                      {content.length}/{MAX_CONTENT_CHARS}
                    </div>
                  </div>

                  {/* Folder selection */}
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-foreground/80">Folder</label>
                    <Select value={selectedFolderId} onValueChange={(value) => setSelectedFolderId(value)}>
                      <SelectTrigger className="bg-background/50 border-border/50">
                        <SelectValue placeholder="Select folder" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="unfiled">Unfiled</SelectItem>
                        {folders.map((f) => (
                          <SelectItem key={f.folder_id} value={f.folder_id}>{f.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Attachment Upload (Image or Document) */}
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-foreground/80">Attachment (optional)</label>
                    {imagePreview ? (
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
                    ) : (
                      <div className="border-2 border-dashed border-border/40 rounded-lg p-6 text-center bg-muted/20 hover:bg-muted/30 transition-colors">
                        <input
                          type="file"
                          accept="image/*,.pdf,.doc,.docx,.csv,.txt,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document,text/csv,text/plain"
                          onChange={(e) => {
                            const file = e.target.files?.[0] || null;
                            if (!file) return;
                            if (!isImageFile(file) && file.size > 50 * 1024 * 1024) {
                              toast.error('File is larger than 50MB. Please choose a smaller file.');
                              e.currentTarget.value = '';
                              setSelectedFile(null);
                              return;
                            }
                            if (isImageFile(file)) {
                              handleImageSelect(file);
                              setSelectedFile(null);
                            } else {
                              setSelectedFile(file);
                              setSelectedImage(null);
                              setImagePreview(null);
                            }
                          }}
                          className="hidden"
                          id="kb-attachment-upload"
                        />
                        <label htmlFor="kb-attachment-upload" className="cursor-pointer block">
                          <Upload className="h-8 w-8 mx-auto text-muted-foreground mb-3" />
                          <p className="text-sm text-muted-foreground mb-1">Click to upload an image or file</p>
                          <p className="text-xs text-muted-foreground/70">Images up to 10MB • Files up to 50MB</p>
                        </label>
                        {selectedFile && (
                          <div className="text-xs text-muted-foreground mt-2">{selectedFile.name} ({Math.round(selectedFile.size/1024)} KB)</div>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Action Buttons */}
                  <div className="flex justify-end gap-3 pt-4 border-t border-border/30">
                    <Button 
                      variant="outline" 
                      onClick={handleCancelAdd}
                      disabled={uploadingImage || uploadingFile}
                      className="border-border/50"
                    >
                      Cancel
                    </Button>
                    <Button 
                      onClick={createEntry} 
                      disabled={uploadingImage || uploadingFile || (!title.trim() || (!content.trim() && !selectedImage && !selectedFile))}
                      className="bg-primary hover:bg-primary/90 text-primary-foreground"
                    >
                      {uploadingImage || uploadingFile ? (
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
              variant="outline"
              onClick={async () => {
                if (!confirmEntry) return;
                await deleteEntry(confirmEntry.entry_id);
                setConfirmEntry(null);
              }}
              disabled={!!deletingId}
              className="bg-black text-white hover:text-red-500 border-border/50 dark:bg-white dark:text-black dark:hover:text-red-500"
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
              maxLength={MAX_TITLE_CHARS}
              onChange={(e) => setEditTitle(e.target.value)}
              className="bg-background/50 border-border/50"
            />
            <div className="flex items-center justify-end text-xs text-muted-foreground">
              {editTitle.length}/{MAX_TITLE_CHARS}
            </div>
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
            {/* Folder selection (edit) */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground/80">Folder</label>
              <Select value={editSelectedFolderId} onValueChange={(value) => setEditSelectedFolderId(value)}>
                <SelectTrigger className="bg-background/50 border-border/50">
                  <SelectValue placeholder="Select folder" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="unfiled">Unfiled</SelectItem>
                  {folders.map((f) => (
                    <SelectItem key={f.folder_id} value={f.folder_id}>{f.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <Textarea 
              placeholder="Entry content" 
              value={editContent}
              onChange={(e) => setEditContent(e.target.value.slice(0, MAX_CONTENT_CHARS))}
              maxLength={MAX_CONTENT_CHARS}
              className="bg-background/50 border-border/50 resize-none h-[120px] overflow-y-auto overflow-x-hidden break-all whitespace-pre-wrap"
              rows={6}
            />
            <div className="flex items-center justify-end text-xs text-muted-foreground">
              {editContent.length}/{MAX_CONTENT_CHARS}
            </div>
            
            {/* Attachment Upload Section for Edit */}
            <div className="space-y-3">
              <label className="text-sm font-medium text-foreground/70">Attachment (optional)</label>
              {editImagePreview ? (
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
              ) : (
                <div className="border-2 border-dashed border-border/40 rounded-lg p-4 text-center bg-muted/20 hover:bg-muted/30 transition-colors">
                  <input
                    type="file"
                    accept="image/*,.pdf,.doc,.docx,.csv,.txt,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document,text/csv,text/plain"
                    onChange={(e) => {
                      const file = e.target.files?.[0] || null;
                      if (!file) return;
                      if (!isImageFile(file)) {
                        setEditSelectedFile(file);
                        setEditSelectedImage(null);
                        setEditImagePreview(null);
                      } else {
                        handleEditImageSelect(file);
                        setEditSelectedFile(null);
                      }
                    }}
                    className="hidden"
                    id="edit-attachment-upload"
                  />
                  <label htmlFor="edit-attachment-upload" className="cursor-pointer block">
                    <Upload className="h-6 w-6 mx-auto text-muted-foreground mb-1" />
                    <p className="text-xs text-muted-foreground">Click to upload an image or file</p>
                  </label>
                  {(editSelectedFile || editEntry?.file_name) && (
                    <div className="text-xs text-muted-foreground mt-2">
                      {editSelectedFile ? `${editSelectedFile.name} (${Math.round(editSelectedFile.size/1024)} KB)` : editEntry?.file_name}
                    </div>
                  )}
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
                disabled={savingEdit || editUploadingImage || editUploadingFile || !editTitle.trim()}
                className="bg-primary hover:bg-primary/90 text-primary-foreground"
              >
                {savingEdit || editUploadingImage || editUploadingFile ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin mr-2" /> 
                    {(editUploadingImage || editUploadingFile) ? 'Uploading...' : 'Saving...'}
                  </>
                ) : (
                  'Save Changes'
                )}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* View Entry Dialog */}
      <Dialog open={!!viewEntryState} onOpenChange={() => setViewEntryState(null)}>
        <DialogContent className="sm:max-w-2xl bg-background/95 backdrop-blur border-border/50">
          <DialogHeader className="border-b border-border/50 pb-4">
            <DialogTitle className="flex items-center gap-2">
              <Eye className="h-4 w-4 text-primary" />
              {viewEntryState?.title || 'View Entry'}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            {viewEntryState?.content && (
              <div className="text-sm text-foreground/90 whitespace-pre-wrap border border-border/30 rounded-md p-3 bg-muted/20">
                {viewEntryState.content}
              </div>
            )}

            {(viewEntryState?.image_url || viewEntryState?.file_url) && (
              <div className="flex items-center justify-start gap-2">
                <Button
                  variant="secondary"
                  onClick={() => setShowViewFile((prev) => !prev)}
                  className="border-border/50"
                >
                  {showViewFile ? 'Hide file' : 'View file'}
                </Button>
              </div>
            )}

            {showViewFile && viewEntryState?.image_url && (
              <div className="rounded-lg overflow-hidden border border-border/30">
                <img
                  src={viewEntryState.image_url}
                  alt={viewEntryState.image_alt_text || 'Image'}
                  className="w-full max-h-80 object-contain"
                />
              </div>
            )}

            {showViewFile && viewEntryState?.file_url && (
              <div className="text-sm space-y-2">
                {/* Render inline for PDF/CSV/DOCX via native or Google Docs Viewer */}
                {viewerUrl ? (
                  <div className="rounded-lg overflow-hidden border border-border/30">
                    <iframe
                      src={viewerUrl}
                      className="w-full h-[480px] bg-background"
                      referrerPolicy="no-referrer"
                    />
                  </div>
                ) : (
                  <div>
                    <div className="mb-2 text-muted-foreground">File:</div>
                    <a
                      href={viewEntryState.file_url}
                      target="_blank"
                      rel="noreferrer"
                      className="text-primary underline break-all"
                    >
                      Open file
                    </a>
                  </div>
                )}
              </div>
            )}

            {!viewEntryState?.content && !viewEntryState?.image_url && !viewEntryState?.file_url && (
              <div className="text-sm text-muted-foreground">No preview available for this entry.</div>
            )}
          </div>
          <div className="flex justify-end">
            <Button variant="outline" onClick={() => setViewEntryState(null)} className="border-border/50">Close</Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete Folder Confirmation */}
      <Dialog open={!!confirmDeleteFolder} onOpenChange={() => setConfirmDeleteFolder(null)}>
        <DialogContent className="sm:max-w-md bg-background/95 backdrop-blur border-border/50">
          <DialogHeader className="border-b border-border/50 pb-4">
            <DialogTitle className="flex items-center gap-2 text-destructive">
              <Trash2 className="h-4 w-4" />
              Delete Folder
            </DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <p className="text-sm text-muted-foreground mb-2">
              This action cannot be undone. The folder will be permanently deleted and all entries in this folder will be moved to "Unfiled".
            </p>
            {confirmDeleteFolder && (
              <div className="p-3 bg-muted/30 rounded-lg border border-border/30 mt-3">
                <p className="text-sm font-medium text-foreground/90">
                  "{confirmDeleteFolder.name}"
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  All entries in this folder will be moved to "Unfiled"
                </p>
              </div>
            )}
          </div>
          <div className="flex justify-end gap-3 pt-2 border-t border-border/50">
            <Button 
              variant="outline" 
              onClick={() => setConfirmDeleteFolder(null)} 
              className="border-border/50"
            >
              Cancel
            </Button>
            <Button
              variant="outline"
              onClick={async () => {
                if (!confirmDeleteFolder) return;
                await deleteFolder(confirmDeleteFolder.folder_id);
                setConfirmDeleteFolder(null);
              }}
              className="bg-black text-white hover:text-red-500 border-border/50 dark:bg-white dark:text-black dark:hover:text-red-500"
            >
              <Trash2 className="h-4 w-4 mr-2" />
              Delete Folder
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </Dialog>
  );
}


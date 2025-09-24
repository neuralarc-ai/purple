'use client';



import { useEffect, useState } from 'react';

import { Button } from '@/components/ui/button';

import { Input } from '@/components/ui/input';

import { Textarea } from '@/components/ui/textarea';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

import { Badge } from '@/components/ui/badge';

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

import { 

  Notebook, Trash2, Loader2, Pencil, Upload, X, Info, Plus, Eye, 

  Folder, FolderOpen, ChevronRight, ChevronDown, Search, Grid3X3, 

  List, MoreVertical, Star, Clock, Archive, Settings, Home, 

  FileText, Image as ImageIcon, File, Download, Share2, Copy,

  Calendar, User, HardDrive, Filter, SortAsc, SortDesc

} from 'lucide-react';

import Image from 'next/image';

import { toast } from 'sonner';

import { useModelSelection } from '@/components/thread/chat-input/_use-model-selection';

import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';

import { cn } from '@/lib/utils';



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

const MAX_STORAGE_MB = 100;

const MAX_STORAGE_BYTES = MAX_STORAGE_MB * 1024 * 1024;



export default function KnowledgeBasePage() {

  const [entries, setEntries] = useState<Entry[]>([]);

  const { selectedModel } = useModelSelection();

  const { session, isLoading: authLoading } = useAuth();

  const [loading, setLoading] = useState(true);



  // Form state

  const [title, setTitle] = useState('');

  const [content, setContent] = useState('');

  const [category, setCategory] = useState<'instructions' | 'preferences' | 'rules' | 'notes' | 'general'>('general');

  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  
  
  // Modal states

  const [deletingId, setDeletingId] = useState<string | null>(null);

  const [confirmEntry, setConfirmEntry] = useState<Entry | null>(null);

  const [editEntry, setEditEntry] = useState<Entry | null>(null);

  const [editTitle, setEditTitle] = useState('');

  const [editContent, setEditContent] = useState('');

  const [editCategory, setEditCategory] = useState<'instructions' | 'preferences' | 'rules' | 'notes' | 'general'>('general');

  const [savingEdit, setSavingEdit] = useState(false);

  const [editIsActive, setEditIsActive] = useState<boolean>(true);

  
  
  // File handling

  const [selectedImage, setSelectedImage] = useState<File | null>(null);

  const [imagePreview, setImagePreview] = useState<string | null>(null);

  const [uploadingImage, setUploadingImage] = useState(false);

  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  const [uploadingFile, setUploadingFile] = useState(false);

  
  
  // Edit file handling

  const [editSelectedImage, setEditSelectedImage] = useState<File | null>(null);

  const [editImagePreview, setEditImagePreview] = useState<string | null>(null);

  const [editUploadingImage, setEditUploadingImage] = useState(false);

  const [editSelectedFile, setEditSelectedFile] = useState<File | null>(null);

  const [editUploadingFile, setEditUploadingFile] = useState(false);

  const [editUploadedFileInfo, setEditUploadedFileInfo] = useState<{

    file_url: string;

    file_name: string;

    file_size: number;

    file_mime_type: string;

    file_metadata?: Record<string, any>;

  } | null>(null);

  const [uploadedFileInfo, setUploadedFileInfo] = useState<{

    file_url: string;

    file_name: string;

    file_size: number;

    file_mime_type: string;

    file_metadata?: Record<string, any>;

  } | null>(null);

  
  
  // View states

  const [showAddForm, setShowAddForm] = useState(false);

  const [viewEntryState, setViewEntryState] = useState<Entry | null>(null);

  const [showViewFile, setShowViewFile] = useState<boolean>(false);

  
  
  // Folder states

  const [folders, setFolders] = useState<{ folder_id: string; name: string }[]>([]);

  const [newFolderName, setNewFolderName] = useState('');

  const [creatingFolder, setCreatingFolder] = useState(false);

  const [selectedFolderId, setSelectedFolderId] = useState<string>('unfiled');

  const [editSelectedFolderId, setEditSelectedFolderId] = useState<string>('unfiled');

  const [confirmDeleteFolder, setConfirmDeleteFolder] = useState<{ folder_id: string; name: string } | null>(null);



  // Google Drive-like UI state

  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

  const [searchQuery, setSearchQuery] = useState('');

  const [sortBy, setSortBy] = useState<'name' | 'date' | 'size' | 'type'>('name');

  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');

  const [currentFolder, setCurrentFolder] = useState<string>('home');

  const [breadcrumbs, setBreadcrumbs] = useState<Array<{ id: string; name: string }>>([{ id: 'home', name: 'Home' }]);

  const [showRightSidebar, setShowRightSidebar] = useState(false);

  const [selectedEntry, setSelectedEntry] = useState<Entry | null>(null);

  const [sidebarSection, setSidebarSection] = useState<'home' | 'folders' | 'recent' | 'starred' | 'storage'>('home');

  const [starredEntries, setStarredEntries] = useState<string[]>([]);

  const [showQuickTemplates, setShowQuickTemplates] = useState(false);

  const [showAddFolderForm, setShowAddFolderForm] = useState(false);



  // Utility functions

  const isImageFile = (file: File | null | undefined) => !!file && file.type.startsWith('image/');



  const calculateTotalStorage = (entries: Entry[]) => {

    return entries.reduce((total, entry) => {

      let entrySize = 0;

      if (entry.content) entrySize += new Blob([entry.content]).size;

      if (entry.title) entrySize += new Blob([entry.title]).size;

      if (entry.file_size) entrySize += entry.file_size;

      if (entry.image_url) entrySize += 50000;

      return total + entrySize;

    }, 0);

  };



  const calculateNewEntrySize = () => {

    let size = 0;

    if (title) size += new Blob([title]).size;

    if (content) size += new Blob([content]).size;

    if (selectedFile) size += selectedFile.size;

    if (selectedImage) size += selectedImage.size;

    return size;

  };



  const calculateEntrySize = (entry: Entry) => {

    let size = 0;

    if (entry.content) size += new Blob([entry.content]).size;

    if (entry.title) size += new Blob([entry.title]).size;

    if (entry.file_size) size += entry.file_size;

    if (entry.image_url) size += 50000;

    return size;

  };



  const formatFileSize = (bytes: number) => {

    if (bytes === 0) return '0 B';

    const k = 1024;

    const sizes = ['B', 'KB', 'MB', 'GB'];

    const i = Math.floor(Math.log(bytes) / Math.log(k));

    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];

  };



  const getFileTypeIcon = (entry: Entry) => {

    if (entry.image_url) return <ImageIcon className="h-5 w-5 text-green-500" />;

    if (entry.file_url) {

      const fileMime = (entry.file_mime_type || '').toLowerCase();

      const fileNameLower = (entry.file_name || entry.file_url || '').toLowerCase();

      
      
      if (fileMime.includes('pdf') || fileNameLower.endsWith('.pdf')) {

        return <FileText className="h-5 w-5 text-red-500" />;

      }

      if (fileMime.includes('csv') || fileNameLower.endsWith('.csv')) {

        return <FileText className="h-5 w-5 text-green-600" />;

      }

      if (fileMime.includes('officedocument.wordprocessingml.document') || 

          fileNameLower.endsWith('.docx') || fileNameLower.endsWith('.doc')) {

        return <FileText className="h-5 w-5 text-blue-500" />;

      }

      return <File className="h-5 w-5 text-gray-500" />;

    }

    return <Notebook className="h-5 w-5 text-blue-500" />;

  };



  const getFilteredAndSortedEntries = () => {

    let filtered = entries;



    if (searchQuery.trim()) {

      const query = searchQuery.toLowerCase();

      filtered = filtered.filter(entry => 

        entry.title.toLowerCase().includes(query) ||

        entry.content?.toLowerCase().includes(query) ||

        entry.category.toLowerCase().includes(query) ||

        entry.file_name?.toLowerCase().includes(query)

      );

    }



    // Filter by sidebar section

    if (sidebarSection === 'starred') {

      filtered = filtered.filter(entry => starredEntries.includes(entry.entry_id));

    } else if (sidebarSection === 'recent') {

      // Sort by most recent and take top 20

      filtered = filtered.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()).slice(0, 20);

    } else if (sidebarSection === 'folders') {

      // When in folders view, filter by current folder

      if (currentFolder === 'home') {

        // Show all entries when in home

      } else if (currentFolder === 'unfiled') {

        filtered = filtered.filter(entry => !entry.folder_id);

      } else {

        filtered = filtered.filter(entry => entry.folder_id === currentFolder);

      }

    } else if (currentFolder === 'home') {

      // Show all entries

    } else if (currentFolder === 'unfiled') {

      filtered = filtered.filter(entry => !entry.folder_id);

    } else {

      filtered = filtered.filter(entry => entry.folder_id === currentFolder);

    }



    filtered.sort((a, b) => {

      let comparison = 0;

      
      
      switch (sortBy) {

        case 'name':

          comparison = a.title.localeCompare(b.title);

          break;

        case 'date':

          comparison = new Date(a.created_at).getTime() - new Date(b.created_at).getTime();

          break;

        case 'size':

          const sizeA = calculateEntrySize(a);

          const sizeB = calculateEntrySize(b);

          comparison = sizeA - sizeB;

          break;

        case 'type':

          comparison = a.category.localeCompare(b.category);

          break;

      }

      
      
      return sortOrder === 'asc' ? comparison : -comparison;

    });



    return filtered;

  };



  const navigateToFolder = (folderId: string, folderName: string) => {

    setCurrentFolder(folderId);

    setSidebarSection('folders');

    setBreadcrumbs(prev => [...prev, { id: folderId, name: folderName }]);

  };



  const navigateBack = () => {

    if (breadcrumbs.length > 1) {

      const newBreadcrumbs = breadcrumbs.slice(0, -1);

      const parentFolder = newBreadcrumbs[newBreadcrumbs.length - 1];

      setBreadcrumbs(newBreadcrumbs);

      setCurrentFolder(parentFolder.id);

    }

  };



  const resetAddForm = () => {

    setTitle('');

    setContent('');

    setCategory('general');

    setSelectedImage(null);

    setImagePreview(null);

    setSelectedFile(null);

    setErrorMsg(null);

  };



  const handleCancelAdd = () => {

    resetAddForm();

    setShowAddForm(false);

  };



  // File upload handlers

  const handleImageSelect = (file: File, isEdit: boolean = false) => {

    if (isEdit) {

      setEditSelectedImage(file);

      const reader = new FileReader();

      reader.onload = (e) => {

        setEditImagePreview(e.target?.result as string);

      };

      reader.readAsDataURL(file);

    } else {

      setSelectedImage(file);

      const reader = new FileReader();

      reader.onload = (e) => {

        setImagePreview(e.target?.result as string);

      };

      reader.readAsDataURL(file);

    }

  };



  const handleEditImageSelect = (file: File) => {

    setEditSelectedImage(file);

    const reader = new FileReader();

    reader.onload = (e) => {

      setEditImagePreview(e.target?.result as string);

    };

    reader.readAsDataURL(file);

  };



  // API functions

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

    if (!title.trim() || (!content.trim() && !selectedImage && !selectedFile)) return;

    
    
    // Calculate current storage usage

    const currentStorage = calculateTotalStorage(entries);

    const newEntrySize = calculateNewEntrySize();

    
    
    if (currentStorage + newEntrySize > MAX_STORAGE_BYTES) {

      const currentMB = (currentStorage / (1024 * 1024)).toFixed(1);

      const newMB = (newEntrySize / (1024 * 1024)).toFixed(1);

      setErrorMsg(`Storage limit exceeded. Current usage: ${currentMB}MB, New entry: ${newMB}MB. Maximum allowed: ${MAX_STORAGE_MB}MB.`);

      toast.error(`Storage limit reached: ${MAX_STORAGE_MB}MB`);

      return;

    }

    
    
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



  const openEdit = (entry: Entry) => {

    setEditEntry(entry);

    setEditTitle(entry.title);

    setEditContent(entry.content || '');

    setEditCategory(entry.category);

    setEditIsActive(entry.is_active);

    setEditImagePreview(entry.image_url || null);

    setEditSelectedImage(null);

    setEditSelectedFile(null);

    setEditUploadedFileInfo(null);

    setEditSelectedFolderId((entry.folder_id ?? 'unfiled') as string);

    
    
    // Initialize file upload states based on existing entry data

    if (entry.file_url) {

      setEditUploadedFileInfo({

        file_url: entry.file_url,

        file_name: entry.file_name || 'Unknown file',

        file_size: entry.file_size || 0,

        file_mime_type: entry.file_mime_type || 'application/octet-stream',

        file_metadata: entry.file_metadata

      });

    }

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



  const toggleStarred = (entryId: string) => {

    setStarredEntries(prev => {

      if (prev.includes(entryId)) {

        // Remove from starred

        const newStarred = prev.filter(id => id !== entryId);

        localStorage.setItem('starredEntries', JSON.stringify(newStarred));

        toast.success('Removed from starred');

        return newStarred;

      } else {

        // Add to starred

        const newStarred = [...prev, entryId];

        localStorage.setItem('starredEntries', JSON.stringify(newStarred));

        toast.success('Added to starred');

        return newStarred;

      }

    });

  };



  const isStarred = (entryId: string) => starredEntries.includes(entryId);



  // Quick folder templates

  const folderTemplates = [

    { name: 'Project Documentation', icon: '📋', description: 'Project specs and docs' },

    { name: 'Meeting Notes', icon: '📝', description: 'Meeting minutes and notes' },

    { name: 'Templates', icon: '📄', description: 'Reusable templates' },

    { name: 'Research', icon: '🔬', description: 'Research materials' },

    { name: 'Training', icon: '🎓', description: 'Training materials' },

    { name: 'Procedures', icon: '📋', description: 'Standard procedures' },

    { name: 'Resources', icon: '📚', description: 'Reference materials' },

    { name: 'Archive', icon: '📦', description: 'Old or archived content' }

  ];



  const handleTemplateSelect = (templateName: string) => {

    setNewFolderName(templateName);

    setShowQuickTemplates(false);

  };



  // Fetch data

  const fetchEntries = async () => {

    try {

      const token = session?.access_token;

      const res = await fetch(`${API_BASE}/dagad?include_inactive=true`, {

        headers: token ? { 'Authorization': `Bearer ${token}` } : undefined,

        credentials: 'include',

      });

      
      
      if (!res.ok) {

        const data = await res.json().catch(() => ({}));

        const detail = data?.detail || res.statusText || 'Unknown error';

        console.error('Failed to fetch entries:', res.status, detail);

        setErrorMsg(`Failed to load entries: ${res.status} ${detail}`);

        setEntries([]);

        return;

      }

      const data = await res.json();

      setEntries(data.entries || []);

      setErrorMsg(null);

    } catch (e) {

      console.error('Error fetching entries:', e);

      setErrorMsg('Failed to load entries. Check API URL and auth.');

    } finally {

      setLoading(false);

    }

  };



  const fetchFolders = async () => {

    try {

      if (!session?.access_token) {

        setFolders([]);

        return;

      }

      
      
      const token = session.access_token;

      const apiUrl = `${API_BASE}/dagad/folders`;

      
      
      const res = await fetch(apiUrl, {

        headers: token ? { 'Authorization': `Bearer ${token}` } : undefined,

        credentials: 'include',

      });

      
      
      if (!res.ok) {

        const errorText = await res.text();

        console.error('Failed to fetch folders:', res.status, res.statusText, errorText);

        setFolders([]);

        return;

      }

      
      
      const data = await res.json();

      const folders = (data.folders || []).map((f: any) => ({ folder_id: f.folder_id, name: f.name }));

      setFolders(folders);

    } catch (e) {

      console.error('Error fetching folders:', e);

      setFolders([]);

    }

  };



  useEffect(() => {

    if (!authLoading && session?.access_token) {

      fetchEntries();

      fetchFolders();

    }

  }, [authLoading, session?.access_token]);



  // Load starred entries from localStorage

  useEffect(() => {

    const savedStarred = localStorage.getItem('starredEntries');

    if (savedStarred) {

      try {

        setStarredEntries(JSON.parse(savedStarred));

      } catch (e) {

        console.error('Failed to parse starred entries:', e);

      }

    }

  }, []);



  // Keyboard navigation support

  useEffect(() => {

    const handleKeyDown = (event: KeyboardEvent) => {

      // Escape key to go back to folder list when viewing a specific folder

      if (event.key === 'Escape' && sidebarSection === 'folders' && currentFolder !== 'home') {

        setCurrentFolder('home');

        setBreadcrumbs([{ id: 'home', name: 'Home' }]);

      }

    };



    document.addEventListener('keydown', handleKeyDown);

    return () => document.removeEventListener('keydown', handleKeyDown);

  }, [sidebarSection, currentFolder]);



  return (

    <div className="flex h-screen bg-background">

      {/* Left Sidebar */}

      <div className="w-64 bg-muted/30 border-r border-border/30 flex flex-col">

        {/* Logo and Title */}

        <div className="p-6 border-b border-border/30">

          <div className="flex items-center gap-3">

            <div className="p-2 rounded-lg bg-primary/10 border border-primary/20">

              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="h-5 w-5 text-primary"><path d="M4.50772 2.87597C4.57028 2.37554 4.99568 2 5.5 2H18.5C19.0043 2 19.4297 2.37554 19.4923 2.87597L20.9923 14.876C20.9974 14.9171 21 14.9585 21 15V21C21 21.5523 20.5523 22 20 22H4C3.44772 22 3 21.5523 3 21V15C3 14.9585 3.00258 14.9171 3.00772 14.876L4.50772 2.87597ZM6.38278 4L5.13278 14H18.8672L17.6172 4H6.38278ZM19 16H5V20H19V16ZM15 17H17V19H15V17ZM13 17H11V19H13V17Z"></path></svg>

            </div>

            <div>

              <h2 className="text-lg font-bold text-foreground">AI Drive</h2>

              <p className="text-xs text-muted-foreground">Helium AI</p>

            </div>

          </div>

        </div>



        {/* Navigation */}

        <div className="flex-1 p-4 space-y-2">

          <button

            onClick={() => setSidebarSection('home')}

            className={cn(

              "w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors",

              sidebarSection === 'home' 

                ? "bg-primary text-primary-foreground" 

                : "text-muted-foreground hover:bg-muted/50 hover:text-foreground"

            )}

          >

            <Home className="h-4 w-4" />

            Home

          </button>

          
          
          <button

            onClick={() => setSidebarSection('folders')}

            className={cn(

              "w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors",

              sidebarSection === 'folders' 

                ? "bg-primary text-primary-foreground" 

                : "text-muted-foreground hover:bg-muted/50 hover:text-foreground"

            )}

          >

            <Folder className="h-4 w-4" />

            Folders

          </button>



          <button

            onClick={() => setSidebarSection('recent')}

            className={cn(

              "w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors",

              sidebarSection === 'recent' 

                ? "bg-primary text-primary-foreground" 

                : "text-muted-foreground hover:bg-muted/50 hover:text-foreground"

            )}

          >

            <Clock className="h-4 w-4" />

            Recent

          </button>



          <button

            onClick={() => setSidebarSection('starred')}

            className={cn(

              "w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors",

              sidebarSection === 'starred' 

                ? "bg-primary text-primary-foreground" 

                : "text-muted-foreground hover:bg-muted/50 hover:text-foreground"

            )}

          >

            <Star className="h-4 w-4" />

            Starred

          </button>



          <button

            onClick={() => setSidebarSection('storage')}

            className={cn(

              "w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors",

              sidebarSection === 'storage' 

                ? "bg-primary text-primary-foreground" 

                : "text-muted-foreground hover:bg-muted/50 hover:text-foreground"

            )}

          >

            <HardDrive className="h-4 w-4" />

            Storage

          </button>

        </div>



        {/* Storage Info */}

        <div className="p-4 border-t border-border/30">

          <div className="space-y-2">

            <div className="flex items-center justify-between text-xs text-muted-foreground">

              <span>Storage used</span>

              <span>{(calculateTotalStorage(entries) / (1024 * 1024)).toFixed(1)} MB</span>

            </div>

            <div className="w-full bg-muted/50 rounded-full h-2">

              <div 

                className="bg-primary h-2 rounded-full transition-all duration-300"

                style={{ 

                  width: `${Math.min((calculateTotalStorage(entries) / MAX_STORAGE_BYTES) * 100, 100)}%` 

                }}

              />

            </div>

            <div className="text-xs text-muted-foreground">

              {MAX_STORAGE_MB} MB total

            </div>

          </div>

        </div>

      </div>



      {/* Main Content Area */}

      <div className="flex-1 flex flex-col">

        {/* Top Bar */}

        <div className="h-16 border-b border-border/30 px-6 flex items-center gap-4">

          {/* Breadcrumbs */}

          <div className="flex items-center gap-2 text-sm">

            {sidebarSection === 'folders' && currentFolder !== 'home' && (

              <button

                onClick={() => {

                  setCurrentFolder('home');

                  setBreadcrumbs([{ id: 'home', name: 'Home' }]);

                }}

                className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors"

                title="Go back to folder list"

              >

                <Home className="h-4 w-4" />

                <span>Folders</span>

              </button>

            )}

            {breadcrumbs.map((crumb, index) => (

              <div key={crumb.id} className="flex items-center gap-2">

                {(index > 0 || (sidebarSection === 'folders' && currentFolder !== 'home')) && <ChevronRight className="h-4 w-4 text-muted-foreground" />}

                <button

                  onClick={() => {

                    if (index < breadcrumbs.length - 1) {

                      const newBreadcrumbs = breadcrumbs.slice(0, index + 1);

                      setBreadcrumbs(newBreadcrumbs);

                      setCurrentFolder(crumb.id);

                    }

                  }}

                  className={cn(

                    "px-3 py-1.5 rounded-lg hover:bg-muted/50 transition-colors",

                    index === breadcrumbs.length - 1 ? "text-foreground font-medium bg-muted/30" : "text-muted-foreground hover:text-foreground"

                  )}

                >

                  {crumb.name}

                </button>

              </div>

            ))}

          </div>



          <div className="flex-1" />



          {/* Search Bar */}

          <div className="relative w-80">

            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />

            <Input

              placeholder="Search in AI Drive..."

              value={searchQuery}

              onChange={(e) => setSearchQuery(e.target.value)}

              className="pl-10 pr-4 h-9"

            />

          </div>



          {/* View Mode Toggle */}

          <div className="flex items-center border border-border/30 rounded-lg">

            <button

              onClick={() => setViewMode('grid')}

              className={cn(

                "p-2 rounded-l-lg transition-colors",

                viewMode === 'grid' ? "bg-primary text-primary-foreground" : "hover:bg-muted/50"

              )}

            >

              <Grid3X3 className="h-4 w-4" />

            </button>

            <button

              onClick={() => setViewMode('list')}

              className={cn(

                "p-2 rounded-r-lg transition-colors",

                viewMode === 'list' ? "bg-primary text-primary-foreground" : "hover:bg-muted/50"

              )}

            >

              <List className="h-4 w-4" />

            </button>

          </div>



          {/* Sort Dropdown */}

          <Select value={`${sortBy}-${sortOrder}`} onValueChange={(value) => {

            const [newSortBy, newSortOrder] = value.split('-') as [typeof sortBy, typeof sortOrder];

            setSortBy(newSortBy);

            setSortOrder(newSortOrder);

          }}>

            <SelectTrigger className="w-40 h-9">

              <SelectValue />

            </SelectTrigger>

            <SelectContent>

              <SelectItem value="name-asc">Name A-Z</SelectItem>

              <SelectItem value="name-desc">Name Z-A</SelectItem>

              <SelectItem value="date-desc">Newest first</SelectItem>

              <SelectItem value="date-asc">Oldest first</SelectItem>

              <SelectItem value="size-desc">Largest first</SelectItem>

              <SelectItem value="size-asc">Smallest first</SelectItem>

              <SelectItem value="type-asc">Type A-Z</SelectItem>

              <SelectItem value="type-desc">Type Z-A</SelectItem>

            </SelectContent>

          </Select>



          {/* New Dropdown */}

          <Popover>

            <PopoverTrigger asChild>

          <Button

            disabled={calculateTotalStorage(entries) >= MAX_STORAGE_BYTES}

            className="h-9 px-4"

          >

            <Plus className="h-4 w-4 mr-2" />

            New

          </Button>

            </PopoverTrigger>

            <PopoverContent align="end" className="w-44 p-2">

              <div className="flex flex-col">

                <button

                  className="flex items-center gap-2 px-2 py-2 rounded hover:bg-muted/50 text-sm text-left"

                  onClick={() => {

                    setShowAddForm(true);

                  }}

                >

                  <Notebook className="h-4 w-4" />

                  <span>New Entry</span>

                </button>

                <button

                  className="flex items-center gap-2 px-2 py-2 rounded hover:bg-muted/50 text-sm text-left"

                  onClick={() => {

                    setSidebarSection('folders');

                    setCurrentFolder('home');

                    setShowAddForm(false);

                    setNewFolderName('');

                    // focus can be added if there's an input

                  }}

                >

                  <Folder className="h-4 w-4" />

                  <span>New Folder</span>

                </button>

              </div>

            </PopoverContent>

          </Popover>

        </div>



        {/* Main Content */}

        <div className="flex-1 flex">

          {/* Files/Folders Area */}

          <div className="flex-1 p-6">

            {!showAddForm ? (

              <div className="space-y-6">

                    {/* Folder Creation */}

                    {sidebarSection === 'folders' && currentFolder === 'home' && (

                      <div className="space-y-4">

                        {/* Compact Add Folder */}

                        <div className="flex items-center justify-between p-3 rounded-lg border border-border/30 bg-muted/10">

                          <div className="text-sm text-muted-foreground">Add a new folder to organize entries</div>

                          {!showAddFolderForm ? (

                            <Button size="sm" onClick={() => setShowAddFolderForm(true)}>

                              <Plus className="h-4 w-4 mr-2" />

                              Add Folder

                            </Button>

                          ) : (

                            <div className="flex items-center gap-2 w-full md:w-auto md:min-w-[420px] justify-end">

                              <Input

                                placeholder="Folder name"

                                value={newFolderName}

                                onChange={(e) => setNewFolderName(e.target.value)}

                                onKeyDown={(e) => e.key === 'Enter' && createFolder()}

                                className="h-9"

                              />

                                <Button 

                                size="sm"

                                onClick={async () => { await createFolder(); setShowAddFolderForm(false); }}

                                  disabled={!newFolderName.trim() || creatingFolder}

                                >

                                  {creatingFolder ? (

                                    <>

                                      <Loader2 className="h-4 w-4 animate-spin mr-2" />

                                    Creating

                                    </>

                                  ) : (

                                    <>

                                      <Plus className="h-4 w-4 mr-2" />

                                    Create

                                    </>

                                  )}

                                </Button>

                                  <Button 

                                size="sm"

                                variant="ghost"

                                onClick={() => { setShowAddFolderForm(false); setNewFolderName(''); }}

                                  >

                                    Cancel

                                  </Button>

                            </div>

                                )}

                        </div>



                        {/* Quick Actions */}

                        <div className="grid grid-cols-1 gap-3">

                          <div 

                            className="p-3 rounded-lg bg-muted/20 border border-border/30 hover:bg-muted/30 transition-colors cursor-pointer"

                            onClick={() => setShowQuickTemplates(!showQuickTemplates)}

                          >

                            <div className="flex items-center gap-2 mb-2">

                              <div className="p-1.5 rounded-lg bg-blue-500/10 border border-blue-500/20">

                                <i className="ri-folder-line text-blue-500 text-sm"></i>

                              </div>

                              <span className="text-sm font-medium text-foreground">Quick Templates</span>

                            </div>

                            <p className="text-xs text-muted-foreground">Use predefined folder names</p>

                          </div>

                        </div>



                        {/* Quick Templates Grid */}

                        {showQuickTemplates && (

                          <div className="space-y-3">

                            <div className="flex items-center justify-between">

                              <h4 className="text-sm font-medium text-foreground">Choose a template</h4>

                              <Button

                                variant="ghost"

                                size="sm"

                                onClick={() => setShowQuickTemplates(false)}

                                className="h-6 w-6 p-0"

                              >

                                <X className="h-4 w-4" />

                              </Button>

                            </div>

                            <div className="grid grid-cols-2 gap-2">

                              {folderTemplates.map((template, index) => (

                                <div

                                  key={index}

                                  className="p-3 rounded-lg bg-muted/20 border border-border/30 hover:bg-muted/30 transition-colors cursor-pointer"

                                  onClick={() => handleTemplateSelect(template.name)}

                                >

                                  <div className="flex items-center gap-2 mb-1">

                                    <span className="text-lg">{template.icon}</span>

                                    <span className="text-sm font-medium text-foreground truncate">{template.name}</span>

                                  </div>

                                  <p className="text-xs text-muted-foreground">{template.description}</p>

                                </div>

                              ))}

                            </div>

                          </div>

                        )}

                      </div>

                    )}



                {/* Files/Folders Display */}

                {authLoading ? (

                  <div className="flex items-center justify-center py-12">

                    <div className="flex items-center gap-2 text-muted-foreground">

                      <Loader2 className="h-4 w-4 animate-spin" />

                      Loading...

                    </div>

                  </div>

                ) : loading ? (

                  <div className="flex items-center justify-center py-12">

                    <div className="flex items-center gap-2 text-muted-foreground">

                      <Loader2 className="h-4 w-4 animate-spin" />

                      Loading entries...

                    </div>

                  </div>

                ) : getFilteredAndSortedEntries().length === 0 ? (

                  <div className="flex flex-col items-center justify-center py-24 text-center">

                    <div className="p-8 rounded-3xl bg-muted/30 border border-border/30 mb-6">

                      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="h-16 w-16 text-muted-foreground"><path d="M4.50772 2.87597C4.57028 2.37554 4.99568 2 5.5 2H18.5C19.0043 2 19.4297 2.37554 19.4923 2.87597L20.9923 14.876C20.9974 14.9171 21 14.9585 21 15V21C21 21.5523 20.5523 22 20 22H4C3.44772 22 3 21.5523 3 21V15C3 14.9585 3.00258 14.9171 3.00772 14.876L4.50772 2.87597ZM6.38278 4L5.13278 14H18.8672L17.6172 4H6.38278ZM19 16H5V20H19V16ZM15 17H17V19H15V17ZM13 17H11V19H13V17Z"></path></svg>

                    </div>

                    <h3 className="text-2xl font-bold text-foreground mb-2">

                      {searchQuery ? 'No results found' : 'No AI Drive entries yet'}

                    </h3>

                    <p className="text-muted-foreground mb-6 max-w-md">

                      {searchQuery 

                        ? `No entries match "${searchQuery}". Try a different search term.`

                        : 'Start building your AI Drive by creating your first entry.'

                      }

                    </p>

                    {!searchQuery && (

                      <Button onClick={() => setShowAddForm(true)}>

                        <Plus className="h-4 w-4 mr-2" />

                        Create Your First Entry

                      </Button>

                    )}

                  </div>

                ) : (

                  <>

                    {/* Folders */}

                    {sidebarSection === 'folders' && currentFolder === 'home' && (

                      <div className="space-y-4">

                        <div className="flex items-center justify-between">

                          <h3 className="text-lg font-semibold text-foreground">Your Folders</h3>

                          <div className="flex items-center gap-2 text-sm text-muted-foreground">

                            <span>{folders.length + 1} folders</span>

                            <span>•</span>

                            <span>{entries.length} total items</span>

                          </div>

                        </div>

                        <div className={cn(

                          "grid gap-3",

                          viewMode === 'grid' ? "grid-cols-2 md:grid-cols-3 lg:grid-cols-4" : "grid-cols-1"

                        )}>

                          {[{ folder_id: 'unfiled', name: 'Unfiled' }, ...folders].map((folder) => {

                            const folderEntries = entries.filter((e) => (e.folder_id ?? 'unfiled') === folder.folder_id);

                            const isUnfiled = folder.folder_id === 'unfiled';

                            return (

                              <div

                                key={folder.folder_id}

                                className={cn(

                                  "group relative p-4 rounded-xl border border-border/30 hover:border-border/60 transition-all cursor-pointer bg-gradient-to-br from-background to-muted/10 hover:from-muted/5 hover:to-muted/20",

                                  viewMode === 'grid' ? "text-center" : "flex items-center gap-3"

                                )}

                                onClick={() => navigateToFolder(folder.folder_id, folder.name)}

                              >

                                <div className={cn(

                                  "flex items-center gap-3",

                                  viewMode === 'grid' ? "flex-col" : "flex-row"

                                )}>

                                  <div className={cn(

                                    "p-3 rounded-xl border transition-all duration-300",

                                    isUnfiled 

                                      ? "bg-muted/20 border-muted-foreground/20" 

                                      : "bg-primary/10 border-primary/20 group-hover:bg-primary/15 group-hover:border-primary/30"

                                  )}>

                                    <Folder className={cn(

                                      "h-6 w-6 transition-colors",

                                      isUnfiled ? "text-muted-foreground" : "text-primary"

                                    )} />

                                  </div>

                                  <div className="flex-1 min-w-0">

                                    <h4 className="font-semibold text-foreground truncate">{folder.name}</h4>

                                    <p className="text-sm text-muted-foreground">

                                      {folderEntries.length} {folderEntries.length === 1 ? 'item' : 'items'}

                                    </p>

                                    {folderEntries.length > 0 && (

                                      <p className="text-xs text-muted-foreground mt-1">

                                        Last updated: {new Date(Math.max(...folderEntries.map(e => new Date(e.updated_at).getTime()))).toLocaleDateString()}

                                      </p>

                                    )}

                                  </div>

                                </div>

                                {!isUnfiled && (

                                  <Button

                                    variant="ghost"

                                    size="sm"

                                    className="absolute top-2 right-2 h-8 w-8 p-0 opacity-0 group-hover:opacity-100 transition-opacity text-destructive hover:bg-destructive/10"

                                    onClick={(e) => {

                                      e.stopPropagation();

                                      setConfirmDeleteFolder({ folder_id: folder.folder_id, name: folder.name });

                                    }}

                                  >

                                    <Trash2 className="h-4 w-4" />

                                  </Button>

                                )}

                                {/* Folder type indicator */}

                                {isUnfiled && (

                                  <div className="absolute top-2 left-2">

                                    <div className="px-2 py-1 rounded-full bg-muted/50 border border-border/30 text-xs text-muted-foreground">

                                      Default

                                    </div>

                                  </div>

                                )}

                              </div>

                            );

                          })}

                        </div>

                      </div>

                    )}



                    {/* Files in Selected Folder */}

                    {sidebarSection === 'folders' && currentFolder !== 'home' && (

                      <div className="space-y-4 relative">

                        {/* Floating Back Button */}

                        <div className="fixed bottom-6 right-6 z-40">

                          <Button

                            onClick={() => {

                              setCurrentFolder('home');

                              setBreadcrumbs([{ id: 'home', name: 'Home' }]);

                            }}

                            className="h-12 w-12 rounded-full shadow-lg hover:shadow-xl transition-all duration-300 bg-primary hover:bg-primary/90"

                            size="sm"

                            title="Back to Folders (Press Esc)"

                          >

                            <ChevronRight className="h-5 w-5 rotate-180" />

                          </Button>

                        </div>

                        <div className="flex items-center justify-between">

                          <div className="flex items-center gap-4">

                            <Button

                              variant="outline"

                              size="sm"

                              onClick={() => {

                                setCurrentFolder('home');

                                setBreadcrumbs([{ id: 'home', name: 'Home' }]);

                              }}

                              className="h-10 px-4 bg-background/60 border-border/60 hover:bg-muted/50"

                            >

                              <ChevronRight className="h-4 w-4 mr-2 rotate-180" />

                              Back to Folders

                            </Button>

                            <div className="flex items-center gap-3">

                              <div className="p-2 rounded-lg bg-primary/10 border border-primary/20">

                                <Folder className="h-5 w-5 text-primary" />

                              </div>

                              <div>

                                <h3 className="text-lg font-semibold text-foreground">

                                  {currentFolder === 'unfiled' ? 'Unfiled Files' : 

                                   folders.find(f => f.folder_id === currentFolder)?.name || 'Folder'}

                                </h3>

                                <p className="text-sm text-muted-foreground">

                                  {getFilteredAndSortedEntries().length} {getFilteredAndSortedEntries().length === 1 ? 'file' : 'files'}

                                </p>

                              </div>

                            </div>

                          </div>

                          <div className="flex items-center gap-2">

                            <Button

                              variant="outline"

                              size="sm"

                              onClick={() => setShowAddForm(true)}

                              className="h-10 px-4"

                            >

                              <Plus className="h-4 w-4 mr-2" />

                              Add File

                            </Button>

                          </div>

                        </div>

                        {getFilteredAndSortedEntries().length === 0 ? (

                          <div className="flex flex-col items-center justify-center py-12 text-center">

                            <div className="p-6 rounded-3xl bg-muted/30 border border-border/30 mb-4">

                              <Folder className="h-12 w-12 text-muted-foreground" />

                            </div>

                            <h4 className="text-lg font-semibold text-foreground mb-2">

                              {currentFolder === 'unfiled' ? 'No unfiled files' : 'This folder is empty'}

                            </h4>

                            <p className="text-muted-foreground mb-4 max-w-md">

                              {currentFolder === 'unfiled' 

                                ? 'All your files are organized in folders. Files without a folder will appear here.'

                                : `The "${folders.find(f => f.folder_id === currentFolder)?.name || 'folder'}" folder doesn't contain any files yet. Add some files to get started.`

                              }

                            </p>

                            <Button onClick={() => setShowAddForm(true)}>

                              <Plus className="h-4 w-4 mr-2" />

                              Add File

                            </Button>

                          </div>

                        ) : (

                          <div className="bg-background border border-border/30 rounded-lg overflow-hidden">

                            {/* Table Header */}

                            <div className="grid grid-cols-5 gap-4 px-4 py-3 bg-muted/30 border-b border-border/30 text-sm font-medium text-muted-foreground">

                              <div>Name</div>

                              <div>Content</div>

                              <div>Created at</div>

                              <div>Status</div>

                              <div>Actions</div>

                            </div>

                            
                            
                            {/* Table Body */}

                            <div className="divide-y divide-border/30">

                              {getFilteredAndSortedEntries().map((entry) => (

                                <div

                                  key={entry.entry_id}

                                  className="grid grid-cols-5 gap-4 px-4 py-3 hover:bg-muted/20 transition-colors cursor-pointer"

                                  onClick={() => {

                                    setSelectedEntry(entry);

                                    setShowRightSidebar(true);

                                  }}

                                >

                                  {/* Name */}

                                  <div className="flex items-center gap-2 min-w-0">

                                    <div className="p-1 rounded bg-muted/50 border border-border/30">

                                      {getFileTypeIcon(entry)}

                                    </div>

                                    <div className="min-w-0 flex-1">

                                      <div className="font-medium text-foreground truncate">{entry.title}</div>

                                      <div className="text-xs text-muted-foreground">{entry.category}</div>

                                    </div>

                                  </div>

                                  
                                  
                                  {/* Content */}

                                  <div className="flex items-center text-sm text-muted-foreground min-w-0">

                                    <span

                                      className="truncate block max-w-[420px]"

                                      title={entry.content || entry.title}

                                    >

                                      {entry.content || entry.title}

                                    </span>

                                  </div>

                                  
                                  
                                  {/* Created at */}

                                  <div className="flex items-center text-sm text-muted-foreground">

                                    {new Date(entry.created_at).toLocaleDateString()}

                                  </div>

                                  
                                  
                                  {/* Status */}

                                  <div className="flex items-center">

                                    <Switch

                                      checked={entry.is_active}

                                      onCheckedChange={(checked) => {

                                        toggleActive(entry, checked);

                                      }}

                                      className="h-4 w-7"

                                      onClick={(e) => e.stopPropagation()}

                                    />

                                  </div>

                                  
                                  
                                  {/* Actions */}

                                  <div className="flex items-center gap-1">

                                    <Button

                                      variant="ghost"

                                      size="sm"

                                      className={cn(

                                        "h-8 w-8 p-0",

                                        isStarred(entry.entry_id) ? "text-yellow-500 hover:text-yellow-600" : "hover:text-yellow-500"

                                      )}

                                      onClick={(e) => { e.stopPropagation(); toggleStarred(entry.entry_id); }}

                                    >

                                      <Star className={cn("h-4 w-4", isStarred(entry.entry_id) ? "fill-current" : "")} />

                                    </Button>

                                    <Button

                                      variant="ghost"

                                      size="sm"

                                      className="h-8 w-8 p-0"

                                      onClick={(e) => { e.stopPropagation(); openEdit(entry); }}

                                    >

                                      <Pencil className="h-4 w-4" />

                                    </Button>

                                    <Button

                                      variant="ghost"

                                      size="sm"

                                      className="h-8 w-8 p-0 text-destructive hover:bg-destructive/10"

                                      onClick={(e) => { e.stopPropagation(); setConfirmEntry(entry); }}

                                    >

                                      <Trash2 className="h-4 w-4" />

                                    </Button>

                                  </div>

                                </div>

                              ))}

                            </div>

                          </div>

                        )}

                      </div>

                    )}



                    {/* Storage Management Section */}

                    {sidebarSection === 'storage' && (

                      <div className="space-y-6">

                        {/* Storage Overview */}

                        <div className="space-y-4">

                          <div className="flex items-center justify-between">

                            <h3 className="text-lg font-semibold text-foreground">Storage Management</h3>

                            <div className="flex items-center gap-2 text-sm text-muted-foreground">

                              <span>{entries.length} entries</span>

                              <span>•</span>

                              <span>{formatFileSize(calculateTotalStorage(entries))} used</span>

                            </div>

                          </div>



                          {/* Storage Usage Card */}

                          <div className="p-6 rounded-xl border border-border/30 bg-gradient-to-br from-muted/20 via-muted/10 to-transparent">

                            <div className="space-y-4">

                              <div className="flex items-center justify-between">

                                <div className="flex items-center gap-3">

                                  <div className="p-2 rounded-lg bg-primary/10 border border-primary/20">

                                    <HardDrive className="h-5 w-5 text-primary" />

                                  </div>

                                  <div>

                                    <h4 className="font-semibold text-foreground">Storage Usage</h4>

                                    <p className="text-sm text-muted-foreground">Current storage consumption</p>

                                  </div>

                                </div>

                                <div className="text-right">

                                  <div className="text-2xl font-bold text-foreground">

                                    {(calculateTotalStorage(entries) / (1024 * 1024)).toFixed(1)} MB

                                  </div>

                                  <div className="text-sm text-muted-foreground">

                                    of {MAX_STORAGE_MB} MB

                                  </div>

                                </div>

                              </div>



                              {/* Progress Bar */}

                              <div className="space-y-2">

                                <div className="w-full bg-muted/50 rounded-full h-3">

                                  <div 

                                    className={cn(

                                      "h-3 rounded-full transition-all duration-500",

                                      calculateTotalStorage(entries) / MAX_STORAGE_BYTES > 0.9 

                                        ? "bg-destructive" 

                                        : calculateTotalStorage(entries) / MAX_STORAGE_BYTES > 0.7

                                        ? "bg-yellow-500"

                                        : "bg-primary"

                                    )}

                                    style={{ 

                                      width: `${Math.min((calculateTotalStorage(entries) / MAX_STORAGE_BYTES) * 100, 100)}%` 

                                    }}

                                  />

                                </div>

                                <div className="flex justify-between text-xs text-muted-foreground">

                                  <span>{Math.round((calculateTotalStorage(entries) / MAX_STORAGE_BYTES) * 100)}% used</span>

                                  <span>{MAX_STORAGE_MB - Number((calculateTotalStorage(entries) / (1024 * 1024)).toFixed(1))} MB remaining</span>

                                </div>

                              </div>

                            </div>

                          </div>



                          {/* Storage Breakdown */}

                          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">

                            <div className="p-4 rounded-lg border border-border/30 bg-muted/10">

                              <div className="flex items-center gap-2 mb-2">

                                <div className="p-1.5 rounded-lg bg-blue-500/10 border border-blue-500/20">

                                  <FileText className="h-4 w-4 text-blue-500" />

                                </div>

                                <span className="text-sm font-medium text-foreground">Text Content</span>

                              </div>

                              <div className="text-lg font-semibold text-foreground">

                                {formatFileSize(entries.reduce((total, entry) => {

                                  let size = 0;

                                  if (entry.content) size += new Blob([entry.content]).size;

                                  if (entry.title) size += new Blob([entry.title]).size;

                                  return total + size;

                                }, 0))}

                              </div>

                              <div className="text-xs text-muted-foreground">

                                {entries.filter(e => e.content || e.title).length} entries

                              </div>

                            </div>



                            <div className="p-4 rounded-lg border border-border/30 bg-muted/10">

                              <div className="flex items-center gap-2 mb-2">

                                <div className="p-1.5 rounded-lg bg-green-500/10 border border-green-500/20">

                                  <ImageIcon className="h-4 w-4 text-green-500" />

                                </div>

                                <span className="text-sm font-medium text-foreground">Images</span>

                              </div>

                              <div className="text-lg font-semibold text-foreground">

                                {formatFileSize(entries.filter(e => e.image_url).length * 50000)}

                              </div>

                              <div className="text-xs text-muted-foreground">

                                {entries.filter(e => e.image_url).length} images

                              </div>

                            </div>



                            <div className="p-4 rounded-lg border border-border/30 bg-muted/10">

                              <div className="flex items-center gap-2 mb-2">

                                <div className="p-1.5 rounded-lg bg-orange-500/10 border border-orange-500/20">

                                  <File className="h-4 w-4 text-orange-500" />

                                </div>

                                <span className="text-sm font-medium text-foreground">Files</span>

                              </div>

                              <div className="text-lg font-semibold text-foreground">

                                {formatFileSize(entries.reduce((total, entry) => total + (entry.file_size || 0), 0))}

                              </div>

                              <div className="text-xs text-muted-foreground">

                                {entries.filter(e => e.file_url).length} files

                              </div>

                            </div>

                          </div>

                        </div>



                        {/* Largest Files */}

                        <div className="space-y-4">

                          <h4 className="text-lg font-semibold text-foreground">Largest Files</h4>

                          <div className="space-y-2">

                            {entries

                              .map(entry => ({ ...entry, calculatedSize: calculateEntrySize(entry) }))

                              .sort((a, b) => b.calculatedSize - a.calculatedSize)

                              .slice(0, 10)

                              .map((entry) => (

                                <div

                                  key={entry.entry_id}

                                  className="flex items-center gap-3 p-3 rounded-lg border border-border/30 hover:border-border/60 transition-colors cursor-pointer"

                                  onClick={() => {

                                    setSelectedEntry(entry);

                                    setShowRightSidebar(true);

                                  }}

                                >

                                  <div className="p-2 rounded-lg bg-muted/50 border border-border/30">

                                    {getFileTypeIcon(entry)}

                                  </div>

                                  <div className="flex-1 min-w-0">

                                    <h5 className="font-medium text-foreground truncate">{entry.title}</h5>

                                    <p className="text-sm text-muted-foreground">{entry.category}</p>

                                  </div>

                                  <div className="text-right">

                                    <div className="text-sm font-semibold text-foreground">

                                      {formatFileSize(entry.calculatedSize)}

                                    </div>

                                    <div className="text-xs text-muted-foreground">

                                      {new Date(entry.created_at).toLocaleDateString()}

                                    </div>

                                  </div>

                                </div>

                              ))}

                          </div>

                        </div>

                      </div>

                    )}



                    {/* Home: show folders + unfiled entries */}

                    {sidebarSection === 'home' && (

                      <div className="space-y-6">

                        {/* Folders row */}

                        <div className="space-y-4">

                          <div className="flex items-center justify-between">

                            <h3 className="text-lg font-semibold text-foreground">Your Folders</h3>

                            <div className="flex items-center gap-2 text-sm text-muted-foreground">

                              <span>{folders.length + 1} folders</span>

                              <span>•</span>

                              <span>{entries.length} total items</span>

                            </div>

                          </div>

                          <div className={cn(

                            "grid gap-3",

                            viewMode === 'grid' ? "grid-cols-2 md:grid-cols-3 lg:grid-cols-4" : "grid-cols-1"

                          )}>

                            {[{ folder_id: 'unfiled', name: 'Unfiled' }, ...folders].map((folder) => {

                              const folderEntries = entries.filter((e) => (e.folder_id ?? 'unfiled') === folder.folder_id);

                              const isUnfiled = folder.folder_id === 'unfiled';

                              return (

                                <div

                                  key={folder.folder_id}

                                  className={cn(

                                    "group relative p-4 rounded-xl border border-border/30 hover:border-border/60 transition-all cursor-pointer bg-gradient-to-br from-background to-muted/10 hover:from-muted/5 hover:to-muted/20",

                                    viewMode === 'grid' ? "text-center" : "flex items-center gap-3"

                                  )}

                                  onClick={() => navigateToFolder(folder.folder_id, folder.name)}

                                >

                                  <div className={cn(

                                    "flex items-center gap-3",

                                    viewMode === 'grid' ? "flex-col" : "flex-row"

                                  )}>

                                    <div className={cn(

                                      "p-3 rounded-xl border transition-all duration-300",

                                      isUnfiled 

                                        ? "bg-muted/20 border-muted-foreground/20" 

                                        : "bg-primary/10 border-primary/20 group-hover:bg-primary/15 group-hover:border-primary/30"

                                    )}>

                                      <Folder className={cn(

                                        "h-6 w-6 transition-colors",

                                        isUnfiled ? "text-muted-foreground" : "text-primary"

                                      )} />

                                    </div>

                                    <div className="flex-1 min-w-0">

                                      <h4 className="font-semibold text-foreground truncate">{folder.name}</h4>

                                      <p className="text-sm text-muted-foreground">

                                        {folderEntries.length} {folderEntries.length === 1 ? 'item' : 'items'}

                                      </p>

                                      {folderEntries.length > 0 && (

                                        <p className="text-xs text-muted-foreground mt-1">

                                          Last updated: {new Date(Math.max(...folderEntries.map(e => new Date(e.updated_at).getTime()))).toLocaleDateString()}

                                        </p>

                                      )}

                                    </div>

                                  </div>

                                  {isUnfiled && (

                                    <div className="absolute top-2 left-2">

                                      <div className="px-2 py-1 rounded-full bg-muted/50 border border-border/30 text-xs text-muted-foreground">

                                        Default

                                      </div>

                                    </div>

                                  )}

                                </div>

                              );

                            })}

                          </div>

                        </div>



                        {/* Unfiled entries */}

                        <div className="space-y-2">

                          <h3 className="text-sm font-medium text-muted-foreground mb-4">Unfiled Files</h3>

                          {viewMode === 'grid' ? (

                            <div className={cn(

                              "grid gap-2",

                              "grid-cols-2 md:grid-cols-3 lg:grid-cols-4"

                            )}>

                              {getFilteredAndSortedEntries()

                                .filter((entry) => !entry.folder_id)

                                .map((entry) => (

                                  <div

                                    key={entry.entry_id}

                                    className={cn(

                                      "group relative p-4 rounded-lg border border-border/30 hover:border-border/60 transition-all cursor-pointer",

                                      "text-center"

                                    )}

                                    onClick={() => {

                                      setSelectedEntry(entry);

                                      setShowRightSidebar(true);

                                    }}

                                  >

                                    <div className="flex items-center gap-3 flex-col">

                                      <div className="p-2 rounded-lg bg-muted/50 border border-border/30">

                                        {getFileTypeIcon(entry)}

                                      </div>

                                      <div className="flex-1 min-w-0">

                                        <h4 className="font-medium text-foreground truncate">{entry.title}</h4>

                                        <p className="text-sm text-muted-foreground">

                                          {entry.category}

                                        </p>

                                        <p className="text-xs text-muted-foreground">

                                          {new Date(entry.created_at).toLocaleDateString()}

                                        </p>

                                      </div>

                                    </div>

                                    {/* Action buttons */}

                                    <div className="absolute top-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">

                                      <Button

                                        variant="ghost"

                                        size="sm"

                                        className={cn(

                                          "h-8 w-8 p-0",

                                          isStarred(entry.entry_id) ? "text-yellow-500 hover:text-yellow-600" : "hover:text-yellow-500"

                                        )}

                                        onClick={(e) => {

                                          e.stopPropagation();

                                          toggleStarred(entry.entry_id);

                                        }}

                                      >

                                        <Star className={cn("h-4 w-4", isStarred(entry.entry_id) ? "fill-current" : "")} />

                                      </Button>

                                      <Button

                                        variant="ghost"

                                        size="sm"

                                        className="h-8 w-8 p-0"

                                        onClick={(e) => {

                                          e.stopPropagation();

                                          openEdit(entry);

                                        }}

                                      >

                                        <Pencil className="h-4 w-4" />

                                      </Button>

                                      <Button

                                        variant="ghost"

                                        size="sm"

                                        className="h-8 w-8 p-0 text-destructive hover:bg-destructive/10"

                                        onClick={(e) => {

                                          e.stopPropagation();

                                          setConfirmEntry(entry);

                                        }}

                                      >

                                        <Trash2 className="h-4 w-4" />

                                      </Button>

                                    </div>

                                    {/* Status */}

                                    <div className="absolute bottom-2 left-2">

                                      <Switch

                                        checked={entry.is_active}

                                        onCheckedChange={(checked) => toggleActive(entry, checked)}

                                        className="h-4 w-7"

                                      />

                                    </div>

                                  </div>

                                ))}

                            </div>

                          ) : (

                            <div className="bg-background border border-border/30 rounded-lg overflow-hidden">

                              <div className="grid grid-cols-5 gap-4 px-4 py-3 bg-muted/30 border-b border-border/30 text-sm font-medium text-muted-foreground">

                                <div>Name</div>

                                <div>Content</div>

                                <div>Created at</div>

                                <div>Status</div>

                                <div>Actions</div>

                              </div>

                              <div className="divide-y divide-border/30">

                                {getFilteredAndSortedEntries()

                                  .filter((entry) => !entry.folder_id)

                                  .map((entry) => (

                                    <div

                                      key={entry.entry_id}

                                      className="grid grid-cols-5 gap-4 px-4 py-3 hover:bg-muted/20 transition-colors cursor-pointer"

                                      onClick={() => {

                                        setSelectedEntry(entry);

                                        setShowRightSidebar(true);

                                      }}

                                    >

                                      {/* Name */}

                                      <div className="flex items-center gap-2 min-w-0">

                                        <div className="p-1 rounded bg-muted/50 border border-border/30">

                                          {getFileTypeIcon(entry)}

                                        </div>

                                        <div className="min-w-0 flex-1">

                                          <div className="font-medium text-foreground truncate">{entry.title}</div>

                                          <div className="text-xs text-muted-foreground">{entry.category}</div>

                                        </div>

                                      </div>

                                      {/* Content */}

                                      <div className="flex items-center text-sm text-muted-foreground min-w-0">

                                        <span className="truncate block max-w-[420px]" title={entry.content || entry.title}>

                                          {entry.content || entry.title}

                                        </span>

                                      </div>

                                      {/* Created at */}

                                      <div className="flex items-center text-sm text-muted-foreground">

                                        {new Date(entry.created_at).toLocaleDateString()}

                                      </div>

                                      {/* Status */}

                                      <div className="flex items-center">

                                        <Switch

                                          checked={entry.is_active}

                                          onCheckedChange={(checked) => toggleActive(entry, checked)}

                                          className="h-4 w-7"

                                          onClick={(e) => e.stopPropagation()}

                                        />

                                      </div>

                                      {/* Actions */}

                                      <div className="flex items-center gap-1">

                                        <Button

                                          variant="ghost"

                                          size="sm"

                                          className={cn(

                                            "h-8 w-8 p-0",

                                            isStarred(entry.entry_id) ? "text-yellow-500 hover:text-yellow-600" : "hover:text-yellow-500"

                                          )}

                                          onClick={(e) => { e.stopPropagation(); toggleStarred(entry.entry_id); }}

                                        >

                                          <Star className={cn("h-4 w-4", isStarred(entry.entry_id) ? "fill-current" : "")} />

                                        </Button>

                                        <Button variant="ghost" size="sm" className="h-8 w-8 p-0" onClick={(e) => { e.stopPropagation(); openEdit(entry); }}>

                                          <Pencil className="h-4 w-4" />

                                        </Button>

                                        <Button

                                          variant="ghost"

                                          size="sm"

                                          className="h-8 w-8 p-0 text-destructive hover:bg-destructive/10"

                                          onClick={(e) => { e.stopPropagation(); setConfirmEntry(entry); }}

                                        >

                                          <Trash2 className="h-4 w-4" />

                                        </Button>

                                      </div>

                                    </div>

                                  ))}

                              </div>

                            </div>

                          )}

                        </div>

                      </div>

                    )}



                    {/* Files (non-home) */}

                    {(sidebarSection === 'recent' || sidebarSection === 'starred') && (

                      <div className="space-y-2">

                        <h3 className="text-sm font-medium text-muted-foreground mb-4">

                          {sidebarSection === 'recent' ? 'Recent Files' : 'Starred Files'}

                        </h3>

                        {viewMode === 'grid' ? (

                      <div className={cn(

                        "grid gap-2",

                            "grid-cols-2 md:grid-cols-3 lg:grid-cols-4"

                      )}>

                        {getFilteredAndSortedEntries().map((entry) => (

                          <div

                            key={entry.entry_id}

                            className={cn(

                              "group relative p-4 rounded-lg border border-border/30 hover:border-border/60 transition-all cursor-pointer",

                                  "text-center"

                            )}

                            onClick={() => {

                              setSelectedEntry(entry);

                              setShowRightSidebar(true);

                            }}

                          >

                                <div className="flex items-center gap-3 flex-col">

                              <div className="p-2 rounded-lg bg-muted/50 border border-border/30">

                                {getFileTypeIcon(entry)}

                              </div>

                              <div className="flex-1 min-w-0">

                                <h4 className="font-medium text-foreground truncate">{entry.title}</h4>

                                <p className="text-sm text-muted-foreground">

                                      {entry.category}

                                </p>

                                <p className="text-xs text-muted-foreground">

                                  {new Date(entry.created_at).toLocaleDateString()}

                                </p>

                              </div>

                            </div>

                            {/* Action buttons */}

                            <div className="absolute top-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">

                              <Button

                                variant="ghost"

                                size="sm"

                                className={cn(

                                  "h-8 w-8 p-0",

                                  isStarred(entry.entry_id) ? "text-yellow-500 hover:text-yellow-600" : "hover:text-yellow-500"

                                )}

                                onClick={(e) => {

                                  e.stopPropagation();

                                  toggleStarred(entry.entry_id);

                                }}

                              >

                                <Star className={cn("h-4 w-4", isStarred(entry.entry_id) ? "fill-current" : "")} />

                              </Button>

                              <Button

                                variant="ghost"

                                size="sm"

                                className="h-8 w-8 p-0"

                                onClick={(e) => {

                                  e.stopPropagation();

                                  openEdit(entry);

                                }}

                              >

                                <Pencil className="h-4 w-4" />

                              </Button>

                              <Button

                                variant="ghost"

                                size="sm"

                                className="h-8 w-8 p-0 text-destructive hover:bg-destructive/10"

                                onClick={(e) => {

                                  e.stopPropagation();

                                  setConfirmEntry(entry);

                                }}

                              >

                                <Trash2 className="h-4 w-4" />

                              </Button>

                                </div>

                                {/* Status */}

                                <div className="absolute bottom-2 left-2">

                                  <Switch

                                    checked={entry.is_active}

                                    onCheckedChange={(checked) => toggleActive(entry, checked)}

                                    className="h-4 w-7"

                                  />

                                </div>

                              </div>

                            ))}

                          </div>

                        ) : (

                          <div className="bg-background border border-border/30 rounded-lg overflow-hidden">

                            {/* Table Header */}

                            <div className="grid grid-cols-6 gap-4 px-4 py-3 bg-muted/30 border-b border-border/30 text-sm font-medium text-muted-foreground">

                              <div>Name</div>

                              <div>Content</div>

                              <div>View</div>

                              <div>Created at</div>

                              <div>Status</div>

                              <div>Actions</div>

                            </div>



                            {/* Table Body */}

                            <div className="divide-y divide-border/30">

                              {getFilteredAndSortedEntries().map((entry) => (

                                <div

                                  key={entry.entry_id}

                                  className="grid grid-cols-6 gap-4 px-4 py-3 hover:bg-muted/20 transition-colors"

                                >

                                  {/* Name */}

                                  <div className="flex items-center gap-2 min-w-0">

                                    <div className="p-1 rounded bg-muted/50 border border-border/30">

                                      {getFileTypeIcon(entry)}

                                    </div>

                                    <div className="min-w-0 flex-1">

                                      <div className="font-medium text-foreground truncate">{entry.title}</div>

                                      <div className="text-xs text-muted-foreground">{entry.category}</div>

                                    </div>

                                  </div>

                                  
                                  
                                  {/* Content */}

                                  <div className="flex items-center text-sm text-muted-foreground min-w-0">

                                    <span

                                      className="truncate block max-w-[420px]"

                                      title={entry.content || entry.title}

                                    >

                                      {entry.content || entry.title}

                                    </span>

                                  </div>

                                  
                                  
                                  {/* View */}

                                  <div className="flex items-center">

                                    <Button

                                      variant="ghost"

                                      size="sm"

                                      className="h-8 w-8 p-0 hover:bg-muted/50"

                                      onClick={(e) => {

                                        e.stopPropagation();

                                        console.log('View button clicked for entry:', entry.title);

                                        setSelectedEntry(entry);

                                        setShowRightSidebar(true);

                                      }}

                                    >

                                      <Eye className="h-4 w-4" />

                                    </Button>

                                  </div>

                                  
                                  
                                  {/* Created at */}

                                  <div className="flex items-center text-sm text-muted-foreground">

                                    {new Date(entry.created_at).toLocaleDateString()}

                                  </div>

                                  
                                  
                                  {/* Status */}

                                  <div className="flex items-center">

                                    <Switch

                                      checked={entry.is_active}

                                      onCheckedChange={(checked) => {

                                        toggleActive(entry, checked);

                                      }}

                                      className="h-4 w-7"

                                    />

                                  </div>

                                  
                                  
                                  {/* Actions */}

                                  <div className="flex items-center gap-1">

                                    <Button

                                      variant="ghost"

                                      size="sm"

                                      className={cn(

                                        "h-8 w-8 p-0",

                                        isStarred(entry.entry_id) ? "text-yellow-500 hover:text-yellow-600" : "hover:text-yellow-500"

                                      )}

                                      onClick={() => toggleStarred(entry.entry_id)}

                                    >

                                      <Star className={cn("h-4 w-4", isStarred(entry.entry_id) ? "fill-current" : "")} />

                                    </Button>

                                    <Button

                                      variant="ghost"

                                      size="sm"

                                      className="h-8 w-8 p-0"

                                      onClick={() => openEdit(entry)}

                                    >

                                      <Pencil className="h-4 w-4" />

                                    </Button>

                                    <Button

                                      variant="ghost"

                                      size="sm"

                                      className="h-8 w-8 p-0 text-destructive hover:bg-destructive/10"

                                      onClick={() => setConfirmEntry(entry)}

                                    >

                                      <Trash2 className={"h-4 w-4"} />

                                    </Button>

                            </div>

                          </div>

                        ))}

                      </div>

                          </div>

                        )}

                    </div>

                    )}

                  </>

                )}

              </div>

            ) : (

              // Add Knowledge Form

              <div className="space-y-8">

                {errorMsg && (

                  <div className="flex items-center gap-3 text-sm text-destructive border border-destructive/40 rounded-xl p-4 mb-6 bg-gradient-to-r from-destructive/10 to-destructive/5 shadow-lg">

                    <div className="p-1.5 rounded-lg bg-destructive/20">

                      <i className="ri-error-warning-line text-base"></i>

                    </div>

                    <span className="font-medium">{errorMsg}</span>

                  </div>

                )}



                <div className="space-y-8">

                  {/* Entry Title */}

                  <div className="space-y-3">

                    <div className="flex items-center gap-2">

                      <div className="p-1.5 rounded-lg bg-primary/10 border border-primary/20">

                        <i className="ri-text text-primary text-sm"></i>

                      </div>

                      <label className="text-base font-semibold text-foreground">Entry Title</label>

                    </div>

                    <Input 

                      placeholder="Enter a descriptive title for your knowledge entry" 

                      value={title} 

                      maxLength={MAX_TITLE_CHARS}

                      onChange={(e) => setTitle(e.target.value)}

                      className="bg-background/60 border-border/60 focus:border-primary/60 focus:ring-primary/30 rounded-xl h-12 text-base shadow-sm"

                    />

                    <div className="flex items-center justify-end text-xs text-muted-foreground font-medium">

                      {title.length}/{MAX_TITLE_CHARS} characters

                    </div>

                  </div>



                  {/* Category and Folder - Side by Side */}

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

                    {/* Category */}

                    <div className="space-y-3">

                      <div className="flex items-center gap-2">

                        <div className="p-1.5 rounded-lg bg-blue-500/10 border border-blue-500/20">

                          <i className="ri-folder-line text-blue-500 text-sm"></i>

                        </div>

                        <label className="text-base font-semibold text-foreground">Category</label>

                      </div>

                      <Select value={category} onValueChange={(value) => setCategory(value as any)}>

                        <SelectTrigger className="bg-background/60 border-border/60 focus:border-primary/60 focus:ring-primary/30 rounded-xl h-12 text-base shadow-sm">

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



                    {/* Folder selection */}

                    <div className="space-y-3">

                      <div className="flex items-center gap-2">

                        <div className="p-1.5 rounded-lg bg-purple-500/10 border border-purple-500/20">

                          <i className="ri-folder-2-line text-purple-500 text-sm"></i>

                        </div>

                        <label className="text-base font-semibold text-foreground">Folder</label>

                      </div>

                      <Select value={selectedFolderId} onValueChange={(value) => setSelectedFolderId(value)}>

                        <SelectTrigger className="bg-background/60 border-border/60 focus:border-primary/60 focus:ring-primary/30 rounded-xl h-12 text-base shadow-sm">

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

                  </div>



                  {/* Entry Content */}

                  <div className="space-y-3">

                    <div className="flex items-center gap-2">

                      <div className="p-1.5 rounded-lg bg-green-500/10 border border-green-500/20">

                        <i className="ri-file-text-line text-green-500 text-sm"></i>

                      </div>

                      <label className="text-base font-semibold text-foreground">Entry Content</label>

                    </div>

                    <Textarea 

                      placeholder="Enter the knowledge content, guidelines, or information" 

                      value={content}

                      onChange={(e) => setContent(e.target.value.slice(0, MAX_CONTENT_CHARS))}

                      maxLength={MAX_CONTENT_CHARS}

                      className="bg-background/60 border-border/60 focus:border-primary/60 focus:ring-primary/30 resize-none h-[140px] overflow-y-auto overflow-x-hidden break-all whitespace-pre-wrap rounded-xl text-base shadow-sm"

                      rows={5}

                    />

                    <div className="flex items-center justify-end text-xs text-muted-foreground font-medium">

                      {content.length}/{MAX_CONTENT_CHARS} characters

                    </div>

                  </div>



                  {/* Attachment Upload (Image or Document) */}

                  <div className="space-y-3">

                    <div className="flex items-center gap-2">

                      <div className="p-1.5 rounded-lg bg-orange-500/10 border border-orange-500/20">

                        <i className="ri-attachment-line text-orange-500 text-sm"></i>

                      </div>

                      <label className="text-base font-semibold text-foreground">Attachment (Optional)</label>

                    </div>

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

                      <div className="border-2 border-dashed border-border/50 rounded-2xl p-8 text-center bg-gradient-to-br from-muted/30 via-muted/20 to-muted/10 hover:from-muted/40 hover:via-muted/30 hover:to-muted/20 transition-all duration-300 group cursor-pointer">

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

                          <div className="p-4 rounded-2xl bg-primary/10 border border-primary/20 group-hover:bg-primary/15 group-hover:border-primary/30 transition-all duration-300 mb-4 inline-block">

                            <Upload className="h-10 w-10 text-primary group-hover:scale-110 transition-transform duration-300" />

                          </div>

                          <p className="text-base font-semibold text-foreground mb-2">Click to upload an image or file</p>

                          <p className="text-sm text-muted-foreground">Images up to 10MB • Files up to 50MB</p>

                        </label>

                        {selectedFile && (

                          <div className="mt-4 px-4 py-2 bg-primary/10 border border-primary/20 rounded-xl text-sm text-primary font-medium">

                            {selectedFile.name} ({Math.round(selectedFile.size/1024)} KB)

                          </div>

                        )}

                      </div>

                    )}

                  </div>



                  {/* Action Buttons */}

                  <div className="flex justify-end gap-4 pt-6 border-t border-border/40">

                    <Button 

                      variant="outline" 

                      onClick={handleCancelAdd}

                      disabled={uploadingImage || uploadingFile}

                      className="border-border/60 hover:bg-muted/50 px-6 py-3 rounded-xl font-semibold transition-all duration-200"

                    >

                      Cancel

                    </Button>

                    <Button 

                      onClick={createEntry} 

                      disabled={uploadingImage || uploadingFile || (!title.trim() || !content.trim())}

                      className="group bg-gradient-to-r from-primary via-primary/95 to-primary hover:from-primary/90 hover:via-primary hover:to-primary/90 text-primary-foreground shadow-xl hover:shadow-2xl transition-all duration-300 px-8 py-3 rounded-xl font-semibold"

                    >

                      {uploadingImage || uploadingFile ? (

                        <div className="flex items-center gap-2">

                          <Loader2 className="h-4 w-4 animate-spin" />

                          <span>Uploading...</span>

                        </div>

                      ) : (

                        <div className="flex items-center gap-2">

                          <i className="ri-save-line text-lg group-hover:scale-110 transition-transform duration-200"></i>

                          <span>Save Entry</span>

                        </div>

                      )}

                    </Button>

                  </div>

                </div>

              </div>

            )}

          </div>



          {/* Right Sidebar - File Details */}

          {showRightSidebar && selectedEntry && (

            <div className="w-80 border-l border-border/30 bg-muted/20 p-6">

              <div className="space-y-6">

                {/* Header */}

                <div className="flex items-center justify-between">

                  <h3 className="text-lg font-semibold text-foreground">Details</h3>

                  <Button

                    variant="ghost"

                    size="sm"

                    onClick={() => setShowRightSidebar(false)}

                    className="h-8 w-8 p-0"

                  >

                    <X className="h-4 w-4" />

                  </Button>

                </div>



                {/* File Info */}

                <div className="space-y-4">

                  <div className="flex items-center gap-3">

                    <div className="p-2 rounded-lg bg-muted/50 border border-border/30">

                      {getFileTypeIcon(selectedEntry)}

                    </div>

                    <div className="flex-1 min-w-0">

                      <h4 className="font-medium text-foreground truncate">{selectedEntry.title}</h4>

                      <p className="text-sm text-muted-foreground">{selectedEntry.category}</p>

                    </div>

                  </div>



                  {/* File Details */}

                  <div className="space-y-3 text-sm">

                    <div className="flex justify-between">

                      <span className="text-muted-foreground">Size</span>

                      <span className="text-foreground">{formatFileSize(calculateEntrySize(selectedEntry))}</span>

                    </div>

                    <div className="flex justify-between">

                      <span className="text-muted-foreground">Created</span>

                      <span className="text-foreground">{new Date(selectedEntry.created_at).toLocaleDateString()}</span>

                    </div>

                    <div className="flex justify-between">

                      <span className="text-muted-foreground">Modified</span>

                      <span className="text-foreground">{new Date(selectedEntry.updated_at).toLocaleDateString()}</span>

                    </div>

                    <div className="flex justify-between">

                      <span className="text-muted-foreground">Status</span>

                      <div className="flex items-center gap-2">

                        <div className={cn(

                          "w-2 h-2 rounded-full",

                          selectedEntry.is_active ? "bg-green-500" : "bg-muted-foreground"

                        )} />

                        <span className="text-foreground">

                          {selectedEntry.is_active ? 'Active' : 'Inactive'}

                        </span>

                      </div>

                    </div>

                  </div>



                  {/* Content Preview */}

                  {selectedEntry.content && (

                    <div className="space-y-2">

                      <h5 className="text-sm font-medium text-foreground">Content</h5>

                      <div className="p-3 bg-muted/30 rounded-lg border border-border/30">

                        <p className="text-sm text-foreground/90 line-clamp-4">

                          {selectedEntry.content}

                        </p>

                      </div>

                    </div>

                  )}



                  {/* Actions */}

                  <div className="space-y-2 pt-4 border-t border-border/30">

                    <Button

                      variant="outline"

                      size="sm"

                      className={cn(

                        "w-full justify-start",

                        isStarred(selectedEntry.entry_id) ? "text-yellow-500 hover:text-yellow-600" : "hover:text-yellow-500"

                      )}

                      onClick={() => toggleStarred(selectedEntry.entry_id)}

                    >

                      <Star className={cn("h-4 w-4 mr-2", isStarred(selectedEntry.entry_id) ? "fill-current" : "")} />

                      {isStarred(selectedEntry.entry_id) ? 'Remove from Starred' : 'Add to Starred'}

                    </Button>

                    <Button

                      variant="outline"

                      size="sm"

                      className="w-full justify-start"

                      onClick={() => {

                        openEdit(selectedEntry);

                        setShowRightSidebar(false);

                      }}

                    >

                      <Pencil className="h-4 w-4 mr-2" />

                      Edit

                    </Button>

                    <Button

                      variant="outline"

                      size="sm"

                      className="w-full justify-start"

                      onClick={() => setViewEntryState(selectedEntry)}

                    >

                      <Eye className="h-4 w-4 mr-2" />

                      View Full

                    </Button>

                    <Button

                      variant="outline"

                      size="sm"

                      className="w-full justify-start text-destructive hover:bg-destructive/10"

                      onClick={() => {

                        setConfirmEntry(selectedEntry);

                        setShowRightSidebar(false);

                      }}

                    >

                      <Trash2 className="h-4 w-4 mr-2" />

                      Delete

                    </Button>

                  </div>

                </div>

              </div>

            </div>

          )}

        </div>

      </div>



      {/* Delete Confirmation Dialog */}

      {confirmEntry && (

        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">

          <div className="bg-background border border-border/50 rounded-lg p-6 max-w-md w-full mx-4">

            <div className="flex items-center gap-2 text-destructive mb-4">

              <Trash2 className="h-4 w-4" />

              <h3 className="text-lg font-semibold">Delete Entry</h3>

            </div>

            <p className="text-sm text-muted-foreground mb-4">

              This action cannot be undone. The entry will be permanently deleted.

            </p>

            <div className="p-3 bg-muted/30 rounded-lg border border-border/30 mb-4">

              <p className="text-sm font-medium text-foreground/90">

                "{confirmEntry.title}"

              </p>

              <p className="text-xs text-muted-foreground mt-1">

                {confirmEntry.category} • {new Date(confirmEntry.created_at).toLocaleDateString()}

              </p>

            </div>

            <div className="flex justify-end gap-3">

              <Button 

                variant="outline" 

                onClick={() => setConfirmEntry(null)} 

                disabled={!!deletingId}

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

          </div>

        </div>

      )}



      {/* Edit Entry Dialog */}

      {editEntry && (

        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">

          <div className="bg-background border border-border/50 rounded-lg p-6 max-w-lg w-full mx-4 max-h-[90vh] overflow-y-auto">

            <div className="flex items-center gap-2 mb-4">

              <Pencil className="h-4 w-4 text-primary" />

              <h3 className="text-lg font-semibold">Edit Entry</h3>

            </div>

            <div className="space-y-4">

              <Input 

                placeholder="Entry title" 

                value={editTitle} 

                maxLength={MAX_TITLE_CHARS}

                onChange={(e) => setEditTitle(e.target.value)}

              />

              <div className="flex items-center justify-end text-xs text-muted-foreground">

                {editTitle.length}/{MAX_TITLE_CHARS}

              </div>

              <Select value={editCategory} onValueChange={(value) => setEditCategory(value as any)}>

                <SelectTrigger>

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

              <div className="space-y-2">

                <label className="text-sm font-medium text-foreground/80">Folder</label>

                <Select value={editSelectedFolderId} onValueChange={(value) => setEditSelectedFolderId(value)}>

                  <SelectTrigger>

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

                className="resize-none h-[120px]"

                rows={6}

              />

              <div className="flex items-center justify-end text-xs text-muted-foreground">

                {editContent.length}/{MAX_CONTENT_CHARS}

              </div>



              {/* Attachment Upload (Image or Document) */}

              <div className="space-y-3">

                <div className="flex items-center gap-2">

                  <div className="p-1.5 rounded-lg bg-orange-500/10 border border-orange-500/20">

                    <i className="ri-attachment-line text-orange-500 text-sm"></i>

                  </div>

                  <label className="text-sm font-medium text-foreground/80">Attachment (Optional)</label>

                </div>

                {editImagePreview ? (

                  <div className="relative rounded-lg overflow-hidden border border-border/30">

                    <img src={editImagePreview} alt="Preview" className="w-full h-32 object-cover" />

                    <button

                      type="button"

                      onClick={() => {

                        setEditSelectedImage(null);

                        setEditImagePreview(null);

                      }}

                      className="absolute top-2 right-2 bg-destructive/90 hover:bg-destructive text-destructive-foreground rounded-full p-1.5 transition-colors"

                    >

                      <X className="h-3 w-3" />

                    </button>

                  </div>

                ) : editUploadedFileInfo ? (

                  <div className="flex items-center justify-between p-3 bg-muted/30 rounded-lg border border-border/30">

                    <div className="flex items-center gap-3">

                      <div className="p-2 rounded-lg bg-primary/10 border border-primary/20">

                        <File className="h-4 w-4 text-primary" />

                      </div>

                      <div>

                        <p className="text-sm font-medium text-foreground">{editUploadedFileInfo.file_name}</p>

                        <p className="text-xs text-muted-foreground">{formatFileSize(editUploadedFileInfo.file_size)}</p>

                      </div>

                    </div>

                    <Button

                      variant="ghost"

                      size="sm"

                      className="h-8 w-8 p-0 text-destructive hover:bg-destructive/10"

                      onClick={() => setEditUploadedFileInfo(null)}

                    >

                      <X className="h-4 w-4" />

                    </Button>

                  </div>

                ) : (

                  <div className="border-2 border-dashed border-border/50 rounded-lg p-4 text-center bg-gradient-to-br from-muted/30 via-muted/20 to-muted/10 hover:from-muted/40 hover:via-muted/30 hover:to-muted/20 transition-all duration-300 group cursor-pointer">

                    <input

                      type="file"

                      accept="image/*,.pdf,.doc,.docx,.csv,.txt,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document,text/csv,text/plain"

                      onChange={(e) => {

                        const file = e.target.files?.[0] || null;

                        if (!file) return;

                        if (!isImageFile(file) && file.size > 50 * 1024 * 1024) {

                          toast.error('File is larger than 50MB. Please choose a smaller file.');

                          e.currentTarget.value = '';

                          setEditSelectedFile(null);

                          return;

                        }

                        if (isImageFile(file)) {

                          handleImageSelect(file, true);

                          setEditSelectedFile(null);

                        } else {

                          setEditSelectedFile(file);

                          setEditSelectedImage(null);

                          setEditImagePreview(null);

                        }

                      }}

                      className="hidden"

                      id="edit-attachment-upload"

                    />

                    <label htmlFor="edit-attachment-upload" className="cursor-pointer block">

                      <div className="p-3 rounded-lg bg-primary/10 border border-primary/20 group-hover:bg-primary/15 group-hover:border-primary/30 transition-all duration-300 mb-3 inline-block">

                        <Upload className="h-6 w-6 text-primary group-hover:scale-110 transition-transform duration-300" />

                      </div>

                      <p className="text-sm text-muted-foreground group-hover:text-foreground transition-colors">

                        Click to upload or drag and drop

                      </p>

                      <p className="text-xs text-muted-foreground mt-1">

                        Images, PDFs, Word docs, CSV files (max 50MB)

                      </p>

                    </label>

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

                >

                  Cancel

                </Button>

                <Button 

                  onClick={saveEdit} 

                  disabled={savingEdit || editUploadingImage || editUploadingFile || !editTitle.trim()}

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

          </div>

        </div>

      )}



      {/* View Entry Dialog */}

      {viewEntryState && (

        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">

          <div className="bg-background border border-border/50 rounded-lg p-6 max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">

            <div className="flex items-center gap-2 mb-4">

              <Eye className="h-4 w-4 text-primary" />

              <h3 className="text-lg font-semibold">{viewEntryState.title}</h3>

            </div>

            <div className="space-y-4">

              {viewEntryState.content && (

                <div className="text-sm text-foreground/90 whitespace-pre-wrap border border-border/30 rounded-md p-3 bg-muted/20">

                  {viewEntryState.content}

                </div>

              )}

              {!viewEntryState.content && !viewEntryState.image_url && !viewEntryState.file_url && (

                <div className="text-sm text-muted-foreground">No preview available for this entry.</div>

              )}

            </div>

            <div className="flex justify-end mt-4">

              <Button variant="outline" onClick={() => setViewEntryState(null)}>Close</Button>

            </div>

          </div>

        </div>

      )}



      {/* Delete Folder Confirmation */}

      {confirmDeleteFolder && (

        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">

          <div className="bg-background border border-border/50 rounded-lg p-6 max-w-md w-full mx-4">

            <div className="flex items-center gap-2 text-destructive mb-4">

              <Trash2 className="h-4 w-4" />

              <h3 className="text-lg font-semibold">Delete Folder</h3>

            </div>

            <p className="text-sm text-muted-foreground mb-4">

              This action cannot be undone. The folder will be permanently deleted and all entries in this folder will be moved to "Unfiled".

            </p>

            <div className="p-3 bg-muted/30 rounded-lg border border-border/30 mb-4">

              <p className="text-sm font-medium text-foreground/90">

                "{confirmDeleteFolder.name}"

              </p>

              <p className="text-xs text-muted-foreground mt-1">

                All entries in this folder will be moved to "Unfiled"

              </p>

            </div>

            <div className="flex justify-end gap-3">

              <Button 

                variant="outline" 

                onClick={() => setConfirmDeleteFolder(null)} 

              >

                Cancel

              </Button>

              <Button

                variant="destructive"

                onClick={async () => {

                  if (!confirmDeleteFolder) return;

                  await deleteFolder(confirmDeleteFolder.folder_id);

                  setConfirmDeleteFolder(null);

                }}

              >

                <Trash2 className="h-4 w-4 mr-2" />

                Delete Folder

              </Button>

            </div>

          </div>

        </div>

      )}

    </div>

  );

}


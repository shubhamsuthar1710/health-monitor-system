"use client";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  FileText,
  Upload,
  Trash2,
  Download,
  Search,
  File,
  ImageIcon,
  FileSpreadsheet,
  Loader2,
  Activity,
  Calendar,
  HardDrive,
  Plus,
  X,
  User,
  Settings,
  Bell,
} from "lucide-react";

const documentTypes = [
  { value: "all", label: "All Documents" },
  { value: "lab_result", label: "Lab Results" },
  { value: "prescription", label: "Prescriptions" },
  { value: "imaging", label: "Imaging/X-Ray" },
  { value: "insurance", label: "Insurance" },
  { value: "vaccination", label: "Vaccinations" },
  { value: "discharge_summary", label: "Discharge Summary" },
  { value: "other", label: "Other" },
];

const documentTypeColors = {
  lab_result: "bg-blue-100 text-blue-600 dark:bg-blue-900 dark:text-blue-300",
  prescription: "bg-purple-100 text-purple-600 dark:bg-purple-900 dark:text-purple-300",
  imaging: "bg-pink-100 text-pink-600 dark:bg-pink-900 dark:text-pink-300",
  insurance: "bg-green-100 text-green-600 dark:bg-green-900 dark:text-green-300",
  vaccination: "bg-yellow-100 text-yellow-600 dark:bg-yellow-900 dark:text-yellow-300",
  discharge_summary: "bg-primary/10 text-primary",
  other: "bg-muted text-muted-foreground",
};

function getFileIcon(fileName) {
  if (!fileName) return File;
  const ext = fileName.split(".").pop()?.toLowerCase();
  if (["jpg", "jpeg", "png", "gif", "webp"].includes(ext || "")) return ImageIcon;
  if (["xls", "xlsx", "csv"].includes(ext || "")) return FileSpreadsheet;
  return FileText;
}

function formatFileSize(bytes) {
  if (!bytes) return "Unknown";
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function formatDate(dateString) {
  return new Date(dateString).toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

export function DocumentsContent({ documents }) {
  const router = useRouter();
  const fileInputRef = useRef(null);
  const [filter, setFilter] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [uploadDialog, setUploadDialog] = useState(false);
  const [deleteDoc, setDeleteDoc] = useState(null);
  const [isUploading, setIsUploading] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [previewDoc, setPreviewDoc] = useState(null);
  const [downloadingId, setDownloadingId] = useState(null);

  const [uploadForm, setUploadForm] = useState({
    title: "",
    document_type: "",
    notes: "",
    file: null,
  });

  // Stats calculations
  const totalDocs = documents.length;
  const thisMonthDocs = documents.filter(doc => {
    const docDate = new Date(doc.uploaded_at);
    const now = new Date();
    return docDate.getMonth() === now.getMonth() && 
           docDate.getFullYear() === now.getFullYear();
  }).length;
  
  const totalSize = documents.reduce((acc, doc) => acc + (doc.file_size || 0), 0);
  const storageUsed = formatFileSize(totalSize);

  // Filter documents
  const filteredDocuments = documents.filter((doc) => {
    const matchesFilter = filter === "all" || doc.document_type === filter;
    const matchesSearch =
      doc.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      doc.file_name?.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  // Get recent documents (last 3)
  const recentDocs = [...documents]
    .sort((a, b) => new Date(b.uploaded_at) - new Date(a.uploaded_at))
    .slice(0, 3);

  const handleFileSelect = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      setUploadForm({
        ...uploadForm,
        file,
        title: uploadForm.title || file.name.replace(/\.[^/.]+$/, ""),
      });
    }
  };

  const handleUpload = async () => {
    if (!uploadForm.file || !uploadForm.title) return;

    setIsUploading(true);
    const supabase = getSupabaseBrowserClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      setIsUploading(false);
      return;
    }

    try {
      const filePath = `${user.id}/${Date.now()}-${uploadForm.file.name}`;
      const { error: uploadError } = await supabase.storage
        .from('documents')
        .upload(filePath, uploadForm.file);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('documents')
        .getPublicUrl(filePath);

      const { error: insertError } = await supabase.from("documents").insert({
        user_id: user.id,
        title: uploadForm.title,
        file_name: uploadForm.file.name,
        file_url: publicUrl,
        file_size: uploadForm.file.size,
        document_type: uploadForm.document_type || 'other',
        notes: uploadForm.notes || null,
        uploaded_at: new Date().toISOString()
      });

      if (insertError) throw insertError;

      setUploadForm({ title: "", document_type: "", notes: "", file: null });
      setUploadDialog(false);
      router.refresh();
    } catch (error) {
      console.error('Upload failed:', error);
    } finally {
      setIsUploading(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteDoc) return;
    setIsDeleting(true);
    const supabase = getSupabaseBrowserClient();

    try {
      if (deleteDoc.file_url) {
        const filePath = deleteDoc.file_url.split('/documents/')[1];
        if (filePath) {
          await supabase.storage.from('documents').remove([filePath]);
        }
      }

      await supabase.from("documents").delete().eq("id", deleteDoc.id);
      router.refresh();
    } catch (error) {
      console.error('Delete failed:', error);
    } finally {
      setIsDeleting(false);
      setDeleteDoc(null);
    }
  };

  const handleCloseUploadDialog = (open) => {
    if (!open) {
      setUploadForm({ title: "", document_type: "", notes: "", file: null });
      setUploadDialog(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-full bg-primary/10 flex items-center justify-center">
            <FileText className="h-7 w-7 text-primary" />
          </div>
          <div>
            <h1 className="text-2xl font-bold">Medical Documents</h1>
            <p className="text-muted-foreground text-sm">Manage your health records</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="icon" asChild>
            <Link href="/dashboard/settings">
              <Settings className="h-4 w-4" />
            </Link>
          </Button>
          <Button variant="outline" size="icon" asChild>
            <Link href="/dashboard/profile">
              <Bell className="h-4 w-4" />
            </Link>
          </Button>
          <Button onClick={() => setUploadDialog(true)} className="gap-2">
            <Plus className="h-4 w-4" />
            <span className="hidden sm:inline">Upload</span>
          </Button>
        </div>
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-xl bg-blue-50 dark:bg-blue-950">
                <FileText className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Total Documents</p>
                <p className="text-2xl font-bold">{totalDocs}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-xl bg-green-50 dark:bg-green-950">
                <Calendar className="h-5 w-5 text-green-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">This Month</p>
                <p className="text-2xl font-bold">{thisMonthDocs}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-xl bg-purple-50 dark:bg-purple-950">
                <HardDrive className="h-5 w-5 text-purple-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Storage Used</p>
                <p className="text-2xl font-bold">{storageUsed}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Search and Tabs */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search documents..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9"
              />
            </div>
            <div className="flex gap-2 overflow-x-auto pb-2 sm:pb-0">
              {documentTypes.slice(0, 6).map((type) => (
                <Button
                  key={type.value}
                  variant={filter === type.value ? "default" : "outline"}
                  size="sm"
                  onClick={() => setFilter(type.value)}
                  className="whitespace-nowrap"
                >
                  {type.label}
                </Button>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Recent Section */}
      {recentDocs.length > 0 && filter === "all" && !searchQuery && (
        <div>
          <h2 className="text-lg font-semibold mb-4">Recently Added</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {recentDocs.map((doc) => {
              const FileIcon = getFileIcon(doc.file_name);
              const colorClass = documentTypeColors[doc.document_type] || documentTypeColors.other;
              const typeLabel = documentTypes.find(t => t.value === doc.document_type)?.label || "Document";

              return (
                <Card key={doc.id} className="hover:shadow-md transition-shadow cursor-pointer" onClick={() => setPreviewDoc(doc)}>
                  <CardContent className="p-4">
                    <div className="flex items-start gap-3">
                      <div className={`p-3 rounded-lg ${colorClass}`}>
                        <FileIcon className="h-5 w-5" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium truncate">{doc.title}</p>
                        <p className="text-xs text-muted-foreground">{formatDate(doc.uploaded_at)}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      )}

      {/* All Documents */}
      <div>
        <h2 className="text-lg font-semibold mb-4">
          {filter === "all" ? "All Documents" : documentTypes.find(t => t.value === filter)?.label || "Documents"}
          <span className="text-muted-foreground font-normal ml-2">({filteredDocuments.length})</span>
        </h2>
        
        {filteredDocuments.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredDocuments.map((doc) => {
              const FileIcon = getFileIcon(doc.file_name);
              const colorClass = documentTypeColors[doc.document_type] || documentTypeColors.other;
              const typeLabel = documentTypes.find((t) => t.value === doc.document_type)?.label || "Document";

              return (
                <Card key={doc.id} className="group hover:shadow-md transition-shadow cursor-pointer" onClick={() => setPreviewDoc(doc)}>
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between gap-3">
                      <div className={`p-3 rounded-lg ${colorClass}`}>
                        <FileIcon className="h-6 w-6" />
                      </div>
                      <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity" onClick={(e) => e.stopPropagation()}>
                        {doc.file_url && (
                          <Button variant="ghost" size="icon" asChild>
                            <a href={doc.file_url} target="_blank" rel="noopener noreferrer">
                              <Download className="h-4 w-4" />
                            </a>
                          </Button>
                        )}
                        <Button variant="ghost" size="icon" onClick={() => setDeleteDoc(doc)}>
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </div>
                    </div>

                    <div className="mt-3">
                      <h3 className="font-medium truncate">{doc.title}</h3>
                      <div className="flex items-center gap-2 mt-1">
                        <Badge variant="secondary" className="text-xs">{typeLabel}</Badge>
                        <span className="text-xs text-muted-foreground">{formatFileSize(doc.file_size)}</span>
                      </div>
                      {doc.notes && (
                        <p className="text-sm text-muted-foreground mt-2 line-clamp-2">{doc.notes}</p>
                      )}
                      <p className="text-xs text-muted-foreground mt-2">Uploaded {formatDate(doc.uploaded_at)}</p>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        ) : (
          <Card>
            <CardContent className="py-16 text-center">
              <div className="w-20 h-20 rounded-full bg-muted/50 flex items-center justify-center mx-auto mb-4">
                <FileText className="h-10 w-10 text-muted-foreground/50" />
              </div>
              <h3 className="font-medium text-lg mb-2">No documents yet</h3>
              <p className="text-muted-foreground mb-6 max-w-sm mx-auto">
                Upload your first medical document to keep all your health records in one place
              </p>
              <Button onClick={() => setUploadDialog(true)} size="lg">
                <Upload className="h-4 w-4 mr-2" />
                Upload Document
              </Button>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Upload Dialog */}
      <Dialog open={uploadDialog} onOpenChange={handleCloseUploadDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Upload Document</DialogTitle>
            <DialogDescription>Add a new medical document to your records</DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="border-2 border-dashed rounded-lg p-6 text-center cursor-pointer hover:border-primary transition-colors" onClick={() => fileInputRef.current?.click()}>
              <input ref={fileInputRef} type="file" className="hidden" onChange={handleFileSelect} accept=".pdf,.doc,.docx,.jpg,.jpeg,.png,.gif,.xls,.xlsx,.csv" />
              {uploadForm.file ? (
                <div className="flex items-center justify-center gap-3">
                  <File className="h-8 w-8 text-primary" />
                  <div className="text-left">
                    <p className="font-medium">{uploadForm.file.name}</p>
                    <p className="text-sm text-muted-foreground">{formatFileSize(uploadForm.file.size)}</p>
                  </div>
                </div>
              ) : (
                <div>
                  <Upload className="h-10 w-10 mx-auto text-muted-foreground mb-2" />
                  <p className="text-sm text-muted-foreground">Click to select a file</p>
                  <p className="text-xs text-muted-foreground mt-1">PDF, Word, Excel, Images</p>
                </div>
              )}
            </div>

            <div className="space-y-2">
              <Input placeholder="Document title" value={uploadForm.title} onChange={(e) => setUploadForm({...uploadForm, title: e.target.value})} />
            </div>

            <div className="space-y-2">
              <Select value={uploadForm.document_type} onValueChange={(v) => setUploadForm({...uploadForm, document_type: v})}>
                <SelectTrigger><SelectValue placeholder="Select document type" /></SelectTrigger>
                <SelectContent>
                  {documentTypes.slice(1).map((type) => (
                    <SelectItem key={type.value} value={type.value}>{type.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Input placeholder="Notes (optional)" value={uploadForm.notes} onChange={(e) => setUploadForm({...uploadForm, notes: e.target.value})} />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setUploadDialog(false)}>Cancel</Button>
            <Button onClick={handleUpload} disabled={!uploadForm.file || !uploadForm.title || isUploading}>
              {isUploading ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Uploading...</> : "Upload"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Preview Dialog */}
      <Dialog open={!!previewDoc} onOpenChange={() => setPreviewDoc(null)}>
        {previewDoc && (
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle>{previewDoc.title}</DialogTitle>
              <DialogDescription>{documentTypes.find(t => t.value === previewDoc.document_type)?.label || "Document"}</DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div className="flex items-center gap-4 p-4 bg-muted/50 rounded-lg">
                {(() => {
                  const FileIcon = getFileIcon(previewDoc.file_name);
                  return <FileIcon className="h-10 w-10 text-primary" />;
                })()}
                <div>
                  <p className="font-medium">{previewDoc.file_name}</p>
                  <p className="text-sm text-muted-foreground">{formatFileSize(previewDoc.file_size)}</p>
                </div>
              </div>
              {previewDoc.notes && (
                <div>
                  <p className="text-sm font-medium mb-1">Notes</p>
                  <p className="text-sm text-muted-foreground">{previewDoc.notes}</p>
                </div>
              )}
              <p className="text-sm text-muted-foreground">Uploaded {formatDate(previewDoc.uploaded_at)}</p>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setPreviewDoc(null)}>Close</Button>
              {previewDoc.file_url && (
                <Button asChild>
                  <a href={previewDoc.file_url} target="_blank" rel="noopener noreferrer">
                    <Download className="h-4 w-4 mr-2" />Download
                  </a>
                </Button>
              )}
            </DialogFooter>
          </DialogContent>
        )}
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={!!deleteDoc} onOpenChange={() => setDeleteDoc(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Document</AlertDialogTitle>
            <AlertDialogDescription>Are you sure you want to delete "{deleteDoc?.title}"? This action cannot be undone.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} disabled={isDeleting} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              {isDeleting ? <Loader2 className="h-4 w-4 animate-spin" /> : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
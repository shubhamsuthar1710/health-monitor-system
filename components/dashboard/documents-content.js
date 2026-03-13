"use client";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
  Filter,
  Search,
  File,
  ImageIcon,
  FileSpreadsheet,
  Loader2,
} from "lucide-react";

const documentTypes = [
  { value: "lab_result", label: "Lab Result" },
  { value: "prescription", label: "Prescription" },
  { value: "imaging", label: "Imaging/X-Ray" },
  { value: "insurance", label: "Insurance" },
  { value: "vaccination", label: "Vaccination Record" },
  { value: "discharge_summary", label: "Discharge Summary" },
  { value: "other", label: "Other" },
];

const documentTypeColors = {
  lab_result: "bg-chart-1/10 text-chart-1",
  prescription: "bg-chart-2/10 text-chart-2",
  imaging: "bg-chart-3/10 text-chart-3",
  insurance: "bg-chart-4/10 text-chart-4",
  vaccination: "bg-chart-5/10 text-chart-5",
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
  if (!bytes) return "Unknown size";
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

  // NEW: State for preview modal and download loading
  const [previewDoc, setPreviewDoc] = useState(null);
  const [downloadingId, setDownloadingId] = useState(null);

  // Upload form state
  const [uploadForm, setUploadForm] = useState({
    title: "",
    document_type: "",
    notes: "",
    file: null,
  });

  const filteredDocuments = documents.filter((doc) => {
    const matchesFilter = filter === "all" || doc.document_type === filter;
    const matchesSearch =
      doc.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      doc.file_name?.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesFilter && matchesSearch;
  });

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
      // 1. Upload file to Storage
      const filePath = `${user.id}/${Date.now()}-${uploadForm.file.name}`;
      const { error: uploadError } = await supabase.storage
        .from('documents')
        .upload(filePath, uploadForm.file);

      if (uploadError) throw uploadError;

      // 2. Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('documents')
        .getPublicUrl(filePath);

      // 3. Insert document record
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

      // Success
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
    await supabase.from("documents").delete().eq("id", deleteDoc.id);
    setDeleteDoc(null);
    setIsDeleting(false);
    router.refresh();
  };

  const handleCloseUploadDialog = () => {
    setUploadForm({ title: "", document_type: "", notes: "", file: null });
    setUploadDialog(false);
  };

  // NEW: Force download function
  const handleDownload = async (doc) => {
    setDownloadingId(doc.id);
    try {
      const response = await fetch(doc.file_url);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = doc.file_name || 'document';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Download failed:', error);
      // You could add a toast notification here
    } finally {
      setDownloadingId(null);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Documents</h1>
          <p className="text-muted-foreground">
            Store and organize your medical documents
          </p>
        </div>
        <Button onClick={() => setUploadDialog(true)} className="gap-2">
          <Upload className="h-4 w-4" />
          Upload Document
        </Button>
      </div>

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
            <div className="flex items-center gap-2">
              <Filter className="h-4 w-4 text-muted-foreground" />
              <Select value={filter} onValueChange={setFilter}>
                <SelectTrigger className="w-40">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Types</SelectItem>
                  {documentTypes.map((type) => (
                    <SelectItem key={type.value} value={type.value}>
                      {type.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {filteredDocuments.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredDocuments.map((doc) => {
            const FileIcon = getFileIcon(doc.file_name);
            const colorClass =
              documentTypeColors[doc.document_type || "other"] ||
              documentTypeColors.other;
            const typeLabel =
              documentTypes.find((t) => t.value === doc.document_type)?.label ||
              "Document";

            return (
              <Card
                key={doc.id}
                className="group hover:shadow-md transition-shadow cursor-pointer"
                onClick={() => setPreviewDoc(doc)} // Click card to preview
              >
                <CardContent className="p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className={`p-3 rounded-lg ${colorClass}`}>
                      <FileIcon className="h-6 w-6" />
                    </div>
                    <div
                      className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity"
                      onClick={(e) => e.stopPropagation()} // Prevent card click when clicking buttons
                    >
                      {doc.file_url && (
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDownload(doc);
                          }}
                          disabled={downloadingId === doc.id}
                        >
                          {downloadingId === doc.id ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <Download className="h-4 w-4" />
                          )}
                        </Button>
                      )}
                      <Button
                        variant="ghost"
                        size="icon"
                        className="text-muted-foreground hover:text-destructive"
                        onClick={(e) => {
                          e.stopPropagation();
                          setDeleteDoc(doc);
                        }}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>

                  <div className="mt-3">
                    <h3 className="font-medium truncate">{doc.title}</h3>
                    <div className="flex items-center gap-2 mt-1">
                      <Badge variant="secondary" className="text-xs">
                        {typeLabel}
                      </Badge>
                      <span className="text-xs text-muted-foreground">
                        {formatFileSize(doc.file_size)}
                      </span>
                    </div>
                    {doc.notes && (
                      <p className="text-sm text-muted-foreground mt-2 line-clamp-2">
                        {doc.notes}
                      </p>
                    )}
                    <p className="text-xs text-muted-foreground mt-2">
                      Uploaded {formatDate(doc.uploaded_at)}
                    </p>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      ) : (
        <Card>
          <CardContent className="py-12 text-center">
            <FileText className="h-12 w-12 mx-auto text-muted-foreground/50 mb-3" />
            <h3 className="font-medium text-lg mb-1">No documents yet</h3>
            <p className="text-muted-foreground mb-4">
              Upload your first medical document to get started
            </p>
            <Button onClick={() => setUploadDialog(true)}>
              <Upload className="h-4 w-4 mr-2" />
              Upload Document
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Upload Dialog (unchanged) */}
      <Dialog open={uploadDialog} onOpenChange={handleCloseUploadDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Upload Document</DialogTitle>
            <DialogDescription>
              Add a new medical document to your library
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div
              className="border-2 border-dashed rounded-lg p-6 text-center cursor-pointer hover:border-primary transition-colors"
              onClick={() => fileInputRef.current?.click()}
            >
              <input
                ref={fileInputRef}
                type="file"
                className="hidden"
                onChange={handleFileSelect}
                accept=".pdf,.doc,.docx,.jpg,.jpeg,.png,.gif,.xls,.xlsx,.csv"
              />
              {uploadForm.file ? (
                <div className="flex items-center justify-center gap-3">
                  <File className="h-8 w-8 text-primary" />
                  <div className="text-left">
                    <p className="font-medium">{uploadForm.file.name}</p>
                    <p className="text-sm text-muted-foreground">
                      {formatFileSize(uploadForm.file.size)}
                    </p>
                  </div>
                </div>
              ) : (
                <>
                  <Upload className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
                  <p className="text-sm text-muted-foreground">
                    Click to select a file or drag and drop
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    PDF, DOC, Images, Spreadsheets up to 10MB
                  </p>
                </>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="doc-title">Document Title</Label>
              <Input
                id="doc-title"
                value={uploadForm.title}
                onChange={(e) =>
                  setUploadForm({ ...uploadForm, title: e.target.value })
                }
                placeholder="e.g., Blood Test Results - January 2026"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="doc-type">Document Type</Label>
              <Select
                value={uploadForm.document_type}
                onValueChange={(value) =>
                  setUploadForm({ ...uploadForm, document_type: value })
                }
              >
                <SelectTrigger id="doc-type">
                  <SelectValue placeholder="Select type" />
                </SelectTrigger>
                <SelectContent>
                  {documentTypes.map((type) => (
                    <SelectItem key={type.value} value={type.value}>
                      {type.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="doc-notes">Notes (optional)</Label>
              <Input
                id="doc-notes"
                value={uploadForm.notes}
                onChange={(e) =>
                  setUploadForm({ ...uploadForm, notes: e.target.value })
                }
                placeholder="Add any relevant notes..."
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={handleCloseUploadDialog}>
              Cancel
            </Button>
            <Button
              onClick={handleUpload}
              disabled={!uploadForm.file || !uploadForm.title || isUploading}
            >
              {isUploading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Uploading...
                </>
              ) : (
                <>
                  <Upload className="mr-2 h-4 w-4" />
                  Upload
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* NEW: Preview Modal */}
      <Dialog open={!!previewDoc} onOpenChange={() => setPreviewDoc(null)}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-auto">
          <DialogHeader>
            <DialogTitle>{previewDoc?.title}</DialogTitle>
            <DialogDescription>
              {previewDoc?.file_name} • {formatFileSize(previewDoc?.file_size)}
            </DialogDescription>
          </DialogHeader>
          <div className="mt-4 flex justify-center">
            {previewDoc?.file_url && (
              <>
                {previewDoc.file_name?.match(/\.(jpg|jpeg|png|gif|webp)$/i) ? (
                  <img
                    src={previewDoc.file_url}
                    alt={previewDoc.title}
                    className="max-w-full max-h-[70vh] object-contain"
                  />
                ) : previewDoc.file_name?.match(/\.pdf$/i) ? (
                  <iframe
                    src={previewDoc.file_url}
                    className="w-full h-[70vh]"
                    title={previewDoc.title}
                  />
                ) : (
                  <div className="text-center py-8">
                    <FileText className="h-16 w-16 mx-auto text-muted-foreground mb-3" />
                    <p className="text-muted-foreground">
                      Preview not available for this file type.
                    </p>
                    <Button
                      variant="outline"
                      className="mt-4"
                      onClick={() => {
                        setPreviewDoc(null);
                        handleDownload(previewDoc);
                      }}
                    >
                      <Download className="mr-2 h-4 w-4" />
                      Download to view
                    </Button>
                  </div>
                )}
              </>
            )}
          </div>
          <DialogFooter>
            <Button onClick={() => setPreviewDoc(null)}>Close</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog (unchanged) */}
      <AlertDialog open={!!deleteDoc} onOpenChange={() => setDeleteDoc(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Document</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete "{deleteDoc?.title}"? This action
              cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={isDeleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isDeleting ? "Deleting..." : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
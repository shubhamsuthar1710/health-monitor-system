"use client";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState } from "react";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Upload, Loader2, X, CheckCircle } from "lucide-react";
export function UploadDocument() {
    const [uploading, setUploading] = useState(false);
    const [error, setError] = useState(null);
    const [success, setSuccess] = useState(false);
    const supabase = getSupabaseBrowserClient();
    const handleUpload = (e) => __awaiter(this, void 0, void 0, function* () {
        var _a;
        const file = (_a = e.target.files) === null || _a === void 0 ? void 0 : _a[0];
        if (!file)
            return;
        setUploading(true);
        setError(null);
        setSuccess(false);
        try {
            // Get current user
            const { data: { user } } = yield supabase.auth.getUser();
            if (!user)
                throw new Error("Not authenticated");
            // Create path: user-id/filename
            const filePath = `${user.id}/${Date.now()}-${file.name}`;
            // 1. Upload to Storage
            const { error: uploadError } = yield supabase.storage
                .from('documents')
                .upload(filePath, file);
            if (uploadError)
                throw uploadError;
            // 2. Get public URL
            const { data: { publicUrl } } = supabase.storage
                .from('documents')
                .getPublicUrl(filePath);
            // 3. Save metadata to documents table - FIXED COLUMN NAMES
            const { error: insertError } = yield supabase
                .from('documents')
                .insert({
                user_id: user.id,
                file_name: file.name, // ✅ Fixed: 'file_name' not 'filename'
                file_url: publicUrl,
                file_size: file.size,
                document_type: 'other', // ✅ Fixed: 'document_type' not 'category'
                uploaded_at: new Date().toISOString()
                // ✅ Removed 'file_type' - your table doesn't have this column
            });
            if (insertError)
                throw insertError;
            setSuccess(true);
            e.target.value = ''; // Reset input
            // Refresh the page to show new document
            setTimeout(() => window.location.reload(), 1000);
        }
        catch (err) {
            setError(err instanceof Error ? err.message : 'Upload failed');
        }
        finally {
            setUploading(false);
        }
    });
    return (_jsxs("div", { className: "space-y-4", children: [_jsxs("div", { className: "flex items-center gap-4", children: [_jsx(Button, { disabled: uploading, asChild: true, children: _jsxs("label", { className: "cursor-pointer", children: [uploading ? (_jsx(Loader2, { className: "mr-2 h-4 w-4 animate-spin" })) : (_jsx(Upload, { className: "mr-2 h-4 w-4" })), uploading ? 'Uploading...' : 'Upload Document', _jsx(Input, { type: "file", className: "hidden", onChange: handleUpload, disabled: uploading })] }) }), success && (_jsxs("div", { className: "flex items-center text-green-600", children: [_jsx(CheckCircle, { className: "h-4 w-4 mr-1" }), _jsx("span", { className: "text-sm", children: "Uploaded!" })] }))] }), error && (_jsxs("div", { className: "flex items-center text-red-500 text-sm", children: [_jsx(X, { className: "h-4 w-4 mr-1" }), error] }))] }));
}

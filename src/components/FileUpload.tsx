import { useState, useRef, useCallback } from "react";
import { Upload, X, File, Image, CheckCircle, AlertCircle, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface UploadedFile {
  name: string;
  url: string;
  size: number;
  type: string;
}

interface FileUploadProps {
  accept?: string;
  maxSizeMb?: number;
  multiple?: boolean;
  onUpload: (files: UploadedFile[]) => void;
  onError?: (error: string) => void;
  className?: string;
  label?: string;
  hint?: string;
  value?: UploadedFile[];
  uploadEndpoint?: string; // tRPC endpoint to get presigned URL
}

type FileState = {
  file: File;
  status: "pending" | "uploading" | "done" | "error";
  progress: number;
  url?: string;
  error?: string;
};

export function FileUpload({
  accept = "*/*",
  maxSizeMb = 100,
  multiple = false,
  onUpload,
  onError,
  className,
  label = "Datei hochladen",
  hint,
  value = [],
  uploadEndpoint,
}: FileUploadProps) {
  const [fileStates, setFileStates] = useState<FileState[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const updateFileState = (index: number, update: Partial<FileState>) => {
    setFileStates(prev => prev.map((f, i) => i === index ? { ...f, ...update } : f));
  };

  const uploadFile = useCallback(async (file: File, index: number) => {
    updateFileState(index, { status: "uploading", progress: 10 });

    try {
      // Get presigned URL from backend
      const res = await fetch("/api/trpc/upload.getPresignedUrl", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ json: { fileName: file.name, fileType: file.type, fileSize: file.size } }),
        credentials: "include",
      });

      if (!res.ok) throw new Error("Presigned URL konnte nicht abgerufen werden.");
      const data = await res.json();
      const { uploadUrl, fileUrl } = data.result?.data?.json ?? {};

      if (!uploadUrl) throw new Error("Kein Upload-URL erhalten.");

      updateFileState(index, { progress: 30 });

      // Upload to S3
      const uploadRes = await fetch(uploadUrl, {
        method: "PUT",
        body: file,
        headers: { "Content-Type": file.type },
      });

      if (!uploadRes.ok) throw new Error("Upload fehlgeschlagen.");

      updateFileState(index, { status: "done", progress: 100, url: fileUrl });
      return fileUrl as string;
    } catch (err) {
      const message = err instanceof Error ? err.message : "Upload fehlgeschlagen.";
      updateFileState(index, { status: "error", error: message });
      onError?.(message);
      return null;
    }
  }, [onError]);

  const handleFiles = useCallback(async (files: FileList | null) => {
    if (!files || files.length === 0) return;

    const maxBytes = maxSizeMb * 1024 * 1024;
    const newStates: FileState[] = [];

    for (const file of Array.from(files)) {
      if (file.size > maxBytes) {
        onError?.(`"${file.name}" ist zu groß (max. ${maxSizeMb} MB).`);
        continue;
      }
      newStates.push({ file, status: "pending", progress: 0 });
    }

    if (newStates.length === 0) return;

    const startIndex = fileStates.length;
    setFileStates(prev => [...prev, ...newStates]);

    const uploadedFiles: UploadedFile[] = [];
    for (let i = 0; i < newStates.length; i++) {
      const url = await uploadFile(newStates[i].file, startIndex + i);
      if (url) {
        uploadedFiles.push({
          name: newStates[i].file.name,
          url,
          size: newStates[i].file.size,
          type: newStates[i].file.type,
        });
      }
    }

    if (uploadedFiles.length > 0) {
      onUpload(uploadedFiles);
    }
  }, [fileStates.length, maxSizeMb, onError, onUpload, uploadFile]);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    handleFiles(e.dataTransfer.files);
  }, [handleFiles]);

  const removeFile = (index: number) => {
    setFileStates(prev => prev.filter((_, i) => i !== index));
  };

  const formatSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const isImage = (type: string) => type.startsWith("image/");

  return (
    <div className={cn("space-y-3", className)}>
      {/* Drop zone */}
      <div
        onClick={() => inputRef.current?.click()}
        onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={handleDrop}
        className={cn(
          "border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-all duration-200",
          isDragging
            ? "border-indigo-500 bg-indigo-500/10 scale-[1.01]"
            : "border-white/10 hover:border-white/30 hover:bg-white/5 bg-white/[0.02]"
        )}
      >
        <Upload className="w-8 h-8 mx-auto mb-3 text-white/40" />
        <p className="text-sm font-medium text-white/70">{label}</p>
        <p className="text-xs text-white/40 mt-1">
          {hint ?? `Drag & Drop oder klicken · Max. ${maxSizeMb} MB`}
        </p>
        <input
          ref={inputRef}
          type="file"
          accept={accept}
          multiple={multiple}
          className="hidden"
          onChange={(e) => handleFiles(e.target.files)}
        />
      </div>

      {/* File list */}
      {fileStates.length > 0 && (
        <ul className="space-y-2">
          {fileStates.map((f, i) => (
            <li key={i} className="flex items-center gap-3 p-3 rounded-lg bg-white/5 border border-white/10">
              <div className="w-8 h-8 rounded flex items-center justify-center bg-white/10 flex-shrink-0">
                {isImage(f.file.type) ? <Image className="w-4 h-4 text-white/60" /> : <File className="w-4 h-4 text-white/60" />}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm text-white/80 truncate">{f.file.name}</p>
                <div className="flex items-center gap-2 mt-0.5">
                  <span className="text-xs text-white/40">{formatSize(f.file.size)}</span>
                  {f.status === "uploading" && (
                    <div className="flex-1 h-1 bg-white/10 rounded-full overflow-hidden">
                      <div className="h-full bg-indigo-500 rounded-full transition-all" style={{ width: `${f.progress}%` }} />
                    </div>
                  )}
                  {f.status === "error" && <span className="text-xs text-red-400">{f.error}</span>}
                </div>
              </div>
              <div className="flex-shrink-0">
                {f.status === "uploading" && <Loader2 className="w-4 h-4 text-indigo-400 animate-spin" />}
                {f.status === "done" && <CheckCircle className="w-4 h-4 text-emerald-400" />}
                {f.status === "error" && <AlertCircle className="w-4 h-4 text-red-400" />}
                {f.status !== "uploading" && (
                  <button onClick={() => removeFile(i)} className="ml-2 text-white/30 hover:text-white/60 transition-colors">
                    <X className="w-4 h-4" />
                  </button>
                )}
              </div>
            </li>
          ))}
        </ul>
      )}

      {/* Existing files */}
      {value.length > 0 && fileStates.length === 0 && (
        <ul className="space-y-2">
          {value.map((f, i) => (
            <li key={i} className="flex items-center gap-3 p-3 rounded-lg bg-white/5 border border-white/10">
              <div className="w-8 h-8 rounded flex items-center justify-center bg-emerald-500/20 flex-shrink-0">
                <CheckCircle className="w-4 h-4 text-emerald-400" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm text-white/80 truncate">{f.name}</p>
                <p className="text-xs text-white/40">{formatSize(f.size)}</p>
              </div>
              <a href={f.url} target="_blank" rel="noopener noreferrer" className="text-xs text-indigo-400 hover:text-indigo-300 transition-colors">
                Ansehen
              </a>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

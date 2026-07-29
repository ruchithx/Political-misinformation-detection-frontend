'use client';

import { useCallback, useRef, useState } from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import { Upload, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { Platform } from '@/lib/types';

interface InputFormProps {
  onSubmit: (
    text: string,
    platform: Platform,
    imageFile?: File | null,
    postUrl?: string,
  ) => void;
  isLoading: boolean;
}

export function InputForm({ onSubmit, isLoading }: InputFormProps) {
  const [text, setText] = useState('');
  const [platform, setPlatform] = useState<Platform>('twitter');
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const shouldReduceMotion = useReducedMotion();
  const [postUrl, setPostUrl] = useState('');

  const handleFile = useCallback((file: File) => {
    if (!file.type.startsWith('image/')) return;
    setImageFile(file);
    const url = URL.createObjectURL(file);
    setImagePreview(url);
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragging(false);
      const file = e.dataTransfer.files[0];
      if (file) handleFile(file);
    },
    [handleFile],
  );

  const removeImage = () => {
    setImageFile(null);
    if (imagePreview) URL.revokeObjectURL(imagePreview);
    setImagePreview(null);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!text.trim() || isLoading) return;
    onSubmit(text.trim(), platform, imageFile, postUrl.trim() || undefined);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* Text input */}
      <div>
        <label
          htmlFor="post-text"
          className="mb-2 block text-xs font-semibold uppercase tracking-widest text-muted-foreground"
        >
          Post Content
        </label>
        <textarea
          id="post-text"
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Paste social media post text here…"
          rows={7}
          className={cn(
            'w-full resize-none rounded-xl border border-border bg-muted/40 px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground/50',
            'focus:border-[#3B6FD4] focus:outline-none focus:ring-1 focus:ring-[#3B6FD4]/30 transition-colors',
          )}
          style={{ fontFamily: 'var(--font-body)' }}
          required
        />
        <div className="mt-1 flex justify-between text-[11px] text-muted-foreground font-mono-num">
          <span>{text.length} characters</span>
          <span>{text.split(/\s+/).filter(Boolean).length} words</span>
        </div>
      </div>

      {/* Media Context (URL) input */}
      <div>
        <label
          htmlFor="post-url"
          className="mb-2 block text-xs font-semibold uppercase tracking-widest text-muted-foreground"
        >
          Media Context (Post URL)
        </label>
        <input
          id="post-url"
          type="url"
          value={postUrl}
          onChange={(e) => setPostUrl(e.target.value)}
          placeholder="https://twitter.com/news/status/..."
          className={cn(
            'w-full rounded-xl border border-border bg-muted/40 px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground/50',
            'focus:border-[#3B6FD4] focus:outline-none focus:ring-1 focus:ring-[#3B6FD4]/30 transition-colors',
          )}
          style={{ fontFamily: 'var(--font-mono)' }}
        />
        <p className="mt-1.5 text-[10px] text-muted-foreground/70 leading-relaxed">
          Structural and behavioral features (like domain credibility and source
          metadata) will be automatically evaluated from the URL context.
        </p>
      </div>

      {/* Image drop zone */}
      <div>
        <label className="mb-2 block text-xs font-semibold uppercase tracking-widest text-muted-foreground">
          Image (optional)
        </label>
        {imagePreview ? (
          <div className="relative overflow-hidden rounded-xl border border-border">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={imagePreview}
              alt="Uploaded preview"
              className="max-h-40 w-full object-cover"
            />
            <button
              type="button"
              onClick={removeImage}
              className="absolute right-2 top-2 rounded-full bg-black/60 p-1 text-white hover:bg-black/80"
              aria-label="Remove image"
            >
              <X className="h-3.5 w-3.5" />
            </button>
            <div className="px-3 py-1.5 text-[11px] text-muted-foreground font-mono-num">
              {imageFile?.name} · {((imageFile?.size ?? 0) / 1024).toFixed(0)}{' '}
              KB
            </div>
          </div>
        ) : (
          <motion.div
            onDragEnter={() => setIsDragging(true)}
            onDragLeave={() => setIsDragging(false)}
            onDragOver={(e) => e.preventDefault()}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
            animate={{ borderColor: isDragging ? '#3B6FD4' : undefined }}
            className={cn(
              'flex cursor-pointer flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed border-border py-6 transition-colors',
              'hover:border-[#3B6FD4]/60 hover:bg-[#3B6FD4]/5',
              isDragging && 'border-[#3B6FD4] bg-[#3B6FD4]/10',
            )}
            aria-label="Upload image"
          >
            <Upload className="h-5 w-5 text-muted-foreground" />
            <p className="text-xs text-muted-foreground">
              Drop image here or <span className="text-[#3B6FD4]">browse</span>
            </p>
            <p className="text-[10px] text-muted-foreground/60 font-mono-num">
              PNG, JPG, WEBP · max 10 MB
            </p>
          </motion.div>
        )}
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={(e) => {
            const f = e.target.files?.[0];
            if (f) handleFile(f);
          }}
          id="image-upload"
        />
      </div>

      {/* Analyze button */}
      <motion.button
        type="submit"
        disabled={isLoading || !text.trim()}
        whileHover={shouldReduceMotion ? {} : { scale: 1.01 }}
        whileTap={shouldReduceMotion ? {} : { scale: 0.98 }}
        className={cn(
          'w-full rounded-xl px-6 py-3.5 text-sm font-semibold text-white transition-all',
          'bg-[#3B6FD4] hover:bg-[#2d5ab8] focus:outline-none focus:ring-2 focus:ring-[#3B6FD4]/50',
          'disabled:cursor-not-allowed disabled:opacity-50',
        )}
        style={{ fontFamily: 'var(--font-heading)' }}
      >
        {isLoading ? 'Analyzing…' : 'Run Analysis →'}
      </motion.button>

      {/* Disclaimer */}
      {/* <p className="text-[11px] text-muted-foreground leading-relaxed">
        <span className="font-semibold">Research disclaimer:</span> TruthLens is an academic
        prototype developed at University of Moratuwa. Results are not intended for use in
        editorial decisions or legal proceedings.
      </p> */}
    </form>
  );
}

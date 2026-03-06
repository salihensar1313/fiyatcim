"use client";

import { useState, useRef, useCallback } from "react";
import { Upload, X, Link as LinkIcon } from "lucide-react";
import Image from "next/image";

interface ImageUploaderProps {
  value: string;
  onChange: (url: string) => void;
  label?: string;
  /** Maksimum genişlik piksel — görsel bu genişliğe sıkıştırılır (default: 1200) */
  maxWidth?: number;
}

const MAX_SIZE = 5 * 1024 * 1024; // 5MB ham dosya sınırı
const ACCEPTED = ["image/png", "image/jpeg", "image/jpg", "image/webp"];

/**
 * Canvas ile görseli sıkıştır — localStorage taşmasını önler
 * Max genişliğe resize + JPEG 0.8 kalite ile base64 döner
 */
function compressImage(file: File, maxWidth: number): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const img = document.createElement("img");
      img.onload = () => {
        let w = img.width;
        let h = img.height;

        // Genişlik maxWidth'den büyükse orantılı küçült
        if (w > maxWidth) {
          h = Math.round((h * maxWidth) / w);
          w = maxWidth;
        }

        const canvas = document.createElement("canvas");
        canvas.width = w;
        canvas.height = h;
        const ctx = canvas.getContext("2d");
        if (!ctx) { reject(new Error("Canvas desteklenmiyor")); return; }
        ctx.drawImage(img, 0, 0, w, h);

        // JPEG olarak sıkıştır (0.8 kalite ≈ görsel olarak kayıpsız, %60-80 boyut azalması)
        const compressed = canvas.toDataURL("image/jpeg", 0.8);
        resolve(compressed);
      };
      img.onerror = () => reject(new Error("Gorsel yuklenemedi"));
      img.src = reader.result as string;
    };
    reader.onerror = () => reject(new Error("Dosya okunamadi"));
    reader.readAsDataURL(file);
  });
}

export default function ImageUploader({ value, onChange, label = "Gorsel", maxWidth = 1200 }: ImageUploaderProps) {
  const [mode, setMode] = useState<"upload" | "url">(value && !value.startsWith("data:") ? "url" : "upload");
  const [dragOver, setDragOver] = useState(false);
  const [error, setError] = useState("");
  const [compressing, setCompressing] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const handleFile = useCallback(
    async (file: File) => {
      setError("");

      if (!ACCEPTED.includes(file.type)) {
        setError("Desteklenmeyen format. PNG, JPG veya WebP yukleyin.");
        return;
      }

      if (file.size > MAX_SIZE) {
        setError("Dosya boyutu 5MB'den buyuk olamaz.");
        return;
      }

      try {
        setCompressing(true);
        const compressed = await compressImage(file, maxWidth);
        onChange(compressed);
      } catch {
        setError("Gorsel isleme hatasi. Baska bir dosya deneyin.");
      } finally {
        setCompressing(false);
      }
    },
    [onChange, maxWidth]
  );

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setDragOver(false);
      const file = e.dataTransfer.files?.[0];
      if (file) handleFile(file);
    },
    [handleFile]
  );

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleFile(file);
    e.target.value = "";
  };

  const isBase64 = value?.startsWith("data:");
  const hasImage = !!value;

  return (
    <div>
      <div className="mb-1 flex items-center justify-between">
        <label className="block text-sm font-medium text-dark-700 dark:text-dark-200">{label}</label>
        <button
          type="button"
          onClick={() => setMode(mode === "upload" ? "url" : "upload")}
          className="flex items-center gap-1 text-xs text-primary-600 hover:text-primary-700"
        >
          {mode === "upload" ? (
            <>
              <LinkIcon size={12} /> URL ile gir
            </>
          ) : (
            <>
              <Upload size={12} /> Dosya yukle
            </>
          )}
        </button>
      </div>

      {mode === "url" ? (
        <input
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="w-full rounded-lg border border-dark-200 px-3 py-2 text-sm focus:border-primary-600 focus:outline-none"
          placeholder="/images/hero/hero-main.png"
        />
      ) : (
        <div
          onDragOver={(e) => {
            e.preventDefault();
            setDragOver(true);
          }}
          onDragLeave={() => setDragOver(false)}
          onDrop={handleDrop}
          onClick={() => !compressing && fileRef.current?.click()}
          className={`flex cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed px-4 py-6 transition-colors ${
            compressing
              ? "border-primary-500 bg-primary-50"
              : dragOver
                ? "border-primary-500 bg-primary-50"
                : "border-dark-200 bg-dark-50 hover:border-primary-400 hover:bg-primary-50/50"
          }`}
        >
          {compressing ? (
            <>
              <div className="mb-2 h-6 w-6 animate-spin rounded-full border-2 border-primary-600 border-t-transparent" />
              <p className="text-sm text-primary-600">Gorsel optimize ediliyor...</p>
            </>
          ) : (
            <>
              <Upload size={24} className="mb-2 text-dark-400" />
              <p className="text-sm text-dark-600 dark:text-dark-300">
                Tiklayin veya dosyayi surukleyin
              </p>
              <p className="mt-1 text-xs text-dark-400">PNG, JPG, WebP — Max 5MB (otomatik optimize edilir)</p>
            </>
          )}
          <input
            ref={fileRef}
            type="file"
            accept=".png,.jpg,.jpeg,.webp"
            onChange={handleInputChange}
            className="hidden"
          />
        </div>
      )}

      {error && <p className="mt-1 text-xs text-red-600">{error}</p>}

      {/* Preview */}
      {hasImage && (
        <div className="relative mt-3 inline-block">
          <div className="overflow-hidden rounded-lg border border-dark-200">
            {isBase64 ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={value} alt="Onizleme" className="h-24 w-auto max-w-[200px] object-contain" />
            ) : (
              <Image
                src={value}
                alt="Onizleme"
                width={200}
                height={96}
                className="h-24 w-auto max-w-[200px] object-contain"
              />
            )}
          </div>
          <button
            type="button"
            onClick={() => onChange("")}
            className="absolute -right-2 -top-2 rounded-full bg-red-500 p-0.5 text-white shadow hover:bg-red-600"
          >
            <X size={14} />
          </button>
        </div>
      )}
    </div>
  );
}

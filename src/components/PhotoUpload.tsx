"use client";
import { useRef } from "react";

interface PhotoUploadProps {
  label: string;
  value: string | null;
  onChange: (dataUrl: string) => void;
  onClear: () => void;
  maxDim?: number;
  quality?: number;
  previewHeight?: number;
}

export default function PhotoUpload({
  label,
  value,
  onChange,
  onClear,
  maxDim = 1000,
  quality = 0.7,
  previewHeight = 160,
}: PhotoUploadProps) {
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onloadend = () => {
      const img = new window.Image();
      img.onload = () => {
        const canvas = document.createElement("canvas");
        let scale = 1;
        if (img.width > maxDim || img.height > maxDim) {
          scale = Math.min(maxDim / img.width, maxDim / img.height);
        }
        canvas.width = img.width * scale;
        canvas.height = img.height * scale;
        const ctx = canvas.getContext("2d");
        if (ctx) {
          ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
          onChange(canvas.toDataURL("image/jpeg", quality));
        } else {
          onChange(reader.result as string);
        }
      };
      img.src = reader.result as string;
    };
    reader.readAsDataURL(file);
    // Reset so the same file can be re-selected
    e.target.value = "";
  };

  return (
    <div style={{ width: "100%" }}>
      {/* Hidden file input — no capture="" so the OS shows Camera / Gallery / Files */}
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        onChange={handleFile}
        style={{ display: "none" }}
      />

      {value ? (
        /* ── PREVIEW with ✕ delete button ── */
        <div style={{ position: "relative", display: "inline-block", width: "100%" }}>
          <img
            src={value}
            alt={label}
            style={{
              width: "100%",
              height: `${previewHeight}px`,
              objectFit: "cover",
              borderRadius: "10px",
              border: "2px solid #10b981",
              display: "block",
            }}
          />
          {/* ✕ button — top-left corner */}
          <button
            type="button"
            onClick={() => { onClear(); if (inputRef.current) inputRef.current.value = ""; }}
            title="Remove photo"
            style={{
              position: "absolute",
              top: "6px",
              left: "6px",
              width: "28px",
              height: "28px",
              borderRadius: "50%",
              background: "rgba(239,68,68,0.92)",
              border: "2px solid white",
              color: "white",
              fontWeight: "bold",
              fontSize: "14px",
              lineHeight: "1",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              boxShadow: "0 2px 6px rgba(0,0,0,0.4)",
              zIndex: 10,
            }}
          >
            ✕
          </button>
          {/* Small "Retake" button at the bottom */}
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            style={{
              position: "absolute",
              bottom: "8px",
              right: "8px",
              padding: "5px 12px",
              background: "rgba(15,23,42,0.85)",
              color: "white",
              border: "1px solid rgba(255,255,255,0.3)",
              borderRadius: "6px",
              fontSize: "12px",
              fontWeight: "600",
              cursor: "pointer",
            }}
          >
            ↺ Retake
          </button>
        </div>
      ) : (
        /* ── UPLOAD button ── */
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          style={{
            width: "100%",
            padding: "14px",
            background: "white",
            border: "2px dashed #cbd5e1",
            borderRadius: "10px",
            color: "#475569",
            fontSize: "14px",
            fontWeight: "600",
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: "8px",
            transition: "all 0.2s ease",
          }}
          onMouseEnter={e => {
            (e.currentTarget as HTMLButtonElement).style.borderColor = "#f59e0b";
            (e.currentTarget as HTMLButtonElement).style.color = "#b45309";
          }}
          onMouseLeave={e => {
            (e.currentTarget as HTMLButtonElement).style.borderColor = "#cbd5e1";
            (e.currentTarget as HTMLButtonElement).style.color = "#475569";
          }}
        >
          {/* Upload icon */}
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
            <polyline points="17 8 12 3 7 8" />
            <line x1="12" y1="3" x2="12" y2="15" />
          </svg>
          Upload Photo
        </button>
      )}
    </div>
  );
}

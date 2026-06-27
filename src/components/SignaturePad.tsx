"use client";
import { useRef, useState, useEffect } from "react";

interface Props {
  title: string;
  onUpdate: (dataUrl: string) => void;
}

export default function SignaturePad({ title, onUpdate }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (canvas) {
      // Set canvas drawing resolution to match its CSS display size to avoid blurry lines
      const rect = canvas.parentElement?.getBoundingClientRect();
      if (rect) {
        canvas.width = rect.width;
        canvas.height = 150;
      }
      const ctx = canvas.getContext("2d");
      if (ctx) {
        ctx.fillStyle = "white";
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.lineWidth = 2.5;
        ctx.lineCap = "round";
        ctx.strokeStyle = "#000000";
      }
    }
  }, []);

  const getCoordinates = (e: React.MouseEvent | React.TouchEvent) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    const rect = canvas.getBoundingClientRect();
    
    // Check if it's a touch event
    if ('touches' in e && e.touches.length > 0) {
      return {
        x: e.touches[0].clientX - rect.left,
        y: e.touches[0].clientY - rect.top
      };
    } else {
      return {
        x: (e as React.MouseEvent).clientX - rect.left,
        y: (e as React.MouseEvent).clientY - rect.top
      };
    }
  };

  const startDrawing = (e: React.MouseEvent | React.TouchEvent) => {
    setIsDrawing(true);
    const { x, y } = getCoordinates(e);
    const ctx = canvasRef.current?.getContext("2d");
    if (ctx) {
      ctx.beginPath();
      ctx.moveTo(x, y);
    }
  };

  const draw = (e: React.MouseEvent | React.TouchEvent) => {
    if (!isDrawing) return;
    
    // Prevent scrolling while drawing on mobile
    if ('touches' in e && e.cancelable) {
      e.preventDefault();
    }
    
    const { x, y } = getCoordinates(e);
    const ctx = canvasRef.current?.getContext("2d");
    if (ctx) {
      ctx.lineTo(x, y);
      ctx.stroke();
    }
  };

  const stopDrawing = () => {
    if (!isDrawing) return;
    setIsDrawing(false);
    const canvas = canvasRef.current;
    if (canvas) {
      const ctx = canvas.getContext("2d");
      ctx?.beginPath(); // reset path so next click doesn't connect
      onUpdate(canvas.toDataURL("image/png")); // Send base64 image back to parent
    }
  };

  const clear = () => {
    const canvas = canvasRef.current;
    if (canvas) {
      const ctx = canvas.getContext("2d");
      if (ctx) {
        ctx.fillStyle = "white";
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.beginPath();
        onUpdate("");
      }
    }
  };

  return (
    <div style={{ width: "100%" }}>
      <label className="form-label" style={{ color: "#ffffff" }}>{title}</label>
      <div style={{ border: "1px solid #cbd5e1", borderRadius: "8px", overflow: "hidden", background: "white" }}>
        <canvas
          ref={canvasRef}
          onMouseDown={startDrawing}
          onMouseUp={stopDrawing}
          onMouseOut={stopDrawing}
          onMouseMove={draw}
          onTouchStart={startDrawing}
          onTouchEnd={stopDrawing}
          onTouchMove={draw}
          style={{ width: "100%", height: "150px", cursor: "crosshair", display: "block", touchAction: "none" }}
        />
      </div>
      <button type="button" onClick={clear} style={{ marginTop: "8px", padding: "6px 16px", fontSize: "13px", borderRadius: "6px", border: "1px solid #94a3b8", background: "#f8fafc", color: "#475569", cursor: "pointer", fontWeight: "600" }}>
        ↺ Clear Signature
      </button>
    </div>
  );
}

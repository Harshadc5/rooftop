"use client";
import React, { useEffect, useRef } from "react";
import { Html5QrcodeScanner } from "html5-qrcode";

interface BarcodeScannerProps {
  onScan: (text: string) => void;
  onClose: () => void;
}

export default function BarcodeScanner({ onScan, onClose }: BarcodeScannerProps) {
  const scannerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!scannerRef.current) return;

    // Initialize scanner
    const scanner = new Html5QrcodeScanner(
      "reader",
      { fps: 10, qrbox: { width: 250, height: 250 } },
      /* verbose= */ false
    );

    scanner.render(
      (decodedText) => {
        scanner.clear(); // Stop scanning on success
        onScan(decodedText);
      },
      (errorMessage) => {
        // We ignore scanning errors since it constantly fires when a barcode isn't in focus
      }
    );

    return () => {
      scanner.clear().catch(console.error);
    };
  }, [onScan]);

  return (
    <div style={{
      position: "fixed", top: 0, left: 0, right: 0, bottom: 0,
      backgroundColor: "rgba(0,0,0,0.9)", zIndex: 9999,
      display: "flex", flexDirection: "column", justifyContent: "center", alignItems: "center"
    }}>
      <div style={{ background: "white", padding: "20px", borderRadius: "12px", width: "90%", maxWidth: "400px" }}>
        <h3 style={{ margin: "0 0 15px 0", textAlign: "center", color: "#0f172a" }}>Scan ALMM Barcode</h3>
        <div id="reader" ref={scannerRef} style={{ width: "100%" }}></div>
        <button 
          onClick={onClose}
          style={{ width: "100%", marginTop: "15px", padding: "12px", background: "#ef4444", color: "white", border: "none", borderRadius: "8px", fontWeight: "bold", fontSize: "16px", cursor: "pointer" }}
        >
          Cancel
        </button>
      </div>
    </div>
  );
}

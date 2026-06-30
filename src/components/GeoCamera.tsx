"use client";
import React, { useRef, useState } from "react";

interface GeoCameraProps {
  onCapture: (base64Image: string) => void;
  address: string;
}

export default function GeoCamera({ onCapture, address }: GeoCameraProps) {
  const [photo, setPhoto] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Helper to draw rounded rectangles
  const roundRect = (ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) => {
    if (w < 2 * r) r = w / 2;
    if (h < 2 * r) r = h / 2;
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.arcTo(x + w, y, x + w, y + h, r);
    ctx.arcTo(x + w, y + h, x, y + h, r);
    ctx.arcTo(x, y + h, x, y, r);
    ctx.arcTo(x, y, x + w, y, r);
    ctx.closePath();
  };

  // Helper to wrap text
  const wrapText = (ctx: CanvasRenderingContext2D, text: string, maxWidth: number) => {
    const words = text.split(' ');
    const lines = [];
    let currentLine = words[0];

    for (let i = 1; i < words.length; i++) {
      const word = words[i];
      const width = ctx.measureText(currentLine + " " + word).width;
      if (width < maxWidth) {
        currentLine += " " + word;
      } else {
        lines.push(currentLine);
        currentLine = word;
      }
    }
    lines.push(currentLine);
    return lines;
  };

  const processImage = async (file: File) => {
    setIsProcessing(true);
    try {
      // 1. Get exact GPS coordinates
      const pos = await new Promise<GeolocationPosition>((resolve, reject) => {
        if (!navigator.geolocation) return reject(new Error("No Geolocation"));
        navigator.geolocation.getCurrentPosition(resolve, reject, {
          enableHighAccuracy: true,
          timeout: 15000,
          maximumAge: 0
        });
      });

      const lat = pos.coords.latitude;
      const lon = pos.coords.longitude;
      
      const now = new Date();
      const dateStr = `${now.toLocaleDateString("en-GB", { weekday: 'long', day: '2-digit', month: '2-digit', year: 'numeric' })} ${now.toLocaleTimeString("en-US", { hour: '2-digit', minute: '2-digit' })} GMT +05:30`;

      // 2. Reverse Geocode for City, State, Country
      let city = "", state = "", country = "India";
      let fullAddress = address;

      const runNominatimFallback = async () => {
        const res = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lon}&zoom=18&addressdetails=1`);
        const data = await res.json();
        city = data.address?.city || data.address?.town || data.address?.village || data.address?.county || "";
        state = data.address?.state || "";
        country = data.address?.country || "India";
        if (!fullAddress) fullAddress = data.display_name;
      };

      try {
        const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;
        if (apiKey) {
          const res = await fetch(`https://maps.googleapis.com/maps/api/geocode/json?latlng=${lat},${lon}&key=${apiKey}`);
          const data = await res.json();
          if (data.results && data.results.length > 0) {
            fullAddress = data.results[0].formatted_address;
            
            // Extract components for title
            const addressComponents = data.results[0].address_components;
            const getComponent = (type: string) => addressComponents.find((c: any) => c.types.includes(type))?.long_name || "";
            
            city = getComponent("locality") || getComponent("administrative_area_level_3") || getComponent("administrative_area_level_2");
            state = getComponent("administrative_area_level_1");
            country = getComponent("country") || "India";
          } else if (data.error_message) {
            console.warn("GeoCamera Google API Error, falling back:", data.error_message);
            await runNominatimFallback();
          } else {
            await runNominatimFallback();
          }
        } else {
          // Fallback to Nominatim if API key isn't set yet
          await runNominatimFallback();
        }
      } catch(e) { console.error("Geocoding failed", e); }

      const title = `${city}, ${state}, ${country}`.replace(/^, /, "").replace(/, ,/g, ","); // Removed emoji to fix Windows rendering issues

      // 3. Fetch Static Map Image via Proxy
      let mapBase64 = null;
      try {
        const mapRes = await fetch(`/api/map-proxy?lat=${lat}&lon=${lon}`);
        const mapData = await mapRes.json();
        if (mapData.base64) {
          mapBase64 = mapData.base64;
        }
      } catch(e) { console.error("Map fetch failed", e); }

      // 4. Load Image to Canvas
      const img = new window.Image();
      const reader = new FileReader();
      
      reader.onload = (e) => {
        img.onload = () => {
          const canvas = canvasRef.current;
          if (!canvas) return;
          const ctx = canvas.getContext("2d");
          if (!ctx) return;

          // Scale the canvas down to a reasonable max dimension for web (e.g., 1200px)
          const MAX_DIM = 1200;
          let scale = 1;
          if (img.width > MAX_DIM || img.height > MAX_DIM) {
            scale = Math.min(MAX_DIM / img.width, MAX_DIM / img.height);
          }
          
          const canvasW = img.width * scale;
          const canvasH = img.height * scale;

          canvas.width = canvasW;
          canvas.height = canvasH;
          ctx.drawImage(img, 0, 0, canvasW, canvasH);

          // Draw the Overlay
          const overlayW = canvasW * 0.94;
          const overlayX = canvasW * 0.03;
          const padding = canvasW * 0.02;
          
          // Estimate overlay height based on font sizes (Scaled down significantly!)
          const baseFontSize = Math.max(12, Math.floor(Math.min(canvasW, canvasH) * 0.018));
          const titleFontSize = Math.floor(baseFontSize * 1.3);
          
          ctx.font = `${baseFontSize}px sans-serif`;
          
          // Pre-calculate text block height to define the map size properly
          const dummyAddrLines = wrapText(ctx, fullAddress || "GPS Location Locked", overlayW * 0.6); // approximate width
          const textBlockHeight = (padding * 0.5) + titleFontSize + (padding * 0.5) + (dummyAddrLines.length * baseFontSize * 1.2) + (padding * 0.5) + (baseFontSize * 1.2) + (baseFontSize * 1.2) + padding;
          
          // Make the map perfectly square with the text block height, rather than a fixed width percentage!
          const mapSize = mapBase64 ? textBlockHeight : 0; 
          
          // Now accurately calculate text wrapping width
          const maxTextW = overlayW - (mapBase64 ? mapSize + (padding * 3) : padding * 2);
          const addrLines = wrapText(ctx, fullAddress || "GPS Location Locked", maxTextW);
          
          // Final exact height recalculation
          const finalTextBlockHeight = (baseFontSize * 1.2) + titleFontSize + (padding * 0.5) + (addrLines.length * baseFontSize * 1.2) + (padding * 0.3) + (baseFontSize * 1.2) + (baseFontSize * 1.2) + padding;
          
          const overlayH = Math.max(finalTextBlockHeight, mapBase64 ? mapSize + (padding * 2) : 0);
          const overlayY = canvasH - overlayH - (canvasH * 0.02);

          // Draw Dark Rounded Background
          ctx.fillStyle = "rgba(15, 23, 42, 0.85)"; // Deep slate dark
          roundRect(ctx, overlayX, overlayY, overlayW, overlayH, 16);
          ctx.fill();

          let textStartX = overlayX + padding;

          // Draw Map Image on the Left
          const drawMapAndText = (mapImgEl?: HTMLImageElement) => {
            if (mapImgEl) {
              ctx.save();
              roundRect(ctx, overlayX + padding, overlayY + padding, mapSize, mapSize, 8);
              ctx.clip();
              ctx.drawImage(mapImgEl, overlayX + padding, overlayY + padding, mapSize, mapSize);
              ctx.restore();
              
              // Draw Custom Red Map Pin in the center of the map tile
              const pinX = overlayX + padding + (mapSize / 2);
              const pinY = overlayY + padding + (mapSize / 2);
              ctx.beginPath();
              ctx.arc(pinX, pinY - (mapSize * 0.04), mapSize * 0.06, 0, Math.PI * 2);
              ctx.fillStyle = "#ef4444";
              ctx.fill();
              ctx.beginPath();
              ctx.moveTo(pinX - (mapSize * 0.06), pinY - (mapSize * 0.04));
              ctx.lineTo(pinX, pinY + (mapSize * 0.05));
              ctx.lineTo(pinX + (mapSize * 0.06), pinY - (mapSize * 0.04));
              ctx.fill();
              ctx.beginPath();
              ctx.arc(pinX, pinY - (mapSize * 0.04), mapSize * 0.02, 0, Math.PI * 2);
              ctx.fillStyle = "#991b1b";
              ctx.fill();
              
              // Draw "Map" style watermark for aesthetics
              ctx.fillStyle = "white";
              ctx.font = `bold ${Math.floor(mapSize * 0.15)}px sans-serif`;
              ctx.fillText("Map", overlayX + padding + (mapSize * 0.05), overlayY + padding + mapSize - (mapSize * 0.05));
              
              textStartX = overlayX + padding + mapSize + padding;
            }

            // Set text baseline to top so coordinates map correctly inside the box
            ctx.textBaseline = "top";
            ctx.textAlign = "left";
            
            // 1. Title (City, State)
            let currentY = overlayY + padding + (padding * 0.5); // Added a tiny bit of breathing room at the top
            ctx.font = `bold ${titleFontSize}px sans-serif`;
            ctx.fillStyle = "white";
            ctx.fillText(title, textStartX, currentY);

            // 2. Address
            currentY += titleFontSize + (padding * 0.5);
            ctx.font = `${baseFontSize}px sans-serif`;
            addrLines.forEach(line => {
              ctx.fillText(line, textStartX, currentY);
              currentY += baseFontSize * 1.3;
            });

            // 3. Lat/Long
            currentY += padding * 0.5;
            ctx.font = `bold ${baseFontSize}px sans-serif`;
            ctx.fillText(`Lat ${lat.toFixed(6)}° Long ${lon.toFixed(6)}°`, textStartX, currentY);

            // 4. Date
            currentY += baseFontSize * 1.3;
            ctx.font = `${baseFontSize}px sans-serif`;
            ctx.fillText(dateStr, textStartX, currentY);

            // Export Final Image
            const finalBase64 = canvas.toDataURL("image/jpeg", 0.85);
            setPhoto(finalBase64);
            onCapture(finalBase64);
            setIsProcessing(false);
          };

          if (mapBase64) {
            const mapImgEl = new window.Image();
            mapImgEl.onload = () => drawMapAndText(mapImgEl);
            mapImgEl.onerror = () => drawMapAndText(); // fallback if map fails to render
            mapImgEl.src = mapBase64;
          } else {
            drawMapAndText();
          }
        };
        img.src = e.target?.result as string;
      };
      
      reader.readAsDataURL(file);

    } catch (err) {
      console.error(err);
      alert("Failed to geo-stamp photo. Please ensure location permissions are granted.");
      setIsProcessing(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      processImage(e.target.files[0]);
    }
  };

  return (
    <div style={{ background: "white", padding: "15px", borderRadius: "8px", border: "1px solid #cbd5e1" }}>
      {!photo && (
        <div style={{ textAlign: "center" }}>
          <button 
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="btn-primary"
            style={{ display: "flex", gap: "10px", alignItems: "center", justifyContent: "center", width: "100%", background: "#10b981", padding: "16px" }}
            disabled={isProcessing}
          >
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"></path>
              <circle cx="12" cy="13" r="4"></circle>
            </svg>
            {isProcessing ? "Processing GPS Stamping..." : "Take Geo-Tagged Photo"}
          </button>
          <input 
            type="file"
            ref={fileInputRef}
            accept="image/*"
            capture="environment"
            onChange={handleChange}
            style={{ display: "none" }}
          />
        </div>
      )}

      {photo && (
        <div>
          <img src={photo} alt="Geo-Tagged" style={{ width: "100%", borderRadius: "8px", border: "1px solid #e2e8f0" }} />
          <button 
            type="button" 
            onClick={() => { setPhoto(null); onCapture(""); }}
            style={{ marginTop: "10px", background: "#ef4444", color: "white", padding: "10px", width: "100%", border: "none", borderRadius: "8px", cursor: "pointer", fontWeight: "bold" }}
          >
            Retake Photo
          </button>
        </div>
      )}

      {/* Hidden canvas for image processing */}
      <canvas ref={canvasRef} style={{ display: "none" }} />
    </div>
  );
}

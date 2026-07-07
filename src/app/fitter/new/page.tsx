"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import SignaturePad from "@/components/SignaturePad";
import GeoCamera from "@/components/GeoCamera";
import BarcodeScanner from "@/components/BarcodeScanner";
import PhotoUpload from "@/components/PhotoUpload";

export default function FitterPortal() {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLocating, setIsLocating] = useState(false);
  const [scanningModuleIndex, setScanningModuleIndex] = useState<number | null>(null);
  const [isScanningInverter, setIsScanningInverter] = useState(false);

  // General Details State
  const [address, setAddress] = useState("");
  const [city, setCity] = useState("");
  const [district, setDistrict] = useState("");
  const [state, setState] = useState("");
  const [zipCode, setZipCode] = useState("");

  // Equipment State
  const [moduleCount, setModuleCount] = useState<number | "">("");
  const [moduleCapacity, setModuleCapacity] = useState<number | "">("");
  const [modules, setModules] = useState<{ serialNumber: string, almmNumber: string, almmImageUrl: string | null }[]>([]);
  const [inverterModel, setInverterModel] = useState("");
  const [inverterImageUrl, setInverterImageUrl] = useState<string | null>(null);

  // Signature State
  const [consumerSignature, setConsumerSignature] = useState("");
  const [vendorSignature, setVendorSignature] = useState("");
  const [witness2Signature, setWitness2Signature] = useState("");
  
  // Separate states for Geo Photo to prevent UI overlap
  const [capturedGeoPhoto, setCapturedGeoPhoto] = useState("");
  const [manualGeoPhoto, setManualGeoPhoto] = useState("");
  const geoPhoto = capturedGeoPhoto || manualGeoPhoto;

  // Aadhar Photo State
  const [aadharPhoto, setAadharPhoto] = useState<string | null>(null);

  const [resetKey, setResetKey] = useState(0);

  const handleAadharUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    handleImageUpload(e, 1000, 0.7, setAadharPhoto);
  };

  const handleGeoPhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    handleImageUpload(e, 1000, 0.7, setManualGeoPhoto);
  };

  const handleInverterImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    handleImageUpload(e, 800, 0.6, setInverterImageUrl);
  };

  const handleAlmmImageUpload = (index: number, e: React.ChangeEvent<HTMLInputElement>) => {
    handleImageUpload(e, 800, 0.6, (dataUrl) => updateModule(index, "almmImageUrl", dataUrl));
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>, maxDim: number, quality: number, callback: (dataUrl: string) => void) => {
    const file = e.target.files?.[0];
    if (file) {
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
            callback(canvas.toDataURL("image/jpeg", quality));
          } else {
            callback(reader.result as string); // fallback
          }
        };
        img.src = reader.result as string;
      };
      reader.readAsDataURL(file);
    }
  };



  useEffect(() => {
    if (typeof moduleCount === "number" && moduleCount > 0) {
      const newModules = Array.from({ length: moduleCount }, (_, i) => {
        return modules[i] || { serialNumber: "", almmNumber: "", almmImageUrl: null };
      });
      setModules(newModules);
    } else {
      setModules([]);
    }
  }, [moduleCount]);

  const updateModule = (index: number, field: string, value: any) => {
    const newModules = [...modules];
    (newModules[index] as any)[field] = value;
    setModules(newModules);
  };

  const handleGetLocation = () => {
    if (!navigator.geolocation) {
      alert("Geolocation is not supported by your browser");
      return;
    }
    setIsLocating(true);
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        try {
          const cleanEnglishText = (text: string) => {
            if (!text) return "";
            let clean = text.replace(/[^\x00-\x7F]+/g, ''); // Strip non-ASCII
            return clean.replace(/,\s*,/g, ',').replace(/\s+/g, ' ').replace(/^,\s*/, '').replace(/,\s*$/, '').trim(); // Clean up leftover commas
          };

          const tryNominatimFallback = async (pos: GeolocationPosition) => {
            const res = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${pos.coords.latitude}&lon=${pos.coords.longitude}&zoom=18&addressdetails=1&accept-language=en`);
            const data = await res.json();
            if (data.address) {
              setCity(cleanEnglishText(data.address.city || data.address.town || data.address.village || data.address.suburb || ""));
              setDistrict(cleanEnglishText(data.address.state_district || data.address.county || ""));
              setState(cleanEnglishText(data.address.state || ""));
              setZipCode(cleanEnglishText(data.address.postcode || ""));
              setAddress(cleanEnglishText(data.display_name || ""));
            }
          };

          const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;
          
          if (apiKey) {
            const res = await fetch(`https://maps.googleapis.com/maps/api/geocode/json?latlng=${position.coords.latitude},${position.coords.longitude}&key=${apiKey}`);
            const data = await res.json();
            if (data.results && data.results.length > 0) {
              const addressComponents = data.results[0].address_components;
              const getComponent = (type: string) => addressComponents.find((c: any) => c.types.includes(type))?.long_name || "";
              
              setCity(cleanEnglishText(getComponent("locality") || getComponent("administrative_area_level_3") || getComponent("administrative_area_level_2")));
              setDistrict(cleanEnglishText(getComponent("administrative_area_level_2")));
              setState(cleanEnglishText(getComponent("administrative_area_level_1")));
              setZipCode(cleanEnglishText(getComponent("postal_code")));
              
              let formattedAddr = data.results[0].formatted_address || "";
              // Strip out Google Maps Plus Codes from the beginning of the address (e.g. "V8GF+FPP, ")
              formattedAddr = formattedAddr.replace(/^[^,]*\+[^,]*,\s*/, '');
              setAddress(cleanEnglishText(formattedAddr));
            } else if (data.error_message) {
              console.warn("Google Maps API Error, falling back to free provider:", data.error_message);
              await tryNominatimFallback(position);
            } else {
              await tryNominatimFallback(position);
            }
          } else {
            // Fallback to Nominatim if no API key
            await tryNominatimFallback(position);
          }
        } catch (err) {
          alert("Failed to get address from coordinates.");
        } finally {
          setIsLocating(false);
        }
      },
      (err) => {
        alert("Could not get location. Please ensure you have given precise location permissions.");
        setIsLocating(false);
      },
      {
        enableHighAccuracy: true, // Forces true GPS satellite lock instead of rough Wi-Fi/Cell triangulation
        timeout: 15000,
        maximumAge: 0 // Forces a fresh reading, ignoring cached locations
      }
    );
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsSubmitting(true);

    // Gather all data using FormData
    const formData = new FormData(e.currentTarget);
    const data = Object.fromEntries(formData.entries());

    // Add the dynamic modules state to the payload
    const payload = {
      ...data,
      modules: modules,
      inverterImageUrl: inverterImageUrl
    };

    try {
      const response = await fetch("/api/installations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (response.ok) {
        alert("Installation data saved to database successfully!");
        (e.target as HTMLFormElement).reset(); // Clear form
        setModules([]);
        setModuleCount("");
        setModuleCapacity("");
        setConsumerSignature("");
        setVendorSignature("");
        setWitness2Signature("");
        setCapturedGeoPhoto("");
        setManualGeoPhoto("");
        setResetKey(Date.now());
        setAadharPhoto(null);
        setInverterModel("");
        setInverterImageUrl(null);

        // Clear controlled address state fields
        setAddress("");
        setCity("");
        setDistrict("");
        setState("");
        setZipCode("");

        setResetKey(prev => prev + 1); // This resets the signature pads

      } else {
        alert("Failed to save data. Check console.");
      }
    } catch (err) {
      alert("Error saving data.");
    }

    setIsSubmitting(false);
  };

  return (
    <div style={{ maxWidth: "1000px", margin: "0 auto", padding: "20px" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "30px", gap: "15px" }}>
        <h1 style={{ fontSize: "32px", fontWeight: "700", textShadow: "0 2px 4px rgba(0,0,0,0.5)", flex: 1, margin: 0, lineHeight: 1.2 }}>
          New Installation Report
        </h1>
        <button className="btn-primary" onClick={() => router.push("/")} style={{ background: "#ef4444", border: "none", boxShadow: "none", flexShrink: 0, padding: "12px 24px" }}>
          Log Out
        </button>
      </div>

      <form
        onSubmit={handleSubmit}
        className="glass-panel animate-fade-in-up"
        style={{ padding: "40px" }}
        onWheel={(e) => {
          // Prevent the scroll wheel from changing number input values
          if (document.activeElement && (document.activeElement as HTMLInputElement).type === 'number') {
            (document.activeElement as HTMLElement).blur();
          }
        }}
      >

        {/* SECTION 0: Installer Details */}
        <h2 style={{ fontSize: "22px", color: "var(--primary)", borderBottom: "1px solid var(--glass-border)", paddingBottom: "10px", marginBottom: "20px" }}>
          Installer Details
        </h2>
        <div className="responsive-grid-2" style={{ marginBottom: "40px", padding: "20px", background: "rgba(255,255,255,0.02)", borderRadius: "12px", border: "1px solid rgba(255,255,255,0.05)" }}>
          <div className="form-group"><label className="form-label">Installer Name</label><input type="text" name="installerName" className="input-field" placeholder="e.g. Ramesh Kumar" required /></div>
          <div className="form-group"><label className="form-label">Installer Contact</label><input type="tel" name="installerContact" className="input-field" pattern="\d{10}" title="Must be exactly 10 digits" maxLength={10} placeholder="e.g. 9876543210" required /></div>
        </div>

        {/* SECTION 1: Consumer Details */}
        <h2 style={{ fontSize: "22px", color: "var(--primary)", borderBottom: "1px solid var(--glass-border)", paddingBottom: "10px", marginBottom: "20px" }}>
          1. Consumer Details
        </h2>
        <div className="responsive-grid-2" style={{ marginBottom: "40px" }}>
          <div className="form-group"><label className="form-label">Consumer Name</label><input type="text" name="consumerName" className="input-field" pattern="[a-zA-Z\s]+" title="Only letters and spaces allowed" placeholder="e.g. RAJNIKANT RAMESH MORE" required /></div>
          <div className="form-group"><label className="form-label">Mobile Number</label><input type="tel" name="mobileNumber" className="input-field" pattern="\d{10}" title="Must be exactly 10 digits" maxLength={10} placeholder="e.g. 8625962552" required /></div>
          <div className="form-group"><label className="form-label">Email</label><input type="email" name="email" className="input-field" placeholder="e.g. rajnikantmore@gmail.com" /></div>
          <div className="form-group"><label className="form-label">Consumer Number</label><input type="text" name="consumerNumber" className="input-field" placeholder="e.g. 065524127941" required /></div>

          <div className="form-group" style={{ gridColumn: "1 / -1" }}>
            <label className="form-label" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span>Address Details</span>
              <button type="button" onClick={handleGetLocation} disabled={isLocating} className="btn-primary" style={{ padding: "8px 16px", fontSize: "13px", background: "#3b82f6", display: "flex", alignItems: "center", gap: "6px" }}>
                {isLocating ? (
                  "Locating..."
                ) : (
                  <>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path>
                      <circle cx="12" cy="10" r="3"></circle>
                    </svg>
                    Auto-Detect GPS Location
                  </>
                )}
              </button>
            </label>
          </div>

          <div className="form-group" style={{ gridColumn: "1 / -1", marginTop: "-10px" }}>
            <label className="form-label">Complete Address</label><input type="text" name="address" className="input-field" value={address} onChange={e => setAddress(e.target.value)} placeholder="e.g. House/Plot No, Landmark, Area" required />
          </div>
          <input type="hidden" name="city" value={city} />
          <input type="hidden" name="district" value={district} />
          <input type="hidden" name="state" value={state} />
          <input type="hidden" name="zipCode" value={zipCode} />

          <div className="form-group"><label className="form-label">Aadhar Number (12 digits)</label><input type="text" name="aadharNumber" className="input-field" pattern="\d{12}" maxLength={12} title="Must be exactly 12 digits" placeholder="e.g. 432084801502" required /></div>
          <div className="form-group">
            <label className="form-label">Aadhar Card Photo</label>
            <PhotoUpload
              label="Aadhar Card"
              value={aadharPhoto}
              onChange={setAadharPhoto}
              onClear={() => setAadharPhoto(null)}
              maxDim={1000}
              quality={0.7}
              previewHeight={180}
            />
            <input type="hidden" name="aadharPhotoUrl" value={aadharPhoto || ""} />
          </div>
        </div>

        {/* SECTION 2: Project Details */}
        <h2 style={{ fontSize: "22px", color: "var(--primary)", borderBottom: "1px solid var(--glass-border)", paddingBottom: "10px", marginBottom: "20px" }}>
          2. Project & Installation Details
        </h2>
        <div className="responsive-grid-2" style={{ marginBottom: "40px" }}>
          <div className="form-group">
            <label className="form-label">Category</label>
            <select name="category" className="input-field" required>
              <option value="">Select Category...</option>
              <option value="Private">Private</option>
              <option value="Government">Government</option>
            </select>
          </div>
          <div className="form-group"><label className="form-label">Sanction Number</label><input type="text" name="sanctionNumber" className="input-field" placeholder="e.g. 0485 / NP-MHSED25-8184107" required /></div>
          <div className="form-group"><label className="form-label">Sanctioned Capacity (KW)</label><input type="number" step="0.1" name="sanctionedCapacity" className="input-field" placeholder="e.g. 3.00" required /></div>
          <div className="form-group"><label className="form-label">Capacity of solar PV system (KW)</label><input type="number" step="0.1" name="capacity" className="input-field" placeholder="e.g. 3.00" required /></div>
          <div className="form-group"><label className="form-label">Total Capacity (KWP)</label><input type="text" name="totalCapacity" placeholder="e.g. 3.270 kw" className="input-field" required /></div>
          <div className="form-group"><label className="form-label">Application Number</label><input type="text" name="applicationNumber" className="input-field" placeholder="e.g. 79430816" required /></div>
          <div className="form-group"><label className="form-label">Date of Application</label><input type="date" name="dateOfApplication" className="input-field" required /></div>
          <div className="form-group"><label className="form-label">Installation Date</label><input type="date" name="installationDate" className="input-field" required /></div>
          <div className="form-group"><label className="form-label">Net Metering Agreement Date</label><input type="date" name="agreementDate" className="input-field" /></div>
          <div className="form-group"><label className="form-label">Project Model</label><input type="text" name="projectModel" className="input-field" placeholder="e.g. CAPEX" required /></div>
          <div className="form-group"><label className="form-label">Earthings Details</label><input type="text" name="earthingsDetails" className="input-field" placeholder="e.g. 03" /></div>
        </div>

        {/* SECTION 3: Equipment */}
        <h2 style={{ fontSize: "22px", color: "var(--primary)", borderBottom: "1px solid var(--glass-border)", paddingBottom: "10px", marginBottom: "20px" }}>
          3. Equipment Details
        </h2>
        <div className="responsive-grid-2" style={{ marginBottom: "20px" }}>
          <div className="form-group"><label className="form-label">Inverter Make</label><input type="text" name="inverterMake" className="input-field" placeholder="e.g. Warry" required /></div>
          
          <div className="form-group" style={{ marginBottom: 0, gridColumn: "1 / -1" }}>
            <label className="form-label">Inverter Model Barcode (Or upload photo)</label>
            <div className="stack-on-mobile" style={{ display: "flex", gap: "10px" }}>
              <button 
                type="button" 
                onClick={() => setIsScanningInverter(true)} 
                style={{ display: "flex", alignItems: "center", gap: "8px", padding: "14px 20px", background: "#3b82f6", color: "white", border: "none", borderRadius: "8px", cursor: "pointer", fontSize: "14px", fontWeight: "bold", whiteSpace: "nowrap" }}
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"></path><circle cx="12" cy="13" r="4"></circle></svg>
                Scan Barcode
              </button>
              <input type="text" name="inverterModel" className="input-field" placeholder="e.g. 3K6020226" value={inverterModel} onChange={(e) => setInverterModel(e.target.value)} style={{ flex: 1, minWidth: "200px" }} required />
              <div style={{ minWidth: "160px" }}>
                <PhotoUpload
                  label="Inverter Photo"
                  value={inverterImageUrl}
                  onChange={setInverterImageUrl}
                  onClear={() => setInverterImageUrl(null)}
                  maxDim={800}
                  quality={0.6}
                  previewHeight={80}
                />
              </div>
            </div>
          </div>

          <div className="form-group"><label className="form-label">Inverter Capacity (KW)</label><input type="number" step="0.1" name="inverterCapacity" className="input-field" placeholder="e.g. 5" required /></div>
          <div className="form-group"><label className="form-label">SolarPV Details - Inverter Capacity</label><input type="text" name="capacityOfInverter" className="input-field" placeholder="e.g. 3" /></div>
          <div className="form-group"><label className="form-label">Inverter Year of Manufacture</label><input type="number" min="2000" max="2100" name="inverterYom" className="input-field" placeholder="e.g. 2026" required /></div>

          <div className="form-group"><label className="form-label">Module Make</label><input type="text" name="moduleMake" className="input-field" placeholder="e.g. Warry" required /></div>
          <div className="form-group"><label className="form-label">Cell Manufacturer's Name</label><input type="text" name="cellManufacturer" className="input-field" placeholder="e.g. WARRY PVT.LTD" required /></div>
          <div className="form-group">
            <label className="form-label" style={{ color: "var(--primary)" }}>Number of Modules (Panels)</label>
            <input
              type="number"
              name="moduleCount"
              min="1"
              className="input-field"
              value={moduleCount}
              onChange={(e) => setModuleCount(e.target.value ? parseInt(e.target.value) : "")}
              required
            />
          </div>
          <div className="form-group">
            <label className="form-label">Wattage per Module (W)</label>
            <input 
              type="number" 
              name="moduleCapacity" 
              className="input-field" 
              placeholder="e.g. 580" 
              value={moduleCapacity}
              onChange={(e) => setModuleCapacity(e.target.value ? parseFloat(e.target.value) : "")}
              required 
            />
          </div>
          <div className="form-group">
            <label className="form-label">SolarPV Details - Module Capacity (W)</label>
            <input 
              type="text" 
              name="moduleCapacityKw" 
              className="input-field" 
              placeholder="e.g. 3240" 
              value={(typeof moduleCount === 'number' && typeof moduleCapacity === 'number') ? (moduleCount * moduleCapacity).toString() : ""}
              readOnly
              style={{ background: "#f1f5f9", cursor: "not-allowed" }}
            />
          </div>
        </div>

        {/* Dynamic Module Serial Numbers */}
        {modules.length > 0 && (
          <div style={{ background: "rgba(0,0,0,0.3)", padding: "20px", borderRadius: "12px", marginBottom: "40px" }}>
            <h3 style={{ fontSize: "18px", fontWeight: "600", marginBottom: "15px", color: "white" }}>
              Panel Details ({modules.length} Panels)
            </h3>

            {modules.map((mod, index) => (
              <div key={index} style={{ background: "rgba(255,255,255,0.05)", padding: "15px", borderRadius: "8px", marginBottom: "15px", border: "1px solid rgba(255,255,255,0.1)" }}>
                <div className="stack-on-mobile" style={{ display: "grid", gridTemplateColumns: "70px 1fr", gap: "15px", alignItems: "end" }}>
                  <div className="form-group" style={{ marginBottom: 0 }}>
                    <label className="form-label" style={{ fontSize: "12px" }}>S.No.</label>
                    <input type="text" className="input-field" value={index + 1} readOnly style={{ padding: "14px", textAlign: "center", background: "#f1f5f9", fontWeight: "bold" }} />
                  </div>
                  <div className="form-group" style={{ marginBottom: 0 }}>
                    <label className="form-label" style={{ fontSize: "12px" }}>ALMM Number (Or upload photo)</label>
                    <div className="stack-on-mobile" style={{ display: "flex", gap: "10px" }}>
                      <button 
                        type="button" 
                        onClick={() => setScanningModuleIndex(index)} 
                        style={{ display: "flex", alignItems: "center", gap: "8px", padding: "14px 20px", background: "#3b82f6", color: "white", border: "none", borderRadius: "8px", cursor: "pointer", fontSize: "14px", fontWeight: "bold", whiteSpace: "nowrap" }}
                      >
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"></path><circle cx="12" cy="13" r="4"></circle></svg>
                        Scan Barcode
                      </button>
                      <input type="text" className="input-field" placeholder="e.g. ALMM Text" value={mod.almmNumber} onChange={(e) => updateModule(index, "almmNumber", e.target.value)} style={{ flex: 1, minWidth: "250px" }} />
                      <input type="file" accept="image/*" capture="environment" onChange={(e) => handleAlmmImageUpload(index, e)} style={{ width: "100%", maxWidth: "150px", padding: "14px", background: "white", borderRadius: "8px", border: "1px solid #cbd5e1" }} />
                      
                      {/* Show thumbnail if uploaded */}
                      {mod.almmImageUrl && (
                        <div style={{ width: "45px", height: "45px", borderRadius: "8px", overflow: "hidden", border: "1px solid #cbd5e1", flexShrink: 0 }}>
                          <img src={mod.almmImageUrl} alt="ALMM" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        <div className="form-group" style={{ marginBottom: "40px" }}>
          <label className="form-label">Geo-tagged Photo of Module with Consumer</label>
          <div style={{ background: "rgba(0,0,0,0.1)", padding: "20px", borderRadius: "12px", border: "1px solid rgba(255,255,255,0.1)" }}>
            <GeoCamera key={`geo-${resetKey}`} address={address} onCapture={setCapturedGeoPhoto} />
            
            <div style={{ marginTop: "20px", borderTop: "1px solid rgba(255,255,255,0.1)", paddingTop: "20px" }}>
              <label className="form-label" style={{ fontSize: "14px", marginBottom: "10px", display: "block" }}>Or Manually Upload Photo (Fallback):</label>
              <PhotoUpload
                label="Geo Photo"
                value={manualGeoPhoto}
                onChange={setManualGeoPhoto}
                onClear={() => setManualGeoPhoto("")}
                maxDim={1000}
                quality={0.7}
                previewHeight={160}
              />
            </div>
            
            <input type="hidden" name="geoTaggedPhotoUrl" value={geoPhoto} />
          </div>
        </div>

        {/* SECTION 4: Signatures */}
        <h2 style={{ fontSize: "22px", color: "var(--primary)", borderBottom: "1px solid var(--glass-border)", paddingBottom: "10px", marginBottom: "20px" }}>
          4. Signatures
        </h2>
        <div className="responsive-grid-2" style={{ marginBottom: "40px" }}>
          <div className="form-group" style={{ gridColumn: "1 / -1" }}>
            <SignaturePad key={`consumer-${resetKey}`} title="Consumer Signature (Draw Below)" onUpdate={setConsumerSignature} />
            <input type="hidden" name="consumerSignature" value={consumerSignature} />
          </div>
          <div className="form-group" style={{ gridColumn: "1 / -1" }}>
            <SignaturePad key={`vendor-${resetKey}`} title="Vendor/Witness 1 Signature (Draw Below)" onUpdate={setVendorSignature} />
            <input type="hidden" name="vendorSignature" value={vendorSignature} />
          </div>
          <div className="form-group" style={{ gridColumn: "1 / -1" }}>
            <SignaturePad key={`witness2-${resetKey}`} title="Witness 2 Signature (Draw Below)" onUpdate={setWitness2Signature} />
            <input type="hidden" name="witness2Signature" value={witness2Signature} />
          </div>
        </div>

        <button type="submit" className="btn-primary" style={{ width: "100%", padding: "18px", fontSize: "18px" }} disabled={isSubmitting}>
          {isSubmitting ? "Saving Installation Data..." : "Submit Installation Report"}
        </button>
      </form>

      {/* Barcode Scanner Modal */}
      {scanningModuleIndex !== null && (
        <BarcodeScanner 
          onScan={(text) => {
            updateModule(scanningModuleIndex, "almmNumber", text);
            setScanningModuleIndex(null);
          }}
          onClose={() => setScanningModuleIndex(null)}
        />
      )}

      {/* Barcode Scanner Modal for Inverter */}
      {isScanningInverter && (
        <BarcodeScanner 
          onScan={(text) => {
            setInverterModel(text);
            setIsScanningInverter(false);
          }}
          onClose={() => setIsScanningInverter(false)}
        />
      )}
    </div>
  );
}

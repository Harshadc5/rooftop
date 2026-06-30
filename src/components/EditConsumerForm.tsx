"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import SignaturePad from "@/components/SignaturePad";
import GeoCamera from "@/components/GeoCamera";

export default function EditConsumerForm({ initialData }: { initialData: any }) {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLocating, setIsLocating] = useState(false);
  const [isCanceling, setIsCanceling] = useState(false);

  // Prefetch dashboard in the background so it loads instantly when Cancel is clicked
  useEffect(() => {
    router.prefetch("/dashboard");
  }, [router]);
  
  // General Details State
  const [address, setAddress] = useState(initialData.address || "");
  const [city, setCity] = useState(initialData.city || "");
  const [district, setDistrict] = useState(initialData.district || "");
  const [state, setState] = useState(initialData.state || "");
  const [zipCode, setZipCode] = useState(initialData.zipCode || "");

  // Equipment State
  const [moduleCount, setModuleCount] = useState<number | "">(initialData.moduleCount || "");
  const [modules, setModules] = useState<{id?: string, serialNumber: string, almmNumber: string, almmImageUrl?: string}[]>(
    initialData.modules || []
  );

  // Geo Photo State
  const [geoPhoto, setGeoPhoto] = useState(initialData.geoTaggedPhotoUrl || "");

  const openBase64ImageInNewTab = (e: React.MouseEvent, base64Url: string) => {
    e.preventDefault();
    const newWindow = window.open();
    if (newWindow) {
      newWindow.document.write(`<body style="margin:0;display:flex;justify-content:center;align-items:center;background:#0f172a;height:100vh;"><img src="${base64Url}" style="max-width:100%;max-height:100vh;" /></body>`);
    }
  };

  const updateModuleCount = (val: string) => {
    const count = val ? parseInt(val) : "";
    setModuleCount(count);
    if (typeof count === "number" && count > 0) {
      const newModules = Array.from({ length: count }, (_, i) => {
        return modules[i] || { serialNumber: "", almmNumber: "" };
      });
      setModules(newModules);
    } else {
      setModules([]);
    }
  };

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
          const res = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${position.coords.latitude}&lon=${position.coords.longitude}&zoom=18&addressdetails=1`);
          const data = await res.json();
          if (data.address) {
            setCity(data.address.city || data.address.town || data.address.village || data.address.suburb || "");
            setDistrict(data.address.state_district || data.address.county || "");
            setState(data.address.state || "");
            setZipCode(data.address.postcode || "");
            const preciseAddressParts = [
              data.address.plot_number || data.address.plot,
              data.address.house_number || data.address.building,
              data.address.lane,
              data.address.road,
              data.address.serve_number || data.address.survey_number,
              data.address.neighbourhood, 
              data.address.suburb,
              data.address.city || data.address.town || data.address.village
            ].filter(Boolean);
            setAddress(preciseAddressParts.length > 0 ? preciseAddressParts.join(", ") : data.display_name || "");
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
      { enableHighAccuracy: true, timeout: 15000, maximumAge: 0 }
    );
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    const formData = new FormData(e.currentTarget);
    const data = Object.fromEntries(formData.entries());
    
    const payload = {
      ...data,
      modules: modules
    };

    try {
      const response = await fetch(`/api/installations/${initialData.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      
      if (response.ok) {
        alert("Installation data updated successfully!");
        router.push("/dashboard");
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
      <div className="stack-on-mobile" style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "30px", gap: "20px", flexWrap: "wrap" }}>
        <h1 style={{ fontSize: "32px", fontWeight: "700", textShadow: "0 2px 4px rgba(0,0,0,0.5)", flex: 1 }}>
          Edit Installation: {initialData.consumerName}
        </h1>
        <button 
          type="button" 
          className="btn-primary" 
          disabled={isCanceling}
          onClick={() => {
            setIsCanceling(true);
            router.push("/dashboard");
          }} 
          style={{ background: isCanceling ? "#94a3b8" : "#64748b", border: "none", boxShadow: "none", position: "relative", zIndex: 9999, padding: "14px 28px", flexShrink: 0, cursor: isCanceling ? "wait" : "pointer", opacity: isCanceling ? 0.7 : 1 }}
        >
          {isCanceling ? "Returning..." : "Cancel & Back"}
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
        
        {/* SECTION 1: Consumer Details */}
        <h2 style={{ fontSize: "22px", color: "var(--primary)", borderBottom: "1px solid var(--glass-border)", paddingBottom: "10px", marginBottom: "20px" }}>
          1. Consumer Details
        </h2>
        <div className="responsive-grid-2" style={{ marginBottom: "40px" }}>
          <div className="form-group"><label className="form-label">Consumer Name</label><input type="text" name="consumerName" defaultValue={initialData.consumerName} className="input-field" pattern="[a-zA-Z\s]+" title="Only letters and spaces allowed" required /></div>
          <div className="form-group"><label className="form-label">Mobile Number</label><input type="tel" name="mobileNumber" defaultValue={initialData.mobileNumber} className="input-field" pattern="\d{10}" title="Must be exactly 10 digits" maxLength={10} required /></div>
          <div className="form-group"><label className="form-label">Email</label><input type="email" name="email" defaultValue={initialData.email} className="input-field" placeholder="example@email.com" /></div>
          <div className="form-group"><label className="form-label">Consumer Number</label><input type="text" name="consumerNumber" defaultValue={initialData.consumerNumber} className="input-field" required /></div>

          <div className="form-group" style={{ gridColumn: "1 / -1" }}>
            <label className="form-label" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span>Address Details</span>
              <button type="button" onClick={handleGetLocation} disabled={isLocating} className="btn-primary" style={{ padding: "8px 16px", fontSize: "13px", background: "#3b82f6", display: "flex", alignItems: "center", gap: "6px" }}>
                {isLocating ? "Locating..." : "Auto-Detect GPS Location"}
              </button>
            </label>
          </div>

          <div className="form-group" style={{ gridColumn: "1 / -1", marginTop: "-10px" }}>
            <label className="form-label">Complete Address</label><input type="text" name="address" className="input-field" value={address} onChange={e => setAddress(e.target.value)} required />
          </div>
          <div className="form-group"><label className="form-label">City</label><input type="text" name="city" className="input-field" value={city} onChange={e => setCity(e.target.value)} required /></div>
          <div className="form-group"><label className="form-label">District</label><input type="text" name="district" className="input-field" value={district} onChange={e => setDistrict(e.target.value)} required /></div>
          <div className="form-group"><label className="form-label">State</label><input type="text" name="state" className="input-field" value={state} onChange={e => setState(e.target.value)} /></div>
          <div className="form-group"><label className="form-label">Postal Zip Code</label><input type="text" name="zipCode" className="input-field" value={zipCode} onChange={e => setZipCode(e.target.value)} /></div>

          <div className="form-group"><label className="form-label">Aadhar Number (12 digits)</label><input type="text" name="aadharNumber" defaultValue={initialData.aadharNumber} className="input-field" pattern="\d{12}" maxLength={12} title="Must be exactly 12 digits" required /></div>
          <input type="hidden" name="aadharPhotoUrl" value={initialData.aadharPhotoUrl || ""} />
        </div>

        {/* SECTION 2: Project Details */}
        <h2 style={{ fontSize: "22px", color: "var(--primary)", borderBottom: "1px solid var(--glass-border)", paddingBottom: "10px", marginBottom: "20px" }}>
          2. Project & Installation Details
        </h2>
        <div className="responsive-grid-2" style={{ marginBottom: "40px" }}>
          <div className="form-group">
            <label className="form-label">Category</label>
            <select name="category" defaultValue={initialData.category} className="input-field" required>
              <option value="">Select Category...</option>
              <option value="Private">Private</option>
              <option value="Government">Government</option>
            </select>
          </div>
          <div className="form-group"><label className="form-label">Sanction Number</label><input type="text" name="sanctionNumber" defaultValue={initialData.sanctionNumber} className="input-field" required /></div>
          <div className="form-group"><label className="form-label">Sanctioned Capacity (KW)</label><input type="number" step="0.1" name="sanctionedCapacity" defaultValue={initialData.sanctionedCapacity} className="input-field" required /></div>
          <div className="form-group"><label className="form-label">Capacity of solar PV system (KW)</label><input type="number" step="0.1" name="capacity" defaultValue={initialData.capacity} className="input-field" required /></div>
          <div className="form-group"><label className="form-label">Total Capacity (KWP)</label><input type="text" name="totalCapacity" defaultValue={initialData.totalCapacity || ""} placeholder="3.270 kw" className="input-field" required /></div>
          <div className="form-group"><label className="form-label">Application Number</label><input type="text" name="applicationNumber" defaultValue={initialData.applicationNumber} className="input-field" required /></div>
          <div className="form-group"><label className="form-label">Date of Application</label><input type="date" name="dateOfApplication" defaultValue={initialData.dateOfApplication} className="input-field" required /></div>
          <div className="form-group"><label className="form-label">Installation Date</label><input type="date" name="installationDate" defaultValue={initialData.installationDate} className="input-field" required /></div>
          <div className="form-group"><label className="form-label">Net Metering Agreement Date</label><input type="date" name="agreementDate" defaultValue={initialData.agreementDate} className="input-field" /></div>
          <div className="form-group"><label className="form-label">Project Model</label><input type="text" name="projectModel" defaultValue={initialData.projectModel} className="input-field" required /></div>
          <div className="form-group"><label className="form-label">Earthings Details</label><input type="text" name="earthingsDetails" defaultValue={initialData.earthingsDetails} className="input-field" /></div>
        </div>

        {/* SECTION 3: Equipment */}
        <h2 style={{ fontSize: "22px", color: "var(--primary)", borderBottom: "1px solid var(--glass-border)", paddingBottom: "10px", marginBottom: "20px" }}>
          3. Equipment Details
        </h2>
        <div className="responsive-grid-2" style={{ marginBottom: "20px" }}>
          <div className="form-group"><label className="form-label">Inverter Make</label><input type="text" name="inverterMake" defaultValue={initialData.inverterMake} className="input-field" required /></div>
          <div className="form-group"><label className="form-label">Inverter Model</label><input type="text" name="inverterModel" defaultValue={initialData.inverterModel} className="input-field" required /></div>
          <div className="form-group"><label className="form-label">Inverter Capacity (KW)</label><input type="number" step="0.1" name="inverterCapacity" defaultValue={initialData.inverterCapacity} className="input-field" required /></div>
          <div className="form-group"><label className="form-label">SolarPV Details - Inverter Capacity</label><input type="text" name="capacityOfInverter" defaultValue={initialData.capacityOfInverter || ""} className="input-field" placeholder="e.g. 5 KW" /></div>
          <div className="form-group"><label className="form-label">Inverter Year of Manufacture</label><input type="number" min="2000" max="2100" name="inverterYom" defaultValue={initialData.inverterYom} className="input-field" required /></div>
          
          <div className="form-group"><label className="form-label">Module Make</label><input type="text" name="moduleMake" defaultValue={initialData.moduleMake} className="input-field" required /></div>
          <div className="form-group"><label className="form-label">Wattage per Module (W)</label><input type="number" name="moduleCapacity" defaultValue={initialData.moduleCapacity} className="input-field" required /></div>
          <div className="form-group"><label className="form-label">SolarPV Details - Module Capacity (KW)</label><input type="text" name="moduleCapacityKw" defaultValue={initialData.moduleCapacityKw || ""} className="input-field" placeholder="e.g. 3240 w" /></div>
          <div className="form-group"><label className="form-label">Cell Manufacturer's Name</label><input type="text" name="cellManufacturer" defaultValue={initialData.cellManufacturer} className="input-field" required /></div>
          <div className="form-group">
            <label className="form-label" style={{ color: "var(--primary)" }}>Number of Modules (Panels)</label>
            <input 
              type="number" 
              name="moduleCount"
              min="1" 
              className="input-field" 
              value={moduleCount}
              onChange={(e) => updateModuleCount(e.target.value)}
              required 
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
                    <label className="form-label" style={{ fontSize: "12px" }}>
                      ALMM Number {(!mod.almmNumber && mod.almmImageUrl) && <span style={{ color: "#ef4444", display: "inline-flex", alignItems: "center", gap: "4px" }}><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path><line x1="12" y1="9" x2="12" y2="13"></line><line x1="12" y1="17" x2="12.01" y2="17"></line></svg> Action Required: Read photo and type here</span>}
                    </label>
                    <div className="stack-on-mobile" style={{ display: "flex", gap: "10px", alignItems: "center" }}>
                      <input 
                        type="text" 
                        className="input-field" 
                        placeholder="Type ALMM Text here" 
                        value={mod.almmNumber || ""} 
                        onChange={(e) => updateModule(index, "almmNumber", e.target.value)} 
                        style={{ border: (!mod.almmNumber && mod.almmImageUrl) ? "2px solid #ef4444" : "1px solid rgba(255,255,255,0.2)" }}
                      />
                      
                      {mod.almmImageUrl && (
                        <div style={{ flexShrink: 0 }}>
                          <a href="#" onClick={(e) => openBase64ImageInNewTab(e, mod.almmImageUrl!)} title="Click to view full photo">
                            <img src={mod.almmImageUrl} alt="ALMM Upload" style={{ width: "60px", height: "60px", borderRadius: "8px", objectFit: "cover", border: "1px solid #cbd5e1" }} />
                          </a>
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
          <label className="form-label">Geo-tagged Photo of Module</label>
          <div style={{ padding: "15px", background: "rgba(255,255,255,0.05)", borderRadius: "8px" }}>
            {geoPhoto ? (
              <img src={geoPhoto} alt="Geo Photo" style={{ maxWidth: "200px", borderRadius: "8px" }} />
            ) : (
              <span style={{ color: "#94a3b8" }}>No photo saved</span>
            )}
          </div>
          <input type="hidden" name="geoTaggedPhotoUrl" value={geoPhoto} />
        </div>

        <button type="submit" className="btn-primary" style={{ width: "100%", padding: "18px", fontSize: "18px" }} disabled={isSubmitting}>
          {isSubmitting ? "Saving Changes..." : "Update Installation Record"}
        </button>
      </form>
    </div>
  );
}

"use client";
import { useState } from "react";

export default function DashboardClient({ initialConsumers }: { initialConsumers: any[] }) {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedConsumer, setSelectedConsumer] = useState<any | null>(null);
  
  // Pagination State
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  
  // Bulk Selection State
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  const filteredConsumers = initialConsumers.filter(c => 
    c.consumerName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    c.mobileNumber?.includes(searchTerm) ||
    c.consumerNumber?.includes(searchTerm)
  );

  // Pagination Logic
  const totalPages = Math.ceil(filteredConsumers.length / itemsPerPage);
  const paginatedConsumers = filteredConsumers.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  // Toggle Single Row Selection
  const toggleSelection = (id: string) => {
    const newSelection = new Set(selectedIds);
    if (newSelection.has(id)) {
      newSelection.delete(id);
    } else {
      newSelection.add(id);
    }
    setSelectedIds(newSelection);
  };

  // Toggle Select All
  const toggleSelectAll = () => {
    if (selectedIds.size === paginatedConsumers.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(paginatedConsumers.map(c => c.id)));
    }
  };

  const exportToCSV = () => {
    const headers = [
      "S.No.", "Consumer Name", "Mobile Number", "Email", "Application Date", 
      "Installation Date", "Consumer Number", "Address", "City", "District", 
      "State", "Zip Code", "Category", "Sanction Number", "Capacity (KW)", 
      "Inverter Make", "Inverter Model", "Inverter Capacity (KW)", "Module Make", 
      "Module Capacity", "Module Count", "Panel Serial/ALMM Numbers",
      "Aadhar Photo URL", "Geo-Photo URL", "Consumer Signature URL", "Vendor Signature URL"
    ];
    
    const rows = filteredConsumers.map((c, idx) => [
      idx + 1,
      `"${c.consumerName || ""}"`,
      `"${c.mobileNumber || ""}"`,
      `"${c.email || ""}"`,
      `"${c.dateOfApplication || ""}"`,
      `"${c.installationDate || ""}"`,
      `"${c.consumerNumber || ""}"`,
      `"${c.address || ""}"`,
      `"${c.city || ""}"`,
      `"${c.district || ""}"`,
      `"${c.state || ""}"`,
      `"${c.zipCode || ""}"`,
      `"${c.category || ""}"`,
      `"${c.sanctionNumber || ""}"`,
      `"${c.capacity || ""}"`,
      `"${c.inverterMake || ""}"`,
      `"${c.inverterModel || ""}"`,
      `"${c.inverterCapacity || ""}"`,
      `"${c.moduleMake || ""}"`,
      `"${c.moduleCapacity || ""}"`,
      `"${c.moduleCount || ""}"`,
      `"${(c.modules || []).map((m: any) => m.almmNumber || m.serialNumber || "").join(", ")}"`,
      `"${c.aadharPhotoUrl && c.aadharPhotoUrl.startsWith('http') ? c.aadharPhotoUrl : "No Link"}"`,
      `"${c.geoTaggedPhotoUrl && c.geoTaggedPhotoUrl.startsWith('http') ? c.geoTaggedPhotoUrl : "No Link"}"`,
      `"${c.signatures?.consumerSignature && c.signatures.consumerSignature.startsWith('http') ? c.signatures.consumerSignature : "No Link"}"`,
      `"${c.signatures?.vendorSignature && c.signatures.vendorSignature.startsWith('http') ? c.signatures.vendorSignature : "No Link"}"`
    ]);

    const csvContent = [headers.join(","), ...rows.map(e => e.join(","))].join("\n");
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `Consumer_Installations_Export_${new Date().toISOString().slice(0,10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleBulkDelete = async () => {
    if (window.confirm(`Are you sure you want to permanently delete ${selectedIds.size} records?`)) {
      try {
        const idsToDelete = Array.from(selectedIds);
        // Delete them concurrently
        await Promise.all(
          idsToDelete.map(id => fetch(`/api/installations/${id}`, { method: 'DELETE' }))
        );
        window.location.reload();
      } catch (e) {
        alert("Error during bulk delete.");
      }
    }
  };

  // --- Analytics Calculations ---
  const totalInstallations = initialConsumers.length;
  const totalCapacity = initialConsumers.reduce((sum, c) => sum + (parseFloat(c.capacity) || 0), 0);
  const totalPanels = initialConsumers.reduce((sum, c) => sum + (parseInt(c.moduleCount) || 0), 0);

  // Helper function to group and get top N items
  const getTopItems = (field: string, limit: number = 5) => {
    const counts: Record<string, number> = {};
    initialConsumers.forEach(c => {
      const val = c[field] || "Unknown";
      counts[val] = (counts[val] || 0) + 1;
    });
    return Object.entries(counts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, limit)
      .map(([name, count]) => ({ name, count, percentage: (count / totalInstallations) * 100 }));
  };

  const topDistricts = getTopItems("district", 4);
  const topInverters = getTopItems("inverterMake", 4);
  const topPanels = getTopItems("moduleMake", 4);

  const handleDelete = async (id: string, name: string) => {
    if (window.confirm(`Are you sure you want to permanently delete the installation record for ${name}?`)) {
      try {
        const res = await fetch(`/api/installations/${id}`, { method: 'DELETE' });
        if (res.ok) {
          window.location.reload();
        } else {
          alert("Failed to delete record.");
        }
      } catch (e) {
        alert("Error deleting record.");
      }
    }
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "25px", width: "100%", overflow: "hidden" }}>
      
      {/* ANALYTICS DASHBOARD SECTION */}
      {totalInstallations > 0 && (
        <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
          
          {/* KPI CARDS */}
          <div className="responsive-grid-2 animate-fade-in-up stagger-1" style={{ marginBottom: "30px", gap: "20px", display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))" }}>
            <div className="glass-panel" style={{ padding: "20px", borderLeft: "4px solid #38bdf8" }}>
              <div style={{ color: "#94a3b8", fontSize: "14px", fontWeight: "600", textTransform: "uppercase" }}>Total Installations</div>
              <div style={{ color: "white", fontSize: "36px", fontWeight: "700", marginTop: "10px" }}>{totalInstallations}</div>
            </div>
            <div className="glass-panel" style={{ padding: "20px", borderLeft: "4px solid #10b981" }}>
              <div style={{ color: "#94a3b8", fontSize: "14px", fontWeight: "600", textTransform: "uppercase" }}>Total Capacity (KWp)</div>
              <div style={{ color: "white", fontSize: "36px", fontWeight: "700", marginTop: "10px" }}>{totalCapacity.toFixed(1)} <span style={{fontSize:"20px", color:"#10b981"}}>KWp</span></div>
            </div>
            <div className="glass-panel" style={{ padding: "20px", borderLeft: "4px solid #f59e0b" }}>
              <div style={{ color: "#94a3b8", fontSize: "14px", fontWeight: "600", textTransform: "uppercase" }}>Solar Panels Installed</div>
              <div style={{ color: "white", fontSize: "36px", fontWeight: "700", marginTop: "10px" }}>{totalPanels}</div>
            </div>
          </div>

          {filteredConsumers.length > 0 && (
            <div className="animate-fade-in-up stagger-2" style={{ marginBottom: "30px", display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))", gap: "20px" }}>
            
            {/* Chart 1: Districts */}
            <div className="glass-panel" style={{ padding: "25px" }}>
              <h3 style={{ fontSize: "16px", color: "var(--primary)", marginBottom: "20px" }}>Installations by District</h3>
              <div style={{ display: "flex", flexDirection: "column", gap: "15px" }}>
                {topDistricts.map(item => (
                  <div key={item.name}>
                    <div style={{ display: "flex", justifyContent: "space-between", fontSize: "13px", color: "#cbd5e1", marginBottom: "5px" }}>
                      <span>{item.name}</span>
                      <span>{item.count}</span>
                    </div>
                    <div style={{ width: "100%", height: "8px", background: "rgba(255,255,255,0.1)", borderRadius: "4px", overflow: "hidden" }}>
                      <div style={{ width: `${item.percentage}%`, height: "100%", background: "#38bdf8", borderRadius: "4px", transition: "width 1s ease-in-out" }}></div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Chart 2: Inverters */}
            <div className="glass-panel" style={{ padding: "25px" }}>
              <h3 style={{ fontSize: "16px", color: "#10b981", marginBottom: "20px" }}>Top Inverter Brands</h3>
              <div style={{ display: "flex", flexDirection: "column", gap: "15px" }}>
                {topInverters.map(item => (
                  <div key={item.name}>
                    <div style={{ display: "flex", justifyContent: "space-between", fontSize: "13px", color: "#cbd5e1", marginBottom: "5px" }}>
                      <span>{item.name}</span>
                      <span>{item.count}</span>
                    </div>
                    <div style={{ width: "100%", height: "8px", background: "rgba(255,255,255,0.1)", borderRadius: "4px", overflow: "hidden" }}>
                      <div style={{ width: `${item.percentage}%`, height: "100%", background: "#10b981", borderRadius: "4px", transition: "width 1s ease-in-out" }}></div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Chart 3: Panels */}
            <div className="glass-panel" style={{ padding: "25px" }}>
              <h3 style={{ fontSize: "16px", color: "#f59e0b", marginBottom: "20px" }}>Top Panel Brands</h3>
              <div style={{ display: "flex", flexDirection: "column", gap: "15px" }}>
                {topPanels.map(item => (
                  <div key={item.name}>
                    <div style={{ display: "flex", justifyContent: "space-between", fontSize: "13px", color: "#cbd5e1", marginBottom: "5px" }}>
                      <span>{item.name}</span>
                      <span>{item.count}</span>
                    </div>
                    <div style={{ width: "100%", height: "8px", background: "rgba(255,255,255,0.1)", borderRadius: "4px", overflow: "hidden" }}>
                      <div style={{ width: `${item.percentage}%`, height: "100%", background: "#f59e0b", borderRadius: "4px", transition: "width 1s ease-in-out" }}></div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            
            </div>
            )}
          </div>
        )}

      {/* EXISTING TABLE SECTION */}
      <div className="glass-panel animate-fade-in-up stagger-3" style={{ background: "rgba(0, 0, 0, 0.85)", padding: "25px", width: "100%", overflowX: "hidden" }}>
      <div className="stack-on-mobile" style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px", flexWrap: "wrap", gap: "15px" }}>
        <div className="stack-on-mobile" style={{ display: "flex", alignItems: "center", gap: "15px" }}>
          <h2 style={{ fontSize: "20px", color: "var(--primary)", margin: 0 }}>Recent Installations</h2>
          
          {/* Entries per page Dropdown */}
          <select 
            value={itemsPerPage} 
            onChange={e => {
              setItemsPerPage(Number(e.target.value));
              setCurrentPage(1);
            }}
            style={{ padding: "8px 12px", borderRadius: "8px", border: "1px solid rgba(255,255,255,0.2)", background: "rgba(255,255,255,0.05)", color: "white", outline: "none" }}
          >
            <option value={10} style={{ color: "black" }}>Show 10 entries</option>
            <option value={25} style={{ color: "black" }}>Show 25 entries</option>
            <option value={50} style={{ color: "black" }}>Show 50 entries</option>
            <option value={100000} style={{ color: "black" }}>Show All</option>
          </select>
          
          {/* Bulk Delete Button */}
          {selectedIds.size > 0 && (
            <button 
              onClick={handleBulkDelete}
              style={{ padding: "8px 15px", borderRadius: "8px", border: "none", background: "#ef4444", color: "white", cursor: "pointer", fontWeight: "600" }}
            >
              Delete Selected ({selectedIds.size})
            </button>
          )}

          <button 
            onClick={exportToCSV}
            style={{ padding: "8px 15px", borderRadius: "8px", border: "none", background: "#10b981", color: "white", cursor: "pointer", fontWeight: "600", display: "flex", alignItems: "center", gap: "6px" }}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="7 10 12 15 17 10"></polyline><line x1="12" y1="15" x2="12" y2="3"></line></svg>
            Export to CSV
          </button>
        </div>
        
        <input 
          type="text" 
          placeholder="Search consumers..." 
          value={searchTerm} 
          onChange={e => {
            setSearchTerm(e.target.value);
            setCurrentPage(1);
          }} 
          style={{ width: "100%", maxWidth: "300px", padding: "10px 15px", borderRadius: "8px", border: "1px solid rgba(255,255,255,0.2)", background: "rgba(255,255,255,0.05)", color: "white", outline: "none" }} 
        />
      </div>
      
      {filteredConsumers.length === 0 ? (
        <p style={{ color: "rgba(255,255,255,0.7)", textAlign: "center", padding: "40px" }}>
          No installation records found.
        </p>
      ) : (
        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left" }}>
            <thead>
              <tr style={{ borderBottom: "1px solid rgba(255,255,255,0.2)" }}>
                <th style={{ padding: "12px 15px", width: "40px" }}>
                  <input 
                    type="checkbox" 
                    checked={paginatedConsumers.length > 0 && selectedIds.size === paginatedConsumers.length}
                    onChange={toggleSelectAll}
                    style={{ cursor: "pointer", width: "16px", height: "16px" }}
                  />
                </th>
                <th style={{ padding: "12px 15px", color: "#94a3b8" }}>S.No.</th>
                <th style={{ padding: "12px 15px", color: "#94a3b8" }}>Consumer Name</th>
                <th style={{ padding: "12px 15px", color: "#94a3b8" }}>Mobile</th>
                <th style={{ padding: "12px 15px", color: "#94a3b8" }}>Date</th>
                <th style={{ padding: "12px 15px", color: "#94a3b8" }}>Panels</th>
                <th style={{ padding: "12px 15px", color: "#94a3b8" }}>Action</th>
              </tr>
            </thead>
            <tbody>
              {paginatedConsumers.map((c, index) => (
                <tr key={c.id} className="table-row-hover" style={{ borderBottom: "1px solid rgba(255,255,255,0.1)", whiteSpace: "nowrap", background: selectedIds.has(c.id) ? "rgba(239,68,68,0.1)" : "transparent" }}>
                  <td style={{ padding: "12px 15px" }}>
                    <input 
                      type="checkbox" 
                      checked={selectedIds.has(c.id)}
                      onChange={() => toggleSelection(c.id)}
                      style={{ cursor: "pointer", width: "16px", height: "16px" }}
                    />
                  </td>
                  <td style={{ padding: "12px 15px", color: "#cbd5e1", fontSize: "14px" }}>{filteredConsumers.length - ((currentPage - 1) * itemsPerPage + index)}</td>
                  <td style={{ padding: "12px 15px", fontWeight: "500", fontSize: "14px", maxWidth: "200px", overflow: "hidden", textOverflow: "ellipsis" }}>{c.consumerName}</td>
                  <td style={{ padding: "12px 15px", color: "#cbd5e1", fontSize: "14px" }}>{c.mobileNumber}</td>
                  <td style={{ padding: "12px 15px", color: "#cbd5e1", fontSize: "14px" }}>{c.dateOfApplication}</td>
                  <td style={{ padding: "12px 15px", color: "#cbd5e1", fontSize: "14px" }}>
                    {c.moduleCount}
                    {c.modules.some((m: any) => !m.almmNumber && m.almmImageUrl) && (
                      <span title="Missing ALMM text (photo uploaded)" style={{ marginLeft: "8px", color: "#f59e0b", fontSize: "16px", cursor: "help" }}>
                        ⚠️
                      </span>
                    )}
                  </td>
                  <td style={{ padding: "12px 15px", display: "flex", gap: "8px", alignItems: "center" }}>
                    <a href={`/api/generate/${c.id}/WCR`} className="btn-primary" style={{ padding: "6px 10px", fontSize: "12px", textDecoration: "none", background: "#3b82f6", borderRadius: "4px" }}>WCR</a>
                    <a href={`/api/generate/${c.id}/ANNEXURE_1`} className="btn-primary" style={{ padding: "6px 10px", fontSize: "12px", textDecoration: "none", background: "#10b981", borderRadius: "4px" }}>Anx 1</a>
                    <a href={`/api/generate/${c.id}/DCR`} className="btn-primary" style={{ padding: "6px 10px", fontSize: "12px", textDecoration: "none", background: "#f59e0b", borderRadius: "4px" }}>DCR</a>
                    <a href={`/api/generate/${c.id}/AGREEMENT`} className="btn-primary" style={{ padding: "6px 10px", fontSize: "12px", textDecoration: "none", background: "#6366f1", borderRadius: "4px" }}>Agrmt</a>
                    {c.geoTaggedPhotoUrl && (
                      <a href={`/api/installations/${c.id}/geophoto`} className="btn-primary" style={{ padding: "6px 10px", fontSize: "12px", textDecoration: "none", background: "#ec4899", borderRadius: "4px" }}>GeoPhoto</a>
                    )}
                    <button onClick={() => setSelectedConsumer(c)} style={{ background: "none", border: "none", cursor: "pointer", fontSize: "18px", padding: "0 4px" }} title="View All Details">
                      👁️
                    </button>
                    <button onClick={() => window.location.href = `/dashboard/edit/${c.id}`} style={{ background: "none", border: "none", cursor: "pointer", fontSize: "18px", padding: "0 4px" }} title="Edit Record">
                      ✏️
                    </button>
                    <button onClick={() => handleDelete(c.id, c.consumerName)} style={{ background: "none", border: "none", cursor: "pointer", fontSize: "18px", padding: "0 4px", color: "#ef4444" }} title="Delete Record">
                      🗑️
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          
          {/* Pagination Controls */}
          {totalPages > 1 && (
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: "20px", borderTop: "1px solid rgba(255,255,255,0.1)", paddingTop: "15px" }}>
              <div style={{ color: "#94a3b8", fontSize: "14px" }}>
                Showing {(currentPage - 1) * itemsPerPage + 1} to {Math.min(currentPage * itemsPerPage, filteredConsumers.length)} of {filteredConsumers.length} entries
              </div>
              <div style={{ display: "flex", gap: "10px" }}>
                <button 
                  disabled={currentPage === 1}
                  onClick={() => setCurrentPage(p => p - 1)}
                  style={{ padding: "6px 12px", borderRadius: "6px", border: "1px solid rgba(255,255,255,0.2)", background: currentPage === 1 ? "transparent" : "rgba(255,255,255,0.1)", color: currentPage === 1 ? "#64748b" : "white", cursor: currentPage === 1 ? "not-allowed" : "pointer" }}
                >
                  Previous
                </button>
                <button 
                  disabled={currentPage === totalPages}
                  onClick={() => setCurrentPage(p => p + 1)}
                  style={{ padding: "6px 12px", borderRadius: "6px", border: "1px solid rgba(255,255,255,0.2)", background: currentPage === totalPages ? "transparent" : "rgba(255,255,255,0.1)", color: currentPage === totalPages ? "#64748b" : "white", cursor: currentPage === totalPages ? "not-allowed" : "pointer" }}
                >
                  Next
                </button>
              </div>
            </div>
          )}
        </div>
      )}
      </div>

      {/* Consumer Details Modal */}
      {selectedConsumer && (
        <div style={{ position: "fixed", top: 0, left: 0, right: 0, bottom: 0, background: "rgba(0,0,0,0.8)", display: "flex", justifyContent: "center", alignItems: "center", zIndex: 1000, padding: "20px" }}>
          <div style={{ background: "#0f172a", border: "1px solid rgba(255,255,255,0.2)", borderRadius: "12px", width: "100%", maxWidth: "800px", maxHeight: "90vh", overflowY: "auto", padding: "30px", position: "relative" }}>
            <button onClick={() => setSelectedConsumer(null)} style={{ position: "absolute", top: "15px", right: "20px", background: "none", border: "none", color: "#94a3b8", fontSize: "28px", cursor: "pointer", lineHeight: 1 }}>&times;</button>
            <h2 style={{ color: "#f8fafc", marginBottom: "20px", borderBottom: "1px solid rgba(255,255,255,0.1)", paddingBottom: "15px" }}>
              Consumer Details: {selectedConsumer.consumerName}
            </h2>
            
            <div className="responsive-grid-2" style={{ color: "#cbd5e1" }}>
              <div><strong>Consumer Number:</strong> {selectedConsumer.consumerNumber}</div>
              <div><strong>Mobile:</strong> {selectedConsumer.mobileNumber}</div>
              <div><strong>Email:</strong> {selectedConsumer.email || "N/A"}</div>
              <div><strong>Aadhar:</strong> {selectedConsumer.aadharNumber}</div>
              <div style={{ gridColumn: "1 / -1" }}><strong>Address:</strong> {selectedConsumer.address}, {selectedConsumer.city}, {selectedConsumer.district}, {selectedConsumer.state} - {selectedConsumer.zipCode}</div>
              
              <div style={{ gridColumn: "1 / -1", height: "1px", background: "rgba(255,255,255,0.1)", margin: "10px 0" }}></div>
              
              <div><strong>Category:</strong> {selectedConsumer.category}</div>
              <div><strong>Sanction No:</strong> {selectedConsumer.sanctionNumber}</div>
              <div><strong>Sanctioned Cap:</strong> {selectedConsumer.sanctionedCapacity} KWp</div>
              <div><strong>Installed Cap:</strong> {selectedConsumer.capacity} KWp</div>
              <div><strong>App No:</strong> {selectedConsumer.applicationNumber}</div>
              <div><strong>App Date:</strong> {selectedConsumer.dateOfApplication}</div>
              <div><strong>Install Date:</strong> {selectedConsumer.installationDate}</div>
              <div><strong>Agreement Date:</strong> {selectedConsumer.agreementDate}</div>
              
              <div style={{ gridColumn: "1 / -1", height: "1px", background: "rgba(255,255,255,0.1)", margin: "10px 0" }}></div>
              
              <div><strong>Inverter Make:</strong> {selectedConsumer.inverterMake}</div>
              <div><strong>Inverter Model:</strong> {selectedConsumer.inverterModel}</div>
              <div><strong>Inverter Cap:</strong> {selectedConsumer.inverterCapacity} KW</div>
              <div><strong>Module Make:</strong> {selectedConsumer.moduleMake}</div>
              <div><strong>Module Cap:</strong> {selectedConsumer.moduleCapacity} Wp</div>
              <div><strong>Total Modules:</strong> {selectedConsumer.moduleCount}</div>
            </div>

            <h3 style={{ color: "#f8fafc", marginTop: "30px", marginBottom: "15px", borderBottom: "1px solid rgba(255,255,255,0.1)", paddingBottom: "10px" }}>Solar Panels List</h3>
            <table style={{ width: "100%", borderCollapse: "collapse", color: "#cbd5e1" }}>
              <thead>
                <tr style={{ borderBottom: "1px solid rgba(255,255,255,0.2)" }}>
                  <th style={{ padding: "8px", textAlign: "left" }}>#</th>
                  <th style={{ padding: "8px", textAlign: "left" }}>Serial Number</th>
                  <th style={{ padding: "8px", textAlign: "left" }}>ALMM Number</th>
                </tr>
              </thead>
              <tbody>
                {selectedConsumer.modules?.map((m: any, idx: number) => (
                  <tr key={m.id} style={{ borderBottom: "1px solid rgba(255,255,255,0.05)" }}>
                    <td style={{ padding: "8px" }}>{idx + 1}</td>
                    <td style={{ padding: "8px" }}>{m.serialNumber}</td>
                    <td style={{ padding: "8px" }}>
                      {m.almmNumber || "N/A"}
                      {m.almmImageUrl && (
                        <a href={m.almmImageUrl} target="_blank" rel="noreferrer" style={{ marginLeft: "10px", color: "var(--primary)" }}>[View Photo]</a>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            <h3 style={{ color: "#f8fafc", marginTop: "30px", marginBottom: "15px", borderBottom: "1px solid rgba(255,255,255,0.1)", paddingBottom: "10px" }}>Captured Media & Signatures</h3>
            <div className="responsive-grid-2" style={{ gap: "20px" }}>
              
              <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
                {selectedConsumer.geoTaggedPhotoUrl ? (
                  <div style={{ background: "rgba(255,255,255,0.05)", padding: "15px", borderRadius: "12px", border: "1px solid rgba(255,255,255,0.1)" }}>
                    <h4 style={{ color: "#94a3b8", marginBottom: "10px", fontSize: "14px" }}>Geo-Tagged Installation Photo</h4>
                    <img src={selectedConsumer.geoTaggedPhotoUrl} alt="Geo Photo" style={{ width: "100%", maxHeight: "250px", objectFit: "contain", borderRadius: "8px" }} />
                  </div>
                ) : (
                  <div style={{ background: "rgba(255,255,255,0.05)", padding: "15px", borderRadius: "12px", border: "1px solid rgba(255,255,255,0.1)", color: "#ef4444" }}>No Geo Photo Captured</div>
                )}

                {selectedConsumer.aadharPhotoUrl ? (
                  <div style={{ background: "rgba(255,255,255,0.05)", padding: "15px", borderRadius: "12px", border: "1px solid rgba(255,255,255,0.1)" }}>
                    <h4 style={{ color: "#94a3b8", marginBottom: "10px", fontSize: "14px" }}>Aadhar Card Photo</h4>
                    <img src={selectedConsumer.aadharPhotoUrl} alt="Aadhar Card" style={{ width: "100%", maxHeight: "250px", objectFit: "contain", borderRadius: "8px" }} />
                  </div>
                ) : (
                  <div style={{ background: "rgba(255,255,255,0.05)", padding: "15px", borderRadius: "12px", border: "1px solid rgba(255,255,255,0.1)", color: "#ef4444" }}>No Aadhar Photo Captured</div>
                )}
              </div>

              <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
                {selectedConsumer.signatures?.[0]?.consumerSignature ? (
                  <div style={{ background: "white", padding: "15px", borderRadius: "12px" }}>
                    <h4 style={{ color: "#0f172a", marginBottom: "10px", fontSize: "14px" }}>Consumer Signature</h4>
                    <img src={selectedConsumer.signatures[0].consumerSignature} alt="Consumer Sig" style={{ width: "100%", maxHeight: "100px", objectFit: "contain" }} />
                  </div>
                ) : (
                  <div style={{ background: "rgba(255,255,255,0.05)", padding: "15px", borderRadius: "12px", border: "1px solid rgba(255,255,255,0.1)", color: "#ef4444" }}>No Consumer Signature</div>
                )}

                {selectedConsumer.signatures?.[0]?.vendorSignature ? (
                  <div style={{ background: "white", padding: "15px", borderRadius: "12px" }}>
                    <h4 style={{ color: "#0f172a", marginBottom: "10px", fontSize: "14px" }}>Vendor/Installer Signature</h4>
                    <img src={selectedConsumer.signatures[0].vendorSignature} alt="Vendor Sig" style={{ width: "100%", maxHeight: "100px", objectFit: "contain" }} />
                  </div>
                ) : (
                  <div style={{ background: "rgba(255,255,255,0.05)", padding: "15px", borderRadius: "12px", border: "1px solid rgba(255,255,255,0.1)", color: "#ef4444" }}>No Vendor Signature</div>
                )}
              </div>
            </div>

          </div>
        </div>
      )}
    </div>
  );
}

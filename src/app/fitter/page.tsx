"use client";
import { useRouter } from "next/navigation";

export default function FitterDashboard() {
  const router = useRouter();

  const handleLogout = () => {
    // Simple redirect to home page
    router.push("/");
  };

  return (
    <div style={{
      minHeight: "100vh",
      background: "linear-gradient(rgba(15, 23, 42, 0.85), rgba(15, 23, 42, 0.95)), url('https://images.unsplash.com/photo-1509391366360-2e959784a276?auto=format&fit=crop&q=80&w=1200')",
      backgroundSize: "cover",
      backgroundPosition: "center",
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      padding: "20px",
      fontFamily: "system-ui, -apple-system, sans-serif"
    }}>
      <header style={{
        width: "100%",
        maxWidth: "1000px",
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        padding: "15px 25px",
        background: "rgba(255, 255, 255, 0.05)",
        backdropFilter: "blur(12px)",
        borderRadius: "16px",
        border: "1px solid rgba(255, 255, 255, 0.1)",
        marginBottom: "80px",
        marginTop: "20px"
      }}>
        <h2 style={{ color: "white", margin: 0, fontSize: "20px", fontWeight: "600", letterSpacing: "0.5px" }}>Mitali <span style={{color: "var(--primary, #f59e0b)"}}>Rooftop</span></h2>
        <button onClick={handleLogout} style={{
          background: "rgba(255,255,255,0.1)",
          color: "white",
          border: "1px solid rgba(255,255,255,0.2)",
          padding: "8px 20px",
          borderRadius: "8px",
          cursor: "pointer",
          fontWeight: "600",
          transition: "all 0.2s"
        }}
        onMouseOver={(e) => e.currentTarget.style.background = "rgba(239, 68, 68, 0.8)"}
        onMouseOut={(e) => e.currentTarget.style.background = "rgba(255,255,255,0.1)"}
        >
          Log Out
        </button>
      </header>

      <main style={{ textAlign: "center", maxWidth: "900px", width: "100%" }}>
        <h1 style={{ fontSize: "56px", fontWeight: "800", color: "white", marginBottom: "15px", textShadow: "0 4px 15px rgba(0,0,0,0.5)", letterSpacing: "-1px" }}>
          Welcome back!
        </h1>
        <p style={{ fontSize: "20px", color: "#94a3b8", marginBottom: "70px", fontWeight: "400" }}>
          What would you like to do today?
        </p>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))", gap: "30px", padding: "0 20px" }}>
          {/* New Installation Card */}
          <div 
            onClick={() => router.push("/fitter/new")}
            style={{
              background: "rgba(255, 255, 255, 0.04)",
              backdropFilter: "blur(20px)",
              border: "1px solid rgba(255, 255, 255, 0.08)",
              borderRadius: "24px",
              padding: "50px 30px",
              cursor: "pointer",
              transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              boxShadow: "0 8px 32px rgba(0,0,0,0.3)"
            }}
            onMouseOver={(e) => {
              e.currentTarget.style.transform = "translateY(-8px)";
              e.currentTarget.style.background = "rgba(255, 255, 255, 0.08)";
              e.currentTarget.style.boxShadow = "0 20px 40px rgba(0,0,0,0.4)";
              e.currentTarget.style.borderColor = "rgba(255, 255, 255, 0.2)";
            }}
            onMouseOut={(e) => {
              e.currentTarget.style.transform = "translateY(0)";
              e.currentTarget.style.background = "rgba(255, 255, 255, 0.04)";
              e.currentTarget.style.boxShadow = "0 8px 32px rgba(0,0,0,0.3)";
              e.currentTarget.style.borderColor = "rgba(255, 255, 255, 0.08)";
            }}
          >
            <div style={{
              width: "85px",
              height: "85px",
              borderRadius: "50%",
              background: "linear-gradient(135deg, #6366f1, #4f46e5)",
              display: "flex",
              justifyContent: "center",
              alignItems: "center",
              marginBottom: "25px",
              boxShadow: "0 10px 25px rgba(99, 102, 241, 0.4)"
            }}>
              <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <line x1="12" y1="5" x2="12" y2="19"></line>
                <line x1="5" y1="12" x2="19" y2="12"></line>
              </svg>
            </div>
            <h3 style={{ color: "white", fontSize: "26px", fontWeight: "700", marginBottom: "15px" }}>New Installation</h3>
            <p style={{ color: "#94a3b8", lineHeight: "1.6", fontSize: "16px" }}>Create a new solar installation record and capture signatures.</p>
          </div>

          {/* View Uploads Card */}
          <div 
            onClick={() => router.push("/fitter/view")}
            style={{
              background: "rgba(255, 255, 255, 0.04)",
              backdropFilter: "blur(20px)",
              border: "1px solid rgba(255, 255, 255, 0.08)",
              borderRadius: "24px",
              padding: "50px 30px",
              cursor: "pointer",
              transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              boxShadow: "0 8px 32px rgba(0,0,0,0.3)"
            }}
            onMouseOver={(e) => {
              e.currentTarget.style.transform = "translateY(-8px)";
              e.currentTarget.style.background = "rgba(255, 255, 255, 0.08)";
              e.currentTarget.style.boxShadow = "0 20px 40px rgba(0,0,0,0.4)";
              e.currentTarget.style.borderColor = "rgba(255, 255, 255, 0.2)";
            }}
            onMouseOut={(e) => {
              e.currentTarget.style.transform = "translateY(0)";
              e.currentTarget.style.background = "rgba(255, 255, 255, 0.04)";
              e.currentTarget.style.boxShadow = "0 8px 32px rgba(0,0,0,0.3)";
              e.currentTarget.style.borderColor = "rgba(255, 255, 255, 0.08)";
            }}
          >
            <div style={{
              width: "85px",
              height: "85px",
              borderRadius: "50%",
              background: "linear-gradient(135deg, #10b981, #059669)",
              display: "flex",
              justifyContent: "center",
              alignItems: "center",
              marginBottom: "25px",
              boxShadow: "0 10px 25px rgba(16, 185, 129, 0.4)"
            }}>
              <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
                <polyline points="14 2 14 8 20 8"></polyline>
                <line x1="16" y1="13" x2="8" y2="13"></line>
                <line x1="16" y1="17" x2="8" y2="17"></line>
                <polyline points="10 9 9 9 8 9"></polyline>
              </svg>
            </div>
            <h3 style={{ color: "white", fontSize: "26px", fontWeight: "700", marginBottom: "15px" }}>View Uploads</h3>
            <p style={{ color: "#94a3b8", lineHeight: "1.6", fontSize: "16px" }}>Review all the installation forms you have submitted.</p>
          </div>

        </div>
      </main>
    </div>
  );
}

"use client";
import { signIn } from "next-auth/react";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  // Prefetch pages in the background to make login instant
  useEffect(() => {
    if (username.toLowerCase() === "admin") router.prefetch("/dashboard");
    if (username.toLowerCase() === "fitter") router.prefetch("/fitter");
  }, [username, router]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);

    const res = await signIn("credentials", {
      username,
      password,
      redirect: false,
    });

    if (res?.error) {
      setError("Invalid credentials. Please try again.");
      setIsLoading(false);
    } else {
      if (username === "admin") router.push("/dashboard");
      else router.push("/fitter");
    }
  };

  return (
    <div className="login-wrapper" style={{
      display: "flex",
      minHeight: "100vh",
      background: "linear-gradient(135deg, rgba(30, 41, 59, 0.8) 0%, rgba(15, 23, 42, 0.95) 100%), url('https://images.unsplash.com/photo-1509391366360-2e959784a276?auto=format&fit=crop&q=80&w=1200')",
      backgroundSize: "cover",
      backgroundPosition: "center",
      backgroundAttachment: "fixed"
    }}>

      {/* TOP/LEFT SIDE - BRANDING */}
      <div className="login-branding" style={{
        flex: 1,
        position: "relative",
        display: "flex",
        flexDirection: "column",
        justifyContent: "space-between",
        padding: "60px",
        overflow: "hidden"
      }}>
        {/* Decorative Background Elements */}
        <div style={{ position: "absolute", top: "-10%", left: "-10%", width: "500px", height: "500px", background: "radial-gradient(circle, rgba(245,158,11,0.2) 0%, rgba(245,158,11,0) 70%)", borderRadius: "50%" }}></div>
        <div style={{ position: "absolute", bottom: "-20%", right: "-10%", width: "600px", height: "600px", background: "radial-gradient(circle, rgba(56,189,248,0.15) 0%, rgba(56,189,248,0) 70%)", borderRadius: "50%" }}></div>

        <div style={{ position: "relative", zIndex: 10 }}>
          <div style={{ display: "flex", alignItems: "center", gap: "15px", marginBottom: "40px" }}>
            <div style={{ background: "linear-gradient(135deg, var(--primary), #ea580c)", padding: "12px", borderRadius: "12px", display: "flex", alignItems: "center", justifyContent: "center", boxShadow: "0 4px 20px rgba(245,158,11,0.4)" }}>
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="5"></circle>
                <line x1="12" y1="1" x2="12" y2="3"></line>
                <line x1="12" y1="21" x2="12" y2="23"></line>
                <line x1="4.22" y1="4.22" x2="5.64" y2="5.64"></line>
                <line x1="18.36" y1="18.36" x2="19.78" y2="19.78"></line>
                <line x1="1" y1="12" x2="3" y2="12"></line>
                <line x1="21" y1="12" x2="23" y2="12"></line>
                <line x1="4.22" y1="19.78" x2="5.64" y2="18.36"></line>
                <line x1="18.36" y1="5.64" x2="19.78" y2="4.22"></line>
              </svg>
            </div>
            <h1 style={{ fontSize: "24px", fontWeight: "800", color: "white", letterSpacing: "1px" }}>MITALI ENTERPRISES <span style={{ fontWeight: "400", opacity: 0.7 }}>| SolarConnect</span></h1>
          </div>

          <h2 className="login-h2" style={{ fontSize: "48px", fontWeight: "700", color: "white", lineHeight: "1.1", marginBottom: "20px", maxWidth: "500px" }}>
            Powering the Future of <span style={{ color: "var(--primary)" }}>Rooftop Solar</span>
          </h2>
          <p style={{ fontSize: "16px", color: "#94a3b8", lineHeight: "1.6", maxWidth: "450px" }}>
            The ultimate enterprise platform for fitters and admins to seamlessly manage solar installations, track assets, and automatically generate government compliance documents.
          </p>
        </div>

        <div style={{ position: "relative", zIndex: 10, marginTop: "30px" }}>
          <div className="stack-on-mobile" style={{ display: "flex", gap: "15px" }}>
            <div style={{ background: "rgba(255,255,255,0.05)", padding: "15px 20px", borderRadius: "16px", border: "1px solid rgba(255,255,255,0.1)", flex: 1 }}>
              <div style={{ fontSize: "20px", fontWeight: "700", color: "white", marginBottom: "4px" }}>100%</div>
              <div style={{ fontSize: "13px", color: "#94a3b8" }}>Paperless Workflow</div>
            </div>
            <div style={{ background: "rgba(255,255,255,0.05)", padding: "15px 20px", borderRadius: "16px", border: "1px solid rgba(255,255,255,0.1)", flex: 1 }}>
              <div style={{ fontSize: "20px", fontWeight: "700", color: "white", marginBottom: "4px" }}>Instant</div>
              <div style={{ fontSize: "13px", color: "#94a3b8" }}>Docxtemplater Exports</div>
            </div>
          </div>
        </div>
      </div>

      {/* RIGHT SIDE - LOGIN FORM */}
      <div style={{ flex: 1, display: "flex", justifyContent: "center", alignItems: "center", padding: "40px", position: "relative" }}>

        <div className="glass-panel animate-fade-in-up" style={{ width: "100%", maxWidth: "450px" }}>
          <div style={{ marginBottom: "40px" }}>
            <h2 style={{ fontSize: "32px", fontWeight: "700", color: "white", marginBottom: "10px" }}>Welcome Back</h2>
            <p style={{ color: "#cbd5e1", fontSize: "16px" }}>Please enter your credentials to access the portal.</p>
          </div>

          <form onSubmit={handleLogin}>
            <div className="form-group" style={{ marginBottom: "25px" }}>
              <label className="form-label" style={{ color: "#f8fafc", fontSize: "14px" }}>Username</label>
              <input
                type="text"
                className="input-field"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="Enter your username"
                style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.2)", color: "white", padding: "16px", fontSize: "16px", borderRadius: "12px" }}
                required
              />
            </div>

            <div className="form-group" style={{ marginBottom: "30px" }}>
              <label className="form-label" style={{ color: "#f8fafc", fontSize: "14px", display: 'flex', justifyContent: 'space-between' }}>
                <span>Password</span>
              </label>
              <input
                type="password"
                className="input-field"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.2)", color: "white", padding: "16px", fontSize: "16px", borderRadius: "12px" }}
                required
              />
            </div>

            {error && (
              <div style={{ background: "#fef2f2", border: "1px solid #fecaca", padding: "12px", borderRadius: "8px", marginBottom: "20px", color: "#ef4444", fontSize: "14px", textAlign: "center", display: "flex", alignItems: "center", justifyContent: "center", gap: "8px" }}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="8" x2="12" y2="12"></line><line x1="12" y1="16" x2="12.01" y2="16"></line></svg>
                {error}
              </div>
            )}

            <button type="submit" className="btn-primary" style={{ width: "100%", padding: "16px", fontSize: "16px", borderRadius: "12px", boxShadow: "0 10px 25px rgba(245,158,11,0.25)" }} disabled={isLoading}>
              {isLoading ? "Authenticating securely..." : "Sign In securely"}
            </button>
          </form>


        </div>

      </div>
    </div>
  );
}

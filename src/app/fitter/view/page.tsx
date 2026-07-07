import prisma from "@/lib/prisma";
import DashboardClient from "@/components/DashboardClient";

export const dynamic = "force-dynamic";

export default async function FitterViewPage() {
  // Fetch all consumers from database
  // Note: Since all fitters share the "fitter" login currently, they can see all submitted forms.
  // We order them by newest first so they see their latest uploads at the top.
  const consumers = await prisma.consumer.findMany({
    orderBy: { createdAt: 'desc' },
    include: { modules: true, signatures: true }
  });

  return (
    <div style={{ width: "100%", maxWidth: "1200px", margin: "0 auto", padding: "20px", overflowX: "hidden" }}>
      <div className="stack-on-mobile" style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "30px", gap: "15px" }}>
        <h1 style={{ fontSize: "32px", fontWeight: "700", textShadow: "0 2px 4px rgba(0,0,0,0.5)", margin: 0, color: "white" }}>
          My Uploads
        </h1>
        <a href="/fitter" style={{ textDecoration: 'none', textAlign: "center", color: "white", background: "rgba(255,255,255,0.15)", padding: "10px 20px", borderRadius: "8px", border: "1px solid rgba(255,255,255,0.3)", fontWeight: "600", transition: "all 0.2s" }} className="hover-brightness">
          &larr; Back to Dashboard
        </a>
      </div>

      <DashboardClient initialConsumers={consumers} role="FITTER" />
    </div>
  );
}

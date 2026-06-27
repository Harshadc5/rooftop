import { PrismaClient } from "@prisma/client";
import DashboardClient from "@/components/DashboardClient";

export const dynamic = "force-dynamic";

const prisma = new PrismaClient();

export default async function DashboardPage() {
  // Fetch all consumers from database
  const consumers = await prisma.consumer.findMany({
    orderBy: { createdAt: 'desc' },
    include: { modules: true }
  });

  return (
    <div style={{ width: "100%", maxWidth: "1200px", margin: "0 auto", padding: "20px", overflowX: "hidden" }}>
      <div className="stack-on-mobile" style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "30px", gap: "15px" }}>
        <h1 style={{ fontSize: "32px", fontWeight: "700", textShadow: "0 2px 4px rgba(0,0,0,0.5)", margin: 0 }}>
          Admin Dashboard
        </h1>
        <a href="/" className="btn-primary" style={{ textDecoration: 'none', background: "rgba(255,255,255,0.1)", textAlign: "center" }}>
          Log Out
        </a>
      </div>

      <DashboardClient initialConsumers={consumers} />
    </div>
  );
}

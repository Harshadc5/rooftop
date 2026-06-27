import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const consumer = await prisma.consumer.findUnique({
      where: { id },
      select: { geoTaggedPhotoUrl: true, consumerName: true }
    });

    if (!consumer || !consumer.geoTaggedPhotoUrl) {
      return new NextResponse("Geo-tagged photo not found", { status: 404 });
    }

    // If it's already a public URL (Supabase bucket), redirect directly to it
    if (consumer.geoTaggedPhotoUrl.startsWith("http")) {
      return NextResponse.redirect(consumer.geoTaggedPhotoUrl);
    }

    // Otherwise, convert legacy Base64 back to binary for native file download
    const base64Data = consumer.geoTaggedPhotoUrl.replace(/^data:image\/\w+;base64,/, "");
    const buffer = Buffer.from(base64Data, "base64");

    const safeName = consumer.consumerName.replace(/[^a-zA-Z0-9]/g, "_");

    return new NextResponse(buffer, {
      headers: {
        "Content-Type": "image/jpeg",
        "Content-Disposition": `attachment; filename="${safeName}_GeoPhoto.jpg"`,
      },
    });
  } catch (error) {
    console.error("GeoPhoto Download Error:", error);
    return new NextResponse("Failed to generate download", { status: 500 });
  }
}

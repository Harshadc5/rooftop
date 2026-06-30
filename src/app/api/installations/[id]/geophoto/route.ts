import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";


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

    const safeName = consumer.consumerName.replace(/[^a-zA-Z0-9]/g, "_");

    let buffer: Buffer;
    
    // If it's a public URL (Supabase bucket), fetch it into a buffer so we can force download
    if (consumer.geoTaggedPhotoUrl.startsWith("http")) {
      const response = await fetch(consumer.geoTaggedPhotoUrl);
      if (!response.ok) return new NextResponse("Failed to fetch photo from storage", { status: 500 });
      const arrayBuffer = await response.arrayBuffer();
      buffer = Buffer.from(arrayBuffer);
    } else {
      // Otherwise, convert legacy Base64 back to binary
      const base64Data = consumer.geoTaggedPhotoUrl.replace(/^data:image\/\w+;base64,/, "");
      buffer = Buffer.from(base64Data, "base64");
    }

    return new NextResponse(buffer as any, {
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

import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { PDFDocument } from "pdf-lib";

export const dynamic = "force-dynamic";

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
    
    // If it's a public URL (Supabase bucket), fetch it into a buffer
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

    // Convert the image into a PDF Document
    const pdfDoc = await PDFDocument.create();
    
    let image;
    try {
      image = await pdfDoc.embedJpg(buffer);
    } catch (e) {
      // Fallback if the uploaded image was a PNG
      image = await pdfDoc.embedPng(buffer);
    }
    
    // Scale image to fit within a standard A4 page (595 x 842 points) while maintaining aspect ratio
    const a4Width = 595.28;
    const a4Height = 841.89;
    const margin = 50;
    const maxWidth = a4Width - margin * 2;
    const maxHeight = a4Height - margin * 2;
    
    const imageDims = image.scale(1);
    const scale = Math.min(maxWidth / imageDims.width, maxHeight / imageDims.height);
    const finalWidth = imageDims.width * scale;
    const finalHeight = imageDims.height * scale;

    const page = pdfDoc.addPage([a4Width, a4Height]);
    
    // Center the image on the A4 page
    page.drawImage(image, {
      x: (a4Width - finalWidth) / 2,
      y: (a4Height - finalHeight) / 2,
      width: finalWidth,
      height: finalHeight,
    });
    
    const pdfBytes = await pdfDoc.save();

    return new NextResponse(pdfBytes as any, {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="${safeName}_GeoPhoto.pdf"`,
      },
    });
  } catch (error) {
    console.error("GeoPhoto Download Error:", error);
    return new NextResponse("Failed to generate PDF", { status: 500 });
  }
}

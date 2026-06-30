import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import PizZip from "pizzip";
import Docxtemplater from "docxtemplater";
// @ts-ignore
import ImageModule from "docxtemplater-image-module-free";
import fs from "fs";
import path from "path";


// Helper function to fetch HTTP images and convert them to Base64 strings for docxtemplater
async function fetchImageBuffer(url: string | null | undefined): Promise<string> {
  if (!url) return "";
  if (url.startsWith("http")) {
    try {
      const response = await fetch(url);
      if (!response.ok) return "";
      const arrayBuffer = await response.arrayBuffer();
      const base64 = Buffer.from(arrayBuffer).toString("base64");
      return `data:image/png;base64,${base64}`;
    } catch (e) {
      console.error("Failed to fetch image for document:", e);
      return "";
    }
  }
  return url; // fallback to returning base64 string
}

export async function GET(req: Request, { params }: { params: Promise<{ id: string, type: string }> }) {
  try {
    const { id, type } = await params;

    const consumer = await prisma.consumer.findUnique({
      where: { id },
      include: { modules: true, signatures: true }
    });

    if (!consumer) return NextResponse.json({ error: "Consumer not found" }, { status: 404 });

    // Map types to filenames
    const fileMap: Record<string, string> = {
      "WCR": "1. WCR_Undertaking_Guarantee_Aadhar.docx",
      "ANNEXURE_1": "2. Annexure- I_Proforma-A.docx",
      "DCR": "3. Decalration_FOR_DCR.docx",
      "AGREEMENT": "4. NET_METERING_CONNECTION_AGREEMENT.docx",
    };

    const fileName = fileMap[type];
    if (!fileName) return NextResponse.json({ error: "Invalid document type" }, { status: 400 });

    const templatePath = path.resolve(process.cwd(), "src/templates", fileName);
    if (!fs.existsSync(templatePath)) {
      return NextResponse.json({ error: `Template file not found at ${templatePath}` }, { status: 404 });
    }

    const content = fs.readFileSync(templatePath, "binary");
    const zip = new PizZip(content);

    // Auto-fix: The user was instructed to use {{tags}} but docxtemplater expects {tags}.
    // This replaces all {{ and }} with { and } in the raw XML to prevent MultiErrors.
    const xmlFiles = zip.file(/word\/(document|header|footer)[0-9]*\.xml/);
    xmlFiles.forEach((f: any) => {
      let xml = f.asText();
      
      // Pass 1: Collapse multiple {{ or }} into single { or } even if Microsoft Word injected XML tags between them
      xml = xml.replace(/\{\s*(?:<[^>]+>\s*)*\{/g, "{");
      xml = xml.replace(/\}\s*(?:<[^>]+>\s*)*\}/g, "}");
      
      // Pass 2: Strip all XML formatting tags that got trapped INSIDE the { ... } brackets
      xml = xml.replace(/\{([^}]+)\}/g, (match: string, inner: string) => {
        let cleanText = inner.replace(/<[^>]+>/g, "").replace(/\{/g, "").trim();
        return "{" + cleanText + "}";
      });
      
      zip.file(f.name, xml);
    });

    const transparentPixel = Buffer.from(
      "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=",
      "base64"
    );

    // Image Module Configuration
    const imageOptions = {
      centered: false,
      getImage: function (tagValue: any, tagName: string) {
        if (!tagValue || tagValue === "") return transparentPixel;
        if (Buffer.isBuffer(tagValue)) return tagValue;
        try {
          const base64Data = tagValue.replace(/^data:image\/\w+;base64,/, "");
          return Buffer.from(base64Data, "base64");
        } catch (e) {
          return transparentPixel;
        }
      },
      getSize: function (img: any, tagValue: string, tagName: string) {
        if (tagName === "aadhar_photo") {
          return [400, 250]; // ID Card size
        }
        return [200, 50]; // Width, Height for signature images
      }
    };

    const imageModule = new ImageModule(imageOptions);

    const doc = new Docxtemplater(zip, {
      paragraphLoop: true,
      linebreaks: true,
      modules: [imageModule]
    });

    // Prepare variables for templating
    const data = {
      // General Details (Mapped to snake_case exact tags used in the Word docs)
      consumer_name: consumer.consumerName,
      consumer_number: consumer.consumerNumber,
      mobile_number: consumer.mobileNumber,
      email: consumer.email || "",
      address: consumer.address || "",
      city: consumer.city,
      district: consumer.district,
      state: (consumer as any).state || "",
      zip_code: (consumer as any).zipCode || "",
      aadhar_number: consumer.aadharNumber,
      aadhar_photo: await fetchImageBuffer(consumer.aadharPhotoUrl),
      
      // Installation Details
      category: consumer.category,
      sanction_number: consumer.sanctionNumber,
      sanctioned_capacity: consumer.sanctionedCapacity,
      capacity: consumer.capacity,
      total_capacity: (consumer as any).totalCapacity || "",
      application_number: consumer.applicationNumber,
      date_of_application: consumer.dateOfApplication,
      installation_date: consumer.installationDate,
      re_source: consumer.reSource,
      project_model: consumer.projectModel,
      agreement_date: consumer.agreementDate,
      location: consumer.location,
      earthings_details: consumer.earthingsDetails || "",
      
      // Equipment
      inverter_make: consumer.inverterMake,
      inverter_model: consumer.inverterModel,
      inverter_capacity: consumer.inverterCapacity + " KW",
      capacity_of_inverter: (consumer as any).capacityOfInverter || "",
      inverter_yom: consumer.inverterYom,
      module_make: consumer.moduleMake,
      module_capacity: consumer.moduleCapacity,
      module_capacity_kw: (consumer as any).moduleCapacityKw || "",
      module_count: consumer.moduleCount,
      cell_manufacturer: consumer.cellManufacturer,
      
      // Loop array for {#modules}
      modules: consumer.modules.map(m => ({
        serial_number: m.serialNumber,
        almm_number: m.almmNumber || ""
      })),

      // Signatures (Use the tag names {%consumer_signature} and {%vendor_signature} in Word)
      geo_photo: await fetchImageBuffer(consumer.geoTaggedPhotoUrl),
      consumer_signature: await fetchImageBuffer(consumer.signatures?.consumerSignature),
      vendor_signature: await fetchImageBuffer(consumer.signatures?.vendorSignature),
      witness2_signature: await fetchImageBuffer(consumer.signatures?.witness2Signature)
    };

    doc.render(data);

    const buf = doc.getZip().generate({ type: "nodebuffer", compression: "DEFLATE" });

    return new NextResponse(buf as any, {
      status: 200,
      headers: {
        "Content-Disposition": `attachment; filename="${consumer.consumerName.replace(/\s+/g, '_')}_${type}.docx"`,
        "Content-Type": "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      },
    });

  } catch (error: any) {
    console.error("Generate Error:", error);
    
    // Extract exact tag errors from docxtemplater MultiError
    let errorDetails = error.message;
    if (error.properties && error.properties.errors) {
      errorDetails = error.properties.errors.map((e: any) => `Tag error: ${e.message} (Are you missing a closing bracket on a tag?)`).join(" | ");
      console.error("Detailed Tag Errors:", errorDetails);
    }
    
    return NextResponse.json({ 
      error: "Document Generation Failed due to invalid tags in the Word Template.", 
      details: errorDetails 
    }, { status: 500 });
  }
}

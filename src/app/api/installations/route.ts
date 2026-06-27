import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import { createClient } from "@supabase/supabase-js";

const prisma = new PrismaClient();

// Initialize Supabase Client for Storage Buckets
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "";
const supabase = createClient(supabaseUrl, supabaseKey);

// Helper function to decode Base64 and upload to Supabase Bucket
async function uploadBase64ToBucket(base64Str: string | null, path: string): Promise<string | null> {
  if (!base64Str || !base64Str.startsWith('data:image')) return base64Str;
  
  try {
    const matches = base64Str.match(/^data:([A-Za-z-+\/]+);base64,(.+)$/);
    if (!matches || matches.length !== 3) return null;
    
    const mimeType = matches[1];
    const buffer = Buffer.from(matches[2], 'base64');
    
    const { error } = await supabase.storage.from('installation-media').upload(path, buffer, {
      contentType: mimeType,
      upsert: true
    });
    
    if (error) {
      console.error("Supabase Upload Error:", error);
      return null;
    }
    
    const { data: publicUrlData } = supabase.storage.from('installation-media').getPublicUrl(path);
    return publicUrlData.publicUrl;
  } catch(e) {
    console.error("Upload exception:", e);
    return null;
  }
}

export async function POST(req: Request) {
  try {
    const data = await req.json();
    
    // Generate a unique prefix for this consumer's files
    const consumerPrefix = `${Date.now()}_${data.consumerNumber || "unknown"}`;

    // Upload massive base64 images to Supabase Object Storage first
    const aadharPhotoUrl = await uploadBase64ToBucket(data.aadharPhotoUrl, `${consumerPrefix}/aadhar_photo.jpg`);
    const geoTaggedPhotoUrl = await uploadBase64ToBucket(data.geoTaggedPhotoUrl, `${consumerPrefix}/geo_photo.jpg`);
    const consumerSignature = await uploadBase64ToBucket(data.consumerSignature, `${consumerPrefix}/consumer_sig.png`);
    const vendorSignature = await uploadBase64ToBucket(data.vendorSignature, `${consumerPrefix}/vendor_sig.png`);
    
    // Process all panel images concurrently
    const processedModules = await Promise.all((data.modules || []).map(async (m: any, index: number) => {
      const almmUrl = await uploadBase64ToBucket(m.almmImageUrl, `${consumerPrefix}/almm_panel_${index + 1}.jpg`);
      return {
        serialNumber: String(index + 1),
        almmNumber: m.almmNumber || null,
        almmImageUrl: almmUrl
      };
    }));

    // Save only the clean, lightweight URLs to the PostgreSQL Database
    const newConsumer = await prisma.consumer.create({
      data: {
        fitterId: "demo-fitter", 
        consumerName: data.consumerName,
        consumerNumber: data.consumerNumber,
        mobileNumber: data.mobileNumber,
        email: data.email || null,
        address: data.address,
        city: data.city,
        district: data.district,
        state: data.state || null,
        zipCode: data.zipCode || null,
        aadharNumber: data.aadharNumber,
        aadharPhotoUrl: aadharPhotoUrl,
        geoTaggedPhotoUrl: geoTaggedPhotoUrl,
        category: data.category,
        sanctionNumber: data.sanctionNumber,
        sanctionedCapacity: data.sanctionedCapacity,
        capacity: data.capacity,
        totalCapacity: data.totalCapacity || null,
        applicationNumber: data.applicationNumber,
        dateOfApplication: data.dateOfApplication,
        installationDate: data.installationDate,
        reSource: data.reSource || "Solar",
        projectModel: data.projectModel,
        agreementDate: data.agreementDate || "",
        location: data.address,
        earthingsDetails: data.earthingsDetails || null,
        
        inverterMake: data.inverterMake,
        inverterModel: data.inverterModel,
        inverterCapacity: parseFloat(data.inverterCapacity),
        capacityOfInverter: data.capacityOfInverter || null,
        inverterYom: parseInt(data.inverterYom),
        
        moduleMake: data.moduleMake,
        moduleCapacity: parseFloat(data.moduleCapacity),
        moduleCapacityKw: data.moduleCapacityKw || null,
        moduleCount: parseInt(data.moduleCount),
        cellManufacturer: data.cellManufacturer,
        modules: {
          create: processedModules
        },
        signatures: {
          create: {
            consumerSignature: consumerSignature,
            vendorSignature: vendorSignature
          }
        }
      }
    });

    return NextResponse.json({ success: true, id: newConsumer.id });
  } catch (error: any) {
    console.error("DB Error:", error);
    try {
      require("fs").writeFileSync("backend-error.txt", error.stack || error.message);
    } catch(e) {}
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

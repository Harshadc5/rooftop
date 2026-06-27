import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export async function POST(req: Request) {
  try {
    const data = await req.json();
    
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
        aadharPhotoUrl: data.aadharPhotoUrl || null,
        geoTaggedPhotoUrl: data.geoTaggedPhotoUrl || null,
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
          create: data.modules.map((m: any, index: number) => ({
            serialNumber: String(index + 1),
            almmNumber: m.almmNumber || null,
            almmImageUrl: m.almmImageUrl || null
          }))
        },
        signatures: {
          create: {
            consumerSignature: data.consumerSignature || null,
            vendorSignature: data.vendorSignature || null
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

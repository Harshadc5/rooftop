import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    
    await prisma.consumer.delete({
      where: { id }
    });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("Delete Error:", error);
    return NextResponse.json({ error: "Failed to delete record" }, { status: 500 });
  }
}

export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const body = await req.json();

    const updatedConsumer = await prisma.consumer.update({
      where: { id },
      data: {
        consumerName: body.consumerName,
        consumerNumber: body.consumerNumber,
        mobileNumber: body.mobileNumber,
        email: body.email,
        address: body.address,
        city: body.city,
        district: body.district,
        state: body.state,
        zipCode: body.zipCode,
        aadharNumber: body.aadharNumber,
        
        category: body.category,
        sanctionNumber: body.sanctionNumber,
        sanctionedCapacity: body.sanctionedCapacity,
        capacity: body.capacity,
        totalCapacity: body.totalCapacity,
        applicationNumber: body.applicationNumber,
        dateOfApplication: body.dateOfApplication,
        installationDate: body.installationDate,
        reSource: body.reSource,
        projectModel: body.projectModel,
        agreementDate: body.agreementDate,
        location: body.location,
        earthingsDetails: body.earthingsDetails,
        
        inverterMake: body.inverterMake,
        inverterModel: body.inverterModel,
        inverterCapacity: body.inverterCapacity ? parseFloat(body.inverterCapacity) : 0,
        capacityOfInverter: body.capacityOfInverter,
        inverterYom: body.inverterYom ? parseInt(body.inverterYom, 10) : 0,
        
        moduleMake: body.moduleMake,
        moduleCapacity: body.moduleCapacity ? parseFloat(body.moduleCapacity) : 0,
        moduleCapacityKw: body.moduleCapacityKw,
        moduleCount: body.moduleCount ? parseInt(body.moduleCount, 10) : 0,
        cellManufacturer: body.cellManufacturer,
        
        modules: {
          deleteMany: {},
          create: body.modules ? body.modules.map((m: any, index: number) => ({
            serialNumber: String(index + 1),
            almmNumber: m.almmNumber || m.serialNumber || null,
            almmImageUrl: m.almmImageUrl || null
          })) : []
        },
      }
    });

    return NextResponse.json({ success: true, data: updatedConsumer });
  } catch (error: any) {
    console.error("Update Error:", error);
    return NextResponse.json({ error: "Failed to update record" }, { status: 500 });
  }
}

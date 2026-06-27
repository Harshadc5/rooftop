import { PrismaClient } from "@prisma/client";
import EditConsumerForm from "@/components/EditConsumerForm";
import { notFound } from "next/navigation";

const prisma = new PrismaClient();

export default async function EditConsumerPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const consumer = await prisma.consumer.findUnique({
    where: { id },
    include: { modules: true, signatures: true }
  });

  if (!consumer) return notFound();

  const safeConsumer = JSON.parse(JSON.stringify(consumer));

  return <EditConsumerForm initialData={safeConsumer} />;
}

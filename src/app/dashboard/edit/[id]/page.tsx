import prisma from "@/lib/prisma";
import EditConsumerForm from "@/components/EditConsumerForm";
import { notFound } from "next/navigation";


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

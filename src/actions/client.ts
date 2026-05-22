"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";

export async function createClient(formData: FormData) {
  const code = formData.get("code") as string;
  const name = formData.get("name") as string;
  const ownerId = formData.get("ownerId") as string;
  const picName = formData.get("picName") as string;
  const picContact = formData.get("picContact") as string;
  const address = formData.get("address") as string;

  if (!code || !name) {
    return { error: "Client Code and Client Name are required" };
  }

  try {
    await prisma.client.create({
      data: {
        code,
        name,
        picName: picName || null,
        picContact: picContact || null,
        address: address || null,
        owner: ownerId ? { connect: { id: ownerId } } : undefined,
      },
    });

    revalidatePath("/clients");
    return { success: true };
  } catch (error: any) {
    console.error("Error creating client:", error);
    if (error.code === "P2002") {
      return { error: "Client code already exists" };
    }
    return { error: "Error creating client: " + (error.message || "") };
  }
}

export async function updateClient(id: string, formData: FormData) {
  const code = formData.get("code") as string;
  const name = formData.get("name") as string;
  const ownerId = formData.get("ownerId") as string;
  const picName = formData.get("picName") as string;
  const picContact = formData.get("picContact") as string;
  const address = formData.get("address") as string;
  const isActive = formData.get("isActive") === "true";

  if (!code || !name) {
    return { error: "Client Code and Client Name are required" };
  }

  try {
    await prisma.client.update({
      where: { id },
      data: {
        code,
        name,
        picName: picName || null,
        picContact: picContact || null,
        address: address || null,
        isActive,
        owner: ownerId 
          ? { connect: { id: ownerId } } 
          : { disconnect: true },
      },
    });


    revalidatePath("/clients");
    revalidatePath(`/clients/${id}`);
    return { success: true };
  } catch (error: any) {
    console.error("Error updating client:", error);
    return { error: "Error updating client: " + (error.message || "") };
  }
}




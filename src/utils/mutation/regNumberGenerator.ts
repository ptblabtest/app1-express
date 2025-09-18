import prisma from "@/lib/prisma";

function getPrefix(model: string): string {
  const prefixMap: { [key: string]: string } = {
    budget: "BUD",
    client: "CLI",
    contract: "CONT",
    expense: "EXP",
    fund: "ADV",
    invoice: "INV",
    lead: "LEAD",
    opportunity: "OPPO",
    product: "PROD",
    project: "PROJ",
    purchase: "PO",
    quote: "QUOT",
    vendor: "VEN",
    pipeline: "DEAL",
  };

  return prefixMap[model.toLowerCase()] || "GEN";
}

export async function generateRegNumber(model: string): Promise<string> {
  const prismaModel = (prisma as any)[model];
  if (!prismaModel) {
    throw new Error(`Invalid model: ${model}`);
  }

  const count = await prismaModel.count(); // count total records
  const nextId = count + 1; // next number is count + 1
  const prefix = getPrefix(model);
  const currentDate = new Date();
  const year = currentDate.getFullYear().toString().slice(-2);
  const month = (currentDate.getMonth() + 1).toString().padStart(2, "0");
  const paddedId = nextId.toString().padStart(2, "0");

  return `${prefix}-${year}-${month}-${paddedId}`;
}

export async function applyRegNumber(
  model: string,
  regNumber: string | undefined
) {
  if (!regNumber || regNumber === "") {
    return await generateRegNumber(model);
  }
  return undefined; // Return undefined if regNumber already exists
}

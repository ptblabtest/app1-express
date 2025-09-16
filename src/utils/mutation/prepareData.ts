import prisma from "../../lib/prisma";
import { generateRegNumber } from "../../utils/mutation/regNumberGenerator";

export const prepareData = async (
  schema: any,
  model: any,
  body: any,
  user: any,
  mode: "create" | "update"
) => {
  // Set user tracking fields
  if (mode === "create") {
    body.createdById = user.id;
  } else if (mode === "update") {
    body.updatedById = user.id;
  }

  // Handle regNumber
  if (schema && "regNumber" in schema.shape) {
    if (mode === "create" && !body.regNumber) {
      body.regNumber = await generateRegNumber(model);
    }
  }

  // Handle revision
  if (schema && "revision" in schema.shape) {
    if (mode === "create" && !body.revision && body.revision !== 0) {
      body.revision = 0;
    }
  }

  // Handle stages
  if (schema && "stages" in schema.shape && model !== "stage") {
    if (mode === "create") {
      const stage = await prisma.stageType.findFirst({
        where: { model, order: 1 },
      });
      if (stage) {
        body.stages = {
          create: {
            stageTypeId: stage.id,
            comment: `${model.charAt(0).toUpperCase() + model.slice(1)} created`,
            createdById: user.id,
          },
        };
      }
    } else if (mode === "update" && body.stageTypeId) {
      body.stages = {
        create: {
          stageTypeId: body.stageTypeId,
          comment: body.stageComment || `Stage updated for ${model}`,
          createdById: user.id,
        },
      };
      delete body.stageTypeId;
      delete body.stageComment;
    }
  }

  // Handle members
  if (body.memberIds && Array.isArray(body.memberIds)) {
    body.members = 
      mode === "create" 
        ? { connect: body.memberIds.map((id: string) => ({ id })) }
        : { set: body.memberIds.map((id: string) => ({ id })) };
    delete body.memberIds;
  }

  return body;
};
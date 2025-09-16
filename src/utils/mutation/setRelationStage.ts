import prisma from "../../lib/prisma";

export const setFieldAndStageForRelation = async (
  relationId: string | null | undefined,
  relationModel: string,
  userId: string,
  field: string,
  stageValue: string
) => {
  if (!relationId) return;
  
  const currentDate = new Date();
  
  // Find the stage type for this model
  const stageType = await prisma.stageType.findFirst({
    where: {
      model: relationModel,
      value: stageValue,
    },
  });
  
  if (!stageType) return;
  
  // Check latest stage for this relation
  const latestStage = await prisma.stage.findFirst({
    where: {
      [`${relationModel}Id`]: relationId,
    },
    orderBy: {
      createdAt: 'desc',
    },
    select: {
      stageTypeId: true,
    },
  });
  
  // If latest stage is same type, don't create new one
  if (latestStage?.stageTypeId === stageType.id) return;
  
  // Update the record with the date field and create the stage
  await prisma[relationModel].update({
    where: { id: relationId },
    data: {
      [field]: currentDate,
      stages: {
        create: {
          stageTypeId: stageType.id,
          comment: `${relationModel.charAt(0).toUpperCase() + relationModel.slice(1)} - ${stageValue}`,
          createdById: userId,
        },
      },
    },
  });
};
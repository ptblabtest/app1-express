import prisma from "../../lib/prisma";

export const calculateWeightedProgress = async (milestoneId: string) => {
  const tasks = await prisma.task.findMany({
    where: { milestoneId },
    select: { progress: true },
  });
  
  if (tasks.length === 0) return 0;
  
  const totalProgress = tasks.reduce(
    (sum: number, task: any) => sum + (Number(task.progress) || 0),
    0
  );
  return Math.round(totalProgress / tasks.length);
};

export const calculateProjectProgress = async (projectId: string) => {
  const milestones = await prisma.milestone.findMany({
    where: { projectId },
    select: {
      progress: true,
      share: true,
    },
  });

  if (milestones.length === 0) return 0;

  const totalShare = milestones.reduce(
    (sum: number, m: any) => sum + (Number(m.share) || 0),
    0
  );

  if (totalShare === 0) return 0;

  const weightedProgress = milestones.reduce(
    (sum: number, m: any) =>
      sum + (Number(m.progress) || 0) * (Number(m.share) || 0),
    0
  );

  return Math.round(weightedProgress / totalShare);
};
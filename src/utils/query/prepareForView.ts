export function prepareForView(data: any) {
  const result = { ...data };

  if (result.stages && Array.isArray(result.stages)) {
    result.stageList = result.stages.map((stage: any) => ({
      id: stage.id,
      stageName: stage.type?.value || "",
      comment: stage.comment || "",
      createdByName: stage.createdBy?.username || "",
    }));

    // Sort stages by createdAt to get the actual latest
    const sortedStages = [...result.stages].sort(
      (a: any, b: any) =>
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
    const latestStage = sortedStages[0]; // First element is the latest after sorting

    result.stageTypeId = latestStage?.stageTypeId;
    result.stageName = latestStage?.type?.value;
    result.stageComment = latestStage?.comment;
    delete result.stages;
  }

  if (result.assignee) {
    result.assigneeName = result.assignee.username;
  }

  if (result.createdBy) {
    result.createdByName = result.createdBy.username;
  }

  if (result.updatedBy) {
    result.updatedByName = result.updatedBy.username;
  }

  if (result.members && Array.isArray(result.members)) {
    result.memberIds = result.members?.map((member: any) => member.id) || [];
    result.members =
      result.members?.map((member: any) => member.username).join(", ") || "";
  }

  delete result.assignee;
  delete result.createdBy;
  delete result.updatedBy;

  return result;
}
